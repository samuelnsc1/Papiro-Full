import React, { useState, useEffect } from 'react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentProject: string;
  onSave: (name: string, project: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentProject,
  onSave
}) => {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setProject(currentProject);
    }
  }, [isOpen, currentName, currentProject]);

  if (!isOpen) return null;

  const handleSave = () => {
    const cleanName = name.trim();
    const cleanProject = project.trim();
    if (!cleanName || !cleanProject) {
      alert("Preencha o nome e o nome do concurso/projeto.");
      return;
    }
    onSave(cleanName, cleanProject.toUpperCase());
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[440px]">
        <div className="modal-header">
          <h3 className="modal-title">✏️ Personalizar Perfil & Concurso</h3>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="form-field">
          <label htmlFor="inpEditProfileName">Seu Nome Completo</label>
          <input
            type="text"
            id="inpEditProfileName"
            placeholder="Ex: Samuel"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="inpEditProjectName">Nome do Concurso / Projeto</label>
          <input
            type="text"
            id="inpEditProjectName"
            placeholder="Ex: PROJETO TRT 3, PROJETO TJ-SP, etc."
            value={project}
            onChange={(e) => setProject(e.target.value)}
          />
        </div>

        <button className="btn-auth-submit" onClick={handleSave}>
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};
