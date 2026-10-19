import React from 'react';
import { getDaysUntilExam, formatFullDateBR } from '../utils/formatters';

interface MetricsRowProps {
  redCount: number;
  yellowCount: number;
  greenCount: number;
  examPublished?: boolean;
  examDate?: string;
  examDays?: number | null;
  onOpenExamConfig: () => void;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  redCount,
  yellowCount,
  greenCount,
  examPublished = true,
  examDate = "2027-02-17",
  examDays = null,
  onOpenExamConfig
}) => {
  const isPublished = examPublished !== false;
  let displayValue: string | number = 0;
  let displayLabel = "";

  if (!isPublished) {
    displayValue = "⏳";
    displayLabel = "Edital ainda não publicado";
  } else if (examDays !== null && examDays !== undefined) {
    displayValue = examDays;
    displayLabel = "Dias até a Prova";
  } else {
    displayValue = getDaysUntilExam(examDate);
    displayLabel = `Dias até a Prova (${formatFullDateBR(examDate)})`;
  }

  return (
    <div className="exam-metrics-row">
      <div
        className="exam-countdown-box cursor-pointer hover:shadow-md transition-all relative group"
        onClick={onOpenExamConfig}
        title="Clique para editar a data da prova ou marcar Edital Não Publicado"
      >
        <button
          type="button"
          className="absolute top-2 right-2 text-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] rounded-md px-1.5 py-0.5 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-bold"
          onClick={(e) => {
            e.stopPropagation();
            onOpenExamConfig();
          }}
        >
          <span>✏️</span>
          <span className="text-[10px]">Editar</span>
        </button>

        <div className={`counter-number ${!isPublished ? 'text-3xl' : ''}`}>
          {displayValue}
        </div>
        <div className={`counter-label ${!isPublished ? 'font-extrabold text-[var(--text)]' : ''}`}>
          {displayLabel}
        </div>
      </div>

      <div className="metrics-trio">
        <div className="metric-card red">
          <div className="val text-[var(--status-red-border)]">{redCount}</div>
          <div className="lbl">Atrasados</div>
        </div>
        <div className="metric-card yellow">
          <div className="val text-[var(--status-yellow-border)]">{yellowCount}</div>
          <div className="lbl">Atenção</div>
        </div>
        <div className="metric-card green">
          <div className="val text-[var(--status-green-border)]">{greenCount}</div>
          <div className="lbl">Em dia</div>
        </div>
      </div>
    </div>
  );
};
