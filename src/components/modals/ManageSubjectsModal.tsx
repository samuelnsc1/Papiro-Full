import React from 'react';

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
  if (!isOpen) return null;

  const handleDelete = (sub: string) => {
    if (confirm(`Tem certeza que deseja apagar a matéria "${sub}" e TODOS os seus conteúdos?`)) {
      onDeleteSubject(sub);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[480px]">
        <div className="modal-header">
          <h3 className="modal-title">⚙️ Gerenciar e Excluir Matérias</h3>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Atenção: Ao excluir uma matéria, todos os seus conteúdos cadastrados também serão excluídos.
        </p>

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
                  className="btn-topic-more w-7 h-7 text-xs text-[#e11d48] hover:border-[#e11d48]"
                  onClick={() => handleDelete(sub)}
                  title="Excluir Matéria"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
