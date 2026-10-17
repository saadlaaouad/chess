/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { socket } from './lib/socket';
import {
  RoomState,
  PlayerColor,
  TimeControlOption,
  ChatMessage,
} from './types';
import { Navbar } from './components/Navbar';
import { RoomLobby } from './components/RoomLobby';
import { PlayerCard } from './components/PlayerCard';
import { ChessBoardContainer } from './components/ChessBoardContainer';
import { MoveHistory } from './components/MoveHistory';
import { ChatPanel } from './components/ChatPanel';
import { GameControls } from './components/GameControls';
import { GameOverModal } from './components/GameOverModal';
import { SoloEngineBoard } from './components/SoloEngineBoard';
import { QuickPlayModal } from './components/QuickPlayModal';
import { SettingsModal } from './components/SettingsModal';
import { DisconnectionModal } from './components/DisconnectionModal';
import { VoiceChatControls } from './components/VoiceChatControls';
import { AiCoachDrawer } from './components/AiCoachDrawer';
import { BuyCreditsModal } from './components/BuyCreditsModal';
import { addCredits, getCredits } from './lib/credits';
import { useVoiceChat } from './lib/useVoiceChat';
import { loadSettings, saveSettings, AppSettings } from './lib/settings';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound, playNotificationSound, getSoundMuted, setSoundMuted, setSoundVolume } from './lib/sound';
import { Handshake, AlertCircle, Trophy, Sparkles, X } from 'lucide-react';
import { useSEO } from './lib/useSEO';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [winRewardToast, setWinRewardToast] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [userColor, setUserColor] = useState<'white' | 'black' | 'spectator'>('spectator');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [drawOfferFrom, setDrawOfferFrom] = useState<'white' | 'black' | null>(null);
  const [soloBotMode, setSoloBotMode] = useState(false);
  const [isMuted, setIsMutedState] = useState(!settings.soundEnabled);

  // Sync loaded settings to sound engine
  useEffect(() => {
    setSoundMuted(!settings.soundEnabled);
    setSoundVolume(settings.soundVolume);
  }, [settings]);

  // Matchmaking state
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [searchTimeControl, setSearchTimeControl] = useState<TimeControlOption>('5+3');
  const [searchPlayerName, setSearchPlayerName] = useState('Grandmaster');

  // Disconnection handling state
  const [disconnectedData, setDisconnectedData] = useState<{
    name: string;
    winnerColor: 'white' | 'black';
  } | null>(null);

  // Live Voice Chat WebRTC Hook
  const voiceChat = useVoiceChat({
    roomId: roomState?.roomId || null,
    userColor,
    isGameActive: roomState?.status === 'active' || roomState?.status === 'waiting',
  });

  // Dynamic SEO meta tags
  const pageTitle = soloBotMode
    ? 'Practice vs Bot | GrandmasterMulti Chess'
    : roomState
    ? `Room ${roomState.roomId.toUpperCase()} | GrandmasterMulti Chess`
    : 'GrandmasterMulti - Real-Time Online Multiplayer Chess';

  const pageDescription = roomState
    ? `Live multiplayer chess room ${roomState.roomId}. Play real-time chess with live clock controls, move history, and instant rematches.`
    : soloBotMode
    ? 'Practice offline against a chess engine bot with move validation and instant feedback.'
    : 'Play real-time online chess with friends or practice against a chess engine bot. Create rooms, play live games, and track moves.';

  useSEO({ title: pageTitle, description: pageDescription });

  // Check URL query string for ?room=xyz123
  const [initialRoomCode, setInitialRoomCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') || params.get('code') || '';
    }
    return '';
  });

  // Socket Connection & Event Listeners Setup
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setLobbyError(null);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onRoomState(state: RoomState) {
      setRoomState(state);

      // Determine socket's user color role
      if (state.players.white?.id === socket.id) {
        setUserColor('white');
        setBoardOrientation('white');
      } else if (state.players.black?.id === socket.id) {
        setUserColor('black');
        setBoardOrientation('black');
      } else {
        setUserColor('spectator');
      }
    }

    function onMoveMade(data: { state: RoomState }) {
      setRoomState(data.state);
    }

    function onGameOver(data: { state: RoomState }) {
      setRoomState(data.state);
      playGameOverSound();

      if (data.state.winner && data.state.winner === userColor) {
        addCredits(3, 'Online Match Victory');
        setWinRewardToast('🏆 VICTORY BONUS! You won the match and earned +3 AI Coach Credits!');
      }
    }

    function onChatMessage(msg: ChatMessage) {
      setChatMessages((prev) => [...prev, msg]);
      if (msg.sender !== 'System') {
        playNotificationSound();
      }
    }

    function onDrawOffered(data: { requestedBy: 'white' | 'black' }) {
      setDrawOfferFrom(data.requestedBy);
      playNotificationSound();
    }

    function onDrawDeclined() {
      setDrawOfferFrom(null);
    }

    function onErrorMsg(msg: string) {
      setLobbyError(msg);
    }

    function onMatchmakingStatus(data: { status: 'queued' | 'cancelled' | 'matched' }) {
      if (data.status === 'cancelled') {
        setIsSearchingMatch(false);
      }
    }

    function onMatchFound(data: { roomId: string; color: 'white' | 'black'; state: RoomState }) {
      setIsSearchingMatch(false);
      setRoomState(data.state);
      setUserColor(data.color);
      setBoardOrientation(data.color);
      playNotificationSound();
    }

    function onOpponentDisconnected(data: {
      disconnectedColor: 'white' | 'black';
      disconnectedName: string;
      winner: 'white' | 'black';
    }) {
      setDisconnectedData({
        name: data.disconnectedName,
        winnerColor: data.winner,
      });
      playGameOverSound();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room-state', onRoomState);
    socket.on('move-made', onMoveMade);
    socket.on('game-over', onGameOver);
    socket.on('chat-message', onChatMessage);
    socket.on('draw-offered', onDrawOffered);
    socket.on('draw-declined', onDrawDeclined);
    socket.on('error-message', onErrorMsg);
    socket.on('matchmaking-status', onMatchmakingStatus);
    socket.on('match-found', onMatchFound);
    socket.on('opponent-disconnected', onOpponentDisconnected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room-state', onRoomState);
      socket.off('move-made', onMoveMade);
      socket.off('game-over', onGameOver);
      socket.off('chat-message', onChatMessage);
      socket.off('draw-offered', onDrawOffered);
      socket.off('draw-declined', onDrawDeclined);
      socket.off('error-message', onErrorMsg);
      socket.off('matchmaking-status', onMatchmakingStatus);
      socket.off('match-found', onMatchFound);
      socket.off('opponent-disconnected', onOpponentDisconnected);
    };
  }, []);

  // Quick Play Matchmaking Handler
  const handleFindQuickMatch = (name: string, timeControl: TimeControlOption) => {
    setLobbyError(null);
    setSearchPlayerName(name);
    setSearchTimeControl(timeControl);
    setIsSearchingMatch(true);

    socket.emit('join-matchmaking', { name, timeControl }, (response) => {
      if (response && !response.success) {
        setIsSearchingMatch(false);
        setLobbyError(response.error || 'Failed to enter matchmaking queue.');
      }
    });
  };

  const handleCancelMatchmaking = () => {
    setIsSearchingMatch(false);
    socket.emit('cancel-matchmaking');
  };

  // 1. Create Room Handler
  const handleCreateRoom = (data: {
    name: string;
    colorPreference: PlayerColor;
    timeControl: TimeControlOption;
    customCode?: string;
  }) => {
    setLobbyError(null);
    socket.emit('create-room', data, (response) => {
      if (!response.success) {
        setLobbyError(response.error || 'Failed to create room.');
      } else if (response.roomId) {
        // Automatically join created room
        socket.emit('join-room', { roomId: response.roomId, name: data.name }, (joinRes) => {
          if (!joinRes.success) {
            setLobbyError(joinRes.error || 'Failed to join created room.');
          }
        });
      }
    });
  };

  // 2. Join Room Handler
  const handleJoinRoom = (roomId: string, name: string) => {
    setLobbyError(null);
    socket.emit('join-room', { roomId, name }, (response) => {
      if (!response.success) {
        setLobbyError(response.error || 'Room not found or game unavailable.');
      }
    });
  };

  // 3. Make Move Handler
  const handleMakeMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!roomState) return;
    socket.emit('make-move', {
      roomId: roomState.roomId,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
  };

  // 4. Resign Handler
  const handleResign = () => {
    if (!roomState) return;
    socket.emit('resign', { roomId: roomState.roomId });
  };

  // 5. Draw Handlers
  const handleOfferDraw = () => {
    if (!roomState) return;
    socket.emit('offer-draw', { roomId: roomState.roomId });
  };

  const handleRespondDraw = (accept: boolean) => {
    if (!roomState) return;
    socket.emit('respond-draw', { roomId: roomState.roomId, accept });
    setDrawOfferFrom(null);
  };

  // 6. Rematch Handlers
  const handleRequestRematch = () => {
    if (!roomState) return;
    socket.emit('request-rematch', { roomId: roomState.roomId });
  };

  const handleRespondRematch = (accept: boolean) => {
    if (!roomState) return;
    socket.emit('respond-rematch', { roomId: roomState.roomId, accept });
  };

  // 7. Chat Handler
  const handleSendChat = (text: string) => {
    if (!roomState) return;
    socket.emit('send-chat', { roomId: roomState.roomId, text, senderName: searchPlayerName });
  };

  // 8. Leave Room
  const handleLeaveRoom = () => {
    setRoomState(null);
    setChatMessages([]);
    setDrawOfferFrom(null);
    setSoloBotMode(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Toggle Mute
  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMutedState(nextMuted);
    setSoundMuted(nextMuted);
    const updated = { ...settings, soundEnabled: !nextMuted };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsMutedState(!newSettings.soundEnabled);
    setSoundMuted(!newSettings.soundEnabled);
    setSoundVolume(newSettings.soundVolume);
  };

  // Determine Player Cards & Perspectives
  let topColor: 'white' | 'black' = 'black';
  let bottomColor: 'white' | 'black' = 'white';

  if (userColor === 'black' || boardOrientation === 'black') {
    topColor = 'white';
    bottomColor = 'black';
  }

  const topPlayer = roomState?.players[topColor] || null;
  const bottomPlayer = roomState?.players[bottomColor] || null;

  // Material evaluation calculation
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const whiteCaptured = roomState?.capturedPieces.white || [];
  const blackCaptured = roomState?.capturedPieces.black || [];

  const whiteVal = whiteCaptured.reduce((sum, p) => sum + (pieceValues[p] || 0), 0);
  const blackVal = blackCaptured.reduce((sum, p) => sum + (pieceValues[p.toLowerCase()] || 0), 0);

  const topCaptured = topColor === 'white' ? blackCaptured : whiteCaptured;
  const bottomCaptured = bottomColor === 'white' ? blackCaptured : whiteCaptured;

  const topMaterialDiff = topColor === 'white' ? Math.max(0, whiteVal - blackVal) : Math.max(0, blackVal - whiteVal);
  const bottomMaterialDiff = bottomColor === 'white' ? Math.max(0, whiteVal - blackVal) : Math.max(0, blackVal - whiteVal);

  const isCurrentTurnToMove = roomState ? roomState.turn === userColor : false;

  return (
    <div className="min-h-screen bg-[#161512] text-[#bababa] flex flex-col font-sans selection:bg-[#81b64c] selection:text-[#161512]">
      {/* Top Navigation */}
      <Navbar
        roomId={roomState?.roomId}
        connected={isConnected}
        spectatorCount={roomState?.spectatorCount}
        onLeaveRoom={handleLeaveRoom}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAiCoach={() => setIsAiCoachOpen(true)}
        onOpenStore={() => setIsStoreOpen(true)}
        isMuted={isMuted}
      />

      {/* Victory Reward Toast Notification */}
      {winRewardToast && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white font-extrabold px-4 py-2.5 flex items-center justify-between text-xs md:text-sm shadow-lg animate-bounce">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Trophy className="w-5 h-5 text-amber-200 animate-pulse" />
            <span>{winRewardToast}</span>
          </div>
          <button
            onClick={() => setWinRewardToast(null)}
            className="p-1 hover:bg-black/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-4 px-2 sm:px-4">
        {soloBotMode ? (
          <SoloEngineBoard
            playerName={localStorage.getItem('chess_player_name') || 'Grandmaster'}
            timeControl="5+3"
            onBackToLobby={() => setSoloBotMode(false)}
          />
        ) : !roomState ? (
          <>
            <RoomLobby
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onFindQuickMatch={handleFindQuickMatch}
              onStartSoloBot={() => setSoloBotMode(true)}
              error={lobbyError}
              initialRoomCode={initialRoomCode}
            />

            {isSearchingMatch && (
              <QuickPlayModal
                playerName={searchPlayerName}
                timeControl={searchTimeControl}
                onCancel={handleCancelMatchmaking}
              />
            )}
          </>
        ) : (
          /* Active Chess Match Arena */
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Board & Player Cards (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-3 max-w-[560px] mx-auto w-full">
              {/* Draw Offer Notification Banner */}
              {drawOfferFrom && drawOfferFrom !== userColor && (
                <div className="p-3 bg-[#2d3a20] border border-[#81b64c]/50 rounded-lg flex items-center justify-between gap-3 text-xs md:text-sm">
                  <div className="flex items-center gap-2 font-bold text-[#81b64c]">
                    <Handshake className="w-5 h-5 text-[#81b64c]" />
                    <span>Your opponent offered a draw!</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondDraw(true)}
                      className="px-3 py-1 bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-black uppercase rounded text-xs"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondDraw(false)}
                      className="px-3 py-1 bg-[#3c3a38] hover:bg-[#4d4b48] text-white font-bold uppercase rounded text-xs"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Waiting for Player Alert */}
              {roomState.status === 'waiting' && (
                <div className="p-3 bg-[#262421] border border-[#312e2b] rounded-lg flex items-center justify-between text-xs text-[#bababa] font-medium">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#81b64c] animate-spin" />
                    <span>Waiting for an opponent to join... Share room code <strong className="text-[#81b64c]">{roomState.roomId}</strong></span>
                  </div>
                </div>
              )}

              {/* Top Player Card (Opponent) */}
              <PlayerCard
                player={topPlayer}
                color={topColor}
                isCurrentTurn={roomState.status === 'active' && roomState.turn === topColor}
                capturedPieces={topCaptured}
                materialDiff={topMaterialDiff}
                isUser={topColor === userColor}
                isVoiceConnected={voiceChat.isVoiceActive}
                isMuted={topColor === userColor ? voiceChat.isMuted : voiceChat.remoteMuted}
                isSpeaking={topColor === userColor ? voiceChat.isSpeaking : voiceChat.remoteSpeaking}
              />

              {/* Interactive Chess Board */}
              <ChessBoardContainer
                fen={roomState.fen}
                userColor={userColor}
                boardOrientation={boardOrientation}
                isTurnToMove={isCurrentTurnToMove}
                onMakeMove={handleMakeMove}
                lastMove={roomState.lastMove}
                inCheck={roomState.inCheck}
                disabled={roomState.status !== 'active'}
                settings={settings}
              />

              {/* Bottom Player Card (User) */}
              <PlayerCard
                player={bottomPlayer}
                color={bottomColor}
                isCurrentTurn={roomState.status === 'active' && roomState.turn === bottomColor}
                capturedPieces={bottomCaptured}
                materialDiff={bottomMaterialDiff}
                isUser={bottomColor === userColor}
                isVoiceConnected={voiceChat.isVoiceActive}
                isMuted={bottomColor === userColor ? voiceChat.isMuted : voiceChat.remoteMuted}
                isSpeaking={bottomColor === userColor ? voiceChat.isSpeaking : voiceChat.remoteSpeaking}
              />

              {/* Live Voice Chat Controls */}
              <VoiceChatControls
                isVoiceActive={voiceChat.isVoiceActive}
                isMuted={voiceChat.isMuted}
                isSpeaking={voiceChat.isSpeaking}
                remoteMuted={voiceChat.remoteMuted}
                remoteSpeaking={voiceChat.remoteSpeaking}
                isPeerConnected={voiceChat.isPeerConnected}
                micPermissionError={voiceChat.micPermissionError}
                onStartVoice={voiceChat.startVoice}
                onStopVoice={voiceChat.stopVoice}
                onToggleMute={voiceChat.toggleMute}
                isSpectator={userColor === 'spectator'}
              />

              {/* Game Controls Bar */}
              <GameControls
                roomState={roomState}
                userColor={userColor}
                onResign={handleResign}
                onOfferDraw={handleOfferDraw}
                onRequestRematch={handleRequestRematch}
                onFlipBoard={() => setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
              />
            </div>

            {/* Right Column: Move History & Room Chat (5 cols on lg) */}
            <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 h-[580px] w-full">
              {/* Move History Log */}
              <div className="h-[280px] md:h-full lg:h-[280px]">
                <MoveHistory history={roomState.history} />
              </div>

              {/* Room Chat */}
              <div className="h-[280px] md:h-full lg:h-[280px]">
                <ChatPanel
                  messages={chatMessages}
                  onSendMessage={handleSendChat}
                  disabled={false}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Game Over Modal with Rematch Flow */}
      {roomState && roomState.status === 'ended' && (
        <GameOverModal
          roomState={roomState}
          userColor={userColor}
          onRequestRematch={handleRequestRematch}
          onRespondRematch={handleRespondRematch}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* Settings Panel Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Opponent Disconnection / Quit Modal */}
      {disconnectedData && (
        <DisconnectionModal
          disconnectedPlayerName={disconnectedData.name}
          winnerColor={disconnectedData.winnerColor}
          userColor={userColor}
          onReturnToLobby={() => {
            setDisconnectedData(null);
            handleLeaveRoom();
          }}
          onFindNewMatch={() => {
            setDisconnectedData(null);
            handleLeaveRoom();
            handleFindQuickMatch(searchPlayerName, searchTimeControl);
          }}
        />
      )}

      {/* AI Chess Coach Drawer */}
      <AiCoachDrawer
        isOpen={isAiCoachOpen}
        onClose={() => setIsAiCoachOpen(false)}
        fen={roomState ? roomState.fen : 'start'}
        movesHistory={roomState ? roomState.history.map((m) => m.san) : []}
        userColor={userColor}
        onOpenStore={() => {
          setIsAiCoachOpen(false);
          setIsStoreOpen(true);
        }}
      />

      {/* Buy Credits PayPal Store Modal */}
      <BuyCreditsModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        currentBalance={getCredits()}
      />
    </div>
  );
}
