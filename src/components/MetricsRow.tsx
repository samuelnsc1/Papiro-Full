import React from 'react';
import { getDaysUntilExam, formatFullDateBR } from '../utils/formatters';
import { Clock, Calendar, FileText } from 'lucide-react';

interface MetricsRowProps {
  redCount: number;
  yellowCount: number;
  greenCount: number;
  examPublished?: boolean;
  examDate?: string;
  examDays?: number | null;
  onOpenExamConfig?: () => void;
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
  let displayValue: React.ReactNode = 0;
  let displayLabel = "";

  if (!isPublished) {
    displayValue = (
      <div className="flex justify-center items-center py-0.5">
        <Clock className="w-8 h-8 text-[var(--text-muted)] stroke-[1.75]" />
      </div>
    );
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
        title="Meta da Prova (para alterar, clique no lápis ao lado do seu nome no topo)"
      >
        <div className="counter-number">
          {displayValue}
        </div>
        <div className={`counter-label ${!isPublished ? 'font-bold text-[var(--text)]' : ''}`}>
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
