import React, { useState, useMemo } from 'react';
import { DailyGoalRecord, StudySession } from '../../types';
import { formatDuration } from '../../utils/formatters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  Flame,
  X
} from 'lucide-react';

interface HistoryCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyGoalsHistory: DailyGoalRecord[];
  studySessions: StudySession[];
  projectName?: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const HistoryCalendarModal: React.FC<HistoryCalendarModalProps> = ({
  isOpen,
  onClose,
  dailyGoalsHistory = [],
  studySessions = [],
  projectName = 'Meu Concurso'
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11

  // Hovered day for rich tooltip
  const [hoveredDateData, setHoveredDateData] = useState<{
    dateStr: string;
    dayNum: number;
    fullDateBR: string;
    status: 'completed' | 'partial' | 'missed';
    statusLabel: string;
    totalSeconds: number;
    subjects: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setHoveredDateData(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setHoveredDateData(null);
  };

  const handleGoToCurrentMonth = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setHoveredDateData(null);
  };

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Pre-index goals and study sessions by date string YYYY-MM-DD
  const goalsMap = useMemo(() => {
    const map = new Map<string, DailyGoalRecord>();
    (dailyGoalsHistory || []).forEach((g) => {
      if (g?.date) map.set(g.date, g);
    });
    return map;
  }, [dailyGoalsHistory]);

  const sessionsMap = useMemo(() => {
    const map = new Map<string, { totalSeconds: number; subjects: Set<string> }>();
    (studySessions || []).forEach((s) => {
      if (!s?.study_date) return;
      const cleanDate = s.study_date.split('T')[0];
      const existing = map.get(cleanDate) || { totalSeconds: 0, subjects: new Set<string>() };
      existing.totalSeconds += Number(s.seconds) || 0;
      if (s.subject) existing.subjects.add(s.subject.toUpperCase());
      map.set(cleanDate, existing);
    });
    return map;
  }, [studySessions]);

  // Monthly aggregated statistics
  const { monthCompletedGoals, monthTotalSeconds, monthActiveDays } = useMemo(() => {
    let completedCount = 0;
    let secondsSum = 0;
    const activeDates = new Set<string>();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const goal = goalsMap.get(dateStr);
      const session = sessionsMap.get(dateStr);

      if (goal?.status === 'completed') {
        completedCount++;
        activeDates.add(dateStr);
      } else if (goal?.status === 'partial') {
        activeDates.add(dateStr);
      }

      if (session && session.totalSeconds > 0) {
        secondsSum += session.totalSeconds;
        activeDates.add(dateStr);
      }
    }

    return {
      monthCompletedGoals: completedCount,
      monthTotalSeconds: secondsSum,
      monthActiveDays: activeDates.size
    };
  }, [currentYear, currentMonth, daysInMonth, goalsMap, sessionsMap]);

  type CalendarCell =
    | { isEmpty: true; key: string }
    | {
        isEmpty: false;
        key: string;
        dayNum: number;
        dateStr: string;
        isToday: boolean;
        status: 'completed' | 'partial' | 'missed';
        statusLabel: string;
        totalSeconds: number;
        subjects: string[];
      };

  // Prepare calendar cells (padding + actual days)
  const calendarDays: CalendarCell[] = [];
  // Empty padding for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push({ isEmpty: true, key: `empty-${i}` });
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const goal = goalsMap.get(dateStr);
    const session = sessionsMap.get(dateStr);
    const isToday = dateStr === todayStr;

    // Determine status
    let status: 'completed' | 'partial' | 'missed' = 'missed';
    let statusLabel = 'Sem Registro';
    if (goal?.status === 'completed') {
      status = 'completed';
      statusLabel = 'Meta Cumprida';
    } else if (goal?.status === 'partial' || (session && session.totalSeconds > 0)) {
      status = 'partial';
      statusLabel = goal?.status === 'partial' ? 'Meta Parcial' : 'Estudo Registrado';
    } else if (dateStr < todayStr) {
      status = 'missed';
      statusLabel = 'Meta Não Cumprida';
    }

    // Combine subjects from goal and study sessions
    const subjectSet = new Set<string>();
    if (goal?.subjects) {
      goal.subjects.forEach((s) => subjectSet.add(s.toUpperCase()));
    }
    if (session?.subjects) {
      session.subjects.forEach((s) => subjectSet.add(s));
    }

    calendarDays.push({
      isEmpty: false,
      key: dateStr,
      dayNum: d,
      dateStr,
      isToday,
      status,
      statusLabel,
      totalSeconds: session?.totalSeconds || goal?.totalSeconds || 0,
      subjects: Array.from(subjectSet)
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card max-w-[620px] !p-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header !pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="modal-title text-base font-extrabold text-[var(--text)] tracking-tight">
                Histórico de Metas & Estudos
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                {projectName} • Acompanhamento diário do ciclo
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation & Stats Ribbon */}
        <div className="space-y-4 my-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-[var(--text)] transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm md:text-base font-extrabold uppercase tracking-tight text-[var(--text)] px-1">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-[var(--text)] transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {(currentMonth !== today.getMonth() || currentYear !== today.getFullYear()) && (
              <button
                type="button"
                onClick={handleGoToCurrentMonth}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
              >
                Mês Atual
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold text-xs mb-0.5">
                <Award className="w-3.5 h-3.5" />
                <span>Metas Cumpridas</span>
              </div>
              <span className="text-lg md:text-xl font-extrabold text-emerald-400">
                {monthCompletedGoals} {monthCompletedGoals === 1 ? 'dia' : 'dias'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-sky-400 font-bold text-xs mb-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Tempo Estudado</span>
              </div>
              <span className="text-lg md:text-xl font-extrabold text-sky-400">
                {formatDuration(monthTotalSeconds)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-xs mb-0.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Dias Ativos</span>
              </div>
              <span className="text-lg md:text-xl font-extrabold text-amber-400">
                {monthActiveDays} {monthActiveDays === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="border border-[var(--border)] rounded-2xl bg-[var(--surface-subtle)]/40 p-3.5 relative">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAY_NAMES.map((w, idx) => (
              <span
                key={idx}
                className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] py-1"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell) => {
              if (cell.isEmpty) {
                return <div key={cell.key} className="h-14 rounded-xl opacity-0 pointer-events-none" />;
              }

              const isCompleted = cell.status === 'completed';
              const isPartial = cell.status === 'partial';
              const isMissed = cell.status === 'missed';

              return (
                <div
                  key={cell.key}
                  onMouseEnter={() => {
                    const dateObj = new Date(`${cell.dateStr}T12:00:00`);
                    const fullDateBR = dateObj.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                    setHoveredDateData({
                      dateStr: cell.dateStr,
                      dayNum: cell.dayNum,
                      fullDateBR,
                      status: cell.status,
                      statusLabel: cell.statusLabel,
                      totalSeconds: cell.totalSeconds,
                      subjects: cell.subjects
                    });
                  }}
                  onMouseLeave={() => setHoveredDateData(null)}
                  className={`h-14 rounded-xl p-1.5 border transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isCompleted
                      ? 'bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25 hover:border-emerald-400'
                      : isPartial
                      ? 'bg-amber-500/15 border-amber-500/35 hover:bg-amber-500/25 hover:border-amber-400'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-sky-500/40'
                  } ${cell.isToday ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-[var(--bg)] font-extrabold' : ''}`}
                >
                  {/* Top row: day number and check icon */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold leading-none ${
                        cell.isToday
                          ? 'text-sky-400 underline decoration-2'
                          : isCompleted
                          ? 'text-emerald-400'
                          : isPartial
                          ? 'text-amber-400'
                          : 'text-[var(--text)]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {isCompleted && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    )}
                    {isPartial && !isCompleted && (
                      <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Bottom row: Time studied or dot */}
                  <div className="w-full text-[9px] font-semibold truncate leading-tight">
                    {cell.totalSeconds > 0 ? (
                      <span className={isCompleted ? 'text-emerald-300' : 'text-sky-300'}>
                        {formatDuration(cell.totalSeconds)}
                      </span>
                    ) : isCompleted ? (
                      <span className="text-emerald-400 font-bold">100%</span>
                    ) : cell.isToday ? (
                      <span className="text-sky-400 font-medium">Hoje</span>
                    ) : isMissed && cell.dateStr < todayStr ? (
                      <span className="text-[var(--text-muted)] opacity-40">•</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Rich Tooltip on Hover */}
          {hoveredDateData && (
            <div className="mt-4 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="text-xs font-extrabold text-[var(--text)] capitalize">
                    {hoveredDateData.fullDateBR}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        hoveredDateData.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : hoveredDateData.status === 'partial'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-500/15 text-[var(--text-muted)] border-zinc-500/30'
                      }`}
                    >
                      {hoveredDateData.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {hoveredDateData.status === 'partial' && <AlertCircle className="w-2.5 h-2.5" />}
                      <span>{hoveredDateData.statusLabel}</span>
                    </span>

                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span>Tempo total: {formatDuration(hoveredDateData.totalSeconds)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Studied Subjects in Tooltip */}
              <div className="pt-2 border-t border-[var(--border)]/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Matérias Concluídas / Estudadas:</span>
                </div>
                {hoveredDateData.subjects && hoveredDateData.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {hoveredDateData.subjects.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--border)] text-[10px] font-bold text-[var(--text)]"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)] italic">
                    Nenhuma matéria registrada neste dia.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 mt-3 border-t border-[var(--border)] text-[var(--text-muted)]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
              <span className="font-medium text-[11px]">Meta Cumprida</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm" />
              <span className="font-medium text-[11px]">Meta Parcial / Estudo</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)] inline-block border border-[var(--text-muted)]/40" />
              <span className="font-medium text-[11px]">Sem Registro</span>
            </span>
          </div>

          <button
            type="button"
            className="btn-auth-submit !py-1.5 !px-4 text-xs font-bold"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
