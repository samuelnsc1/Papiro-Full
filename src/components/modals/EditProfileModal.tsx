import React, { useState, useEffect } from 'react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentProject: string;
  onSave: (name: string, project: string) => Promise<void> | void;
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
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setProject(currentProject);
      setErrorMsg(null);
      setIsSaving(false);
    }
  }, [isOpen, currentName, currentProject]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim() || currentName || 'Concurseiro';
    const cleanProject = project.trim().toUpperCase() || currentProject || 'MEU PROJETO';

    setIsSaving(true);
    setErrorMsg(null);

    try {
      await onSave(cleanName, cleanProject);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err.message || "Erro ao salvar alterações.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[440px]">
        <div className="modal-header">
          <h3 className="modal-title">✏️ Personalizar Perfil & Concurso</h3>
          <button className="btn-close-modal" onClick={onClose} disabled={isSaving}>✕</button>
        </div>

        {errorMsg && (
          <div className="auth-alert-message error text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-3">
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

          <div className="form-field">
            <label htmlFor="inpEditProjectName">Nome do Concurso / Projeto</label>
            <input
              type="text"
              id="inpEditProjectName"
              placeholder="Ex: BORA TRT 3, PROJETO TJ-SP, etc."
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <button
            type="submit"
            className="btn-auth-submit mt-2"
            disabled={isSaving}
          >
            {isSaving ? "Salvando na nuvem..." : "Salvar Alterações"}
          </button>
        </form>
      </div>
    </div>
  );
};
