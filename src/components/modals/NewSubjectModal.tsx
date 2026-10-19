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
    onAddSubject(cleanSub, firstTopic.trim() || "Conteúdo Geral / Bloco 1");
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
          />
        </div>

        <div className="form-field">
          <label>Primeiro Conteúdo / Bloco Inicial (Opcional)</label>
          <input
            type="text"
            placeholder="Ex: Introdução e Princípios"
            value={firstTopic}
            onChange={(e) => setFirstTopic(e.target.value)}
          />
        </div>

        <button className="btn-auth-submit" onClick={handleSave}>
          Cadastrar Matéria
        </button>
      </div>
    </div>
  );
};
