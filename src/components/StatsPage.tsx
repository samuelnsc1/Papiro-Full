import React, { useState, useMemo } from 'react';
import { StudySession } from '../types';
import { formatDuration, getTodayString } from '../utils/formatters';
import { ArrowLeft, BarChart3, Calendar, Filter, BookOpen, Clock, PieChart, Sparkles } from 'lucide-react';

interface StatsPageProps {
  sessions: StudySession[];
  onBack: () => void;
}

// Distinct, high-contrast palette for subjects in charts and legends
const SUBJECT_PALETTE = [
  { bg: '#38bdf8', text: '#0284c7', border: '#0284c7', name: 'Azul Celeste' },
  { bg: '#34d399', text: '#059669', border: '#059669', name: 'Esmeralda' },
  { bg: '#a78bfa', text: '#7c3aed', border: '#7c3aed', name: 'Roxo' },
  { bg: '#fbbf24', text: '#d97706', border: '#d97706', name: 'Âmbar' },
  { bg: '#f472b6', text: '#db2777', border: '#db2777', name: 'Rosa' },
  { bg: '#60a5fa', text: '#2563eb', border: '#2563eb', name: 'Azul' },
  { bg: '#fb7185', text: '#e11d48', border: '#e11d48', name: 'Coral' },
  { bg: '#4ade80', text: '#16a34a', border: '#16a34a', name: 'Verde' },
  { bg: '#818cf8', text: '#4f46e5', border: '#4f46e5', name: 'Índigo' },
  { bg: '#2dd4bf', text: '#0d9488', border: '#0d9488', name: 'Turquesa' },
  { bg: '#f97316', text: '#ea580c', border: '#ea580c', name: 'Laranja' }
];

