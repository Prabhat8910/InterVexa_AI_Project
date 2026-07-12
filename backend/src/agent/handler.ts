import { 
  Room, 
  RoomEvent, 
  AudioSource, 
  LocalAudioTrack, 
  AudioStream, 
  AudioFrame, 
  TrackPublishOptions, 
  TrackSource,
  TrackKind
} from '@livekit/rtc-node';
import { transcribeAudio } from './stt';
import { synthesizeSpeech } from './tts';
import { analyzeSpeechData } from './analyzer';
import { groq } from '../config/groq';
import InterviewSession from '../models/InterviewSession';
import StudentProfile from '../models/StudentProfile';
import User from '../models/User';
import Report from '../models/Report';
import { questionBank, Question } from '../data/questionBank';
import { checkSemanticSimilarity } from './similarity';

export const isSkipOrMeaninglessAnswer = (answer: string): boolean => {
  const clean = answer.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  if (clean.length === 0) return true;
  
  const skipPhrases = [
    "i dont know",
    "i do not know",
    "no idea",
    "skip",
    "i forgot",
    "dont know",
    "pass",
    "no answer",
    "no response",
    "i have no idea",
    "i am not sure",
    "i forgot it",
    "let's skip",
    "lets skip",
    "next question",
    "next"
  ];
  
  if (skipPhrases.includes(clean)) return true;
  
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= 2) {
    const hasSkipWord = words.some(w => ["know", "skip", "next", "pass", "forgot", "idea"].includes(w));
    if (hasSkipWord) return true;
  }
  
  return false;
};

export class InterviewAgent {
  private room: Room;
  private roomName: string;
  private token: string;
  
  private audioSource!: AudioSource;
  private audioTrack!: LocalAudioTrack;
  private isSpeaking = false;
  private isProcessing = false;
  private isFinished = false;
  
  // State variables for tracking conversation
  private studentName = 'Candidate';
  private targetRole = 'Software Engineer';
  private targetCompany = 'Tech Company';
  private resumeContext = '';
  private conversationHistory: { role: 'assistant' | 'user'; content: string }[] = [];
  
  private maxQuestions = 6; // Greeting + 5 technical rounds
  private currentQuestionIndex = 0;
  private askedQuestionTexts: string[] = [];
  private lastQuestionObj: Question | null = null;
  private lastQuestionWasCorrect = false;
  private followUpCount = 0;
  
  // Volume calculation configurations for VAD
  private volumeThreshold = 500; // RMS threshold for active voice to filter ambient noise
  private silenceThresholdMs = 3000; // 3.0s of silence triggers STT
  private sampleRate = 16000;
  private numChannels = 1;

  constructor(roomName: string, token: string) {
    this.roomName = roomName;
    this.token = token;
    this.room = new Room();
  }

