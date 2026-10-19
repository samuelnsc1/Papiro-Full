import React, { useState } from 'react';
import { StudySession } from '../types';
import { formatDuration, getTodayString } from '../utils/formatters';

interface StatsPageProps {
  sessions: StudySession[];
  onBack: () => void;
}

export const StatsPage: React.FC<StatsPageProps> = ({ sessions, onBack }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customResult, setCustomResult] = useState<string | null>(null);

  const todayStr = getTodayString();
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  let todaySec = 0;
  let last15Sec = 0;
  let monthSec = 0;
  let totalSec = 0;

  sessions.forEach((item) => {
    if (!item.study_date) return;
    const parts = item.study_date.split('-');
    if (parts.length < 3) return;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m - 1, d);
    const diff = Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));

    totalSec += item.seconds || 0;
    if (item.study_date === todayStr) todaySec += item.seconds || 0;
    if (diff >= 0 && diff <= 15) last15Sec += item.seconds || 0;
    if (dt.getMonth() === curMonth && dt.getFullYear() === curYear) monthSec += item.seconds || 0;
  });

  // Weekly chart data (Monday to Sunday)
  const daysAbbr = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const daySeconds = [0, 0, 0, 0, 0, 0, 0];

  sessions.forEach((item) => {
    if (!item.study_date) return;
    const parts = item.study_date.split('-');
    if (parts.length < 3) return;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m - 1, d);
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      // getDay: 0 is Sun, 1 is Mon... convert so Mon is 0, Sun is 6
      const idx = (date.getDay() + 6) % 7;
      daySeconds[idx] += item.seconds || 0;
    }
  });

  const maxSec = Math.max(...daySeconds, 3600);

  const handleFilter = () => {
    if (!startDate || !endDate) {
      alert("Selecione ambas as datas.");
      return;
    }

    const filtered = sessions.filter((s) => s.study_date >= startDate && s.study_date <= endDate);
    const sum = filtered.reduce((acc, curr) => acc + (curr.seconds || 0), 0);
    setCustomResult(`Total no período (${startDate} até ${endDate}): ${formatDuration(sum)} estudados.`);
  };

  return (
    <div className="stats-page-container">
      <div className="stats-navbar">
        <button className="btn-back-dashboard" onClick={onBack}>
          <span>←</span> <span>Voltar ao Ciclo de Estudos</span>
        </button>
        <h2 className="text-xl font-black">RELATÓRIO DE ESTATÍSTICAS</h2>
        <div />
      </div>

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

      <div className="chart-box-large">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-extrabold">Tempo Estudado na Semana Atual</h3>
          <span className="text-xs text-[var(--text-muted)] font-bold">Segunda a Domingo</span>
        </div>
        <div className="stats-chart-columns">
          {daysAbbr.map((name, idx) => {
            const s = daySeconds[idx];
            const hPercent = Math.min(100, Math.round((s / maxSec) * 100));
            return (
              <div key={name} className="chart-col">
                <div className="chart-val">{s > 0 ? formatDuration(s) : ''}</div>
                <div className="chart-bar" style={{ height: `${Math.max(6, hPercent)}%` }} />
                <div className="chart-label">{name}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chart-box-large">
        <h3 className="text-base font-extrabold">Consulta por Período Personalizado</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="form-field">
            <label>Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="btn-auth-submit py-2 px-5"
            onClick={handleFilter}
          >
            Filtrar Período
          </button>
        </div>
        <div className="text-base font-extrabold text-[var(--primary)] mt-2">
          {customResult || "Selecione as datas para consultar seu rendimento."}
        </div>
      </div>
    </div>
  );
};
