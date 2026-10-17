import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from './socket';

interface UseVoiceChatProps {
  roomId: string | null;
  userColor: 'white' | 'black' | 'spectator';
  isGameActive: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useVoiceChat({ roomId, userColor, isGameActive }: UseVoiceChatProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [isPeerConnected, setIsPeerConnected] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize hidden remote audio element
  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audio = new Audio();
      audio.autoplay = true;
      remoteAudioRef.current = audio;
    }
  }, []);

  // Monitor speaking levels using Web Audio API
  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let speakingCount = 0;

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for speaking
        const speakingNow = average > 15;
        if (speakingNow) {
          speakingCount = Math.min(speakingCount + 1, 5);
        } else {
          speakingCount = Math.max(speakingCount - 1, 0);
        }

        const isCurrentlySpeaking = speakingCount > 2;
        setIsSpeaking((prev) => {
          if (prev !== isCurrentlySpeaking) {
            if (roomId) {
              socket.emit('webrtc-mic-status', {
                roomId,
                isMuted: isMuted,
                isSpeaking: isCurrentlySpeaking,
              });
            }
          }
          return isCurrentlySpeaking;
        });

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // Ignore Web Audio API fallback errors
    }
  };

  // Create Peer Connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        socket.emit('webrtc-ice-candidate', {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      setIsPeerConnected(pc.connectionState === 'connected');
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId]);

  // Start Voice Connection
  const startVoice = useCallback(async () => {
    if (userColor === 'spectator' || !roomId) return;
    setMicPermissionError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      setIsVoiceActive(true);
      setIsMuted(false);

      setupAudioAnalysis(stream);

      const pc = createPeerConnection();

      // Initiate WebRTC offer if white or initiating player
      if (userColor === 'white') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { roomId, offer });
      }

      // Send initial mic status
      socket.emit('webrtc-mic-status', { roomId, isMuted: false, isSpeaking: false });
    } catch (err: any) {
      setMicPermissionError('Microphone access denied or not available.');
      setIsVoiceActive(false);
    }
  }, [roomId, userColor, createPeerConnection]);

  // Stop Voice Connection
  const stopVoice = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsVoiceActive(false);
    setIsMuted(false);
    setIsSpeaking(false);
    setIsPeerConnected(false);
  }, []);

  // Toggle Mute / Unmute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const nextMuted = !isMuted;
      audioTracks[0].enabled = !nextMuted;
      setIsMuted(nextMuted);

      if (roomId) {
        socket.emit('webrtc-mic-status', {
          roomId,
          isMuted: nextMuted,
          isSpeaking: false,
        });
      }
    }
  }, [isMuted, roomId]);

  // Handle Incoming Socket Signaling Events
  useEffect(() => {
    if (!roomId || userColor === 'spectator') return;

    async function onOffer(data: { senderId: string; offer: RTCSessionDescriptionInit }) {
      if (!isVoiceActive && !localStreamRef.current) {
        // Auto start local stream when opponent initiates offer
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          setIsVoiceActive(true);
          setupAudioAnalysis(stream);
        } catch {
          return;
        }
      }

      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc-answer', { roomId, answer });
    }

    async function onAnswer(data: { senderId: string; answer: RTCSessionDescriptionInit }) {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    }

    async function onIceCandidate(data: { senderId: string; candidate: RTCIceCandidateInit }) {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
          // ignore candidate error
        }
      }
    }

    function onMicStatus(data: { senderId: string; isMuted: boolean; isSpeaking?: boolean }) {
      setRemoteMuted(data.isMuted);
      if (data.isSpeaking !== undefined) {
        setRemoteSpeaking(data.isSpeaking);
      }
    }

    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIceCandidate);
    socket.on('webrtc-mic-status', onMicStatus);

    return () => {
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIceCandidate);
      socket.off('webrtc-mic-status', onMicStatus);
    };
  }, [roomId, userColor, isVoiceActive, createPeerConnection]);

  // Cleanup on unmount or game leave
  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  return {
    isVoiceActive,
    isMuted,
    isSpeaking,
    remoteMuted,
    remoteSpeaking,
    isPeerConnected,
    micPermissionError,
    startVoice,
    stopVoice,
    toggleMute,
  };
}
