import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, XCircle, RotateCcw, Home, Trophy, Maximize, Volume2 } from 'lucide-react';
import { COMPETITION_SPEECH_RATE } from '../data/sets';

// Confetti Component
const Confetti = () => {
  const colors = ['#4d79ff', '#ae90fd', '#ffd700', '#60a5fa', '#b4d7ff'];

  const pieces = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      delay: Math.random() * 2,
      size: Math.random() * 10 + 8,
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.id % 2 === 0 ? '50%' : '2px',
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// Pop sound for each result
const playPop = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 600 + Math.random() * 400;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
};

// Fullscreen toggle
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
};

// ============================================
// HIGH-QUALITY VOICE FILTER (Same as main game)
// ============================================
const getBestVoice = () => {
  const voices = window.speechSynthesis.getVoices();

  const preferredPatterns = [
    /google/i,
    /neural/i,
    /microsoft.*online/i,
    /natural/i,
    /enhanced/i,
  ];

  for (const pattern of preferredPatterns) {
    const voice = voices.find(
      (v) => pattern.test(v.name) && v.lang.startsWith('en')
    );
    if (voice) return voice;
  }

  return voices.find((v) => v.lang.startsWith('en')) || voices[0];
};

// Speak a word using high-quality voice (same as competition dictation)
// STABILITY FIXES: cancel at start, get fresh voice, cancel before speak
const speakWord = (word) => {
  // Cancel any ongoing speech first
  window.speechSynthesis.cancel();

  // Get fresh voice reference
  const voice = getBestVoice();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.voice = voice;
  utterance.rate = COMPETITION_SPEECH_RATE; // 0.85 rate matching competition
  utterance.pitch = 1;
  utterance.volume = 1;

  // STABILITY FIX: Cancel immediately before speak to prevent stall bug
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const SummaryPop = ({ results, onRestart, onHome }) => {
  const [resultsData, setResultsData] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const listRef = useRef(null);
  const animationStartedRef = useRef(false);

  // Load voices on mount
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  // Initialize resultsData from props on mount
  useEffect(() => {
    if (results && Array.isArray(results) && results.length > 0) {
      setResultsData([...results]);
    }
  }, [results]);

  const isCompetitionMode = resultsData.length > 0 && resultsData[0]?.isCompetitionMode === true;

  const correctCount = isCompetitionMode
    ? resultsData.length
    : resultsData.filter((r) => r?.correct === true).length;

  const percentage = resultsData.length > 0
    ? Math.round((correctCount / resultsData.length) * 100)
    : 0;

  // Animate results with sound
  useEffect(() => {
    if (animationStartedRef.current || resultsData.length === 0) return;
    animationStartedRef.current = true;

    let index = 0;
    const allResults = [...resultsData];

    const interval = setInterval(() => {
      if (index < allResults.length) {
        const currentResult = allResults[index];

        if (currentResult) {
          // Play sound first, then add result (ensures sync with animation)
          playPop();
          setDisplayedResults((prev) => [...prev, currentResult]);
        }

        index++;

        if (listRef.current) {
          setTimeout(() => {
            if (listRef.current) {
              listRef.current.scrollTop = listRef.current.scrollHeight;
            }
          }, 50);
        }
      } else {
        clearInterval(interval);
        setAnimationComplete(true);

        setTimeout(() => {
          setShowStats(true);
          // Show confetti for competition mode always, or practice mode if >= 70%
          if (isCompetitionMode || percentage >= 70) {
            setShowConfetti(true);
          }
        }, 500);
      }
    }, 100); // Faster animation for 60 questions

    return () => clearInterval(interval);
  }, [resultsData, isCompetitionMode, percentage]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-[#d8e9fa]">
      {showConfetti && <Confetti />}

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-[#b4d7ff] hover:bg-[#9fc9ff] transition-all shadow-lg"
        title="Toggle Fullscreen"
      >
        <Maximize size={24} className="text-[#3e366b]" />
      </button>

      {/* Taller Fixed Height Results Panel - h-[85vh] for both modes */}
      <div
        className="rounded-[2.7rem] shadow-xl p-6 md:p-8 w-full max-w-4xl flex flex-col h-[85vh]"
        style={{ background: 'linear-gradient(150deg, #f0f7ff 65%, #e6f0ff 100%)' }}
      >
        {/* Header */}
        <div className="text-center mb-4 shrink-0">
          <h2 className="text-3xl md:text-4xl font-bold text-[#3e366b] mb-2">
            {isCompetitionMode ? 'Answer Key' : 'Results'}
          </h2>
          <p className="text-gray-500">
            {displayedResults.length} of {resultsData.length} {isCompetitionMode ? 'questions' : 'questions'}
          </p>
        </div>

        {/* Scrollable Results List - Fixed container with internal scroll */}
        <div
          ref={listRef}
          className="results-scrollable flex-1 overflow-y-auto space-y-2 min-h-0 pr-2"
        >
          {resultsData && resultsData.length > 0 ? (
            displayedResults.map((item, idx) => {
              if (!item) return null;

              // Competition mode: [Q#] [Correct Word] [Listen Icon]
              // NO "(Your Answer: ...)" text
              if (isCompetitionMode) {
                return (
                  <div
                    key={idx}
                    className="result-pop flex items-center gap-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-200"
                  >
                    <span className="text-2xl font-bold text-[#4d79ff] w-14 text-center shrink-0">
                      {item.questionNumber || idx + 1}
                    </span>
                    <span className="font-bold text-3xl text-gray-700 flex-1">
                      {item.sound || 'Unknown'}
                    </span>
                    <button
                      onClick={() => speakWord(item.sound)}
                      className="speaker-button shrink-0"
                      title="Play word"
                    >
                      <Volume2 className="text-[#ae90fd]" size={32} />
                    </button>
                  </div>
                );
              }

              // Practice mode: [Q#] [Correct/Incorrect] [Word] [Listen Icon]
              // NO "Your Answer" text
              return (
                <div
                  key={idx}
                  className={`result-pop flex items-center gap-4 p-4 rounded-xl ${
                    item.correct
                      ? 'bg-green-50 border-2 border-green-200'
                      : 'bg-red-50 border-2 border-red-200'
                  }`}
                >
                  <span className="text-2xl font-bold text-gray-400 w-14 text-center shrink-0">
                    {item.questionNumber || idx + 1}
                  </span>
                  {item.correct ? (
                    <CheckCircle className="text-green-500 shrink-0" size={28} />
                  ) : (
                    <XCircle className="text-red-500 shrink-0" size={28} />
                  )}
                  <span className="font-semibold text-2xl text-gray-700 flex-1">
                    {item.sound || 'Unknown'}
                  </span>
                  <button
                    onClick={() => speakWord(item.sound)}
                    className="speaker-button shrink-0"
                    title="Play word"
                  >
                    <Volume2 className="text-[#ae90fd]" size={28} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 py-8">
              No results to display
            </div>
          )}
        </div>

        {/* Stats Section - More compact */}
        {showStats && (
          <div className="mascot-bounce-in mt-4 shrink-0">
            {isCompetitionMode ? (
              <div className="text-center p-3 rounded-2xl bg-gradient-to-r from-blue-100 to-sky-100 border-2 border-blue-300">
                <div className="flex items-center justify-center gap-3">
                  <Trophy className="text-[#ffd700]" size={32} />
                  <div>
                    <span className="text-2xl font-bold text-[#4d79ff]">
                      Complete!
                    </span>
                    <span className="text-gray-600 ml-3">
                      {resultsData.length} questions
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center p-3 rounded-2xl ${
                percentage >= 90
                  ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300'
                  : percentage >= 70
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300'
                    : 'bg-gradient-to-r from-blue-100 to-sky-100 border-2 border-blue-300'
              }`}>
                <div className="flex items-center justify-center gap-4">
                  {percentage >= 90 && (
                    <Trophy className="text-[#ffd700]" size={32} />
                  )}
                  <div>
                    <span className="text-4xl font-bold text-[#4d79ff]">
                      {percentage}%
                    </span>
                    <span className="text-gray-600 ml-3">
                      {correctCount} / {resultsData.length} correct
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons - Inside the panel */}
        {showStats && (
          <div className="flex justify-center gap-4 mt-4 shrink-0">
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#b4d7ff] text-[#3e366b] rounded-full font-bold hover:bg-[#9fc9ff] transition-all shadow-lg"
            >
              <RotateCcw size={20} />
              Try Again
            </button>
            <button
              onClick={onHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#b4d7ff] text-[#3e366b] rounded-full font-bold hover:bg-[#9fc9ff] transition-all shadow-lg"
            >
              <Home size={20} />
              Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPop;
