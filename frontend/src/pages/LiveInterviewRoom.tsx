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
  Brain, 
  Users, 
  Copy, 
  Check, 
  Video, 
  MessageSquare,
  Activity,
  AlertCircle
} from 'lucide-react';

interface TranscriptItem {
  sender: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export const LiveInterviewRoom: React.FC = () => {
  const navigate = useNavigate();
  
  // Setup & Entry States
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Read initial query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const paramRoomId = queryParams.get('roomId') || '';
  const paramRole = queryParams.get('role') || 'interviewer';
  const paramToken = queryParams.get('token') || '';
  const paramSessionId = queryParams.get('sessionId') || '';

  const [roomIdInput, setRoomIdInput] = useState(paramRoomId);
  const [selectedRole, setSelectedRole] = useState<'interviewer' | 'candidate'>(
    (paramRole === 'candidate' || paramRole === 'interviewer') ? paramRole : 'interviewer'
  );
  const [error, setError] = useState<string | null>(null);

  // Active Session parameters
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const [agentState, setAgentState] = useState<'connected' | 'interviewer_speaking' | 'candidate_speaking' | 'interviewer_thinking' | 'candidate_thinking' | 'finished'>('connected');
  
  // Real-time Trackers
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Participant list representation
  const [participantsCount, setParticipantsCount] = useState(1); // include local user
  const [interviewerName, setInterviewerName] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string | null>(null);
  const [interviewerConnected, setInterviewerConnected] = useState(false);
  const [candidateConnected, setCandidateConnected] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  
  const [interviewerMuted, setInterviewerMuted] = useState(false);
  const [candidateMuted, setCandidateMuted] = useState(false);

  // Evaluation redirect states
  const [isEvaluating, setIsEvaluating] = useState(false);

  // LiveKit refs
  const roomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const transcriptsEndRef = useRef<HTMLDivElement | null>(null);
  const autoJoinedRef = useRef(false);
  const hasJoinedRef = useRef(false);

  // Canvas visual wave parameters
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Dynamic Scroll behavior for transcript panel
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Duration Timer
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

  // Poll for Report Readiness once the Interview is finished
  useEffect(() => {
    if (!isEvaluating || !sessionId) return;

    let pollInterval: any = null;
    let attempts = 0;
    const maxAttempts = 30; // 60s max wait time

    const checkReportStatus = async () => {
      try {
        attempts++;
        console.log(`[Client Polling] Checking session status. Attempt: ${attempts}`);
        const response = await api.get(`/live-interview/session/${sessionId}`);
        const session = response.data.session;
        
        if (session && session.reportId) {
          const reportId = typeof session.reportId === 'object' ? session.reportId._id : session.reportId;
          console.log('[Client Polling] Report is ready! Redirecting to report:', reportId);
          clearInterval(pollInterval);
          navigate(`/report/${reportId}`);
        } else if (attempts >= maxAttempts) {
          console.warn('[Client Polling] Max attempts reached. Returning to dashboard.');
          clearInterval(pollInterval);
          setIsEvaluating(false);
          setError('Report generation is taking longer than expected. Please check your dashboard in a few minutes.');
        }
      } catch (err) {
        console.error('[Client Polling] Status check failed:', err);
      }
    };

    pollInterval = setInterval(checkReportStatus, 2000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isEvaluating, sessionId, navigate]);

  // Initialize Canvas Visualizer Wave
  useEffect(() => {
    if (connectionStatus === 'connected' && canvasRef.current && analyserRef.current) {
      drawWave();
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [connectionStatus, agentState]);

  // Connect to LiveKit Room
  const handleConnect = async (token: string, roomName: string, seshId: string, role: 'interviewer' | 'candidate') => {
    if (hasJoinedRef.current) {
      console.log('[Client LK] Connection already initiated or connected. Skipping duplicate connect call.');
      return;
    }
    try {
      hasJoinedRef.current = true;
      setIsConnecting(true);
      setConnectionStatus('connecting');
      setError(null);

      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://intervexa-ai-w1v5n19y.livekit.cloud';

      // 1. Initialize local LiveKit Room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // 2. Set role connection statuses
      if (role === 'interviewer') {
        setInterviewerConnected(true);
        setInterviewerName('You (Interviewer)');
      } else {
        setCandidateConnected(true);
        setCandidateName('You (Candidate)');
      }

      // 3. Listen for Room Events
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('[Client LK] Participant joined:', participant.identity);
        updateParticipants(room);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('[Client LK] Participant left:', participant.identity);
        updateParticipants(room);
      });

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        console.log(`[Client LK] Subscribed to track ${track.sid} from ${participant.identity}`);
        updateParticipants(room);
      });

      room.on(RoomEvent.TrackMuted, (_publication, participant) => {
        updateParticipantMuteState(participant, true);
      });

      room.on(RoomEvent.TrackUnmuted, (_publication, participant) => {
        updateParticipantMuteState(participant, false);
      });

      // Data Channel Listeners for Real-time Transcripts and States
      room.on(RoomEvent.DataReceived, (payload, _participant) => {
        try {
          const textDecoder = new TextDecoder();
          const rawData = textDecoder.decode(payload);
          const packet = JSON.parse(rawData);

          if (packet.type === 'state') {
            console.log('[Client LK] Received state packet:', packet.value);
            setAgentState(packet.value);
            if (packet.value === 'finished') {
              console.log('[Client LK] Interview finished by interviewer.');
              setIsEvaluating(true);
              handleDisconnect();
            }
          } else if (packet.type === 'live_transcript') {
            console.log('[Client LK] Received live transcript:', packet.text);
            setTranscripts(prev => [
              ...prev,
              {
                sender: packet.sender,
                text: packet.text,
                timestamp: new Date(packet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        } catch (err) {
          console.error('[Client LK] Error decoding data packet:', err);
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[Client LK] Room disconnected.');
        handleDisconnect();
      });

      // 4. Connect to LiveKit Cloud Room
      await room.connect(livekitUrl, token);
      console.log('[Client LK] Connected successfully to Room.');
      setConnectionStatus('connected');
      setSessionStarted(true);
      setRoomId(roomName);
      setSessionId(seshId);
      updateParticipants(room);

      // 5. Publish Microphone Track
      const localTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true
      });
      localAudioTrackRef.current = localTrack;
      await room.localParticipant.publishTrack(localTrack);
      console.log('[Client LK] Microphone track published.');

      // 6. Connect Web Audio Visualizer
      setupMicrophoneVisualizer(localTrack);

    } catch (err: any) {
      console.error('[Client LK] Connection error:', err);
      hasJoinedRef.current = false;
      autoJoinedRef.current = false;
      setConnectionStatus('failed');
      setIsConnecting(false);
      setError(err.response?.data?.message || 'Failed to initialize session. Please check your credentials or network connection.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-connect if token/roomId/sessionId are provided in the URL on load
  useEffect(() => {
    const autoJoin = async () => {
      if (autoJoinedRef.current) return;
      if (paramToken && paramRoomId && paramSessionId) {
        autoJoinedRef.current = true;
        console.log(`[Auto-Join] Query parameters present. Automatically connecting to room: ${paramRoomId}`);
        handleConnect(paramToken, paramRoomId, paramSessionId, selectedRole);
      } else if (paramRoomId && !paramToken) {
        autoJoinedRef.current = true;
        console.log(`[Auto-Join] Room ID present but no token. Fetching token dynamically for room: ${paramRoomId}`);
        try {
          setIsConnecting(true);
          setError(null);
          const response = await api.post('/live-interview/join', {
            roomId: paramRoomId,
            role: selectedRole
          });
          const { token, sessionId } = response.data;
          handleConnect(token, paramRoomId, sessionId, selectedRole);
        } catch (err: any) {
          console.error('[Auto-Join] Failed to fetch token:', err);
          setError(err.response?.data?.message || 'Failed to auto-join the live room.');
          setIsConnecting(false);
          autoJoinedRef.current = false;
        }
      }
    };
    autoJoin();
  }, [paramToken, paramRoomId, paramSessionId, selectedRole]);

  const updateParticipants = (room: Room) => {
    let count = 1; // Include self
    let agentPresent = false;
    let peerInterviewerConnected = false;
    let peerCandidateConnected = false;

    // Check remote participants
    for (const [_, participant] of room.remoteParticipants) {
      count++;
      
      // Parse identity or metadata
      let role = 'candidate';
      try {
        const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
        role = metadata.role || 'candidate';
      } catch (e) {
        if (participant.identity === 'ai-evaluation-agent') role = 'agent';
      }

      if (participant.identity === 'ai-evaluation-agent' || role === 'agent') {
        agentPresent = true;
      } else if (role === 'interviewer') {
        peerInterviewerConnected = true;
        setInterviewerName(participant.name || 'Interviewer');
      } else if (role === 'candidate') {
        peerCandidateConnected = true;
        setCandidateName(participant.name || 'Candidate');
      }
    }

    setParticipantsCount(count);
    setAgentConnected(agentPresent);
    
    if (selectedRole === 'interviewer') {
      setInterviewerConnected(true);
      setCandidateConnected(peerCandidateConnected);
    } else {
      setCandidateConnected(true);
      setInterviewerConnected(peerInterviewerConnected);
    }
  };

  const updateParticipantMuteState = (participant: any, isMuted: boolean) => {
    let role = 'candidate';
    try {
      const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
      role = metadata.role || 'candidate';
    } catch (e) {
      if (participant.identity === 'ai-evaluation-agent') role = 'agent';
    }

    if (role === 'interviewer') {
      setInterviewerMuted(isMuted);
    } else if (role === 'candidate') {
      setCandidateMuted(isMuted);
    }
  };

  // Create Room Session
  const handleCreateRoom = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const response = await api.post('/live-interview/create', { role: selectedRole });
      const { token, roomId, sessionId } = response.data;
      
      await handleConnect(token, roomId, sessionId, selectedRole);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create live room. Please try again.');
      setIsConnecting(false);
    }
  };

  // Join Room Session
  const handleJoinRoom = async () => {
    if (!roomIdInput.trim()) {
      setError('Please enter a valid Room ID.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const response = await api.post('/live-interview/join', {
        roomId: roomIdInput.trim(),
        role: selectedRole
      });
      const { token, sessionId } = response.data;

      await handleConnect(token, roomIdInput.trim(), sessionId, selectedRole);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to join live room. Please verify the Room ID and try again.');
      setIsConnecting(false);
    }
  };

  // Audio Analyzer Visualizer
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
      
      // Select visualizer bar color depending on who is currently speaking
      let waveColor = '#4b5563'; // Idle gray
      if (agentState === 'interviewer_speaking') waveColor = '#ec4899'; // Interviewer speaking pink
      else if (agentState === 'candidate_speaking') waveColor = '#6366f1'; // Candidate speaking indigo
      else if (agentState === 'interviewer_thinking' || agentState === 'candidate_thinking') waveColor = '#eab308'; // AI agent processing yellow

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // scale height based on frequency
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        ctx.fillStyle = waveColor;
        // Symmetric drawing
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1.5, barHeight);

        x += barWidth;
      }
    };

    renderFrame();
  };