  public async start(): Promise<void> {
    try {
      console.log(`[Agent] Connecting to room: ${this.roomName}...`);
      
      const livekitUrl = process.env.LIVEKIT_URL;
      if (!livekitUrl) {
        throw new Error('LIVEKIT_URL is not set in backend environment.');
      }

      await this.room.connect(livekitUrl, this.token);
      console.log(`[Agent] Successfully connected to room!`);

      // Initialize audio publishing source (defaulting to 24kHz to match Groq TTS output format)
      this.audioSource = new AudioSource(24000, 1);
      this.audioTrack = LocalAudioTrack.createAudioTrack('agent-voice', this.audioSource);

      const publishOptions = new TrackPublishOptions();
      publishOptions.source = TrackSource.SOURCE_MICROPHONE;
      
      if (this.room.localParticipant) {
        await this.room.localParticipant.publishTrack(this.audioTrack, publishOptions);
      } else {
        throw new Error('Local participant not defined');
      }
      console.log(`[Agent] Voice track published.`);

      // Pre-load student resume and profile data
      await this.loadStudentContext();

      // Set room event handlers for new track subscriptions
      this.room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === TrackKind.KIND_AUDIO && participant.identity !== this.room.localParticipant?.identity) {
          console.log(`[Agent] Subscribed to student audio track from: ${participant.identity}`);
          this.handleStudentAudio(track as any);
        }
      });

      // Handle any pre-existing participants' tracks that are already subscribed when agent joins
      for (const [_, participant] of this.room.remoteParticipants) {
        for (const [_, publication] of participant.trackPublications) {
          if (publication.track && publication.track.kind === TrackKind.KIND_AUDIO && participant.identity !== this.room.localParticipant?.identity) {
            console.log(`[Agent] Subscribing to pre-existing student audio track from: ${participant.identity}`);
            this.handleStudentAudio(publication.track as any);
          }
        }
      }

      // Send initial state update to client
      this.broadcastState('connected');

      // Wait 1.5 seconds and trigger greeting
      setTimeout(() => {
        this.runGreeting();
      }, 1500);

    } catch (error: any) {
      console.error(`[Agent] Start Error:`, error.message);
      this.cleanup();
    }
  }

  private async loadStudentContext(): Promise<void> {
    try {
      // Find the session in MongoDB
      const session = await InterviewSession.findOne({ roomId: this.roomName });
      if (!session) return;

      const user = await User.findById(session.studentId);
      if (user) {
        this.studentName = user.name;
      }

      const profile = await StudentProfile.findOne({ userId: session.studentId });
      if (profile) {
        this.targetRole = profile.targetRole || 'Software Engineer';
        this.targetCompany = profile.targetCompany || 'Top Tech Firm';
        
        // Build concise context for the LLM
        this.resumeContext = `
          Student Name: ${user?.name || 'Candidate'}
          Target Role: ${this.targetRole}
          Target Company: ${this.targetCompany}
          Skills: ${profile.skills.join(', ')}
          Education: ${JSON.stringify(profile.education.map(e => ({ degree: e.degree, inst: e.institution })))}
          Experience: ${JSON.stringify(profile.experience.map(exp => ({ role: exp.role, company: exp.company })))}
          Projects: ${JSON.stringify(profile.projects.map(p => ({ title: p.title, desc: p.description })))}
        `;
      }
    } catch (error) {
      console.error(`[Agent] Error loading student profile:`, error);
    }
  }

  private async runGreeting(): Promise<void> {
    try {
      this.broadcastState('speaking');
      
      const greetingText = `Hello ${this.studentName}. Welcome to InterVexa AI. I have analyzed your resume. Today I will conduct your AI mock interview for the ${this.targetRole} position at ${this.targetCompany}. Please answer naturally. Let's begin.`;
      
      console.log(`[Agent] Greeting student: "${greetingText}"`);
      
      this.conversationHistory.push({ role: 'assistant', content: greetingText });
      
      // Update session questions list with first placeholder greeting record
      await InterviewSession.findOneAndUpdate(
        { roomId: this.roomName },
        { 
          status: 'active',
          $push: { questions: { questionText: greetingText } } 
        }
      );

      this.broadcastTranscript('ai', greetingText);
      this.broadcastQuestion(greetingText);
      
      await this.speak(greetingText);
      
      this.broadcastState('listening');
    } catch (error) {
      console.error('[Agent] Greeting Error:', error);
      this.broadcastState('listening');
    }
  }

  private async handleStudentAudio(track: any): Promise<void> {
    try {
      const audioStream = new AudioStream(track, {
        sampleRate: this.sampleRate,
        numChannels: this.numChannels
      });

      console.log('[Agent] AudioStream initialized. Listening to student audio...');
      
      let pcmBufferChunks: Buffer[] = [];
      let preRollBuffer: Buffer[] = []; // Pre-roll buffer to prevent onset clipping (300ms history)
      let isStudentSpeaking = false;
      let silenceMs = 0;
      const frameDurationMs = 20; // default frame duration
      let volumeHistory: number[] = [];

      for await (const frame of audioStream) {
        if (this.isSpeaking || this.isProcessing || this.isFinished) {
          // If the AI is currently playing speech, processing, or the interview is finished, ignore student audio
          continue;
        }

        const audioData = new Int16Array(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength / 2);
        
        // Calculate root-mean-square volume
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
          sum += audioData[i] * audioData[i];
        }
        const rms = Math.sqrt(sum / audioData.length);
        
        const frameBuffer = Buffer.from(frame.data.buffer.slice(frame.data.byteOffset, frame.data.byteOffset + frame.data.byteLength));

        if (rms > this.volumeThreshold) {
          if (!isStudentSpeaking) {
            isStudentSpeaking = true;
            console.log('[Agent VAD] Speech started.');
            this.broadcastState('speaking_indicator'); // notify UI student is speaking
            // Prepend pre-roll buffer to preserve the first consonant/syllable
            pcmBufferChunks.push(...preRollBuffer);
            preRollBuffer = [];
          }
          silenceMs = 0;
          volumeHistory.push(rms);
          
          // Append raw bytes to buffers list
          pcmBufferChunks.push(frameBuffer);
        } else {
          if (isStudentSpeaking) {
            silenceMs += frameDurationMs;
            
            // Still capture silence frames during speech gaps up to threshold
            pcmBufferChunks.push(frameBuffer);
            
            if (silenceMs >= this.silenceThresholdMs) {
              console.log('[Agent VAD] Speech stopped.');
              isStudentSpeaking = false;
              
              // Copy buffer and process turn
              const studentSpeechBuffer = Buffer.concat(pcmBufferChunks);
              pcmBufferChunks = []; // reset
              preRollBuffer = []; // reset pre-roll for next turn
              
              const currentVolHistory = [...volumeHistory];
              volumeHistory = []; // reset
              
              this.isProcessing = true;
              this.broadcastState('thinking');
              
              // Execute the turn processing asynchronously so as not to block audio socket
              this.processTurn(studentSpeechBuffer, currentVolHistory).finally(() => {
                this.isProcessing = false;
              });
            }
          } else {
            // Keep a rolling history of the last 15 frames (300ms) of silent/ambient audio
            preRollBuffer.push(frameBuffer);
            if (preRollBuffer.length > 15) {
              preRollBuffer.shift();
            }
          }
        }
      }
    } catch (error: any) {
      console.error('[Agent] Error handling student audio stream:', error.message);
    }
  }

  private async processTurn(pcmBuffer: Buffer, volumeHistory: number[]): Promise<void> {
    try {
      // Calculate audio duration
      const audioDurationSec = pcmBuffer.length / (this.sampleRate * this.numChannels * 2);
      
      // Calculate max RMS volume to verify if it was a real voice peak
      const maxVolume = volumeHistory.length > 0 ? Math.max(...volumeHistory) : 0;
      console.log(`[Agent VAD Analysis] Audio length: ${pcmBuffer.length} bytes, Duration: ${audioDurationSec.toFixed(2)}s, Max Volume peak: ${maxVolume}`);
      
      // If the peak is below 500 or duration is less than 0.6 seconds, ignore.
      if (maxVolume < 500 || audioDurationSec < 0.6) {
        console.log('[Agent VAD] Audio segment too quiet or too short (likely connection pop/click). Ignoring.');
        this.broadcastState('listening');
        return;
      }

      console.log(`[Agent] Transcribing user answer (${pcmBuffer.length} bytes)...`);
      const transcriptText = await transcribeAudio(pcmBuffer, this.sampleRate, this.numChannels);
      
      const cleanText = transcriptText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
      const isNoiseHallucination = [
        "thank you", "thank you for watching", "subtitles by", 
        "please subscribe", "amara.org", "you", "bye", "subscribe"
      ].includes(cleanText) || cleanText.length <= 1;

      if (!transcriptText || transcriptText.trim().length < 2 || isNoiseHallucination) {
        console.log(`[Agent] User answer empty or ambient noise hallucination ("${transcriptText}"). Continuing to listen silently...`);
        this.broadcastState('listening');
        return;
      }

      // If we are at the very beginning of the interview (waiting for user to say "lets begin" after greeting)
      if (this.currentQuestionIndex === 0) {
        const startKeywords = ['begin', 'start', 'ready', 'ok', 'yes', 'hello', 'hi', 'sure', 'go', 'play', 'let'];
        const hasStartKeyword = startKeywords.some(kw => cleanText.includes(kw));
        
        if (!hasStartKeyword) {
          console.log(`[Agent] Waiting for start trigger. User transcript: "${transcriptText}". Ignoring.`);
          this.broadcastState('listening');
          return;
        }
      }

      console.log(`[Agent] Student Answer: "${transcriptText}"`);
      this.broadcastTranscript('user', transcriptText);
      this.conversationHistory.push({ role: 'user', content: transcriptText });

      // Run voice parameters and emotion detection on the audio
      const speechMetrics = analyzeSpeechData(transcriptText, audioDurationSec, volumeHistory);
      this.broadcastMetrics(speechMetrics);

      // Increment question count
      this.currentQuestionIndex++;
      const isLastQuestion = this.currentQuestionIndex >= this.maxQuestions;

      // Ask LLM for evaluation of this response and the next question
      const llmResult = await this.queryLLMEvaluation(transcriptText, isLastQuestion);
      
      // Override technicalScore if skip or meaningless response is detected (and not greeting check)
      if (this.currentQuestionIndex > 1 && isSkipOrMeaninglessAnswer(transcriptText)) {
        console.log(`[Agent Engine] Overriding technical score to 0 due to skip/meaningless answer.`);
        llmResult.technicalScore = 0;
      }
      
      this.lastQuestionWasCorrect = llmResult.technicalScore >= 7;
      console.log(`[Agent] Next Question: "${llmResult.questionText}"`);

      // Update current session questions record in DB
      await InterviewSession.findOneAndUpdate(
        { roomId: this.roomName },
        {
          $push: {
            questions: {
              questionText: llmResult.questionText,
              answerTranscript: transcriptText,
              audioDuration: audioDurationSec,
              scores: {
                technical: llmResult.technicalScore,
                communication: speechMetrics.communication,
                confidence: speechMetrics.confidence
              },
              emotionalFeedback: {
                confidence: speechMetrics.confidence,
                stress: speechMetrics.stress,
                calmness: speechMetrics.calmness,
                excitement: speechMetrics.excitement,
                nervousness: speechMetrics.nervousness
              },
              voiceMetrics: {
                speedWordsPerMin: speechMetrics.speedWordsPerMin,
                pausesCount: speechMetrics.pausesCount,
                fillersCount: speechMetrics.fillersCount,
                stabilityScore: speechMetrics.stabilityScore
              }
            }
          }
        }
      );

      this.conversationHistory.push({ role: 'assistant', content: llmResult.questionText });

      // Detect early goodbye/exit from LLM
      const lowerQuestion = llmResult.questionText.toLowerCase();
      const isGoodbyeMessage = 
        lowerQuestion.includes('goodbye') || 
        lowerQuestion.includes('thank you for your time') || 
        lowerQuestion.includes('we\'ll be in touch') || 
        lowerQuestion.includes('not the right fit') || 
        lowerQuestion.includes('end of our interview') || 
        lowerQuestion.includes('interview has finished') || 
        lowerQuestion.includes('interview has now finished') || 
        lowerQuestion.includes('interview is complete') || 
        lowerQuestion.includes('interview is now complete') || 
        lowerQuestion.includes('evaluation will be saved') || 
        lowerQuestion.includes('saved and reviewed') || 
        lowerQuestion.includes('last turn') || 
        lowerQuestion.includes('final turn') || 
        lowerQuestion.includes('pleasure speaking with you') || 
        lowerQuestion.includes('pleasure talking to you') || 
        lowerQuestion.includes('wish you the best') ||
        lowerQuestion.includes('wish you all the best');

      const forceFinalize = isLastQuestion || isGoodbyeMessage;

      this.broadcastState('speaking');
      this.broadcastTranscript('ai', llmResult.questionText);
      
      if (!forceFinalize) {
        this.broadcastQuestion(llmResult.questionText);
      }

      // Convert question to speech and play
      await this.speak(llmResult.questionText);

      if (forceFinalize) {
        this.isFinished = true;
        this.broadcastState('finished');
        console.log('[Agent] Interview finalization triggered. Finalizing report...');
        await this.finalizeInterview();
      } else {
        this.broadcastState('listening');
      }

    } catch (error) {
      console.error('[Agent] Error processing turn:', error);
      this.broadcastState('listening');
    }
  }

  private async queryLLMEvaluation(
    userAnswer: string,
    isLastQuestion: boolean
  ): Promise<{
    questionText: string;
    technicalScore: number;
    feedback: string;
  }> {
    try {
      // Determine if this is just the greeting response
      const isGreetingConfirm = this.currentQuestionIndex === 1;

      // Determine next question text and obj
      let nextQuestionText = '';
      let nextQuestionObj: Question | null = null;
      let targetTopic = 'Core CS';
      let targetDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';

      if (isLastQuestion) {
        nextQuestionText = `Thank you, ${this.studentName}. This concludes our mock interview session today. Your detailed performance evaluation is generating now.`;
      } else {
        // If candidate answered well last turn, try follow-up question
        if (this.lastQuestionWasCorrect && this.followUpCount < 2 && !isGreetingConfirm) {
          if (this.lastQuestionObj && this.lastQuestionObj.followUpQuestions) {
            const followUp = this.lastQuestionObj.followUpQuestions[this.followUpCount];
            if (followUp) {
              nextQuestionText = followUp;
              nextQuestionObj = this.lastQuestionObj; // maintain context
              this.followUpCount++;
              console.log(`[Agent Engine] Selected predefined follow-up question: "${nextQuestionText}"`);
            }
          }
        }

        // If no follow-up was selected, choose next topic in progression
        if (!nextQuestionText) {
          this.followUpCount = 0; // reset
          
          // Progression: Round 1 = Core CS, Round 2 = DBMS/OS, Round 3 = Projects, Round 4 = Programming, Round 5 = HR
          if (this.currentQuestionIndex === 1) {
            targetTopic = 'Core CS';
            targetDifficulty = 'Easy';
          } else if (this.currentQuestionIndex === 2) {
            targetTopic = Math.random() > 0.5 ? 'DBMS' : 'OS';
            targetDifficulty = 'Medium';
          } else if (this.currentQuestionIndex === 3) {
            targetTopic = 'Projects';
            targetDifficulty = 'Medium';
          } else if (this.currentQuestionIndex === 4) {
            targetTopic = 'Programming';
            targetDifficulty = 'Hard';
          } else if (this.currentQuestionIndex === 5) {
            targetTopic = 'HR';
            targetDifficulty = 'Medium';
          }

          if (targetTopic !== 'Projects') {
            const candidates = questionBank.filter(q => q.topic === targetTopic && q.difficulty === targetDifficulty);
            // Shuffle
            candidates.sort(() => Math.random() - 0.5);

            for (const cand of candidates) {
              const isSimilar = await checkSemanticSimilarity(cand.questionText, this.askedQuestionTexts);
              if (!isSimilar) {
                nextQuestionText = cand.questionText;
                nextQuestionObj = cand;
                break;
              }
            }
          }
        }
      }

      // Build evaluation prompt for LLM
      const lastAskedQuestion = this.askedQuestionTexts[this.askedQuestionTexts.length - 1] || 'None (Greeting)';
      
      const systemPrompt = `
        You are a principal engineer and senior hiring interviewer at Google, Amazon, Microsoft, and Flipkart.
        You are conducting a strict, objective, and evidence-based live voice mock technical interview.
        
        Candidate Context:
        ${this.resumeContext}

        Current Interview State:
        - Question Round: ${this.currentQuestionIndex} / ${this.maxQuestions}
        
        Task:
        1. Evaluate the candidate's answer ("${userAnswer}") to the last question asked ("${lastAskedQuestion}").
           - If this is the start confirmation (isGreetingConfirm = ${isGreetingConfirm}), do not grade technically. Set "technicalScore" to 10 and "feedback" to "Greeting response".
           - Otherwise, apply a strict scoring standard. If the answer is incorrect, hallucinated, or a skip/empty response (e.g. "I don't know", "Next question", "Skip", "No idea"), you MUST rate their "technicalScore" as 0 or 1 out of 10. Do NOT inflate scores. 
           - Justify your score with explicit evidence from their text.
        2. Next Question Selection:
           ${nextQuestionText 
             ? `For the next question, you MUST use the following pre-selected question text in the "questionText" field: "${nextQuestionText}"`
             : `Generate the next technical question on the topic "${targetTopic}" and difficulty "${targetDifficulty}" matching the candidate's resume/skills/projects. Ensure the question is highly specific and does not repeat or resemble any previously asked questions: ${JSON.stringify(this.askedQuestionTexts)}`
           }
           - If isLastQuestion is true, say a warm professional goodbye and explain that the evaluation report is being compiled. Do not ask a new question.

        You MUST respond ONLY with a JSON object in this exact format:
        {
          "questionText": "Text of the next question (or final goodbye message)",
          "technicalScore": 7, // technical rating out of 10 (use 0 for incorrect/empty/skip answers)
          "feedback": "Short constructive technical evaluation of their answer with evidence."
        }
      `;

      let parsed: any = {};
      let retries = 0;
      const maxRetries = 3;
      let validQuestion = false;

      const messages = [
        { role: 'system', content: systemPrompt } as any,
        ...this.conversationHistory.slice(-6) // Include recent context
      ];

      while (retries < maxRetries && !validQuestion) {
        const chatCompletion = await groq.chat.completions.create({
          messages: messages,
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' }
        });

        const rawJson = chatCompletion.choices[0]?.message?.content || '{}';
        try {
          parsed = JSON.parse(rawJson);
        } catch (e) {
          console.error('[Agent LLM] Failed to parse JSON response from LLM:', e);
          parsed = {};
        }

        const proposedQuestion = parsed.questionText || '';

        if (isLastQuestion || nextQuestionText) {
          validQuestion = true;
        } else {
          // Check similarity of dynamic question
          const isSimilar = await checkSemanticSimilarity(proposedQuestion, this.askedQuestionTexts);
          if (!isSimilar && proposedQuestion.trim().length > 10) {
            validQuestion = true;
          } else {
            console.log(`[Agent Engine] Proposed question was too similar or invalid, retrying dynamic generation...`);
            retries++;
          }
        }
      }

      // Fallback overrides
      const finalQuestionText = nextQuestionText || parsed.questionText || (isLastQuestion ? "Thank you, this concludes our session." : "Can you elaborate further?");
      let finalScore = typeof parsed.technicalScore === 'number' ? parsed.technicalScore : 7;
      
      if (!isGreetingConfirm && isSkipOrMeaninglessAnswer(userAnswer)) {
        finalScore = 0;
      }

      // Add to in-memory asked history
      if (!isLastQuestion && finalQuestionText) {
        this.askedQuestionTexts.push(finalQuestionText);
        this.lastQuestionObj = nextQuestionObj;
      }

      return {
        questionText: finalQuestionText,
        technicalScore: finalScore,
        feedback: parsed.feedback || "Satisfactory response."
      };

    } catch (error) {
      console.error('[Agent LLM] Query error, using default response:', error);
      return {
        questionText: isLastQuestion 
          ? `Thank you, ${this.studentName}. This concludes our mock interview session today. Your detailed performance evaluation is generating now.`
          : "Interesting. Can you elaborate further on how you would design or test that?",
        technicalScore: isSkipOrMeaninglessAnswer(userAnswer) ? 0 : 7,
        feedback: "Satisfactory answer."
      };
    }
  }

  private async speak(text: string): Promise<void> {
    try {
      this.isSpeaking = true;
      
      // Get PCM data from Groq TTS
      const { pcmData, sampleRate, numChannels } = await synthesizeSpeech(text);

      // We need to write PCM data in chunks to simulate speech playback speed
      // Calculate length of 20ms of audio frame
      // sampleRate * numChannels * 2 bytes per sample * 20 / 1000 seconds
      const frameSamples = Math.round(sampleRate * 0.02);
      const chunkSize = frameSamples * numChannels * 2;
      
      console.log(`[Agent Audio] Playing synthesized audio stream: ${pcmData.length} bytes, SampleRate: ${sampleRate}`);

      // Re-initialize audioSource if sample rate differs dynamically
      if (this.audioSource.sampleRate !== sampleRate) {
        // Unfortunately, in some bindings we cannot re-init. It is safer to re-create track, but
        // since we configure Orpheus TTS to output WAV, it generally uses a constant rate (e.g. 24kHz)
        // so it matches the 24kHz audioSource initialized in start().
      }

      let offset = 0;
      let frameCount = 0;
      const startTime = performance.now();

      while (offset < pcmData.length) {
        const remaining = pcmData.length - offset;
        const size = Math.min(chunkSize, remaining);
        
        const chunk = pcmData.subarray(offset, offset + size);
        offset += size;
        
        // Push frame to LiveKit AudioSource
        const samplesPerChannel = chunk.length / (numChannels * 2);
        
        // Copy to a new private ArrayBuffer to guarantee byteOffset is 0 and no memory sharing.
        // This prevents C++ native bindings from reading the incorrect start of the shared buffer.
        const cleanArrayBuffer = chunk.buffer.slice(
          chunk.byteOffset,
          chunk.byteOffset + chunk.byteLength
        );
        const int16Data = new Int16Array(cleanArrayBuffer);
        
        const frame = new AudioFrame(int16Data, sampleRate, numChannels, samplesPerChannel);
        await this.audioSource.captureFrame(frame);
        
        frameCount++;
        
        // Drift correction: Calculate target sleep time to match exact frame duration
        const targetNextFrameTime = startTime + (frameCount * 20);
        const sleepTime = targetNextFrameTime - performance.now();
        
        if (sleepTime > 0) {
          await new Promise(resolve => setTimeout(resolve, sleepTime));
        }
      }

      console.log('[Agent Audio] Speech playback completed.');
      this.isSpeaking = false;
    } catch (error: any) {
      console.error('[Agent Audio] Synthesize/Playback Error:', error.message);
      
      // Fallback to client-side SpeechSynthesis when backend TTS fails (e.g. rate limited)
      console.log('[Agent Audio] Falling back to client-side speech synthesis.');
      this.publishDataPacket({ type: 'speak_text', value: text });
      
      // Estimate duration: 2.0 words per second + 1.5s extra buffer to be safe against echo
      const estimatedDurationMs = Math.max(2500, (text.split(' ').length / 2.0) * 1000 + 1500);
      await new Promise(resolve => setTimeout(resolve, estimatedDurationMs));
      
      this.isSpeaking = false;
    }
  }

  private async finalizeInterview(): Promise<void> {
    try {
      console.log('[Agent] Finalizing session database structures...');
      this.isFinished = true;
      
      const session = await InterviewSession.findOne({ roomId: this.roomName });
      if (!session) return;
      
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();

      // Compile detailed evaluation metrics via LLM in the background
      this.generateReport(session._id.toString()).catch(err => {
        console.error('[Agent] Async report generation error:', err);
      });

      console.log('[Agent] Session audit finished. Waiting 2s to flush WebRTC data channel...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.cleanup();
    } catch (error) {
      console.error('[Agent] Finalization error:', error);
    }
  }

  private async generateReport(sessionId: string): Promise<void> {
    try {
      console.log(`[Report Service] Initializing AI report generation for session: ${sessionId}`);
      
      const session = await InterviewSession.findById(sessionId);
      if (!session) return;

      const profile = await StudentProfile.findOne({ userId: session.studentId });
      const user = await User.findById(session.studentId);
      
      // Construct aligned QAs (skipping greeting)
      const alignedQAs: { question: string; answer: string; audioDuration: number; technicalRating: number }[] = [];
      for (let i = 2; i < session.questions.length; i++) {
        alignedQAs.push({
          question: session.questions[i - 1].questionText,
          answer: session.questions[i].answerTranscript || '(No response recorded)',
          audioDuration: session.questions[i].audioDuration || 0,
          technicalRating: session.questions[i].scores?.technical || 0
        });
      }

      if (alignedQAs.length === 0 && session.questions.length > 1) {
        const QAsWithAnswers = session.questions.filter(q => q.answerTranscript);
        QAsWithAnswers.forEach(q => {
          alignedQAs.push({
            question: q.questionText,
            answer: q.answerTranscript || '',
            audioDuration: q.audioDuration || 0,
            technicalRating: q.scores?.technical || 0
          });
        });
      }

      // Compute averages
      let totalTech = 0;
      let totalComm = 0;
      let totalConf = 0;
      let totalGrammar = 0;
      let validTurns = 0;

      for (let i = 2; i < session.questions.length; i++) {
        const q = session.questions[i];
        if (q.answerTranscript) {
          totalTech += q.scores?.technical || 0;
          totalComm += q.scores?.communication || 7.0;
          totalConf += q.scores?.confidence || 7.0;
          totalGrammar += q.voiceMetrics?.stabilityScore || 8.0;
          validTurns++;
        }
      }

      // Fallback
      if (validTurns === 0) {
        session.questions.forEach(q => {
          if (q.answerTranscript) {
            totalTech += q.scores?.technical || 0;
            totalComm += q.scores?.communication || 7.0;
            totalConf += q.scores?.confidence || 7.0;
            totalGrammar += q.voiceMetrics?.stabilityScore || 8.0;
            validTurns++;
          }
        });
      }

      const avgTech = validTurns > 0 ? totalTech / validTurns : 7.0;
      const avgComm = validTurns > 0 ? (totalComm / validTurns) * 10 : 70;
      const avgConf = validTurns > 0 ? (totalConf / validTurns) * 10 : 70;
      const avgGrammar = validTurns > 0 ? (totalGrammar / validTurns) * 10 : 80;

      const prompt = `
        You are a principal engineer and lead career readiness evaluator at Google, Amazon, Microsoft, and Flipkart.
        Generate a detailed, objective, and constructive feedback report based on the candidate's technical interview performance:
        
        Candidate: ${user?.name || 'Candidate'}
        Target Position: ${profile?.targetRole || 'Software Development Engineer'}
        
        Transcripts of Technical Q&As:
        ${alignedQAs.map((qa, idx) => `
        ---
        Question ${idx + 1}: ${qa.question}
        Answer ${idx + 1}: ${qa.answer}
        Technical Rating from Interview: ${qa.technicalRating}/10
        Time Taken: ${qa.audioDuration.toFixed(1)} seconds
        `).join('\n')}
        
        STRICT SCORING RUBRIC:
        Rate each question response out of 100 based on the following exact weights:
        - Technical Accuracy (40%)
        - Concept Coverage (20%)
        - Problem Solving (15%)
        - Communication (10%)
        - Confidence (5%)
        - Grammar (5%)
        - Examples (5%)
        Total = 100%
        
        If a candidate's answer is wrong or incorrect:
        - Technical Accuracy = 0
        - Concept Coverage = 0
        - Examples = 0
        - The overall score for that question MUST NOT exceed 25%.
        
        If the candidate says "I don't know", "Next question", "No idea", "Skip", "I forgot", or gives meaningless/empty text:
        - The overall score for that question MUST NOT exceed 25%.
        - The technical score for that question must be rated between 0 and 10 out of 100.
        
        If the answer is partially correct, give a proportional score.
        If the answer is excellent, score it 90-100.
        Never inflate scores. Always justify every score with concrete evidence from the candidate's answer.
        
        Calculate overall average scores for the whole interview (0-100 scale) for:
        - Overall Score (weighted average based on the rubric across all questions)
        - Technical Score (weighted average of Technical Accuracy + Concept Coverage + Examples, or simple technical average)
        - Communication Score (use candidate communication quality average: ${avgComm.toFixed(1)}/100 as base, adjusted strictly by actual answer clarity)
        - Confidence Score (use candidate confidence average: ${avgConf.toFixed(1)}/100 as base)
        - Grammar Score (use candidate grammar/stability average: ${avgGrammar.toFixed(1)}/100 as base)
        - Problem Solving Score (average of Problem Solving across all questions)
        
        Also identify:
        - Strong Topics & Weak Topics (do not inflate or hallucinate strengths; only list genuine strengths demonstrated)
        - Topic-wise Scores (evaluate performance in Core CS, Projects, Programming, DBMS, OS, HR if asked)
        - Difficulty-wise Performance (average score for Easy, Medium, and Hard questions)
        - Hiring Recommendation (Strong Hire, Hire, Leaning Hire, No Hire) with objective justification
        - Interview Summary
        - Detailed Improvement Plan
        - Learning Roadmap
        
        You MUST respond ONLY with a JSON object in this exact schema:
        {
          "overallScore": 65,
          "technicalScore": 60,
          "communicationScore": 75,
          "confidenceScore": 80,
          "grammarScore": 70,
          "problemSolvingScore": 65,
          "hiringRecommendation": "Hiring Recommendation text...",
          "interviewSummary": "Interview summary text...",
          "strongTopics": ["Topic 1", "Topic 2"],
          "weakTopics": ["Topic 3", "Topic 4"],
          "topicWiseScores": {
            "Core CS": 80,
            "Projects": 75,
            "Programming": 50,
            "DBMS": 40,
            "OS": 60,
            "HR": 85
          },
          "difficultyWisePerformance": {
            "Easy": 85,
            "Medium": 70,
            "Hard": 45
          },
          "strengths": ["Strength 1", "Strength 2"],
          "weaknesses": ["Weakness 1", "Weakness 2"],
          "detailedImprovementPlan": "Detailed step-by-step improvement plan referencing specific mistakes made...",
          "learningRoadmap": "Structured learning roadmap timeline...",
          "expectedAnswers": [
            {
              "question": "text of question",
              "givenAnswer": "text of answer",
              "expectedBetterAnswer": "comprehensive optimal answer text",
              "score": 60,
              "difficulty": "Medium",
              "timeTaken": 45,
              "strengths": "strengths in this answer",
              "weaknesses": "weaknesses in this answer",
              "missingConcepts": ["concept A", "concept B"],
              "improvementSuggestions": "improvement suggestions...",
              "evaluationFeedback": "detailed review commentary..."
            }
          ],
          "resources": [
            { "title": "Resource title", "type": "course|video|article", "url": "URL" }
          ]
        }
      `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const rawJson = chatCompletion.choices[0]?.message?.content || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(rawJson);
      } catch (parseErr) {
        console.error('[Report Service] JSON parse error in generateReport:', parseErr);
        parsedData = {
          overallScore: Math.round((avgTech * 10 + avgComm + avgConf + avgGrammar) / 4),
          technicalScore: Math.round(avgTech * 10),
          communicationScore: Math.round(avgComm),
          confidenceScore: Math.round(avgConf),
          grammarScore: Math.round(avgGrammar),
          problemSolvingScore: Math.round(avgTech * 10),
          hiringRecommendation: "Leaning No Hire due to evaluation compile failure.",
          interviewSummary: "Parsing failure during evaluation generation.",
          strongTopics: [],
          weakTopics: [],
          topicWiseScores: {},
          difficultyWisePerformance: {},
          strengths: ["Foundational knowledge"],
          weaknesses: ["Structural detail depth"],
          detailedImprovementPlan: "Practice structuring technical answers.",
          learningRoadmap: "N/A",
          expectedAnswers: [],
          resources: []
        };
      }

      // Construct strengths list containing structured sections
      const structuredStrengths: string[] = [
        `Interview Summary: ${parsedData.interviewSummary || 'No summary generated.'}`,
        `Hiring Recommendation: ${parsedData.hiringRecommendation || 'No recommendation generated.'}`,
        `Problem Solving Score: ${parsedData.problemSolvingScore || parsedData.technicalScore || 0}%`,
        `Topic-wise Scores: ${Object.entries(parsedData.topicWiseScores || {}).map(([topic, score]) => `${topic}: ${score}%`).join(' | ')}`,
        `Difficulty-wise Performance: Easy: ${parsedData.difficultyWisePerformance?.Easy || 0}%, Medium: ${parsedData.difficultyWisePerformance?.Medium || 0}%, Hard: ${parsedData.difficultyWisePerformance?.Hard || 0}%`,
        `Strong Topics: ${(parsedData.strongTopics || []).join(', ') || 'None identified'}`
      ];
      
      if (parsedData.strengths && Array.isArray(parsedData.strengths)) {
        structuredStrengths.push(...parsedData.strengths);
      }

      // Construct weaknesses list containing structured sections
      const structuredWeaknesses: string[] = [
        `Weak Topics: ${(parsedData.weakTopics || []).join(', ') || 'None identified'}`,
        `Detailed Improvement Plan: ${parsedData.detailedImprovementPlan || 'N/A'}`,
        `Learning Roadmap: ${parsedData.learningRoadmap || 'N/A'}`
      ];
      
      if (parsedData.weaknesses && Array.isArray(parsedData.weaknesses)) {
        structuredWeaknesses.push(...parsedData.weaknesses);
      }

      // Construct expectedAnswersComparison with detailed evaluation feedback block
      const expectedAnswersComparison = (parsedData.expectedAnswers || []).map((ea: any) => {
        const feedbackBlock = `Score: ${ea.score || 0}/100 | Difficulty: ${ea.difficulty || 'Medium'} | Time Taken: ${ea.timeTaken || 0}s
Strengths: ${ea.strengths || 'None'}
Weaknesses: ${ea.weaknesses || 'None'}
Missing Concepts: ${Array.isArray(ea.missingConcepts) ? ea.missingConcepts.join(', ') : (ea.missingConcepts || 'None')}
Improvement Suggestions: ${ea.improvementSuggestions || 'None'}

Detailed Review: ${ea.evaluationFeedback || 'N/A'}`;

        return {
          question: ea.question || 'N/A',
          givenAnswer: ea.givenAnswer || 'No response recorded',
          expectedBetterAnswer: ea.expectedBetterAnswer || 'N/A',
          evaluationFeedback: feedbackBlock
        };
      });

      // Fallback for expectedAnswersComparison if empty
      if (expectedAnswersComparison.length === 0) {
        alignedQAs.forEach(qa => {
          expectedAnswersComparison.push({
            question: qa.question,
            givenAnswer: qa.answer,
            expectedBetterAnswer: 'N/A',
            evaluationFeedback: `Score: ${qa.technicalRating * 10}/100 | Commentary: Satisfactory response.`
          });
        });
      }

      const report = new Report({
        interviewId: session._id,
        studentId: session.studentId,
        overallScore: Math.round(parsedData.overallScore || (avgTech * 10 + avgComm + avgConf + avgGrammar) / 4),
        technicalScore: Math.round(parsedData.technicalScore || avgTech * 10),
        communicationScore: Math.round(parsedData.communicationScore || avgComm),
        confidenceScore: Math.round(parsedData.confidenceScore || avgConf),
        grammarScore: Math.round(parsedData.grammarScore || avgGrammar),
        strengths: structuredStrengths,
        weaknesses: structuredWeaknesses,
        expectedAnswersComparison: expectedAnswersComparison,
        voiceAnalysisSummary: {
          overallFluency: avgComm >= 75 ? 'Excellent' : 'Moderate',
          avgSpeechRate: Math.round(session.questions.reduce((acc, curr) => acc + (curr.voiceMetrics?.speedWordsPerMin || 0), 0) / (validTurns || 1)),
          totalFillersDetected: session.questions.reduce((acc, curr) => acc + (curr.voiceMetrics?.fillersCount || 0), 0),
          voiceToneRating: 'Professional'
        },
        emotionTimeline: session.questions.filter(q => q.answerTranscript).map((q, idx) => ({
          timestamp: `Question ${idx + 1}`,
          stress: q.emotionalFeedback?.stress || 3,
          calmness: q.emotionalFeedback?.calmness || 7,
          confidence: q.emotionalFeedback?.confidence || 7
        })),
        recommendedResources: parsedData.resources || []
      });

      const savedReport = await report.save();
      
      // Link report back to session
      session.reportId = savedReport._id as any;
      await session.save();

      // Update student profile placement readiness score
      if (profile) {
        const score = Math.round((profile.atsScore + savedReport.overallScore) / 2);
        profile.placementReadinessScore = score;
        profile.strengths = savedReport.strengths;
        profile.weaknesses = savedReport.weaknesses;
        await profile.save();
      }

      console.log(`[Report Service] Report generated successfully: ${savedReport._id}`);
    } catch (error) {
      console.error('[Report Service] Error generating interview report:', error);
    }
  }

  private broadcastState(value: string): void {
    this.publishDataPacket({ type: 'state', value });
  }

  private broadcastTranscript(sender: 'ai' | 'user', text: string): void {
    this.publishDataPacket({ type: 'transcript', sender, text });
  }

  private broadcastQuestion(text: string): void {
    this.publishDataPacket({ type: 'question', text });
  }

  private broadcastMetrics(metrics: any): void {
    this.publishDataPacket({ type: 'metrics', data: metrics });
  }

  private publishDataPacket(payload: any): void {
    try {
      const data = Buffer.from(JSON.stringify(payload));
      if (this.room.localParticipant) {
        this.room.localParticipant.publishData(new Uint8Array(data), { reliable: true });
      }
    } catch (error) {
      // Ignore publish failures on disconnects
    }
  }

  private cleanup(): void {
    try {
      if (this.room) {
        this.room.disconnect();
      }
    } catch (e) {
      // Already disconnected
    }
  }
}
