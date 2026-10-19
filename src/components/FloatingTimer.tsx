import React, { useState, useEffect } from 'react';
import { TimerMode } from '../types';
import { formatTime, formatDuration, getTodayString } from '../utils/formatters';

interface FloatingTimerProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  onSaveSession: (subject: string, seconds: number, date: string) => void;
  onTimerTick: (timeStr: string | null) => void;
}

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

  // Manual mode states
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(50);
  const [manualDate, setManualDate] = useState(getTodayString());

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (mode === 'up') {
            return prev + 1;
          } else if (mode === 'down') {
            if (prev <= 1) {
              setIsRunning(false);
              alert("Tempo de estudo finalizado!");
              return 0;
            }
            return prev - 1;
          }
          return prev;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  useEffect(() => {
    if (isRunning) {
      onTimerTick(formatTime(seconds));
    } else {
      onTimerTick(null);
    }
  }, [seconds, isRunning, onTimerTick]);

  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'down') {
      setSeconds(countdownTarget);
    } else if (newMode === 'up') {
      setSeconds(0);
    }
  };

  const setCountdownPreset = (mins: number) => {
    const target = mins * 60;
    setCountdownTarget(target);
    setSeconds(target);
  };

  const handleFinishTimer = () => {
    setIsRunning(false);
    const spent = (mode === 'up') ? seconds : (countdownTarget - seconds);

    if (!selectedSubject) {
      alert("Selecione ou cadastre uma matéria antes de salvar.");
      return;
    }

    if (spent >= 10) {
      onSaveSession(selectedSubject, spent, getTodayString());
      alert(`Sessão salva: ${formatDuration(spent)} em ${selectedSubject}!`);
    } else {
      alert("Sessão inferior a 10 segundos não foi registrada.");
    }

    setSeconds(0);
    onClose();
  };

  const handleSaveManual = () => {
    const totalSeconds = (manualHours * 3600) + (manualMinutes * 60);
    if (totalSeconds <= 0) {
      alert("Insira um tempo válido (horas ou minutos).");
      return;
    }
    if (!selectedSubject) {
      alert("Selecione uma matéria.");
      return;
    }

    onSaveSession(selectedSubject, totalSeconds, manualDate || getTodayString());
    alert(`Registrado com sucesso: ${formatDuration(totalSeconds)} em ${selectedSubject}!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="floating-timer-corner">
      <div className="corner-timer-header">
        <span className="corner-timer-title">⏱️ Cronômetro de Estudo</span>
        <button className="btn-close-modal" onClick={onClose}>✕</button>
      </div>

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

          <div className="corner-timer-time">{formatTime(seconds)}</div>

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
                className="btn-timer-action start"
                onClick={() => setIsRunning(true)}
              >
                Iniciar
              </button>
            ) : (
              <button
                className="btn-timer-action pause"
                onClick={() => setIsRunning(false)}
              >
                Pausar
              </button>
            )}
            <button
              className="btn-timer-action stop"
              onClick={handleFinishTimer}
            >
              Salvar Sessão
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
            className="btn-auth-submit py-2 text-xs"
            onClick={handleSaveManual}
          >
            Registrar Tempo
          </button>
        </div>
      )}
    </div>
  );
};
