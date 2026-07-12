import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { 
  Room, 
  RoomEvent, 
  LocalAudioTrack, 
  createLocalAudioTrack 
} from 'livekit-client';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Clock, 
  Sparkles,
  MessageSquare,
  AlertCircle,
  Brain
} from 'lucide-react';

interface TranscriptItem {
  sender: 'ai' | 'user';
  text: string;
}

export const InterviewRoom: React.FC = () => {
  const navigate = useNavigate();
  
  // Connection states
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [aiState, setAiState] = useState<'greeting' | 'thinking' | 'speaking' | 'listening' | 'finished'>('greeting');
  const [error, setError] = useState<string | null>(null);
  
  // Real-time parameters
  const [currentQuestion, setCurrentQuestion] = useState('Interviewer is joining...');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [speechMetrics, setSpeechMetrics] = useState<any>(null);

  // Evaluation & Session ID states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const isEvaluatingRef = useRef(false);
  const aiStateRef = useRef<'greeting' | 'thinking' | 'speaking' | 'listening' | 'finished'>('greeting');

  // LiveKit refs
  const roomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const transcriptsEndRef = useRef<HTMLDivElement | null>(null);

  // Canvas visual wave parameters
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-scroll transcript container
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Session duration timer
  useEffect(() => {
    if (connectionStatus === 'connected') {
      timerIntervalRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimer(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [connectionStatus]);

  // Polling for report readiness
  useEffect(() => {
    if (!isEvaluating || !sessionId) return;

    let pollInterval: any = null;
    let attempts = 0;
    const maxAttempts = 30; // 60s max wait time

    const checkReportStatus = async () => {
      try {
        attempts++;
        console.log(`[Client Polling] Checking session status. Attempt: ${attempts}`);
        const response = await api.get(`/interview/session/${sessionId}`);
        const session = response.data.session;
        
        if (session && session.reportId) {
          const reportId = typeof session.reportId === 'object' ? session.reportId._id : session.reportId;
          console.log('[Client Polling] Report is ready! Redirecting to report:', reportId);
          clearInterval(pollInterval);
          navigate(`/report/${reportId}`);
        } else if (attempts >= maxAttempts) {
          console.warn('[Client Polling] Max attempts reached. Redirecting to dashboard.');
          clearInterval(pollInterval);
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('[Client Polling] Error checking report status:', err);
      }
    };

    checkReportStatus();
    pollInterval = setInterval(checkReportStatus, 2000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isEvaluating, sessionId, navigate]);

  const handleStartInterview = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);
    setTranscripts([]);
    setTimer(0);
    isEvaluatingRef.current = false;
    aiStateRef.current = 'greeting';
    
    try {
      const response = await api.post('/interview/start');
      const { token, sessionId } = response.data;
      setSessionId(sessionId);
      
      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-url.livekit.cloud';

      // 2. Initialize LiveKit Room
      const room = new Room({
        adaptiveStream: true
      });
      roomRef.current = room;

      // 3. Setup event listeners
      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === 'audio') {
          console.log(`[Client LK] Subscribed to audio track from: ${participant.identity}`);
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
        }
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const textDecoder = new TextDecoder();
          const decodedText = textDecoder.decode(payload);
          const data = JSON.parse(decodedText);

          console.log('[Client LK] Received data packet:', data);

          if (data.type === 'state') {
            aiStateRef.current = data.value;
            setAiState(data.value);
            if (data.value === 'finished') {
              isEvaluatingRef.current = true;
              setIsEvaluating(true);
              cleanupRoom();
              setSessionStarted(false);
            }
          } else if (data.type === 'transcript') {
            setTranscripts((prev) => [...prev, { sender: data.sender, text: data.text }]);
          } else if (data.type === 'question') {
            setCurrentQuestion(data.text);
          } else if (data.type === 'metrics') {
            setSpeechMetrics(data.data);
          } else if (data.type === 'speak_text') {
            console.log('[Client Speech] Fallback speech synthesis:', data.value);
            window.speechSynthesis.cancel(); // Cancel any ongoing speech
            const utterance = new SpeechSynthesisUtterance(data.value);
            const voices = window.speechSynthesis.getVoices();
            // Look for Google US English or standard English voice
            const preferredVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'));
            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }

            utterance.onstart = () => {
              console.log('[Client Speech] Muting mic to prevent echo...');
              if (localAudioTrackRef.current) {
                localAudioTrackRef.current.mute().then(() => setIsMuted(true)).catch(e => console.error(e));
              }
            };
            
            utterance.onend = () => {
              console.log('[Client Speech] Speech ended. Unmuting mic...');
              if (localAudioTrackRef.current) {
                localAudioTrackRef.current.unmute().then(() => setIsMuted(false)).catch(e => console.error(e));
              }
            };
            
            utterance.onerror = () => {
              console.log('[Client Speech] Speech error. Unmuting mic...');
              if (localAudioTrackRef.current) {
                localAudioTrackRef.current.unmute().then(() => setIsMuted(false)).catch(e => console.error(e));
              }
            };

            window.speechSynthesis.speak(utterance);
          }
        } catch (err) {
          console.error('[Client LK] Error decoding data packet:', err);
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[Client LK] Room disconnected.');
        handleDisconnect();
      });

      // 4. Connect to Room
      await room.connect(livekitUrl, token);
      console.log('[Client LK] Connected successfully.');
      setConnectionStatus('connected');
      setSessionStarted(true);

      // 5. Publish microphone track
      const localTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true
      });
      localAudioTrackRef.current = localTrack;
      await room.localParticipant.publishTrack(localTrack);
      console.log('[Client LK] Microphones track published.');

      // 6. Connect Web Audio Visualizer
      setupMicrophoneVisualizer(localTrack);

    } catch (err: any) {
      console.error('[Client LK] Connection error:', err);
      setConnectionStatus('failed');
      setIsConnecting(false);
      setError(err.response?.data?.message || 'Failed to initialize session. Please try again.');
    }
  };

  const setupMicrophoneVisualizer = (track: LocalAudioTrack) => {
    try {
      const mediaStream = new MediaStream([track.mediaStreamTrack]);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      
      drawWave();
    } catch (err) {
      console.error('[Visualizer] Setup failed:', err);
    }
  };

  const drawWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Determine wave parameters based on speaking state
      let pulseColor = '#4F46E5'; // Default blue
      if (aiState === 'speaking') pulseColor = '#EC4899'; // Pink when AI speaks
      else if (aiState === 'thinking') pulseColor = '#EAB308'; // Yellow when thinking

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Draw symmetric waves
        ctx.fillStyle = pulseColor;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    renderFrame();
  };

  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;
    if (isMuted) {
      await localAudioTrackRef.current.unmute();
      setIsMuted(false);
    } else {
      await localAudioTrackRef.current.mute();
      setIsMuted(true);
    }
  };

  const cleanupRoom = () => {
    // Cancel any fallback browser speech synthesis
    window.speechSynthesis.cancel();
    
    // Stop recording visual frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close LiveKit Room
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    
    // Stop microphone
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current = null;
    }

    setConnectionStatus('disconnected');
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    cleanupRoom();
    setSessionStarted(false);
    
    // Only navigate back to the dashboard if they manually quit early (aiState is not finished)
    // and we are not currently generating/polling for the evaluation report.
    if (aiStateRef.current !== 'finished' && !isEvaluatingRef.current) {
      navigate('/dashboard');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6">
      {isEvaluating ? (
        /* Evaluation Loading/Report Generating Screen */
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-cardBg p-8 text-center backdrop-blur shadow-2xl space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white mx-auto animate-pulse">
            <Brain className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-white font-sans">Generating Evaluation Report</h2>
          <p className="text-sm text-textMuted max-w-md mx-auto leading-relaxed">
            Our AI evaluator is reviewing your responses, speech parameters, and confidence scores to compile a comprehensive performance analysis.
          </p>
          
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-brandPrimary animate-pulse w-2/3 rounded-full"></div>
            </div>
            <span className="text-xs text-brandSecondary font-semibold uppercase tracking-wider animate-pulse">
              Analyzing transcript and metrics...
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/2 p-4 text-xs text-textMuted max-w-sm mx-auto text-left space-y-2">
            <p className="flex items-center space-x-2 text-white font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-brandSecondary" />
              <span>What's inside the report?</span>
            </p>
            <p>• Detailed ATS score analysis & technical knowledge grading.</p>
            <p>• Communication fluency feedback & emotional stress logs.</p>
            <p>• Expected answer comparisons & custom learning resources.</p>
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-textMuted underline hover:text-white transition"
            >
              Skip and go to Dashboard
            </button>
          </div>
        </div>
      ) : !sessionStarted ? (
        /* Startup Glass Panel */
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-cardBg p-8 text-center backdrop-blur shadow-2xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white mx-auto mb-6">
            <Brain className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-white font-sans">AI Voice Mock Interview</h2>
          <p className="mt-4 text-sm text-textMuted max-w-md mx-auto leading-relaxed font-sans">
            Participate in a realistic, adaptive technical screening. The AI agent will greet you first and adjust question difficulty based on your answers.
          </p>

          <div className="mt-8 rounded-xl border border-white/5 bg-white/2 p-4 text-xs text-textMuted max-w-sm mx-auto text-left space-y-2">
            <p className="flex items-center space-x-2 text-white font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-brandSecondary" />
              <span>Guidelines Check</span>
            </p>
            <p>• Speak naturally inside a quiet room environment.</p>
            <p>• Ensure your microphone permissions are granted.</p>
            <p>• Complete reports are generated instantly upon session close.</p>
          </div>

          {error && (
            <div className="mt-6 flex items-start space-x-2 rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-sm text-red-400 text-left max-w-sm mx-auto">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleStartInterview}
            disabled={isConnecting}
            className="mt-8 rounded-xl bg-brandPrimary px-8 py-4 font-semibold text-white shadow-lg shadow-brandPrimary/30 transition hover:bg-brandPrimary/80 disabled:opacity-50 font-sans"
          >
            {isConnecting ? 'Connecting LiveKit Room...' : 'Start Mock Interview'}
          </button>
        </div>
      ) : (
        /* Active Interview Room Grid */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Visual Arena */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-col justify-between min-h-[400px]">
              
              {/* Top status bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 animate-ping rounded-full bg-brandSecondary"></span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">Active Session</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5 text-xs text-textMuted">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(timer)}</span>
                  </div>
                  <span className="text-xs bg-brandPrimary/20 text-brandPrimary border border-brandPrimary/30 rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider">
                    {connectionStatus}
                  </span>
                </div>
              </div>

              {/* Central Wave Canvas */}
              <div className="flex-grow flex flex-col items-center justify-center my-6">
                <canvas 
                  ref={canvasRef} 
                  width={300} 
                  height={100} 
                  className="w-full max-w-sm rounded-lg"
                />
                
                <div className="mt-6 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2 block">
                    AI Interviewer Status: <span className="text-white capitalize">{aiState}</span>
                  </span>
                  <h4 className="text-lg font-bold text-white px-4 leading-relaxed max-w-xl mx-auto">
                    {currentQuestion}
                  </h4>
                </div>
              </div>

              {/* Bottom Control Bar */}
              <div className="flex items-center justify-center space-x-4 border-t border-white/5 pt-4">
                <button
                  onClick={toggleMute}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                    isMuted 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={handleDisconnect}
                  className="flex h-12 px-6 items-center justify-center space-x-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold transition hover:bg-red-500/20"
                >
                  <PhoneOff className="h-5 w-5" />
                  <span>End Interview</span>
                </button>
              </div>
            </div>

            {/* Realtime voice metrics analysis */}
            {speechMetrics && (
              <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
                <h3 className="text-sm font-bold uppercase tracking-wider text-textMuted mb-4">Voice Parameters Analysis</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
                  <div className="bg-white/2 rounded-xl border border-white/5 p-3">
                    <span className="text-xs text-textMuted">Confidence</span>
                    <h5 className="text-lg font-bold text-white mt-1">{speechMetrics.confidence}/10</h5>
                  </div>
                  <div className="bg-white/2 rounded-xl border border-white/5 p-3">
                    <span className="text-xs text-textMuted">Calmness</span>
                    <h5 className="text-lg font-bold text-brandAccent mt-1">{speechMetrics.calmness}/10</h5>
                  </div>
                  <div className="bg-white/2 rounded-xl border border-white/5 p-3">
                    <span className="text-xs text-textMuted">Stress Level</span>
                    <h5 className="text-lg font-bold text-red-400 mt-1">{speechMetrics.stress}/10</h5>
                  </div>
                  <div className="bg-white/2 rounded-xl border border-white/5 p-3">
                    <span className="text-xs text-textMuted">Speaking Rate</span>
                    <h5 className="text-lg font-bold text-brandPrimary mt-1">{speechMetrics.speedWordsPerMin} WPM</h5>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transcript Panel on Right Side */}
          <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-col justify-between h-[540px]">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-4">
              <MessageSquare className="h-5 w-5 text-brandPrimary" />
              <h3 className="text-md font-bold text-white">Live Transcription</h3>
            </div>

            {/* scrolling container */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {transcripts.map((t, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-sm ${
                    t.sender === 'ai' 
                      ? 'bg-brandPrimary/10 border border-brandPrimary/20 text-gray-200 self-start' 
                      : 'bg-white/5 border border-white/10 text-gray-300 self-end ml-auto'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1">
                    {t.sender === 'ai' ? 'AI Evaluator' : 'You'}
                  </span>
                  <p className="leading-relaxed">{t.text}</p>
                </div>
              ))}
              <div ref={transcriptsEndRef} />
            </div>
            
            <div className="border-t border-white/5 pt-4 mt-4 text-center">
              <span className="text-xs text-textMuted italic">
                {aiState === 'listening' ? '• AI is listening... Speak now' : '• AI is preparing response...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InterviewRoom;
