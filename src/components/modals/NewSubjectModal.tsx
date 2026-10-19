import React, { useState } from 'react';

interface NewSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (subject: string, firstTopic?: string) => void;
}

export const NewSubjectModal: React.FC<NewSubjectModalProps> = ({
  isOpen,
  onClose,
  onAddSubject
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [firstTopic, setFirstTopic] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const cleanSub = subjectName.trim().toUpperCase();
    if (!cleanSub) {
      alert("Digite o nome da matéria.");
      return;
    }
    // Only pass firstTopic if the user explicitly typed something! Do NOT auto-insert placeholder topics!
    const topicToAdd = firstTopic.trim() ? firstTopic.trim() : undefined;
    onAddSubject(cleanSub, topicToAdd);
    setSubjectName('');
    setFirstTopic('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[440px]">
        <div className="modal-header">
          <h3 className="modal-title">➕ Cadastrar Nova Matéria</h3>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="form-field">
          <label>Nome da Matéria</label>
          <input
            type="text"
            placeholder="Ex: DIREITO ELEITORAL"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            autoFocus
          />
        </div>

        <div className="form-field">
          <label>Primeiro Conteúdo / Bloco Inicial (Opcional)</label>
          <input
            type="text"
            placeholder="Deixe em branco se quiser adicionar depois"
            value={firstTopic}
            onChange={(e) => setFirstTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Opcional. Se deixar vazio, a matéria será criada limpa e vazia para você cadastrar seus tópicos quando quiser.
          </span>
        </div>

        <div className="modal-actions mt-2">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-modal-save"
            onClick={handleSave}
          >
            Cadastrar Matéria
          </button>
        </div>
      </div>
    </div>
  );
};
