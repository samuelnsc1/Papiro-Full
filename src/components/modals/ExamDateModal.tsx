import React, { useState, useEffect } from 'react';
import { getDaysUntilExam, formatFullDateBR } from '../../utils/formatters';

interface ExamDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPublished: boolean;
  currentExamDate: string;
  currentExamDays: number | null;
  onSave: (published: boolean, examDate: string, examDays: number | null) => Promise<void> | void;
}

export const ExamDateModal: React.FC<ExamDateModalProps> = ({
  isOpen,
  onClose,
  currentPublished,
  currentExamDate,
  currentExamDays,
  onSave
}) => {
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [calcMode, setCalcMode] = useState<'calendar' | 'custom_days'>('calendar');
  const [examDate, setExamDate] = useState<string>('2027-02-17');
  const [customDays, setCustomDays] = useState<string>('120');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsPublished(currentPublished !== false);
      const initialDate = currentExamDate || '2027-02-17';
      setExamDate(initialDate);

      if (currentExamDays !== null && currentExamDays !== undefined) {
        setCalcMode('custom_days');
        setCustomDays(String(currentExamDays));
      } else {
        setCalcMode('calendar');
        setCustomDays(String(getDaysUntilExam(initialDate)));
      }
      setIsSaving(false);
      setErrorMsg(null);
    }
  }, [isOpen, currentPublished, currentExamDate, currentExamDays]);

  if (!isOpen) return null;

  const calculatedDays = getDaysUntilExam(examDate);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      if (!isPublished) {
        await onSave(false, examDate || '2027-02-17', null);
      } else if (calcMode === 'custom_days') {
        const daysNum = Math.max(0, parseInt(customDays, 10) || 0);
        await onSave(true, examDate, daysNum);
      } else {
        await onSave(true, examDate, null);
      }
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err.message || "Erro ao salvar configuração.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[480px]">
        <div className="modal-header">
          <h3 className="modal-title">📅 Configurar Data da Prova / Edital</h3>
          <button className="btn-close-modal" onClick={onClose} disabled={isSaving}>✕</button>
        </div>

        {errorMsg && (
          <div className="auth-alert-message error text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* 1. Situação do Edital */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
              Situação do Concurso
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                  isPublished
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-muted)]'
                }`}
                onClick={() => setIsPublished(true)}
              >
                <span className="text-lg">🎯</span>
                <span>Edital Publicado</span>
                <span className="text-[10px] font-normal opacity-80">(Com contagem de dias)</span>
              </button>

              <button
                type="button"
                className={`p-3 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                  !isPublished
                    ? 'border-[#ea580c] bg-[rgba(234,88,12,0.12)] text-[#ea580c] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-muted)]'
                }`}
                onClick={() => setIsPublished(false)}
              >
                <span className="text-lg">⏳</span>
                <span>Edital Não Publicado</span>
                <span className="text-[10px] font-normal opacity-80">(Sem data definida)</span>
              </button>
            </div>
          </div>

          {/* 2. Se publicado: escolher modo de cálculo */}
          {isPublished && (
            <div className="flex flex-col gap-3 p-3 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border)]">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    calcMode === 'calendar'
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                  onClick={() => setCalcMode('calendar')}
                >
                  📅 Por Data no Calendário
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    calcMode === 'custom_days'
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                  onClick={() => setCalcMode('custom_days')}
                >
                  🔢 Informar Dias Diretamente
                </button>
              </div>

              {calcMode === 'calendar' ? (
                <div className="form-field">
                  <label htmlFor="inpExamDate">Data da Prova</label>
                  <input
                    type="date"
                    id="inpExamDate"
                    className="inline-input w-full"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    disabled={isSaving}
                    required
                  />
                  <div className="text-xs font-semibold text-[var(--text-muted)] mt-1 flex justify-between">
                    <span>Data: {formatFullDateBR(examDate)}</span>
                    <span className="text-[var(--primary)] font-bold">{calculatedDays} dias até a prova</span>
                  </div>
                </div>
              ) : (
                <div className="form-field">
                  <label htmlFor="inpCustomDays">Quantidade Exata de Dias até a Prova</label>
                  <input
                    type="number"
                    id="inpCustomDays"
                    min="0"
                    max="999"
                    className="inline-input w-full"
                    placeholder="Ex: 90"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    disabled={isSaving}
                    required
                  />
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    Exibirá diretamente o valor digitado no painel da contagem regressiva.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Pré-visualização ao vivo */}
          <div className="flex flex-col gap-1 p-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Pré-visualização no Painel:
            </span>
            <div className="exam-countdown-box mt-1">
              {isPublished ? (
                <>
                  <div className="counter-number">
                    {calcMode === 'custom_days' ? (customDays || "0") : calculatedDays}
                  </div>
                  <div className="counter-label">
                    {calcMode === 'custom_days'
                      ? "Dias até a Prova"
                      : `Dias até a Prova (${formatFullDateBR(examDate)})`}
                  </div>
                </>
              ) : (
                <>
                  <div className="counter-number text-2xl">⏳</div>
                  <div className="counter-label text-sm font-extrabold text-[var(--text)]">
                    Edital ainda não publicado
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-actions mt-1">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-modal-save"
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Configuração"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
