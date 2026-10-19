import React from 'react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[400px] text-center">
        <div className="text-3xl mb-1">🚪</div>
        <h3 className="text-lg font-black text-[var(--text)]">Deseja realmente sair?</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Sua sessão atual será encerrada. Você precisará informar seu e-mail e senha para acessar novamente.
        </p>

        <div className="flex gap-2 justify-center mt-3">
          <button
            type="button"
            className="btn-auth-submit bg-[var(--surface-subtle)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] flex-1 text-xs py-2"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-auth-submit bg-[#e11d48] hover:bg-[#be123c] text-white flex-1 text-xs py-2"
            onClick={onConfirm}
          >
            Sim, Sair
          </button>
        </div>
      </div>
    </div>
  );
};
