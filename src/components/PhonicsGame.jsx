import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, X, Maximize } from 'lucide-react';
import questions from '../data/questions';
import {
  getSetQuestions,
  COMPETITION_TOTAL_TIME,
  COMPETITION_MS_PER_QUESTION,
  COMPETITION_SPEECH_RATE
} from '../data/sets';

// ============================================
// WEB AUDIO API SOUND EFFECTS
// ============================================

const playStartBuzz = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator1.frequency.value = 440;
    oscillator2.frequency.value = 554;
    oscillator1.type = 'square';
    oscillator2.type = 'square';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.4);
    oscillator2.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
};

const playClick = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
};

const playCorrect = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.25);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
};

const playIncorrect = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
};

// ============================================
// VOICE CONFIGURATION - High-quality voice filter
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

// ============================================
// PRACTICE MODE: Create 300-word pool
// ============================================

const createPracticePool = () => {
  const pool = [];

  questions.forEach((q) => {
    q.choices.forEach((word, wordIndex) => {
      pool.push({
        id: `${q.id}-${wordIndex}`,
        originalQuestionId: q.id,
        sound: word,
        choices: q.choices,
        correctIndex: wordIndex,
      });
    });
  });

  return pool;
};

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const selectUniqueTargets = (pool, count) => {
  const shuffled = shuffleArray(pool);
  const selected = [];
  const usedWords = new Set();

  for (const item of shuffled) {
    if (selected.length >= count) break;
    if (!usedWords.has(item.sound)) {
      usedWords.add(item.sound);
      selected.push(item);
    }
  }

  return selected;
};

// Fullscreen functions
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
};

