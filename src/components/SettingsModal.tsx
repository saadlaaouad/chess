import React, { useState } from 'react';
import { AppSettings, BOARD_THEMES, BoardThemeId } from '../lib/settings';
import { Settings, Volume2, VolumeX, Palette, ShieldCheck, Check, X, Bell, UserCheck, Zap } from 'lucide-react';
import { playMoveSound, setSoundMuted, setSoundVolume } from '../lib/sound';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'board' | 'sound' | 'game' | 'account'>('board');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof AppSettings) => {
    setLocalSettings((prev) => {
      const val = !prev[key];
      if (key === 'soundEnabled') {
        setSoundMuted(!val);
      }
      return { ...prev, [key]: val };
    });
  };

  const handleVolumeChange = (v: number) => {
    setLocalSettings((prev) => {
      setSoundVolume(v);
      return { ...prev, soundVolume: v };
    });
  };

  const handleThemeSelect = (themeId: BoardThemeId) => {
    setLocalSettings((prev) => ({ ...prev, boardTheme: themeId }));
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    if (localSettings.soundEnabled && localSettings.moveSounds) {
      playMoveSound();
    }
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#262421] border border-[#312e2b] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#161512] border-b border-[#312e2b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center text-[#81b64c]">
              <Settings className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-black text-base text-white uppercase tracking-tight">
                Game Settings <span className="text-[#81b64c] text-xs font-normal">| إعدادات التطبيق</span>
              </h2>
              <p className="text-[11px] text-[#7d7b78]">Customize sound, themes, board styles, and gameplay rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#3c3a38] hover:bg-[#4d4b48] text-[#bababa] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 bg-[#161512] border-b border-[#312e2b] text-xs font-bold">
          <button
            onClick={() => setActiveTab('board')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'board'
                ? 'border-[#81b64c] text-[#81b64c] bg-[#262421]'
                : 'border-transparent text-[#7d7b78] hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={() => setActiveTab('sound')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'sound'
                ? 'border-[#81b64c] text-[#81b64c] bg-[#262421]'
                : 'border-transparent text-[#7d7b78] hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('game')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'game'
                ? 'border-[#81b64c] text-[#81b64c] bg-[#262421]'
                : 'border-transparent text-[#7d7b78] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'account'
                ? 'border-[#81b64c] text-[#81b64c] bg-[#262421]'
                : 'border-transparent text-[#7d7b78] hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Status</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: BOARD THEME */}
          {activeTab === 'board' && (
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#7d7b78] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#81b64c]" />
                <span>Select Board Theme (طابع اللوحة)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.values(BOARD_THEMES).map((theme) => {
                  const isSelected = localSettings.boardTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'border-[#81b64c] bg-[#2d3a20]/40 ring-2 ring-[#81b64c]/30'
                          : 'border-[#312e2b] bg-[#161512] hover:border-[#4d4b48]'
                      }`}
                    >
                      {/* Miniature 2x2 board preview */}
                      <div className="w-10 h-10 rounded border border-[#312e2b] grid grid-cols-2 overflow-hidden shrink-0 shadow">
                        <div style={{ backgroundColor: theme.lightSquare }} />
                        <div style={{ backgroundColor: theme.darkSquare }} />
                        <div style={{ backgroundColor: theme.darkSquare }} />
                        <div style={{ backgroundColor: theme.lightSquare }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-white truncate">{theme.name}</div>
                        <div className="text-[10px] text-[#7d7b78] font-mono uppercase">
                          {theme.darkSquare}
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-[#81b64c] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO / SOUND */}
          {activeTab === 'sound' && (
            <div className="space-y-4">
              {/* Master Volume */}
              <div className="p-3.5 rounded-lg bg-[#161512] border border-[#312e2b] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    {localSettings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#81b64c]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    )}
                    Master Audio
                  </span>
                  <button
                    onClick={() => handleToggle('soundEnabled')}
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors ${
                      localSettings.soundEnabled
                        ? 'bg-[#81b64c] text-[#161512]'
                        : 'bg-[#3c3a38] text-red-400'
                    }`}
                  >
                    {localSettings.soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {localSettings.soundEnabled && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-[#7d7b78] font-mono">
                      <span>Volume</span>
                      <span>{Math.round(localSettings.soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={localSettings.soundVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-[#81b64c] cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Sound Categories */}
              <div className="space-y-2">
                {[
                  { key: 'moveSounds', label: 'Piece Move Sound', desc: 'Play click feedback when pieces are placed' },
                  { key: 'captureSounds', label: 'Capture Sound', desc: 'Distinct audio prompt when a piece is captured' },
                  { key: 'checkSounds', label: 'Check Warning Sound', desc: 'Alert tone when a King is put in check' },
                  { key: 'lowTimeWarning', label: 'Low Time Warning', desc: 'Beep when timer drops below 30 seconds' },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => handleToggle(item.key as keyof AppSettings)}
                    className="p-3 rounded-lg bg-[#161512] border border-[#312e2b] flex items-center justify-between cursor-pointer hover:border-[#4d4b48] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-white">{item.label}</div>
                      <div className="text-[11px] text-[#7d7b78]">{item.desc}</div>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                        localSettings[item.key as keyof AppSettings] ? 'bg-[#81b64c]' : 'bg-[#3c3a38]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          localSettings[item.key as keyof AppSettings] ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GAME RULES */}
          {activeTab === 'game' && (
            <div className="space-y-3">
              {[
                {
                  key: 'highlightLegalMoves',
                  label: 'Highlight Legal Moves',
                  desc: 'Display target dots and capture rings when clicking pieces',
                },
                {
                  key: 'autoQueenPromotion',
                  label: 'Auto Queen Promotion',
                  desc: 'Automatically promote Pawns to Queens without popping up promotion dialog',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => handleToggle(item.key as keyof AppSettings)}
                  className="p-3.5 rounded-lg bg-[#161512] border border-[#312e2b] flex items-center justify-between cursor-pointer hover:border-[#4d4b48] transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-white">{item.label}</div>
                    <div className="text-[11px] text-[#7d7b78]">{item.desc}</div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      localSettings[item.key as keyof AppSettings] ? 'bg-[#81b64c]' : 'bg-[#3c3a38]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        localSettings[item.key as keyof AppSettings] ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: ACCOUNT / STATUS */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#161512] border border-[#312e2b] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#81b64c]" /> Online Presence
                    </div>
                    <div className="text-[11px] text-[#7d7b78]">
                      Show active status in room lobbies
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        onlineStatus: prev.onlineStatus === 'online' ? 'offline' : 'online',
                      }))
                    }
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors border ${
                      localSettings.onlineStatus === 'online'
                        ? 'bg-[#2d3a20] text-[#81b64c] border-[#81b64c]/40'
                        : 'bg-[#3c3a38] text-[#bababa] border-[#4d4b48]'
                    }`}
                  >
                    {localSettings.onlineStatus}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#161512] border border-[#312e2b] text-xs text-[#7d7b78] space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#81b64c]" /> Preferences Storage
                </div>
                <p>All customization settings are saved locally to your device browser cache.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#161512] border-t border-[#312e2b] flex items-center justify-between">
          <span className="text-[11px] text-[#7d7b78]">GrandmasterMulti v2.0</span>
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] border-b-2 border-[#5a8035]'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
