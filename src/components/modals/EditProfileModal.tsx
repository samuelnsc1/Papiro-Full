import React, { useState, useEffect } from 'react';
import { getDaysUntilExam, formatFullDateBR } from '../../utils/formatters';
import { Pencil, Calendar, Clock, FileText } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentProject: string;
  currentPublished?: boolean;
  currentExamDate?: string;
  currentExamDays?: number | null;
  onSave: (
    name: string,
    project: string,
    examPublished: boolean,
    examDate: string,
    examDays: number | null
  ) => Promise<void> | void;
  onOpenEdital?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentProject,
  currentPublished = true,
  currentExamDate = "2027-02-17",
  currentExamDays = null,
  onSave,
  onOpenEdital
}) => {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [inputMode, setInputMode] = useState<'days' | 'date'>('date');
  const [examDate, setExamDate] = useState('2027-02-17');
  const [daysCount, setDaysCount] = useState<number>(120);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setProject(currentProject);
      setIsPublished(currentPublished !== false);
      const initialDate = currentExamDate || '2027-02-17';
      setExamDate(initialDate);

      if (currentExamDays !== null && currentExamDays !== undefined) {
        setInputMode('days');
        setDaysCount(currentExamDays);
      } else {
        setInputMode('date');
        setDaysCount(getDaysUntilExam(initialDate));
      }

      setErrorMsg(null);
      setIsSaving(false);
    }
  }, [isOpen, currentName, currentProject, currentPublished, currentExamDate, currentExamDays]);

  if (!isOpen) return null;

  const handleDateChange = (newDate: string) => {
    setExamDate(newDate);
    const calculated = getDaysUntilExam(newDate);
    setDaysCount(calculated);
  };

  const handleDaysChange = (newDays: number) => {
    const val = Math.max(0, Math.min(9999, newDays));
    setDaysCount(val);
    const target = new Date();
    target.setDate(target.getDate() + val);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setExamDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim() || currentName || 'Concurseiro';
    const cleanProject = project.trim().toUpperCase() || currentProject || 'MEU PROJETO';

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const finalDays = inputMode === 'days' ? daysCount : null;
      await onSave(cleanName, cleanProject, isPublished, examDate, finalDays);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err.message || "Erro ao salvar alterações.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[500px]">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
              <Pencil className="w-3.5 h-3.5" />
            </div>
            <h3 className="modal-title">Perfil, Concurso & Prova</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose} disabled={isSaving}>✕</button>
        </div>

        {errorMsg && (
          <div className="auth-alert-message error text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* 1. Nome do Usuário */}
          <div className="form-field">
            <label htmlFor="inpEditProfileName">Seu Nome Completo</label>
            <input
              type="text"
              id="inpEditProfileName"
              placeholder="Ex: Samuel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* 2. Nome do Projeto / Concurso */}
          <div className="form-field">
            <label htmlFor="inpEditProjectName">Nome do Concurso / Projeto</label>
            <input
              type="text"
              id="inpEditProjectName"
              placeholder="Ex: BORA TRT 3, PREFEITURA DE LAGOA SANTA, etc."
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Link para Edital */}
          {onOpenEdital && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-semibold text-[var(--text)]">Documento do Edital</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdital();
                }}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
              >
                Gerenciar Edital →
              </button>
            </div>
          )}

          {/* 3. Situação do Edital */}
          <div className="border-t border-[var(--border)] pt-3">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
              Situação do Edital da Prova
            </label>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  isPublished
                    ? 'bg-slate-800 text-white border-slate-700 shadow-sm dark:bg-slate-700 dark:border-slate-600'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface)]'
                }`}
                onClick={() => setIsPublished(true)}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Edital Publicado</span>
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  !isPublished
                    ? 'bg-slate-800 text-white border-slate-700 shadow-sm dark:bg-slate-700 dark:border-slate-600'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface)]'
                }`}
                onClick={() => setIsPublished(false)}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Edital Não Publicado</span>
              </button>
            </div>

            {!isPublished ? (
              <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)] text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>O card exibirá <strong>"Edital ainda não publicado"</strong> até que uma data de prova seja definida.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Modo de definição:</span>
                  <div className="inline-flex rounded-md border border-[var(--border)] p-0.5 bg-[var(--surface)]">
                    <button
                      type="button"
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${inputMode === 'date' ? 'bg-slate-700 text-white' : 'text-[var(--text-muted)]'}`}
                      onClick={() => setInputMode('date')}
                    >
                      Por Data
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${inputMode === 'days' ? 'bg-slate-700 text-white' : 'text-[var(--text-muted)]'}`}
                      onClick={() => setInputMode('days')}
                    >
                      Por Dias
                    </button>
                  </div>
                </div>

                {inputMode === 'date' ? (
                  <div className="form-field mb-0">
                    <label htmlFor="inpExamDate">Data da Prova</label>
                    <input
                      type="date"
                      id="inpExamDate"
                      value={examDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                    />
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                      Faltam <strong>{getDaysUntilExam(examDate)} dias</strong> até a prova ({formatFullDateBR(examDate)}).
                    </div>
                  </div>
                ) : (
                  <div className="form-field mb-0">
                    <label htmlFor="inpExamDays">Quantidade de Dias até a Prova</label>
                    <input
                      type="number"
                      id="inpExamDays"
                      min="0"
                      max="9999"
                      value={daysCount}
                      onChange={(e) => handleDaysChange(parseInt(e.target.value) || 0)}
                    />
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                      Equivale a aproximadamente: <strong>{formatFullDateBR(examDate)}</strong>.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-auth-submit mt-2"
            disabled={isSaving}
          >
            {isSaving ? "Salvando configurações..." : "Salvar Alterações"}
          </button>
        </form>
      </div>
    </div>
  );
};