// Format time as M:SS
const formatTime = (seconds) => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ============================================
// EXIT CONFIRMATION MODAL
// ============================================
const ExitModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div
        className="rounded-[2rem] shadow-2xl p-8 max-w-md mx-4 text-center"
        style={{ background: 'linear-gradient(150deg, #f0f7ff 65%, #e6f0ff 100%)' }}
      >
        <h2 className="text-2xl font-bold text-[#3e366b] mb-4">
          Exit Competition?
        </h2>
        <p className="text-gray-600 mb-8">
          Are you sure you want to exit the competition? Your progress will be lost.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-bold hover:bg-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-3 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const PhonicsGame = ({ settings, onFinish, onExit }) => {
  const [phase, setPhase] = useState('countdown');
  const [countdown, setCountdown] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameQuestions, setGameQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [canAnswer, setCanAnswer] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Competition states
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(COMPETITION_TOTAL_TIME);

  const voiceRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const hasPlayedStartBuzz = useRef(false);
  const blitzTimerRef = useRef(null);
  const questionIntervalRef = useRef(null);
  const resultsRef = useRef([]);
  const startTimeRef = useRef(null);

  const isCompetition = settings.mode === 'competition';

  // Initialize game questions
  useEffect(() => {
    let selectedQuestions;

    if (isCompetition && settings.setLetter) {
      selectedQuestions = getSetQuestions(settings.setLetter, questions);
    } else {
      const pool = createPracticePool();
      selectedQuestions = selectUniqueTargets(pool, settings.questionCount);
    }

    setGameQuestions(selectedQuestions);
  }, [settings, isCompetition]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      voiceRef.current = getBestVoice();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      if (blitzTimerRef.current) clearInterval(blitzTimerRef.current);
      if (questionIntervalRef.current) clearTimeout(questionIntervalRef.current);
    };
  }, []);

  // Countdown sequence: 3, 2, 1, Go!
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown > 1) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 1) {
      if (!hasPlayedStartBuzz.current) {
        hasPlayedStartBuzz.current = true;
        playStartBuzz();
      }
      const timer = setTimeout(() => setCountdown(0), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setPhase('playing');
    }
  }, [phase, countdown]);

  const getCountdownDisplay = () => {
    if (countdown === 4) return '3';
    if (countdown === 3) return '2';
    if (countdown === 2) return '1';
    if (countdown === 1) return 'Go!';
    return '';
  };

  // Speak number, pause, then speak word - returns callback when speech completes
  // STABILITY FIXES: cancel before speak, safety wrapper to prevent overlap
  const speakBlitz = useCallback((questionNumber, word, onSpeechComplete) => {
    // SAFETY WRAPPER: Prevent overlapping speech that can crash browser audio
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);

    // First: speak the question number
    const numberUtterance = new SpeechSynthesisUtterance(String(questionNumber));
    numberUtterance.voice = voiceRef.current;
    numberUtterance.lang = 'en-US'; // Force English dictation
    numberUtterance.rate = 1.0; // Normal rate for number
    numberUtterance.pitch = 1;
    numberUtterance.volume = 1;

    numberUtterance.onend = () => {
      // Pause between number and word (500ms delay)
      setTimeout(() => {
        // Then: speak the word at slower rate for clarity
        const wordUtterance = new SpeechSynthesisUtterance(word);
        wordUtterance.voice = voiceRef.current;
        wordUtterance.lang = 'en-US'; // Force English dictation
        wordUtterance.rate = COMPETITION_SPEECH_RATE; // 0.85 rate for clarity
        wordUtterance.pitch = 1;
        wordUtterance.volume = 1;

        wordUtterance.onend = () => {
          setIsSpeaking(false);
          // Callback when speech is fully complete
          if (onSpeechComplete) onSpeechComplete();
        };
        wordUtterance.onerror = () => {
          setIsSpeaking(false);
          if (onSpeechComplete) onSpeechComplete();
        };

        // STABILITY FIX: Cancel immediately before speak to prevent stall bug
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(wordUtterance);
      }, 500);
    };

    numberUtterance.onerror = () => {
      setIsSpeaking(false);
      if (onSpeechComplete) onSpeechComplete();
    };

    // STABILITY FIX: Cancel immediately before speak to prevent stall bug
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(numberUtterance);
  }, []);

  // Practice mode speech
  // STABILITY FIXES: cancel before speak, safety wrapper to prevent overlap
  const speakText = useCallback((text, onComplete) => {
    // SAFETY WRAPPER: Prevent overlapping speech that can crash browser audio
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voiceRef.current;
    utterance.lang = 'en-US'; // Force English dictation
    utterance.rate = settings.speed;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };

    // STABILITY FIX: Cancel immediately before speak to prevent stall bug
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [settings.speed]);

  // ============================================
  // EXACT 4-SECOND CYCLE COMPETITION LOGIC
  // ============================================
  const runBlitzCompetition = useCallback(() => {
    if (gameQuestions.length === 0) return;

    startTimeRef.current = Date.now();
    let questionIndex = 0;
    let questionStartTime = 0;

    // Start the main countdown timer (updates every 100ms for smooth display)
    blitzTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, COMPETITION_TOTAL_TIME - elapsed);
      setTotalTimeRemaining(remaining);

      // End when time is up
      if (remaining <= 0) {
        clearInterval(blitzTimerRef.current);
        if (questionIntervalRef.current) clearTimeout(questionIntervalRef.current);
        window.speechSynthesis.cancel();
        setPhase('competitionFinished');
      }
    }, 100);

    // Function to process each question with EXACT 4-second cycle
    const processQuestion = () => {
      if (questionIndex >= gameQuestions.length) {
        // All questions done
        clearInterval(blitzTimerRef.current);
        window.speechSynthesis.cancel();
        setPhase('competitionFinished');
        return;
      }

      const question = gameQuestions[questionIndex];

      // Mark the start time of this question's 4-second cycle
      questionStartTime = Date.now();

      // Update current index for display
      setCurrentIndex(questionIndex);

      // Record result with targetIdx for proper replay in SummaryPop
      const resultItem = {
        questionId: question.id,
        questionNumber: questionIndex + 1,
        choices: question.choices,
        targetIdx: question.targetIdx,
        sound: question.sound,
        isCompetitionMode: true,
      };

      setResults((prev) => {
        const newResults = [...prev, resultItem];
        resultsRef.current = newResults;
        return newResults;
      });

      const currentQuestionIndex = questionIndex;
      questionIndex++;

      // Speak number, pause, then word at targetIdx - callback fires when speech completes
      speakBlitz(currentQuestionIndex + 1, question.sound, () => {
        // Calculate remaining time in the 4-second cycle
        const elapsedInCycle = Date.now() - questionStartTime;
        const remainingInCycle = Math.max(0, COMPETITION_MS_PER_QUESTION - elapsedInCycle);

        // Schedule next question to complete the exact 4-second cycle
        questionIntervalRef.current = setTimeout(processQuestion, remainingInCycle);
      });
    };

    // Start the first question immediately
    processQuestion();
  }, [gameQuestions, speakBlitz]);

  // Start blitz when playing phase begins (competition mode)
  useEffect(() => {
    if (phase === 'playing' && isCompetition && gameQuestions.length > 0) {
      setTotalTimeRemaining(COMPETITION_TOTAL_TIME);
      runBlitzCompetition();
    }
  }, [phase, isCompetition, gameQuestions, runBlitzCompetition]);

  // Practice mode: Speak current word
  const speakWord = useCallback(() => {
    if (gameQuestions.length === 0 || currentIndex >= gameQuestions.length) return;

    const word = gameQuestions[currentIndex].sound;
    speakText(word, () => {
      setCanAnswer(true);
    });
  }, [gameQuestions, currentIndex, speakText]);

  // Handle question changes (practice mode only)
  useEffect(() => {
    if (phase !== 'playing' || gameQuestions.length === 0 || isCompetition) return;

    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true;
      setCanAnswer(false);
      const timer = setTimeout(speakWord, 300);
      return () => clearTimeout(timer);
    }
  }, [phase, currentIndex, gameQuestions, isCompetition, speakWord]);

  // Reset hasSpoken when index changes (practice mode)
  useEffect(() => {
    if (!isCompetition) {
      hasSpokenRef.current = false;
    }
  }, [currentIndex, isCompetition]);

  // Handle answer selection (Practice mode only)
  const handleAnswer = (choiceIndex) => {
    if (!canAnswer || feedback || isCompetition) return;

    playClick();

    const question = gameQuestions[currentIndex];
    const isCorrect = choiceIndex === question.correctIndex;

    if (isCorrect) {
      playCorrect();
    } else {
      playIncorrect();
    }

    const resultItem = {
      questionId: question.id,
      questionNumber: currentIndex + 1,
      sound: question.sound,
      correct: isCorrect,
      userAnswer: question.choices[choiceIndex],
      correctAnswer: question.choices[question.correctIndex],
      isCompetitionMode: false,
    };

    setResults((prev) => {
      const newResults = [...prev, resultItem];
      resultsRef.current = newResults;
      return newResults;
    });

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setTimeout(() => {
      setFeedback(null);
      setCanAnswer(false);
      hasSpokenRef.current = false;

      if (currentIndex + 1 >= gameQuestions.length) {
        setPhase('finished');
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 800);
  };

  // Handle replay sound (Practice mode only)
  const handleReplay = () => {
    if (!isSpeaking && canAnswer && !isCompetition) {
      speakWord();
    }
  };

  // Handle exit button click
  const handleExitClick = () => {
    if (isCompetition && phase === 'playing') {
      setShowExitModal(true);
    } else {
      onExit();
    }
  };

  // Handle exit confirmation
  const handleExitConfirm = () => {
    // Clean up timers
    if (blitzTimerRef.current) clearInterval(blitzTimerRef.current);
    if (questionIntervalRef.current) clearTimeout(questionIntervalRef.current);
    window.speechSynthesis.cancel();
    setShowExitModal(false);
    onExit();
  };

  // Handle show answer key button click (Competition mode)
  const handleShowAnswerKey = () => {
    const finalResults = resultsRef.current.length > 0 ? resultsRef.current : results;
    onFinish(finalResults);
  };

  // Finish game for practice mode
  useEffect(() => {
    if (phase === 'finished') {
      const finalResults = resultsRef.current.length > 0 ? resultsRef.current : results;
      onFinish(finalResults);
    }
  }, [phase, results, onFinish]);

  const currentQuestion = gameQuestions[currentIndex] || gameQuestions[0];
  const progress = gameQuestions.length > 0
    ? ((currentIndex + 1) / gameQuestions.length) * 100
    : 0;

  // ============================================
  // COUNTDOWN SCREEN
  // ============================================
  if (phase === 'countdown') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d8e9fa]">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-[#b4d7ff] hover:bg-[#9fc9ff] transition-all shadow-lg"
            title="Toggle Fullscreen"
          >
            <Maximize size={24} className="text-[#3e366b]" />
          </button>
          <button
            onClick={handleExitClick}
            className="p-3 rounded-full bg-[#b4d7ff] hover:bg-[#9fc9ff] transition-all shadow-lg"
            title="Exit"
          >
            <X size={24} className="text-[#3e366b]" />
          </button>
        </div>

        <div className="text-center">
          <p className="text-3xl text-gray-500 mb-8 fade-in">
            {isCompetition ? `Get Ready! Set ${settings.setLetter}` : 'Get Ready!'}
          </p>
          <div
            key={countdown}
            className="countdown-number text-[30vh] font-bold"
            style={{ color: countdown === 1 ? '#fd90d7' : '#4d79ff' }}
          >
            {getCountdownDisplay()}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // COMPETITION FINISHED SCREEN
  // ============================================
  if (phase === 'competitionFinished') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d8e9fa]">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-[#b4d7ff] hover:bg-[#9fc9ff] transition-all shadow-lg"
            title="Toggle Fullscreen"
          >
            <Maximize size={24} className="text-[#3e366b]" />
          </button>
        </div>

        <div
          className="text-center p-12 rounded-[2.7rem] shadow-xl max-w-2xl mx-4"
          style={{ background: 'linear-gradient(150deg, #f0f7ff 65%, #e6f0ff 100%)' }}
        >
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-5xl md:text-6xl font-bold text-[#3e366b] mb-4">
            Time's Up!
          </h1>
          <p className="text-2xl text-gray-500 mb-4">
            Set {settings.setLetter} Complete
          </p>
          <p className="text-xl text-[#4d79ff] font-bold mb-8">
            {resultsRef.current.length} questions played
          </p>
          <p className="text-lg text-gray-400 mb-10">
            Students can now check their answer sheets
          </p>

          <button
            onClick={handleShowAnswerKey}
            className="px-12 py-5 text-2xl font-bold bg-[#4d79ff] text-white rounded-full hover:bg-[#3d69ef] transition-all shadow-lg"
          >
            Show Answers
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN GAME SCREEN - FIXED LAYOUT (NO SHIFTS)
  // ============================================
  if (phase === 'playing' && currentQuestion) {
    return (
      <div className="h-screen flex flex-col bg-[#d8e9fa] overflow-hidden">
        {/* Exit Modal */}
        {showExitModal && (
          <ExitModal
            onConfirm={handleExitConfirm}
            onCancel={() => setShowExitModal(false)}
          />
        )}

        {/* Top Right Buttons - Fixed Position (Fullscreen left, Exit right) */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-[#b4d7ff] hover:bg-[#9fc9ff] transition-all shadow-lg"
            title="Toggle Fullscreen"
          >
            <Maximize size={24} className="text-[#3e366b]" />
          </button>
          <button
            onClick={handleExitClick}
            className="p-3 rounded-full bg-[#b4d7ff] hover:bg-[#9fc9ff] transition-all shadow-lg"
            title="Exit"
          >
            <X size={24} className="text-[#3e366b]" />
          </button>
        </div>

        {/* Top Bar - Fixed Height, compact on phones */}
        <div className="shrink-0 p-2 md:p-6">
          <div className="flex flex-col max-w-lg">
            {/* Question Counter & Mode */}
            <div className="flex items-center gap-2 md:gap-4 mb-1 md:mb-2">
              <span className="text-lg md:text-3xl font-bold text-[#3e366b]">
                Q{currentIndex + 1} / {gameQuestions.length}
              </span>
              <span className="text-sm md:text-xl text-gray-500">
                {isCompetition ? `Set ${settings.setLetter}` : 'Practice'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden mb-1 md:mb-2">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #ae90fd 0%, #4d79ff 50%, #ffd700 100%)'
                }}
              />
            </div>

            {/* Timer - Competition Only - Pulses red at last 10 seconds */}
            {isCompetition && (
              <div className={`flex items-center gap-2 px-3 py-1 md:px-6 md:py-3 rounded-full w-fit transition-colors ${
                totalTimeRemaining <= 10
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-[#ffd700]'
              }`}>
                <span className={`text-xl md:text-4xl font-bold ${
                  totalTimeRemaining <= 10 ? 'text-white animate-pulse' : 'text-[#3e366b]'
                }`}>
                  {formatTime(totalTimeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - FIXED HEIGHT FLEX CONTAINER - Raised up with pt-0 and justify-start */}
        <div className="flex-1 flex flex-col items-center justify-start pt-1 md:pt-4 min-h-0">

          {/* Speaker Icon Container - Compact on phones, full size on desktop */}
          <div className="h-[60px] md:h-[140px] flex items-center justify-center shrink-0">
            {isCompetition ? (
              <div className={`p-3 md:p-8 rounded-full bg-white/50 ${isSpeaking ? 'speaker-pulse' : ''}`}>
                <Volume2
                  className="w-10 h-10 md:w-[100px] md:h-[100px]"
                  style={{ color: '#ae90fd' }}
                  strokeWidth={1.5}
                />
              </div>
            ) : (
              <button
                onClick={handleReplay}
                disabled={isSpeaking}
                className={`p-3 md:p-8 rounded-full bg-white/50 hover:bg-white/80 transition-all ${
                  isSpeaking ? 'speaker-pulse' : ''
                }`}
              >
                <Volume2
                  className="w-8 h-8 md:w-[80px] md:h-[80px]"
                  style={{ color: '#ae90fd' }}
                  strokeWidth={1.5}
                />
              </button>
            )}
          </div>

          {/* Instruction Text - Compact on phones */}
          <div className="h-[20px] md:h-[36px] flex items-center justify-center shrink-0 mb-1 md:mb-2">
            {!isCompetition && (
              <p className="text-sm md:text-2xl text-gray-500">
                {isSpeaking ? 'Listen carefully...' : 'Tap the correct word!'}
              </p>
            )}
          </div>

          {/* Choice Cards - LOCKED IN CENTER, NO LAYOUT SHIFT */}
          {/* Always 3 columns, compact on phones, full size on desktop */}
          <div className="grid grid-cols-3 gap-2 md:gap-8 w-full max-w-6xl px-2 md:px-4 shrink-0">
            {currentQuestion.choices.map((choice, index) => {
              let cardClass = 'rounded-xl md:rounded-[2.7rem] shadow-lg transition-colors aspect-square';

              if (!isCompetition) {
                cardClass += ' cursor-pointer hover:scale-105 transition-transform';

                if (feedback) {
                  if (index === currentQuestion.correctIndex) {
                    cardClass += ' correct-flash';
                  } else if (feedback === 'incorrect' && results[results.length - 1]?.userAnswer === choice) {
                    cardClass += ' incorrect-flash';
                  }
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => !isCompetition && handleAnswer(index)}
                  disabled={isCompetition || !canAnswer || feedback}
                  className={`${cardClass} flex items-center justify-center p-2 md:p-4`}
                  style={{ background: 'linear-gradient(150deg, #f0f7ff 65%, #e6f0ff 100%)' }}
                >
                  <span className="text-3xl md:text-[10vh] font-bold text-gray-700 text-center leading-none">
                    {choice}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d8e9fa]">
      <div className="text-2xl text-gray-500">Loading...</div>
    </div>
  );
};

export default PhonicsGame;
