import React, { useState } from 'react';
import { Play, Trophy, Shuffle, Volume2, Gauge, Maximize, Clock, Printer } from 'lucide-react';
import { SET_LETTERS, COMPETITION_TOTAL_TIME } from '../data/sets';
import { openPrintableSheet } from './PrintableView';

// Fullscreen toggle
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
};

// Request fullscreen (for auto-fullscreen on start)
const requestFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch((e) => {
      console.warn('Fullscreen request failed:', e);
    });
  }
};

// Format time as M:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SettingsView = ({ onStartGame, initialSettings }) => {
  // State persistence: use initialSettings if provided (when user exits mid-game)
  const [mode, setMode] = useState(initialSettings?.mode || 'practice');
  const [questionCount, setQuestionCount] = useState(initialSettings?.questionCount || 10);
  const [speed, setSpeed] = useState(initialSettings?.speed || 0.75);
  const [selectedSet, setSelectedSet] = useState(initialSettings?.setLetter || null);

  const handleStart = () => {
    // Competition mode requires a set selection
    if (mode === 'competition' && !selectedSet) {
      return;
    }

    requestFullscreen();

    onStartGame({
      mode,
      questionCount: mode === 'competition' ? 60 : questionCount,
      speed,
      setLetter: mode === 'competition' ? selectedSet : null,
    });
  };

  const handleSetSelect = (letter) => {
    setSelectedSet(letter);
  };

  const handlePrint = () => {
    if (selectedSet) {
      openPrintableSheet(selectedSet);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2 landscape:p-2 lg:p-4 bg-[#d8e9fa] overflow-auto">
      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-2 right-2 lg:top-4 lg:right-4 z-50 p-2 lg:p-3 rounded-full bg-[#b4d7ff] hover:bg-[#9fc9ff] transition-all shadow-lg"
        title="Toggle Fullscreen"
      >
        <Maximize size={20} className="lg:w-6 lg:h-6 text-[#3e366b]" />
      </button>

      <div
        className="rounded-2xl landscape:rounded-xl lg:rounded-[2.7rem] shadow-xl p-4 landscape:p-3 lg:p-12 w-full max-w-2xl fade-in"
        style={{ background: 'linear-gradient(150deg, #f0f7ff 65%, #e6f0ff 100%)' }}
      >
        {/* Title */}
        <div className="text-center mb-4 landscape:mb-2 lg:mb-10">
          <h1 className="text-2xl landscape:text-xl lg:text-5xl font-bold text-[#3e366b] mb-1 lg:mb-3">
            Phonics Competition
          </h1>
          <p className="text-gray-500 text-sm lg:text-lg">Select your mode and settings</p>
        </div>

        {/* Mode Selection */}
        <div className="mb-4 landscape:mb-2 lg:mb-8">
          <label className="block text-[#3e366b] font-semibold mb-2 landscape:mb-1 lg:mb-4 text-base lg:text-lg">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-2 landscape:gap-2 lg:gap-4">
            <button
              onClick={() => {
                setMode('practice');
                setSelectedSet(null);
              }}
              className={`p-3 landscape:p-2 lg:p-6 rounded-xl landscape:rounded-lg lg:rounded-[2.7rem] border-3 transition-all flex flex-col items-center gap-1 landscape:gap-1 lg:gap-3 ${
                mode === 'practice'
                  ? 'border-[#4d79ff] bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Shuffle
                className={`w-6 h-6 landscape:w-5 landscape:h-5 lg:w-10 lg:h-10 ${mode === 'practice' ? 'text-[#ae90fd]' : 'text-gray-400'}`}
              />
              <span className={`font-semibold text-sm lg:text-lg ${
                mode === 'practice' ? 'text-[#4d79ff]' : 'text-gray-600'
              }`}>
                Practice
              </span>
              <span className="text-xs lg:text-sm text-gray-400 hidden landscape:hidden lg:block">Tap to answer</span>
            </button>

            <button
              onClick={() => setMode('competition')}
              className={`p-3 landscape:p-2 lg:p-6 rounded-xl landscape:rounded-lg lg:rounded-[2.7rem] border-3 transition-all flex flex-col items-center gap-1 landscape:gap-1 lg:gap-3 ${
                mode === 'competition'
                  ? 'border-[#4d79ff] bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Trophy
                className={`w-6 h-6 landscape:w-5 landscape:h-5 lg:w-10 lg:h-10 ${mode === 'competition' ? 'text-[#ffd700]' : 'text-gray-400'}`}
              />
              <span className={`font-semibold text-sm lg:text-lg ${
                mode === 'competition' ? 'text-[#4d79ff]' : 'text-gray-600'
              }`}>
                Competition
              </span>
              <span className="text-xs lg:text-sm text-gray-400 hidden landscape:hidden lg:block">60 questions per set</span>
            </button>
          </div>
        </div>

        {/* Competition Set Selection - 10 Buttons (A-J) */}
        {mode === 'competition' && (
          <div className="mb-4 landscape:mb-2 lg:mb-8 fade-in">
            <label className="block text-[#3e366b] font-semibold mb-2 landscape:mb-1 lg:mb-3 text-base lg:text-lg">
              Select Question Set
            </label>
            <div className="grid grid-cols-5 gap-2 landscape:gap-1 lg:gap-3">
              {SET_LETTERS.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleSetSelect(letter)}
                  className={`p-2 landscape:p-1.5 lg:p-4 rounded-lg lg:rounded-xl font-bold text-lg landscape:text-base lg:text-2xl transition-all ${
                    selectedSet === letter
                      ? 'bg-[#ffd700] text-[#3e366b] shadow-lg scale-105'
                      : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-[#4d79ff] hover:bg-blue-50'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* Competition Info */}
            <div className="mt-2 landscape:mt-1 lg:mt-4 p-2 landscape:p-1.5 lg:p-4 rounded-xl lg:rounded-2xl bg-[#e6f0ff] border-2 border-[#b4d7ff]">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-[#4d79ff]" />
                <span className="text-[#3e366b] font-bold text-sm lg:text-lg">
                  Total Time: {formatTime(COMPETITION_TOTAL_TIME)}
                </span>
              </div>
              <p className="text-center text-gray-500 text-xs lg:text-sm mt-0.5 lg:mt-1">
                60 questions • 4 seconds per question
              </p>
            </div>
          </div>
        )}

        {/* Question Count (Practice Mode Only) */}
        {mode === 'practice' && (
          <div className="mb-4 landscape:mb-2 lg:mb-8 fade-in">
            <label className="block text-[#3e366b] font-semibold mb-2 landscape:mb-1 lg:mb-3 text-base lg:text-lg">
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-2 landscape:gap-1 lg:gap-3">
              {[10, 20, 50, 100].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`p-2 landscape:p-1.5 lg:p-4 rounded-lg lg:rounded-xl font-bold text-base landscape:text-sm lg:text-xl transition-all ${
                    questionCount === count
                      ? 'bg-[#4d79ff] text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-[#4d79ff]'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Speed Control (Practice Mode Only) */}
        {mode === 'practice' && (
          <div className="mb-4 landscape:mb-2 lg:mb-10 fade-in">
            <label className="block text-[#3e366b] font-semibold mb-2 landscape:mb-1 lg:mb-3 text-base lg:text-lg flex items-center gap-2">
              <Gauge className="w-4 h-4 lg:w-[22px] lg:h-[22px] text-[#ae90fd]" />
              Speech Speed: {speed.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-[#4d79ff]"
            />
            <div className="flex justify-between text-xs lg:text-sm text-gray-400 mt-1 lg:mt-2">
              <span>Slower</span>
              <span>Default</span>
              <span>Faster</span>
            </div>
          </div>
        )}

        {/* Button Row - Start and Print */}
        <div className={`flex gap-2 lg:gap-3 ${mode === 'competition' && selectedSet ? '' : 'flex-col'}`}>
          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={mode === 'competition' && !selectedSet}
            className={`flex-1 text-base landscape:text-sm lg:text-2xl py-3 landscape:py-2 lg:py-5 flex items-center justify-center gap-2 lg:gap-3 rounded-full font-bold transition-all shadow-lg ${
              mode === 'competition' && !selectedSet
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#b4d7ff] text-[#3e366b] hover:bg-[#9fc9ff]'
            }`}
          >
            <Play className="w-5 h-5 lg:w-8 lg:h-8" fill={mode === 'competition' && !selectedSet ? '#9ca3af' : '#3e366b'} />
            {mode === 'competition'
              ? selectedSet
                ? `Start Set ${selectedSet}`
                : 'Select a Set'
              : 'Start Game'
            }
          </button>

          {/* Print Answer Sheet Button - Only in Competition Mode with Set Selected */}
          {mode === 'competition' && selectedSet && (
            <button
              onClick={handlePrint}
              className="px-4 lg:px-6 py-3 landscape:py-2 lg:py-5 flex items-center justify-center gap-2 rounded-full font-bold transition-all shadow-lg bg-white border-2 border-[#4d79ff] text-[#4d79ff] hover:bg-blue-50"
              title="Print Answer Sheet"
            >
              <Printer className="w-5 h-5 lg:w-7 lg:h-7" />
              <span className="hidden lg:inline text-lg">Print</span>
            </button>
          )}
        </div>

        {/* Voice Info */}
        <div className="mt-3 landscape:mt-2 lg:mt-6 text-center text-gray-400 text-xs lg:text-sm flex items-center justify-center gap-2">
          <Volume2 className="w-3 h-3 lg:w-4 lg:h-4 text-[#ae90fd]" />
          <span className="hidden landscape:hidden lg:inline">
            {mode === 'competition'
              ? 'Deterministic sets matching printed answer sheets'
              : 'Using high-quality Google/Neural voice synthesis'
            }
          </span>
          <span className="lg:hidden">
            {mode === 'competition' ? 'Matches printed sheets' : 'Voice synthesis enabled'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
