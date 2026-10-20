import React, { useState } from 'react';
import { Settings, Trash2 } from 'lucide-react';

interface ManageSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  onDeleteSubject: (subject: string) => void;
}

export const ManageSubjectsModal: React.FC<ManageSubjectsModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onDeleteSubject
}) => {
  const [subjectPendingDelete, setSubjectPendingDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmDelete = () => {
    if (subjectPendingDelete) {
      onDeleteSubject(subjectPendingDelete);
      setSubjectPendingDelete(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[480px]">
        <div className="modal-header">
          <h3 className="modal-title flex items-center gap-2">
            <Settings className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Gerenciar e Excluir Matérias</span>
          </h3>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Atenção: Ao excluir uma matéria, todos os seus conteúdos cadastrados também serão excluídos.
        </p>

        {subjectPendingDelete && (
          <div className="bg-[var(--status-red-bg)] border border-[var(--status-red-border)] p-3 rounded-lg text-center flex flex-col gap-2">
            <span className="text-xs font-bold text-[var(--status-red-text)]">
              Apagar a matéria "{subjectPendingDelete}" e TODOS os seus conteúdos associados?
            </span>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                className="btn-auth-submit bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] py-1 px-3 text-xs"
                onClick={() => setSubjectPendingDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-auth-submit bg-[#e11d48] text-white py-1 px-3 text-xs"
                onClick={handleConfirmDelete}
              >
                Sim, Excluir Matéria
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
          {subjects.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)] py-4 text-center">
              Nenhuma matéria cadastrada.
            </div>
          ) : (
            subjects.map((sub) => (
              <div
                key={sub}
                className="flex justify-between items-center bg-[var(--surface-subtle)] p-2 px-3 rounded-md border border-[var(--border)]"
              >
                <span className="text-xs font-extrabold">{sub}</span>
                <button
                  className="btn-topic-more w-7 h-7 text-xs text-[#e11d48] hover:border-[#e11d48] flex items-center justify-center"
                  onClick={() => setSubjectPendingDelete(sub)}
                  title="Excluir Matéria"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
