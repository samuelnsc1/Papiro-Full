import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode } from '../types';
import { formatTime, formatDuration, getTodayString } from '../utils/formatters';
import { Clock, Play, Pause, Check, X, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FloatingTimerProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  onSaveSession: (subject: string, seconds: number, date: string) => void;
  onTimerTick: (timeStr: string | null) => void;
}

const DEFAULT_DOC_TITLE = 'Papiro Full | Gestão Inteligente de Estudos';
const STORAGE_KEY = 'papiro_active_timer_state';

export const FloatingTimer: React.FC<FloatingTimerProps> = ({
  isOpen,
  onClose,
  subjects,
  onSaveSession,
  onTimerTick
}) => {
  const [mode, setMode] = useState<TimerMode>('up');
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [countdownTarget, setCountdownTarget] = useState(3600); // 60 mins default
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);

  // Manual mode states
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(50);
  const [manualDate, setManualDate] = useState(getTodayString());

  // Precision time tracking refs (delta based on real timestamps)
  const startTimestampRef = useRef<number | null>(null);
  const accumulatedSecondsRef = useRef<number>(0);
  const modeRef = useRef<TimerMode>(mode);
  const countdownTargetRef = useRef<number>(countdownTarget);
  const selectedSubjectRef = useRef<string>(selectedSubject);
  const isRunningRef = useRef<boolean>(isRunning);
  const workerRef = useRef<Worker | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    countdownTargetRef.current = countdownTarget;
  }, [countdownTarget]);

  useEffect(() => {
    selectedSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  // Save state to localStorage for cross-tab or reload preservation
  const persistState = useCallback((running: boolean, accum: number, startTs: number | null) => {
    try {
      if (!running && accum === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          isRunning: running,
          accumulatedSeconds: accum,
          startTimestamp: startTs,
          mode: modeRef.current,
          countdownTarget: countdownTargetRef.current,
          selectedSubject: selectedSubjectRef.current
        }));
      }
    } catch (e) {
      console.warn("LocalStorage timer error:", e);
    }
  }, []);

  // Compute exact elapsed and display seconds from real timestamps
  const computeCurrentSeconds = useCallback(() => {
    let totalElapsed = accumulatedSecondsRef.current;
    if (isRunningRef.current && startTimestampRef.current) {
      const deltaSec = Math.max(0, Math.floor((Date.now() - startTimestampRef.current) / 1000));
      totalElapsed += deltaSec;
    }

    const currentMode = modeRef.current;
    const target = countdownTargetRef.current;

    if (currentMode === 'up') {
      return { displaySec: totalElapsed, totalElapsed, isFinished: false };
    } else if (currentMode === 'down') {
      const remaining = Math.max(0, target - totalElapsed);
      const isFinished = remaining <= 0 && isRunningRef.current;
      return { displaySec: remaining, totalElapsed, isFinished };
    }
    return { displaySec: totalElapsed, totalElapsed, isFinished: false };
  }, []);

  // Update display and document.title based on current calculation
  const updateTick = useCallback(() => {
    const { displaySec, isFinished } = computeCurrentSeconds();

    if (isFinished) {
      setIsRunning(false);
      isRunningRef.current = false;
      accumulatedSecondsRef.current = countdownTargetRef.current;
      startTimestampRef.current = null;
      setSeconds(0);
      onTimerTick("00:00:00");
      document.title = "Papiro Full - Tempo Finalizado!";
      setFeedback({ type: 'warning', text: 'Tempo de estudo finalizado!' });

      // Subtle audio alert
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.0);
        }
      } catch (_) {}

      persistState(false, 0, null);
      return;
    }

    setSeconds(displaySec);
    const timeFormatted = formatTime(displaySec);

    if (isRunningRef.current) {
      onTimerTick(timeFormatted);
      // Requirement: "Ao invés de aparecer Papiro Full - Gestão Inteligente, apareça no lugar de Gestão Inteligente o relógio contando ali."
      document.title = `Papiro Full - ${timeFormatted}`;
    } else if (accumulatedSecondsRef.current > 0) {
      onTimerTick(timeFormatted);
      document.title = `Papiro Full - [Pausado] ${timeFormatted}`;
    } else {
      onTimerTick(null);
      document.title = DEFAULT_DOC_TITLE;
    }
  }, [computeCurrentSeconds, onTimerTick, persistState]);

  // Hydrate timer from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && typeof data === 'object') {
          const savedMode: TimerMode = data.mode || 'up';
          const savedTarget = Number(data.countdownTarget) || 3600;
          let savedAccum = Number(data.accumulatedSeconds) || 0;
          const savedStart = Number(data.startTimestamp) || null;
          const wasRunning = Boolean(data.isRunning && savedStart);
          const savedSub = data.selectedSubject || '';

          setMode(savedMode);
          modeRef.current = savedMode;
          setCountdownTarget(savedTarget);
          countdownTargetRef.current = savedTarget;
          if (savedSub) setSelectedSubject(savedSub);

          if (wasRunning && savedStart) {
            // Add time passed since the page was last open
            const elapsed = Math.max(0, Math.floor((Date.now() - savedStart) / 1000));
            savedAccum += elapsed;
            startTimestampRef.current = Date.now();
            accumulatedSecondsRef.current = savedAccum;
            setIsRunning(true);
            isRunningRef.current = true;
          } else {
            accumulatedSecondsRef.current = savedAccum;
            startTimestampRef.current = null;
            setIsRunning(false);
            isRunningRef.current = false;
          }

          let display = savedAccum;
          if (savedMode === 'down') {
            display = Math.max(0, savedTarget - savedAccum);
          }
          setSeconds(display);
        }
      }
    } catch (e) {
      console.warn("Timer hydration error:", e);
    }
  }, []);

  // Web Worker + Fallback Interval + visibilitychange & focus listeners
  useEffect(() => {
    let intervalId: any = null;
    let worker: Worker | null = null;

    // 1. Dedicated inline Web Worker runs in background thread without DOM tab throttling
    try {
      const workerScript = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(function() {
              self.postMessage('tick');
            }, 1000);
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl);
      workerRef.current = worker;

      worker.onmessage = () => {
        updateTick();
      };
    } catch (e) {
      console.warn("Inline Web Worker unavailable, using interval fallback:", e);
    }

    // 2. Fallback interval
    intervalId = setInterval(() => {
      updateTick();
    }, 1000);

    if (isRunning) {
      worker?.postMessage('start');
    } else {
      worker?.postMessage('stop');
    }

    // 3. Immediately re-calculate time when user returns to this tab or window gains focus
    const handleSync = () => {
      updateTick();
    };

    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
        workerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [isRunning, updateTick]);

  // Restore title on unmount
  useEffect(() => {
    return () => {
      document.title = DEFAULT_DOC_TITLE;
    };
  }, []);

  // Mode change handler
  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    isRunningRef.current = false;
    startTimestampRef.current = null;
    accumulatedSecondsRef.current = 0;
    workerRef.current?.postMessage('stop');

    setMode(newMode);
    modeRef.current = newMode;

    if (newMode === 'up') {
      setSeconds(0);
    } else if (newMode === 'down') {
      setSeconds(countdownTarget);
    }
    persistState(false, 0, null);
    onTimerTick(null);
    document.title = DEFAULT_DOC_TITLE;
    setFeedback(null);
  };

  // Countdown preset handler
  const setCountdownPreset = (mins: number) => {
    setIsRunning(false);
    isRunningRef.current = false;
    startTimestampRef.current = null;
    accumulatedSecondsRef.current = 0;
    workerRef.current?.postMessage('stop');

    const secs = mins * 60;
    setCountdownTarget(secs);
    countdownTargetRef.current = secs;
    setSeconds(secs);

    persistState(false, 0, null);
    onTimerTick(null);
    document.title = DEFAULT_DOC_TITLE;
    setFeedback(null);
  };

  // Start timer
  const handleStart = () => {
    const now = Date.now();
    startTimestampRef.current = now;
    setIsRunning(true);
    isRunningRef.current = true;
    persistState(true, accumulatedSecondsRef.current, now);
    workerRef.current?.postMessage('start');
    updateTick();
    setFeedback(null);
  };

  // Pause timer
  const handlePause = () => {
    if (startTimestampRef.current) {
      const deltaSec = Math.max(0, Math.floor((Date.now() - startTimestampRef.current) / 1000));
      accumulatedSecondsRef.current += deltaSec;
      startTimestampRef.current = null;
    }
    setIsRunning(false);
    isRunningRef.current = false;
    workerRef.current?.postMessage('stop');
    persistState(false, accumulatedSecondsRef.current, null);
    updateTick();
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    startTimestampRef.current = null;
    accumulatedSecondsRef.current = 0;
    workerRef.current?.postMessage('stop');

    const initSec = mode === 'down' ? countdownTarget : 0;
    setSeconds(initSec);
    persistState(false, 0, null);
    onTimerTick(null);
    document.title = DEFAULT_DOC_TITLE;
    setFeedback(null);
  };

  // Save timer session
  const handleFinishTimer = () => {
    if (!selectedSubject) {
      setFeedback({ type: 'warning', text: 'Selecione uma matéria para salvar a sessão.' });
      return;
    }

    let totalElapsed = accumulatedSecondsRef.current;
    if (isRunningRef.current && startTimestampRef.current) {
      totalElapsed += Math.max(0, Math.floor((Date.now() - startTimestampRef.current) / 1000));
    }

    let recorded = totalElapsed;
    if (mode === 'down') {
      recorded = Math.min(countdownTarget, totalElapsed);
    }

    if (recorded <= 10) {
      setFeedback({ type: 'warning', text: 'Tempo muito curto (mínimo de 10 segundos).' });
      return;
    }

    // Stop and clear timer
    setIsRunning(false);
    isRunningRef.current = false;
    startTimestampRef.current = null;
    accumulatedSecondsRef.current = 0;
    workerRef.current?.postMessage('stop');

    const initSec = mode === 'down' ? countdownTarget : 0;
    setSeconds(initSec);
    persistState(false, 0, null);
    onTimerTick(null);
    document.title = DEFAULT_DOC_TITLE;

    onSaveSession(selectedSubject, recorded, getTodayString());
    setFeedback({
      type: 'success',
      text: `Sessão salva: ${formatDuration(recorded)} em ${selectedSubject}!`
    });

    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1200);
  };

  // Save manual session
  const handleSaveManual = () => {
    if (!selectedSubject) {
      setFeedback({ type: 'warning', text: 'Selecione uma matéria.' });
      return;
    }
    const totalSeconds = (manualHours * 3600) + (manualMinutes * 60);
    if (totalSeconds <= 0) {
      setFeedback({ type: 'warning', text: 'Insira uma duração maior que 0 minutos.' });
      return;
    }

    onSaveSession(selectedSubject, totalSeconds, manualDate || getTodayString());
    setFeedback({
      type: 'success',
      text: `Registrado: ${formatDuration(totalSeconds)} em ${selectedSubject}!`
    });

    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="floating-timer-corner"
      style={{ display: isOpen ? 'flex' : 'none' }}
    >
      <div className="corner-timer-header">
        <span className="corner-timer-title flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-sky-500'}`} />
          <span>Cronômetro de Estudo</span>
        </span>
        <button className="btn-close-modal" onClick={onClose} aria-label="Fechar">
          <X className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div
          className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span className="leading-tight">{feedback.text}</span>
        </div>
      )}

      {/* Mode segments */}
      <div className="timer-segmented-control">
        <button
          className={`timer-segment-btn ${mode === 'up' ? 'active' : ''}`}
          onClick={() => handleModeChange('up')}
        >
          Livre
        </button>
        <button
          className={`timer-segment-btn ${mode === 'down' ? 'active' : ''}`}
          onClick={() => handleModeChange('down')}
        >
          Regressiva
        </button>
        <button
          className={`timer-segment-btn ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => handleModeChange('manual')}
        >
          Manual
        </button>
      </div>

      {mode !== 'manual' ? (
        <div>
          {mode === 'down' && (
            <div className="flex gap-1 justify-center mb-2">
              {[30, 50, 60, 90].map((mins) => (
                <button
                  key={mins}
                  className="btn-study-action py-1 px-2 text-xs"
                  onClick={() => setCountdownPreset(mins)}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}

          <div className="corner-timer-time">
            <span className={isRunning ? 'text-emerald-400' : 'text-[var(--text)]'}>
              {formatTime(seconds)}
            </span>
          </div>

          <div className="form-field mb-2">
            <label className="text-xs">Matéria</label>
            <select
              className="text-xs p-1"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.length === 0 ? (
                <option value="">Nenhuma matéria cadastrada</option>
              ) : (
                subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))
              )}
            </select>
          </div>

          <div className="timer-quick-actions">
            {!isRunning ? (
              <button
                className="btn-timer-action start flex items-center justify-center gap-1"
                onClick={handleStart}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Iniciar</span>
              </button>
            ) : (
              <button
                className="btn-timer-action pause flex items-center justify-center gap-1"
                onClick={handlePause}
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar</span>
              </button>
            )}

            {(accumulatedSecondsRef.current > 0 || isRunning) && (
              <button
                className="btn-timer-action reset flex items-center justify-center gap-1 opacity-80 hover:opacity-100"
                onClick={handleReset}
                title="Zerar cronômetro"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Zerar</span>
              </button>
            )}

            <button
              className="btn-timer-action stop flex items-center justify-center gap-1"
              onClick={handleFinishTimer}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Sessão</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="form-field">
              <label className="text-xs">Horas</label>
              <input
                type="number"
                min="0"
                max="23"
                value={manualHours}
                onChange={(e) => setManualHours(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="form-field">
              <label className="text-xs">Minutos</label>
              <input
                type="number"
                min="1"
                max="59"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="text-xs">Matéria</label>
            <select
              className="text-xs p-1"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.length === 0 ? (
                <option value="">Nenhuma matéria cadastrada</option>
              ) : (
                subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))
              )}
            </select>
          </div>

          <div className="form-field">
            <label className="text-xs">Data do Estudo</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
            />
          </div>

          <button
            className="btn-auth-submit py-2 text-xs flex items-center justify-center gap-1.5"
            onClick={handleSaveManual}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Registrar Tempo</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingTimer;
