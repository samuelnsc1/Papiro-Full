import React from 'react';
import { CycleDay } from '../types';
import { getCycleDayIndexForDate, DAYS_ABBR } from '../utils/formatters';

interface CalendarHeroProps {
  studyCycle: CycleDay[];
  onOpenCycleConfig: () => void;
}

export const CalendarHero: React.FC<CalendarHeroProps> = ({
  studyCycle,
  onOpenCycleConfig
}) => {
  const today = new Date();
  const currentCycleIndex = getCycleDayIndexForDate(today);
  const activeCycle = studyCycle[currentCycleIndex] || { day: currentCycleIndex + 1, subjects: [] };

  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  // Build the 7 days strip starting from today
  const daysStrip = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const cycleIdx = getCycleDayIndexForDate(d);
    const cycleItem = studyCycle[cycleIdx] || { day: cycleIdx + 1, subjects: [] };
    const isToday = i === 0;

    daysStrip.push({
      date: d,
      weekday: DAYS_ABBR[d.getDay()],
      dayDateStr: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      subjects: cycleItem.subjects || [],
      isToday
    });
  }

  const hasSubjects = activeCycle.subjects && activeCycle.subjects.length > 0;

  return (
    <div className="calendar-hero-card">
      {/* Top Header Row: Badges & Controls */}
      <div className="hero-top-info">
        <div className="hero-badges-wrapper">
          <span className="hero-program-title">
            PROGRAMAÇÃO DE HOJE
          </span>
          <span className="hero-cycle-badge">
            Dia {activeCycle.day} de 7
          </span>
        </div>

        <div className="hero-controls">
          <span className="hero-today-tag">{todayStr}</span>
          <button
            type="button"
            className="btn-dots-menu"
            onClick={onOpenCycleConfig}
            title="Configurar Ciclo de 7 Dias & Matérias"
            aria-label="Configurar Ciclo de Estudo"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Middle Section: Matérias de Hoje */}
      <div className="hero-subjects-container">
        {!hasSubjects ? (
          <div
            className="empty-cycle-hint cursor-pointer"
            onClick={onOpenCycleConfig}
            title="Clique para cadastrar matérias no seu ciclo"
          >
            <span className="hint-icon">👉</span>
            <span className="hint-text">Nenhuma matéria para hoje. Toque em ⋮ para planejar seus 7 dias.</span>
          </div>
        ) : (
          <div className="hero-active-subjects-list">
            {activeCycle.subjects.map((sub, idx) => (
              <span key={idx} className="hero-subject-pill" title={sub}>
                {sub}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section: 7-Days Strip */}
      <div className="days-strip-scroll">
        <div className="days-strip">
          {daysStrip.map((item, idx) => (
            <div
              key={idx}
              className={`day-cell ${item.isToday ? 'active-today' : ''}`}
            >
              <div className="day-cell-top">
                <span className="day-cell-weekday">{item.weekday}</span>
                <span className="day-cell-date">{item.dayDateStr}</span>
              </div>
              <div className="day-cell-pills">
                {item.subjects.length > 0 ? (
                  item.subjects.map((s, sIdx) => (
                    <span key={sIdx} className="cell-pill" title={s}>
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="cell-pill opacity-40">Vazio (⋮)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
