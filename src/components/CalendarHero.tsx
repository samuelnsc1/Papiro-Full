import React, { useState, useRef } from 'react';
import { CycleDay } from '../types';
import { DAYS_ABBR } from '../utils/formatters';
import { Calendar, ChevronLeft, ChevronRight, SlidersHorizontal, BookOpen } from 'lucide-react';

interface CalendarHeroProps {
  studyCycle: CycleDay[];
  onOpenCycleConfig: () => void;
}

export const CalendarHero: React.FC<CalendarHeroProps> = ({
  studyCycle,
  onOpenCycleConfig
}) => {
  const today = new Date();

  // Allow selecting any day in the cycle to inspect its plan without cluttering the screen
  const [selectedOffset, setSelectedOffset] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamic cycle length (e.g. 4, 5, 6, 7 days)
  const cycleLength = studyCycle && Array.isArray(studyCycle) && studyCycle.length > 0
    ? studyCycle.length
    : 7;

  // Build the cycle strip starting from today (Day 1 = Hoje, Day 2 = Amanhã, etc.)
  const daysStrip = [];
  for (let i = 0; i < cycleLength; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    // Each day card corresponds to the sequential day in the user's study cycle
    const cycleItem = studyCycle[i] || { day: i + 1, subjects: [] };
    const isToday = i === 0;

    daysStrip.push({
      offset: i,
      date: d,
      weekday: DAYS_ABBR[d.getDay()],
      fullWeekday: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
      dayDateStr: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      cycleDayNumber: cycleItem.day || i + 1,
      subjects: cycleItem.subjects || [],
      isToday
    });
  }

  // Ensure safe index bounds if cycle length changes dynamically
  const safeOffset = selectedOffset < daysStrip.length ? selectedOffset : 0;
  const selectedItem = daysStrip[safeOffset] || daysStrip[0];
  const isSelectedToday = safeOffset === 0;
  const hasSubjects = selectedItem.subjects && selectedItem.subjects.length > 0;

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
    setSelectedOffset((prev) => {
      const newIdx = Math.max(0, prev - 1);
      scrollToIndex(newIdx);
      return newIdx;
    });
  };

  const handleNext = () => {
    setSelectedOffset((prev) => {
      const newIdx = Math.min(daysStrip.length - 1, prev + 1);
      scrollToIndex(newIdx);
      return newIdx;
    });
  };

  const handleSelectDay = (offset: number) => {
    setSelectedOffset(offset);
    scrollToIndex(offset);
  };

  return (
    <div className="calendar-hero-card">
      {/* Top Header Row: Badges & Controls */}
      <div className="hero-top-info">
        <div className="hero-badges-wrapper">
          <div className="flex items-center gap-2">
            <span className="hero-program-title flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-75" />
              <span>
                {isSelectedToday
                  ? 'PROGRAMAÇÃO DE HOJE'
                  : `PROGRAMAÇÃO: ${selectedItem.weekday} (${selectedItem.dayDateStr})`}
              </span>
            </span>
            <span className="hero-cycle-badge">
              Dia {selectedItem.cycleDayNumber} de {cycleLength}
            </span>
          </div>

          {!isSelectedToday && (
            <button
              type="button"
              onClick={() => handleSelectDay(0)}
              className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline transition-colors cursor-pointer"
            >
              Voltar para Hoje
            </button>
          )}
        </div>

        <div className="hero-controls">
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

      {/* Middle Section: Matérias em Destaque do Dia em Foco */}
      <div className="hero-subjects-container py-1">
        {!hasSubjects ? (
          <div
            className="empty-cycle-hint cursor-pointer"
            onClick={onOpenCycleConfig}
            title="Clique para cadastrar matérias neste dia"
          >
            <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="hint-text text-xs">
              {isSelectedToday
                ? 'Nenhuma matéria programada para hoje. Toque no ícone de configurações para planejar seu ciclo.'
                : `Nenhuma matéria programada para o Dia ${selectedItem.cycleDayNumber} (${selectedItem.weekday}). Toque para configurar.`}
            </span>
          </div>
        ) : (
          <div className="hero-active-subjects-list">
            {selectedItem.subjects.map((sub, idx) => (
              <span key={idx} className="hero-subject-pill" title={sub}>
                {sub}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section: Carrossel / Slider Horizontal dos Dias do Ciclo */}
      <div className="calendar-slider-wrapper">
        <div className="calendar-slider-header">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--cal-text-muted)]">
            Ciclo de {cycleLength} Dias
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={safeOffset === 0}
              className={`slider-nav-btn ${safeOffset === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="Dia anterior"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={safeOffset === daysStrip.length - 1}
              className={`slider-nav-btn ${safeOffset === daysStrip.length - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="Próximo dia"
              aria-label="Próximo dia"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="calendar-slider-strip" ref={scrollRef}>
          {daysStrip.map((item) => {
            const isSelected = item.offset === safeOffset;
            const subCount = item.subjects.length;

            return (
              <div
                key={item.offset}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectDay(item.offset)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectDay(item.offset);
                  }
                }}
                className={`slider-day-pill ${isSelected ? 'active' : ''} ${item.isToday ? 'is-today' : ''}`}
                title={`Dia ${item.cycleDayNumber} de ${cycleLength}: ${item.weekday} (${item.dayDateStr}) - Clique para selecionar`}
              >
                {/* Header do Card */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1">
                    <span className="slider-day-weekday">{item.weekday}</span>
                    {item.isToday && <span className="slider-today-dot" title="Hoje" />}
                  </div>
                  <span className="slider-day-date">{item.dayDateStr}</span>
                </div>

                {/* Sub-header com dia do ciclo */}
                <div className="flex items-center justify-between text-[10px] text-[var(--cal-text-muted)]">
                  <span className="slider-day-cycle-num font-bold">
                    Dia {item.cycleDayNumber}
                  </span>
                  {subCount > 0 && (
                    <span className="text-[10px] opacity-75">{subCount} mat.</span>
                  )}
                </div>

                {/* As Matérias do Card no Carrossel (até 2 matérias visíveis de forma limpa) */}
                <div className="slider-card-subjects">
                  {subCount > 0 ? (
                    <>
                      {item.subjects.slice(0, 2).map((sub, sIdx) => (
                        <div key={sIdx} className="slider-card-subject-pill" title={sub}>
                          <span className="slider-sub-bullet">•</span>
                          <span className="slider-sub-name">{sub}</span>
                        </div>
                      ))}
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