export const StatsPage: React.FC<StatsPageProps> = ({ sessions, onBack }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customResult, setCustomResult] = useState<{
    totalSec: number;
    subjects: { subject: string; seconds: number; percent: number }[];
  } | null>(null);

  const todayStr = getTodayString();
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  // 1. Top KPI Summary Cards Calculation
  let todaySec = 0;
  let last15Sec = 0;
  let monthSec = 0;
  let totalSec = 0;

  sessions.forEach((item) => {
    if (!item?.study_date) return;
    const parts = item.study_date.split('-');
    if (parts.length < 3) return;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m - 1, d);
    const diff = Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));

    const s = Number(item.seconds) || 0;
    totalSec += s;
    if (item.study_date === todayStr) todaySec += s;
    if (diff >= 0 && diff <= 15) last15Sec += s;
    if (dt.getMonth() === curMonth && dt.getFullYear() === curYear) monthSec += s;
  });

  // 2. Stable Subject Color Map
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, typeof SUBJECT_PALETTE[0]>();
    const uniqueSubs = new Set<string>();
    (sessions || []).forEach((s) => {
      if (s?.subject && !s.subject.startsWith('__')) {
        uniqueSubs.add(s.subject.trim().toUpperCase());
      }
    });

    Array.from(uniqueSubs).forEach((sub, idx) => {
      map.set(sub, SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length]);
    });
    return map;
  }, [sessions]);

  // 3. Current Calendar Week (Monday to Sunday)
  const currentDayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, ..., Sunday = 6
  const mondayCurrentWeek = new Date(now);
  mondayCurrentWeek.setDate(now.getDate() - currentDayOfWeek);
  mondayCurrentWeek.setHours(0, 0, 0, 0);

  // Default selected day in the chart to today (0 to 6)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(currentDayOfWeek);

  // 4. Aggregate each day of the current week with subject breakdowns
  const weekData = useMemo(() => {
    const daysAbbr = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const daysFullName = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const colDate = new Date(mondayCurrentWeek);
      colDate.setDate(mondayCurrentWeek.getDate() + i);
      const dateStr = `${colDate.getFullYear()}-${String(colDate.getMonth() + 1).padStart(2, '0')}-${String(colDate.getDate()).padStart(2, '0')}`;
      const dayDateStr = `${String(colDate.getDate()).padStart(2, '0')}/${String(colDate.getMonth() + 1).padStart(2, '0')}`;
      const isToday = colDate.toDateString() === now.toDateString();

      // Find sessions strictly belonging to this calendar date
      const daySessions = sessions.filter((s) => s?.study_date === dateStr);

      // Aggregate time per subject for this day
      const subMap = new Map<string, number>();
      let dayTotal = 0;
      daySessions.forEach((s) => {
        const sec = Number(s.seconds) || 0;
        if (sec > 0) {
          const subName = (s.subject || 'GERAL').trim().toUpperCase();
          subMap.set(subName, (subMap.get(subName) || 0) + sec);
          dayTotal += sec;
        }
      });

      // Prepare subject slices with percentages and colors
      const slices = Array.from(subMap.entries()).map(([sub, sec]) => {
        const percent = dayTotal > 0 ? (sec / dayTotal) * 100 : 0;
        const color = subjectColorMap.get(sub) || SUBJECT_PALETTE[0];
        return {
          subject: sub,
          seconds: sec,
          percent,
          color
        };
      });

      return {
        index: i,
        name: daysAbbr[i],
        fullName: daysFullName[i],
        dateStr,
        dayDateStr,
        isToday,
        totalSeconds: dayTotal,
        slices
      };
    });
  }, [sessions, mondayCurrentWeek, now, subjectColorMap]);

  // Max seconds for chart scaling
  const maxWeekDaySec = useMemo(() => {
    const highest = Math.max(...weekData.map((d) => d.totalSeconds), 0);
    return Math.max(highest, 3600); // Minimum 1h scale
  }, [weekData]);

  // 5. Weekly Subject Totals for the whole week
  const weeklySubjectSummary = useMemo(() => {
    const map = new Map<string, number>();
    let grandTotal = 0;

    weekData.forEach((day) => {
      day.slices.forEach((slice) => {
        map.set(slice.subject, (map.get(slice.subject) || 0) + slice.seconds);
        grandTotal += slice.seconds;
      });
    });

    const list = Array.from(map.entries()).map(([subject, sec]) => {
      const percent = grandTotal > 0 ? Math.round((sec / grandTotal) * 100) : 0;
      const color = subjectColorMap.get(subject) || SUBJECT_PALETTE[0];
      return {
        subject,
        seconds: sec,
        percent,
        color
      };
    });

    list.sort((a, b) => b.seconds - a.seconds);
    return { list, grandTotal };
  }, [weekData, subjectColorMap]);

  // Selected Day in the chart
  const selectedDay = weekData[selectedDayIdx] || weekData[0];

  // 6. Custom Period Filter with subject breakdown
  const handleFilter = () => {
    if (!startDate || !endDate) {
      alert("Selecione ambas as datas para consultar.");
      return;
    }

    const filtered = sessions.filter((s) => s.study_date >= startDate && s.study_date <= endDate);
    let sum = 0;
    const subMap = new Map<string, number>();

    filtered.forEach((s) => {
      const sec = Number(s.seconds) || 0;
      if (sec > 0) {
        sum += sec;
        const subName = (s.subject || 'GERAL').trim().toUpperCase();
        subMap.set(subName, (subMap.get(subName) || 0) + sec);
      }
    });

    const subjectsList = Array.from(subMap.entries()).map(([sub, sec]) => {
      const percent = sum > 0 ? Math.round((sec / sum) * 100) : 0;
      return { subject: sub, seconds: sec, percent };
    });
    subjectsList.sort((a, b) => b.seconds - a.seconds);

    setCustomResult({
      totalSec: sum,
      subjects: subjectsList
    });
  };

  return (
    <div className="stats-page-container">
      {/* Top Navbar */}
      <div className="stats-navbar">
        <button className="btn-back-dashboard flex items-center gap-1.5" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Ciclo de Estudos</span>
        </button>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-500" />
          <h2 className="text-lg font-bold tracking-tight">RELATÓRIO DE ESTATÍSTICAS</h2>
        </div>
        <div />
      </div>

      {/* 1. Hero KPI Cards */}
      <div className="stats-cards-grid">
        <div className="stat-hero-card">
          <div className="val">{formatDuration(todaySec)}</div>
          <div className="lbl">Estudado Hoje</div>
        </div>
        <div className="stat-hero-card">
          <div className="val">{formatDuration(last15Sec)}</div>
          <div className="lbl">Últimos 15 Dias</div>
        </div>
        <div className="stat-hero-card">
          <div className="val">{formatDuration(monthSec)}</div>
          <div className="lbl">Total no Mês</div>
        </div>
        <div className="stat-hero-card">
          <div className="val">{formatDuration(totalSec)}</div>
          <div className="lbl">Total Acumulado</div>
        </div>
      </div>

      {/* 2. Gráfico Semanal com Barras Divididas por Matéria (Segmented Bar Chart) */}
      <div className="chart-box-large">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 pb-2 border-b border-[var(--border)]">
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-1.5 text-[var(--text)]">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>Tempo Estudado na Semana Atual</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Barras divididas proporcionalmente pelas matérias estudadas em cada dia. Clique em um dia para ver o detalhamento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/30">
              Total Semana: {formatDuration(weeklySubjectSummary.grandTotal)}
            </span>
          </div>
        </div>

        {/* Chart Column Canvas */}
        <div className="stats-chart-columns !h-48 relative">
          {weekData.map((day) => {
            const isSelected = selectedDayIdx === day.index;
            const hPercent = day.totalSeconds > 0
              ? Math.max(10, Math.min(100, Math.round((day.totalSeconds / maxWeekDaySec) * 100)))
              : 4;

            return (
              <div
                key={day.name}
                className={`chart-col cursor-pointer transition-all select-none group ${
                  isSelected ? 'scale-[1.03]' : 'hover:opacity-95'
                }`}
                onClick={() => setSelectedDayIdx(day.index)}
                title={`${day.fullName} (${day.dayDateStr}): ${formatDuration(day.totalSeconds)} estudados. Clique para detalhar.`}
              >
                {/* Time Label on top of bar */}
                <div
                  className={`chart-val text-[11px] font-extrabold truncate px-1 py-0.5 rounded transition-all ${
                    isSelected
                      ? 'text-sky-400 bg-sky-500/15'
                      : day.totalSeconds > 0
                      ? 'text-[var(--text)]'
                      : 'text-transparent'
                  }`}
                >
                  {day.totalSeconds > 0 ? formatDuration(day.totalSeconds) : '--'}
                </div>

                {/* Segmented Stacked Bar */}
                <div
                  className={`w-full max-w-[48px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all border ${
                    isSelected
                      ? 'ring-2 ring-sky-400 border-sky-400 shadow-md shadow-sky-500/20'
                      : day.totalSeconds > 0
                      ? 'border-transparent group-hover:border-sky-400/40'
                      : 'border-[var(--border)] bg-[var(--surface-subtle)]/40'
                  }`}
                  style={{ height: `${hPercent}%` }}
                >
                  {day.totalSeconds > 0 ? (
                    day.slices.map((slice, sIdx) => (
                      <div
                        key={sIdx}
                        className="w-full transition-all relative border-t border-black/10 first:border-t-0"
                        style={{
                          height: `${Math.max(4, slice.percent)}%`,
                          backgroundColor: slice.color.bg
                        }}
                        title={`${slice.subject}: ${formatDuration(slice.seconds)} (${Math.round(slice.percent)}%)`}
                      />
                    ))
                  ) : (
                    <div className="w-full h-full bg-[var(--border)]/30" />
                  )}
                </div>

                {/* Day Label & Date */}
                <div className="text-center mt-1">
                  <div
                    className={`text-xs font-black transition-colors ${
                      isSelected
                        ? 'text-sky-400'
                        : day.isToday
                        ? 'text-sky-400 font-extrabold underline'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {day.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-dim)] font-semibold">
                    {day.dayDateStr}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Detalhamento Interativo do Dia Selecionado */}
        {selectedDay && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] shadow-xs animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[var(--border)]/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <h4 className="text-sm font-extrabold text-[var(--text)]">
                  {selectedDay.fullName} ({selectedDay.dayDateStr})
                </h4>
                {selectedDay.isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    Hoje
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Tempo total no dia: <strong>{formatDuration(selectedDay.totalSeconds)}</strong></span>
              </div>
            </div>

            {selectedDay.slices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {selectedDay.slices.map((slice, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between gap-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: slice.color.bg }}
                        />
                        <span className="text-xs font-bold text-[var(--text)] truncate">
                          {slice.subject}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[var(--text)] flex-shrink-0">
                        {formatDuration(slice.seconds)}
                      </span>
                    </div>

                    {/* Progress representation */}
                    <div className="w-full bg-[var(--surface-subtle)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round(slice.percent)}%`,
                          backgroundColor: slice.color.bg
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-semibold">
                      <span>Proporção do dia:</span>
                      <span>{Math.round(slice.percent)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[var(--text-muted)] italic py-1 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 opacity-60" />
                <span>Nenhum estudo registrado neste dia. Clique em outro dia da semana acima para ver o detalhamento.</span>
              </div>
            )}
          </div>
        )}

        {/* 4. Resumo de Matérias da Semana com Legenda e Barras */}
        {weeklySubjectSummary.list.length > 0 && (
          <div className="pt-3 border-t border-[var(--border)]">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-2.5 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-sky-400" />
              <span>Distribuição Total por Matéria na Semana</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {weeklySubjectSummary.list.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-[var(--surface-subtle)]/70 border border-[var(--border)] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color.bg }}
                    />
                    <span className="text-[11px] font-bold text-[var(--text)] truncate">
                      {item.subject}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-[var(--text)] block leading-tight">
                      {formatDuration(item.seconds)}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold">
                      {item.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Consulta por Período Personalizado com Detalhamento por Matéria */}
      <div className="chart-box-large">
        <h3 className="text-sm font-bold flex items-center gap-1.5 mb-1">
          <Filter className="w-4 h-4 text-sky-500" />
          <span>Consulta por Período Personalizado</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Selecione o intervalo de datas para ver o tempo total e a divisão completa de horas por disciplina.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="form-field">
            <label className="text-xs font-semibold">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="text-xs font-semibold">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="btn-auth-submit py-2 px-5 text-xs font-semibold cursor-pointer"
            onClick={handleFilter}
          >
            Filtrar Período
          </button>
        </div>

        {customResult ? (
          <div className="mt-3 p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/70">
              <span className="text-xs font-bold text-[var(--text)]">
                Período: {startDate} até {endDate}
              </span>
              <span className="text-xs font-black text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/30">
                Total: {formatDuration(customResult.totalSec)}
              </span>
            </div>

            {customResult.subjects.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  Divisão por Matéria no Período:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {customResult.subjects.map((sub, sIdx) => {
                    const color = subjectColorMap.get(sub.subject) || SUBJECT_PALETTE[sIdx % SUBJECT_PALETTE.length];
                    return (
                      <div
                        key={sIdx}
                        className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color.bg }}
                          />
                          <span className="text-xs font-bold text-[var(--text)] truncate">
                            {sub.subject}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-[var(--text)] block leading-tight">
                            {formatDuration(sub.seconds)}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] font-bold">
                            {sub.percent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-muted)] italic">
                Nenhum estudo registrado neste período selecionado.
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm font-semibold text-[var(--text-muted)] mt-3 p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
            Selecione as datas para consultar seu rendimento detalhado por matéria.
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
