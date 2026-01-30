import React, { useState, useCallback } from 'react';
import './App.css';
import SettingsView from './components/SettingsView';
import PhonicsGame from './components/PhonicsGame';
import SummaryPop from './components/SummaryPop';

function App() {
  const [screen, setScreen] = useState('settings'); // settings, game, summary
  const [gameSettings, setGameSettings] = useState(null);
  const [gameResults, setGameResults] = useState([]);
  // State persistence: remember last used settings for when user exits mid-game
  const [lastUsedSettings, setLastUsedSettings] = useState(null);

  const handleStartGame = useCallback((settings) => {
    setGameSettings(settings);
    setLastUsedSettings(settings); // Save for state persistence
    setScreen('game');
  }, []);

  const handleGameFinish = useCallback((results) => {
    setGameResults(results);
    setScreen('summary');
  }, []);

  const handleRestart = useCallback(() => {
    setScreen('game');
  }, []);

  const handleGoHome = useCallback(() => {
    setGameSettings(null);
    setGameResults([]);
    setLastUsedSettings(null); // Clear persisted settings
    setScreen('settings');
  }, []);

  // Exit game - preserves settings so user returns to settings with previous selections
  const handleExitGame = useCallback(() => {
    // Note: The confirmation modal is now handled in PhonicsGame for competition mode
    // For practice mode, PhonicsGame still uses window.confirm before calling this
    setGameSettings(null);
    setGameResults([]);
    // Keep lastUsedSettings intact so SettingsView can use it
    setScreen('settings');
  }, []);

  return (
    <div className="min-h-screen bg-[#d8e9fa]">
      {screen === 'settings' && (
        <SettingsView
          onStartGame={handleStartGame}
          initialSettings={lastUsedSettings}
        />
      )}

      {screen === 'game' && gameSettings && (
        <PhonicsGame
          settings={gameSettings}
          onFinish={handleGameFinish}
          onExit={handleExitGame}
        />
      )}

      {screen === 'summary' && (
        <SummaryPop
          results={gameResults}
          onRestart={handleRestart}
          onHome={handleGoHome}
        />
      )}
    </div>
  );
}

export default App;