  // Toggle Microphone
  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;
    try {
      if (isMuted) {
        await localAudioTrackRef.current.unmute();
        setIsMuted(false);
        updateParticipantMuteState({ metadata: JSON.stringify({ role: selectedRole }) }, false);
      } else {
        await localAudioTrackRef.current.mute();
        setIsMuted(true);
        updateParticipantMuteState({ metadata: JSON.stringify({ role: selectedRole }) }, true);
      }
    } catch (err) {
      console.error('[Client Mute] Error toggling mute status:', err);
    }
  };

  // End Interview Session & Start Report Generation
  const handleEndInterview = async () => {
    if (!sessionId) return;
    
    try {
      setError(null);

      // If the candidate has not joined the room, we don't start the evaluation process
      if (selectedRole === 'interviewer' && !candidateConnected) {
        console.log('[Client End] Ending session without evaluation because candidate never joined.');
        await api.post('/live-interview/end', { sessionId });
        handleDisconnect();
        setError('Interview room closed. No evaluation report was generated because the candidate did not join.');
        return;
      }

      setIsEvaluating(true);

      // Broadcast to other participants in the room that the interview is finished
      if (roomRef.current && roomRef.current.localParticipant) {
        try {
          const encoder = new TextEncoder();
          const payload = encoder.encode(JSON.stringify({ type: 'state', value: 'finished' }));
          await roomRef.current.localParticipant.publishData(payload, { reliable: true });
          console.log('[Client LK] Broadcasted finished state to peers.');
        } catch (publishErr) {
          console.warn('[Client LK] Failed to publish finished state packet:', publishErr);
        }
      }

      // Tell backend to end room and compile report in the background
      await api.post('/live-interview/end', { sessionId });
      
      // Cleanup WebRTC room on frontend
      handleDisconnect();

    } catch (err) {
      console.error('[Client End] End interview failed:', err);
      setError('Failed to end the interview cleanly. You can exit manually.');
      setIsEvaluating(false);
    }
  };

  // Clean disconnect room
  const handleDisconnect = () => {
    autoJoinedRef.current = false;
    hasJoinedRef.current = false;
    // 1. Stop visualizer animation
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    // 2. Stop microphone tracks
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current = null;
    }

    // 3. Clear audio contexts
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => console.error(e));
      audioContextRef.current = null;
    }

    // 4. Disconnect LiveKit Room
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    // 5. Clear interval timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setSessionStarted(false);
    setConnectionStatus('disconnected');
    setParticipantsCount(1);
    setInterviewerConnected(false);
    setCandidateConnected(false);
    setAgentConnected(false);
  };

  // Copy Room ID to clipboard for invitees
  const copyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Count metrics based on transcripts
  const questionsAskedCount = transcripts.filter(t => t.sender === 'interviewer').length;
  const answersReceivedCount = transcripts.filter(t => t.sender === 'candidate').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brandPrimary to-brandSecondary text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Live Interview Room</h2>
            <p className="text-xs text-textMuted mt-0.5">Real-time collaborative tech interview call with silent AI Evaluation Agent</p>
          </div>
        </div>
        
        {sessionStarted && roomId && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-gray-300">
              Room ID: {roomId}
            </span>
            <button
              onClick={copyRoomId}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition"
              title="Copy Room ID"
            >
              {isCopied ? <Check className="h-4 w-4 text-brandSecondary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Setup Screen (when not connected) */}
      {!sessionStarted && !isEvaluating && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur space-y-6">
            <h3 className="text-lg font-bold text-white">Join / Create Interview Call</h3>
            
            <div className="space-y-4">
              {/* Select Role */}
              <div>
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider block mb-2">Select Your Role</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedRole('interviewer')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${
                      selectedRole === 'interviewer' 
                        ? 'border-brandPrimary bg-brandPrimary/10 text-white shadow-lg shadow-brandPrimary/5' 
                        : 'border-white/5 bg-white/2 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <Video className="h-6 w-6 mb-2" />
                    <span className="text-sm font-semibold">Interviewer</span>
                    <span className="text-[10px] text-textMuted mt-1">REAL PERSON</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedRole('candidate')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${
                      selectedRole === 'candidate' 
                        ? 'border-brandPrimary bg-brandPrimary/10 text-white shadow-lg shadow-brandPrimary/5' 
                        : 'border-white/5 bg-white/2 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm font-semibold">Candidate</span>
                    <span className="text-[10px] text-textMuted mt-1">REAL PERSON</span>
                  </button>
                </div>
              </div>

              {/* Action Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                {/* Panel 1: Create Room */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">Host a Session</h4>
                  <p className="text-xs text-textMuted">Generate a unique LiveKit room. The AI silent evaluation agent will automatically join the room.</p>
                  <button
                    onClick={handleCreateRoom}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Video className="h-4 w-4" />
                    <span>{isConnecting ? 'Initializing Call...' : 'Create Room'}</span>
                  </button>
                </div>

                {/* Panel 2: Join Room */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">Join Existing Session</h4>
                  <p className="text-xs text-textMuted">Paste the Room ID provided by the interviewer to connect your audio stream.</p>
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="live-interview-xxxx..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brandPrimary focus:outline-none"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <Users className="h-4 w-4" />
                    <span>{isConnecting ? 'Connecting...' : 'Join Room'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description Sidebar */}
          <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur space-y-4 text-xs text-gray-300 leading-relaxed">
            <h4 className="text-sm font-bold text-white">How it Works</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <span className="font-bold text-brandPrimary">1.</span>
                <p><span className="text-white font-semibold">WebRTC Connection</span>: Both users communicate directly via ultra low-latency LiveKit real-time voice call.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-brandPrimary">2.</span>
                <p><span className="text-white font-semibold">Silent AI Observer</span>: The AI agent connects silently as the third participant. It never speaks, interrupts, or asks questions.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-brandPrimary">3.</span>
                <p><span className="text-white font-semibold">Real-Time Transcription</span>: The AI listens to both feeds, isolates questions and answers, and transcribes them.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-brandPrimary">4.</span>
                <p><span className="text-white font-semibold">Automated Grading</span>: Once the interview ends, a comprehensive score sheet is generated assessing confidence, fluency, and answers.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Evaluating Loading Screen */}
      {isEvaluating && (
        <div className="rounded-2xl border border-white/10 bg-cardBg p-12 text-center backdrop-blur space-y-6 max-w-xl mx-auto">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-brandPrimary/10 border border-brandPrimary/20 flex items-center justify-center text-brandPrimary animate-pulse">
              <Brain className="h-8 w-8 text-brandPrimary" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">AI Evaluation In Progress</h3>
            <p className="text-sm text-textMuted">The Observer Agent is compiling the conversation transcripts, computing technical scores, and generating your detailed feedback report...</p>
          </div>
          <div className="flex justify-center">
            <div className="flex space-x-1.5 items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-brandPrimary animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-brandSecondary animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-brandAccent animate-bounce"></div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Room Screen */}
      {sessionStarted && !isEvaluating && (
        <div className="space-y-6">
          {/* Real-time stats header row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-cardBg p-4 backdrop-blur flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-textMuted uppercase tracking-wider block">Participants ({participantsCount} Connected)</span>
              </div>
              <div className="space-y-1 text-[11px] mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Interviewer:</span>
                  <span className={interviewerConnected ? 'text-brandAccent font-semibold' : 'text-textMuted'}>
                    {interviewerConnected ? 'Connected' : 'Waiting'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Candidate:</span>
                  <span className={candidateConnected ? 'text-brandPrimary font-semibold' : 'text-textMuted'}>
                    {candidateConnected ? 'Connected' : 'Waiting'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">AI Observer:</span>
                  <span className={agentConnected ? 'text-brandSecondary font-semibold animate-pulse' : 'text-textMuted'}>
                    {agentConnected ? 'Connected' : 'Joining...'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-cardBg p-5 backdrop-blur">
              <span className="text-xs text-textMuted uppercase tracking-wider block">Call Mode</span>
              <h4 className="text-lg font-bold text-brandPrimary mt-1.5 flex items-center space-x-2">
                <Activity className="h-4 w-4 text-brandPrimary animate-pulse" />
                <span>Live Voice (WebRTC)</span>
              </h4>
            </div>

            <div className="rounded-2xl border border-white/10 bg-cardBg p-5 backdrop-blur">
              <span className="text-xs text-textMuted uppercase tracking-wider block">AI Observer</span>
              <h4 className="text-lg font-bold text-brandSecondary mt-1.5 flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brandSecondary"></span>
                </span>
                <span>{agentConnected ? 'Active Listening' : 'Waiting...'}</span>
              </h4>
            </div>

            <div className="rounded-2xl border border-white/10 bg-cardBg p-5 backdrop-blur">
              <span className="text-xs text-textMuted uppercase tracking-wider block">AI Report Status</span>
              <h4 className="text-lg font-bold text-brandAccent mt-1.5 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-brandAccent" />
                <span>Compiling Live</span>
              </h4>
            </div>
          </div>

          {/* Main Visualizer and Control Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Voice Room Visualizer grid */}
              <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Live Voice Call Deck</span>
                  <span className="text-xs bg-brandPrimary/10 border border-brandPrimary/20 px-2.5 py-1 rounded-full text-brandPrimary font-semibold tracking-wider">
                    {connectionStatus.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Left Column: Interviewer Card */}
                  <div className={`p-5 rounded-xl border transition ${
                    agentState === 'interviewer_speaking' 
                      ? 'bg-pink-500/5 border-pink-500/30' 
                      : 'bg-white/2 border-white/5'
                  }`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white ${
                        interviewerConnected ? 'bg-pink-600/30 border border-pink-500/40' : 'bg-white/5 border border-white/10'
                      }`}>
                        <Video className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{interviewerName || 'Waiting...'}</h4>
                        <span className="text-[10px] text-textMuted uppercase tracking-wider">Role: Interviewer</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t border-white/5">
                      <span className="text-textMuted">Microphone</span>
                      {interviewerMuted ? (
                        <span className="text-red-400 font-semibold flex items-center space-x-1">
                          <MicOff className="h-3.5 w-3.5" />
                          <span>Muted</span>
                        </span>
                      ) : (
                        <span className="text-brandAccent font-semibold flex items-center space-x-1">
                          <Mic className="h-3.5 w-3.5" />
                          <span>Unmuted</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Candidate Card */}
                  <div className={`p-5 rounded-xl border transition ${
                    agentState === 'candidate_speaking' 
                      ? 'bg-brandPrimary/5 border-brandPrimary/30' 
                      : 'bg-white/2 border-white/5'
                  }`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white ${
                        candidateConnected ? 'bg-brandPrimary/30 border border-brandPrimary/40' : 'bg-white/5 border border-white/10'
                      }`}>
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{candidateName || 'Waiting...'}</h4>
                        <span className="text-[10px] text-textMuted uppercase tracking-wider">Role: Candidate</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t border-white/5">
                      <span className="text-textMuted">Microphone</span>
                      {candidateMuted ? (
                        <span className="text-red-400 font-semibold flex items-center space-x-1">
                          <MicOff className="h-3.5 w-3.5" />
                          <span>Muted</span>
                        </span>
                      ) : (
                        <span className="text-brandAccent font-semibold flex items-center space-x-1">
                          <Mic className="h-3.5 w-3.5" />
                          <span>Unmuted</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Symmetric Soundwave Visualizer Canvas */}
                <div className="h-28 rounded-xl border border-white/5 bg-white/2 flex items-center justify-center relative overflow-hidden">
                  <canvas ref={canvasRef} width={600} height={110} className="w-full h-full block" />
                  
                  {/* Visual overlay description of who speaks */}
                  <div className="absolute bottom-2.5 left-4 text-[10px] font-semibold text-textMuted flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                    <span>Interviewer</span>
                    <span className="h-2 w-2 rounded-full bg-brandPrimary ml-2"></span>
                    <span>Candidate</span>
                  </div>
                </div>

                {/* Silent AI Evaluation Observer Badge */}
                <div className="rounded-xl border border-white/5 bg-white/2 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-brandSecondary/15 border border-brandSecondary/25 flex items-center justify-center text-brandSecondary">
                        <Brain className="h-5 w-5 animate-pulse" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-brandAccent border-2 border-cardBg animate-ping"></span>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-brandAccent border-2 border-cardBg"></span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">AI Evaluation Agent</h5>
                      <span className="text-[10px] text-textMuted block">Joined Room • Silently Listening</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-brandAccent block">Status</span>
                    <span className="text-xs font-bold text-white">
                      {agentState.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deck Control Panels */}
              <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {/* Timer widget */}
                  <div className="flex items-center space-x-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-gray-300">
                    <Clock className="h-4 w-4 text-brandPrimary" />
                    <span className="font-mono font-semibold">{formatTimer(timer)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Microphone Toggle Button */}
                  <button
                    onClick={toggleMute}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                      isMuted 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  {/* End Interview Call Button */}
                  <button
                    onClick={handleEndInterview}
                    className="flex items-center justify-center space-x-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow shadow-red-600/20 transition"
                  >
                    <PhoneOff className="h-4 w-4" />
                    <span>End Interview</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Transcript Panel Column */}
            <div className="rounded-2xl border border-white/10 bg-cardBg p-6 backdrop-blur flex flex-col h-[495px]">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                <MessageSquare className="h-4.5 w-4.5 text-brandSecondary" />
                <span>Live Dialogue Feed</span>
              </h4>

              {/* Dialogue Scroll container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {transcripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Brain className="h-8 w-8 text-white/10 animate-bounce" />
                    <p className="text-xs text-textMuted">Waiting for conversation to begin. The AI Agent will transcribe interviewer questions and candidate answers in real-time...</p>
                  </div>
                ) : (
                  transcripts.map((t, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition leading-relaxed ${
                        t.sender === 'interviewer' 
                          ? 'bg-pink-500/5 border-pink-500/10 text-pink-200' 
                          : 'bg-brandPrimary/5 border-brandPrimary/10 text-brandPrimary/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-[9px]">
                          {t.sender.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-textMuted">{t.timestamp}</span>
                      </div>
                      <p className="italic">"{t.text}"</p>
                    </div>
                  ))
                )}
                <div ref={transcriptsEndRef} />
              </div>

              {/* Dialog metrics trackers */}
              <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-white/5 text-center">
                <div className="bg-white/2 border border-white/5 p-2 rounded-xl">
                  <span className="text-[10px] text-textMuted block">Questions</span>
                  <h6 className="text-sm font-extrabold text-white mt-0.5">{questionsAskedCount}</h6>
                </div>
                <div className="bg-white/2 border border-white/5 p-2 rounded-xl">
                  <span className="text-[10px] text-textMuted block">Answers</span>
                  <h6 className="text-sm font-extrabold text-white mt-0.5">{answersReceivedCount}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveInterviewRoom;
