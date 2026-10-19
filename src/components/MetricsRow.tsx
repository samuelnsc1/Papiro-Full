import React from 'react';
import { getDaysUntilExam } from '../utils/formatters';

interface MetricsRowProps {
  redCount: number;
  yellowCount: number;
  greenCount: number;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  redCount,
  yellowCount,
  greenCount
}) => {
  const daysUntilExam = getDaysUntilExam();

  return (
    <div className="exam-metrics-row">
      <div className="exam-countdown-box">
        <div className="counter-number">{daysUntilExam}</div>
        <div className="counter-label">Dias até a Prova (17/02/2027)</div>
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
