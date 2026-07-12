import { 
  Room, 
  RoomEvent, 
  AudioStream, 
  TrackKind
} from '@livekit/rtc-node';
import { transcribeAudio } from './stt';
import { analyzeSpeechData } from './analyzer';
import LiveInterviewSession from '../models/LiveInterviewSession';

export class LiveInterviewAgent {
  private room: Room;
  private roomName: string;
  private token: string;
  private isFinished = false;
  
  // VAD parameters (consistent with mock interview room sensitivity)
  private volumeThreshold = 500;
  private silenceThresholdMs = 2500;
  private sampleRate = 16000;
  private numChannels = 1;

  constructor(roomName: string, token: string) {
    this.roomName = roomName;
    this.token = token;
    this.room = new Room();
  }

  public async start(): Promise<void> {
    try {
      console.log(`[Live Agent] Connecting to room: ${this.roomName}...`);
      
      const livekitUrl = process.env.LIVEKIT_URL;
      if (!livekitUrl) {
        throw new Error('LIVEKIT_URL is not set in backend environment.');
      }

      await this.room.connect(livekitUrl, this.token);
      console.log(`[Live Agent] Successfully joined live room!`);

      // 1. Subscribe to existing participants' audio tracks
      for (const [_, participant] of this.room.remoteParticipants) {
        for (const [_, publication] of participant.trackPublications) {
          if (publication.track && publication.track.kind === TrackKind.KIND_AUDIO) {
            this.handleParticipantAudio(publication.track as any, participant);
          }
        }
      }

      // 2. Handle dynamically joining participants and newly published audio tracks
      this.room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === TrackKind.KIND_AUDIO) {
          console.log(`[Live Agent] Subscribed to track from: ${participant.identity}`);
          this.handleParticipantAudio(track as any, participant);
        }
      });

      // Broadcast connected status to any frontend listening
      this.broadcastState('connected');

    } catch (error: any) {
      console.error('[Live Agent] Connect error:', error.message);
      this.cleanup();
    }
  }

  private handleParticipantAudio(track: any, participant: any): void {
    // Determine the participant role (Interviewer or Candidate) from token metadata attributes
    let role: 'interviewer' | 'candidate' = 'candidate';
    try {
      const meta = participant.metadata ? JSON.parse(participant.metadata) : {};
      if (meta.role === 'interviewer') {
        role = 'interviewer';
      }
    } catch (err) {
      console.warn(`[Live Agent] Metadata parsing failed for: ${participant.identity}`);
    }

    console.log(`[Live Agent] Initializing STT stream for participant: ${participant.identity} as role: ${role}`);

    const audioStream = new AudioStream(track, {
      sampleRate: this.sampleRate,
      numChannels: this.numChannels
    });

    // Run background consumer loop for this participant's audio track
    this.runAudioVADLoop(audioStream, participant, role).catch(err => {
      console.error(`[Live Agent] Audio VAD loop crashed for participant: ${participant.identity}`, err);
    });
  }

  private async runAudioVADLoop(audioStream: AudioStream, _participant: any, role: 'interviewer' | 'candidate'): Promise<void> {
    let pcmBufferChunks: Buffer[] = [];
    let preRollBuffer: Buffer[] = []; // 300ms pre-roll history to avoid consonant clipping
    let isSpeaking = false;
    let silenceMs = 0;
    const frameDurationMs = 20;
    let volumeHistory: number[] = [];

    for await (const frame of audioStream) {
      if (this.isFinished) break;

      // Extract raw PCM bytes from the shared frame buffer
      const frameBuffer = Buffer.from(
        frame.data.buffer.slice(frame.data.byteOffset, frame.data.byteOffset + frame.data.byteLength)
      );

      // Convert buffer data to Int16 to calculate Root-Mean-Square (RMS) amplitude
      const audioData = new Int16Array(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength / 2);
      let sum = 0;
      for (let i = 0; i < audioData.length; i++) {
        sum += audioData[i] * audioData[i];
      }
      const rms = Math.sqrt(sum / audioData.length);

      if (rms > this.volumeThreshold) {
        if (!isSpeaking) {
          isSpeaking = true;
          // Notify room that this participant role started speaking
          this.broadcastState(`${role}_speaking` as any);
          pcmBufferChunks.push(...preRollBuffer);
          preRollBuffer = [];
        }
        silenceMs = 0;
        volumeHistory.push(rms);
        pcmBufferChunks.push(frameBuffer);
      } else {
        if (isSpeaking) {
          silenceMs += frameDurationMs;
          pcmBufferChunks.push(frameBuffer);

          if (silenceMs >= this.silenceThresholdMs) {
            isSpeaking = false;
            
            // Extract the speech buffer and clear state
            const speechBuffer = Buffer.concat(pcmBufferChunks);
            pcmBufferChunks = [];
            preRollBuffer = [];
            const currentVolHistory = [...volumeHistory];
            volumeHistory = [];

            // Process speech turn asynchronously to keep audio stream responsive
            this.processSpeechTurn(speechBuffer, role, currentVolHistory).catch(e => {
              console.error('[Live Agent] Turn processing failed:', e);
            });
          }
        } else {
          // Keep a rolling history of ambient sound for pre-roll (up to 15 frames)
          preRollBuffer.push(frameBuffer);
          if (preRollBuffer.length > 15) {
            preRollBuffer.shift();
          }
        }
      }
    }
  }

  private async processSpeechTurn(pcmBuffer: Buffer, role: 'interviewer' | 'candidate', volumeHistory: number[]): Promise<void> {
    try {
      const audioDurationSec = pcmBuffer.length / (this.sampleRate * this.numChannels * 2);
      const maxVolume = volumeHistory.length > 0 ? Math.max(...volumeHistory) : 0;

      // Ignore brief clicks or connection pops
      if (maxVolume < this.volumeThreshold || audioDurationSec < 0.6) {
        return;
      }

      console.log(`[Live Agent VAD] Processing turn for ${role}. Duration: ${audioDurationSec.toFixed(2)}s, RMS Peak: ${maxVolume}`);
      this.broadcastState(`${role}_thinking` as any);

      // Transcribe user speech using Whisper STT
      const transcriptText = await transcribeAudio(pcmBuffer, this.sampleRate, this.numChannels);
      
      const cleanText = transcriptText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
      const isNoise = [
        "thank you", "thank you for watching", "subtitles by", 
        "please subscribe", "amara.org", "you", "bye", "subscribe"
      ].includes(cleanText) || cleanText.length <= 1;

      if (!transcriptText || transcriptText.trim().length < 2 || isNoise) {
        console.log(`[Live Agent] Transcribed text empty or noise. Ignoring.`);
        this.broadcastState('connected');
        return;
      }

      console.log(`[Live Agent] Role: ${role}, Transcript: "${transcriptText}"`);

      // 1. Add raw transcript entry to MongoDB session
      const session = await LiveInterviewSession.findOneAndUpdate(
        { roomId: this.roomName },
        {
          $push: {
            transcripts: {
              sender: role,
              text: transcriptText,
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );

      if (!session) return;

      // 2. Broadcast transcript data packet to frontend clients
      this.publishDataPacket({
        type: 'live_transcript',
        sender: role,
        text: transcriptText,
        timestamp: new Date()
      });

      // 3. Maintain QA structure
      if (role === 'interviewer') {
        // Create a new question slot
        await LiveInterviewSession.findByIdAndUpdate(session._id, {
          $push: {
            questions: {
              questionText: transcriptText,
              answerTranscript: ''
            }
          }
        });
      } else {
        // Candidate spoke. Analyze voice characteristics and bind to latest interviewer question.
        const speechMetrics = analyzeSpeechData(transcriptText, audioDurationSec, volumeHistory);
        
        // Broadcast candidates real-time voice parameters
        this.publishDataPacket({
          type: 'live_metrics',
          data: speechMetrics
        });

        // Update the last question slot in array with Candidate's response + metrics
        if (session.questions && session.questions.length > 0) {
          const lastIdx = session.questions.length - 1;
          await LiveInterviewSession.updateOne(
            { _id: session._id },
            {
              $set: {
                [`questions.${lastIdx}.answerTranscript`]: transcriptText,
                [`questions.${lastIdx}.audioDuration`]: audioDurationSec,
                [`questions.${lastIdx}.scores`]: {
                  technical: 0, // calculated in bulk analysis at end of interview
                  communication: speechMetrics.communication,
                  confidence: speechMetrics.confidence
                },
                [`questions.${lastIdx}.emotionalFeedback`]: {
                  confidence: speechMetrics.confidence,
                  stress: speechMetrics.stress,
                  calmness: speechMetrics.calmness,
                  excitement: speechMetrics.excitement,
                  nervousness: speechMetrics.nervousness
                },
                [`questions.${lastIdx}.voiceMetrics`]: {
                  speedWordsPerMin: speechMetrics.speedWordsPerMin,
                  pausesCount: speechMetrics.pausesCount,
                  fillersCount: speechMetrics.fillersCount,
                  stabilityScore: speechMetrics.stabilityScore
                }
              }
            }
          );
        }
      }

      this.broadcastState('connected');

    } catch (err: any) {
      console.error('[Live Agent] Turn processing failed:', err.message);
      this.broadcastState('connected');
    }
  }

  public broadcastState(state: 'connected' | 'interviewer_speaking' | 'candidate_speaking' | 'interviewer_thinking' | 'candidate_thinking' | 'finished'): void {
    this.publishDataPacket({ type: 'state', value: state });
  }

  private publishDataPacket(packet: any): void {
    if (!this.room.localParticipant) return;
    const payload = Buffer.from(JSON.stringify(packet));
    this.room.localParticipant.publishData(payload, {
      reliable: true
    }).catch(err => {
      console.error('[Live Agent Data] Broadcast error:', err);
    });
  }

  public cleanup(): void {
    console.log(`[Live Agent] Cleaning up live session: ${this.roomName}`);
    this.isFinished = true;
    if (this.room) {
      this.room.disconnect();
    }
  }
}
