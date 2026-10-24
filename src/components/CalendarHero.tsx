import React, { useState, useRef, useEffect } from 'react';
import { CycleDay } from '../types';
import { DAYS_ABBR } from '../utils/formatters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowRight,
  Check,
  History,
  Sparkles
} from 'lucide-react';

interface CalendarHeroProps {
  studyCycle: CycleDay[];
  activeCycleDay: number; // 1-indexed (e.g. 1, 2, 3...)
  cycleCompletedSubjects?: { [dayNumber: number]: string[] };
  onToggleSubject: (dayNumber: number, subject: string) => void;
  onAdvanceDay: () => void;
  onOpenCycleConfig: () => void;
  onOpenHistoryCalendar: () => void;
  onSelectActiveCycleDay?: (dayNumber: number) => void;
}

export const CalendarHero: React.FC<CalendarHeroProps> = ({
  studyCycle,
  activeCycleDay = 1,
  cycleCompletedSubjects = {},
  onToggleSubject,
  onAdvanceDay,
  onOpenCycleConfig,
  onOpenHistoryCalendar,
  onSelectActiveCycleDay
}) => {
  const today = new Date();

  // Dynamic cycle length (e.g. 4, 5, 6, 7 days)
  const cycleLength = studyCycle && Array.isArray(studyCycle) && studyCycle.length > 0
    ? studyCycle.length
    : 7;

  // Safe active day (1-indexed within [1, cycleLength])
  const safeActiveDay = Math.min(Math.max(1, activeCycleDay || 1), cycleLength);

  // Selected day index in carousel (0-indexed within [0, cycleLength - 1])
  // Defaults to safeActiveDay - 1
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(safeActiveDay - 1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync selected index whenever activeCycleDay changes
  useEffect(() => {
    setSelectedDayIndex(safeActiveDay - 1);
  }, [safeActiveDay]);

  // Build the cycle strip for all days in the cycle
  const daysStrip = [];
  for (let i = 0; i < cycleLength; i++) {
    const cycleDayNum = i + 1;
    const cycleItem = studyCycle[i] || { day: cycleDayNum, subjects: [] };

    // Offset relative to current active cycle day:
    // If activeCycleDay is 1, day 1 is Today (offset 0), day 2 is Tomorrow (offset +1), etc.
    const relativeOffset = i - (safeActiveDay - 1);
    const d = new Date();
    d.setDate(today.getDate() + relativeOffset);

    const isThisActiveDay = cycleDayNum === safeActiveDay;
    const completedSubs = cycleCompletedSubjects[cycleDayNum] || [];
    const subjects = cycleItem.subjects || [];
    const isDayFullyDone = subjects.length > 0 && subjects.every((s) => completedSubs.includes(s));
    const isDayPartiallyDone = completedSubs.length > 0 && !isDayFullyDone;

    daysStrip.push({
      index: i,
      cycleDayNumber: cycleDayNum,
      date: d,
      weekday: DAYS_ABBR[d.getDay()],
      fullWeekday: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
      dayDateStr: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      subjects,
      completedSubs,
      isThisActiveDay,
      isDayFullyDone,
      isDayPartiallyDone
    });
  }

  // Ensure safe index bounds if cycle length changes dynamically
  const safeIndex = selectedDayIndex < daysStrip.length ? selectedDayIndex : 0;
  const selectedItem = daysStrip[safeIndex] || daysStrip[0];
  const isSelectedActive = selectedItem.cycleDayNumber === safeActiveDay;

  const currentDaySubjects = selectedItem.subjects || [];
  const currentCompletedSubs = cycleCompletedSubjects[selectedItem.cycleDayNumber] || [];
  const completedCount = currentCompletedSubs.length;
  const totalCount = currentDaySubjects.length;
  const isAllCompleted = totalCount > 0 && completedCount >= totalCount;
  const percentCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Center a card in the scrollable strip
  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.children[index] as HTMLElement | undefined;
      if (card) {
        const targetLeft = card.offsetLeft - container.offsetWidth / 2 + card.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }
    }
  };

  const handlePrev = () => {
    setSelectedDayIndex((prev) => {
      const newIdx = Math.max(0, prev - 1);
      scrollToIndex(newIdx);
      return newIdx;
    });
  };

  const handleNext = () => {
    setSelectedDayIndex((prev) => {
      const newIdx = Math.min(daysStrip.length - 1, prev + 1);
      scrollToIndex(newIdx);
      return newIdx;
    });
  };

  const handleSelectDay = (index: number) => {
    setSelectedDayIndex(index);
    scrollToIndex(index);
  };

  return (
    <div className="calendar-hero-card">
      {/* Top Header Row: Badges & Controls */}
      <div className="hero-top-info">
        <div className="hero-badges-wrapper">
          <div className="flex items-center gap-2">
            <span className="hero-program-title flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 opacity-80" />
              <span>
                {isSelectedActive
                  ? 'PROGRAMAÇÃO DE HOJE'
                  : `PROGRAMAÇÃO: DIA ${selectedItem.cycleDayNumber} (${selectedItem.weekday} ${selectedItem.dayDateStr})`}
              </span>
            </span>

            <span className="hero-cycle-badge">
              Dia {selectedItem.cycleDayNumber} de {cycleLength}
            </span>

            {isSelectedActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dia Ativo</span>
              </span>
            )}
          </div>

          {!isSelectedActive && (
            <button
              type="button"
              onClick={() => handleSelectDay(safeActiveDay - 1)}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 underline transition-colors cursor-pointer"
            >
              Voltar ao Dia Ativo (Dia {safeActiveDay})
            </button>
          )}
        </div>

        {/* Right Header Controls: History Button, Date Tag & Settings */}
        <div className="hero-controls">
          {/* Calendar History Button (Requested in brief) */}
          <button
            type="button"
            onClick={onOpenHistoryCalendar}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] text-sky-400 hover:text-sky-300 hover:border-sky-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Ver Histórico de Metas no Calendário"
            aria-label="Histórico de Metas"
          >
            <History className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Histórico</span>
          </button>

          <span className="hero-today-tag">
            {selectedItem.dayDateStr} • {selectedItem.weekday}
          </span>

          <button
            type="button"
            className="btn-dots-menu"
            onClick={onOpenCycleConfig}
            title={`Configurar Ciclo de ${cycleLength} Dias & Matérias`}
            aria-label="Configurar Ciclo de Estudo"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle Section: Matérias em Destaque com Checklist Interativo */}
      <div className="hero-subjects-container py-1.5 flex flex-col gap-3">
        {totalCount === 0 ? (
          <div
            className="empty-cycle-hint cursor-pointer"
            onClick={onOpenCycleConfig}
            title="Clique para cadastrar matérias neste dia"
          >
            <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="hint-text text-xs">
              {isSelectedActive
                ? 'Nenhuma matéria programada para hoje. Toque no ícone de configurações para planejar seu ciclo.'
                : `Nenhuma matéria programada para o Dia ${selectedItem.cycleDayNumber} (${selectedItem.weekday}). Toque para configurar.`}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 w-full">
            {/* Checklist de Matérias do Dia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 w-full">
              {currentDaySubjects.map((sub, idx) => {
                const isDone = currentCompletedSubs.includes(sub);

                return (
                  <div
                    key={idx}
                    role="checkbox"
                    aria-checked={isDone}
                    tabIndex={0}
                    onClick={() => onToggleSubject(selectedItem.cycleDayNumber, sub)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleSubject(selectedItem.cycleDayNumber, sub);
                      }
                    }}
                    className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 shadow-sm ${
                      isDone
                        ? 'bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25 hover:border-emerald-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    title={`Clique para marcar ${sub} como ${isDone ? 'pendente' : 'concluída'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Checkbox Icon */}
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'border-2 border-white/30 text-transparent group-hover:border-white/60'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      {/* Subject Name */}
                      <span
                        className={`text-xs md:text-sm font-extrabold truncate uppercase tracking-tight ${
                          isDone ? 'text-emerald-300 line-through opacity-90' : 'text-white'
                        }`}
                      >
                        {sub}
                      </span>
                    </div>

                    {/* Badge Concluída / Pendente */}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 transition-all ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-white/50 border border-white/10'
                      }`}
                    >
                      {isDone ? 'Concluída' : 'Pendente'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Progression Toolbar for the Day */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-white/10 mt-1">
              {/* Progress Bar & Counter */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-[var(--text)]">
                      Meta do Dia: {completedCount}/{totalCount} matérias
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isAllCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-sky-500/20 text-sky-400'
                      }`}
                    >
                      {percentCompleted}%
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-36 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAllCompleted ? 'bg-emerald-400' : 'bg-sky-400'
                      }`}
                      style={{ width: `${percentCompleted}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Finalizar Dia & Avançar Ciclo */}
              <div className="flex items-center gap-2">
                {isSelectedActive ? (
                  <button
                    type="button"
                    onClick={onAdvanceDay}
                    className={`btn-advance-cycle px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                      isAllCompleted
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 animate-pulse'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20'
                    }`}
                    title={
                      isAllCompleted
                        ? 'Meta cumprida! Clique para registrar o dia e avançar para o próximo dia do ciclo'
                        : 'Finalizar dia e avançar para o próximo dia do ciclo de estudos'
                    }
                  >
                    {isAllCompleted ? (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Meta Cumprida! Avançar Ciclo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-sky-200" />
                        <span>Finalizar Dia & Avançar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                ) : (
                  onSelectActiveCycleDay && (
                    <button
                      type="button"
                      onClick={() => onSelectActiveCycleDay(selectedItem.cycleDayNumber)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Tornar este o Dia Ativo</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Carrossel / Slider Horizontal dos Dias do Ciclo */}
      <div className="calendar-slider-wrapper">
        <div className="calendar-slider-header">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--cal-text-muted)]">
              Ciclo de {cycleLength} Dias
            </span>
            <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
              Hoje: Dia {safeActiveDay}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeIndex === 0}
              className={`slider-nav-btn ${safeIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="Dia anterior"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={safeIndex === daysStrip.length - 1}
              className={`slider-nav-btn ${safeIndex === daysStrip.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="Próximo dia"
              aria-label="Próximo dia"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="calendar-slider-strip" ref={scrollRef}>
          {daysStrip.map((item) => {
            const isSelected = item.index === safeIndex;
            const subCount = item.subjects.length;

            return (
              <div
                key={item.index}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectDay(item.index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectDay(item.index);
                  }
                }}
                className={`slider-day-pill relative ${isSelected ? 'active' : ''} ${
                  item.isThisActiveDay ? 'is-today ring-1 ring-sky-400' : ''
                } ${item.isDayFullyDone ? '!border-emerald-500/40 !bg-emerald-500/10' : ''}`}
                title={`Dia ${item.cycleDayNumber} de ${cycleLength}: ${item.weekday} (${item.dayDateStr}) - Clique para selecionar`}
              >
                {/* Header do Card */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="slider-day-weekday font-bold">{item.weekday}</span>
                    {item.isThisActiveDay && (
                      <span className="slider-today-dot" title="Dia Ativo do Ciclo" />
                    )}
                  </div>
                  <span className="slider-day-date">{item.dayDateStr}</span>
                </div>

                {/* Sub-header com dia do ciclo e status */}
                <div className="flex items-center justify-between text-[10px] text-[var(--cal-text-muted)]">
                  <span className="slider-day-cycle-num font-extrabold text-[var(--text)]">
                    Dia {item.cycleDayNumber}
                  </span>

                  {item.isDayFullyDone ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold text-[10px]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>Concluído</span>
                    </span>
                  ) : item.isThisActiveDay ? (
                    <span className="text-sky-400 font-bold text-[10px]">Ativo</span>
                  ) : subCount > 0 ? (
                    <span className="text-[10px] opacity-75">{subCount} mat.</span>
                  ) : null}
                </div>

                {/* As Matérias do Card no Carrossel */}
                <div className="slider-card-subjects">
                  {subCount > 0 ? (
                    <>
                      {item.subjects.slice(0, 2).map((sub, sIdx) => {
                        const isSubDone = item.completedSubs.includes(sub);
                        return (
                          <div
                            key={sIdx}
                            className={`slider-card-subject-pill ${
                              isSubDone ? 'opacity-80 line-through text-emerald-300' : ''
                            }`}
                            title={sub}
                          >
                            <span className="slider-sub-bullet">•</span>
                            <span className="slider-sub-name">{sub}</span>
                          </div>
                        );
                      })}
                      {item.subjects.length > 2 && (
                        <span className="text-[10px] text-[var(--cal-text-muted)] font-medium pl-1">
                          +{item.subjects.length - 2} mais
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="slider-card-free">Livre</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
