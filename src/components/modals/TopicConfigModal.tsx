import React, { useState, useEffect } from 'react';
import { Topic } from '../../types';

interface TopicConfigModalProps {
  topic: Topic | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Topic>) => void;
  onDelete: (id: string) => void;
}

export const TopicConfigModal: React.FC<TopicConfigModalProps> = ({
  topic,
  onClose,
  onSave,
  onDelete
}) => {
  const [link, setLink] = useState('');
  const [obs, setObs] = useState('');
  const [yellow, setYellow] = useState(10);
  const [red, setRed] = useState(15);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (topic) {
      setLink(topic.link || '');
      setObs(topic.obs || '');
      setYellow(topic.green ?? (topic.yellow ?? 10));
      setRed(topic.yellow ?? (topic.red ?? 15));
      setConfirmDelete(false);
    }
  }, [topic]);

  if (!topic) return null;

  const handleSave = () => {
    const valGreen = Number(yellow) || 10;
    const valYellow = Number(red) || 15;
    onSave(topic.id, {
      link: link.trim(),
      obs: obs.trim(),
      green: valGreen,
      yellow: valYellow,
      red: valYellow
    });
    onClose();
  };

  const handleExecuteDelete = () => {
    onDelete(topic.id);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[480px]">
        <div className="modal-header">
          <h3 className="modal-title">Configurar Assunto</h3>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="text-sm font-extrabold text-[var(--text)]">{topic.title}</div>

        <div className="form-field">
          <label>Link de Questões (TEC Concursos ou Qconcursos)</label>
          <input
            type="url"
            placeholder="https://www.tecconcursos.com.br/... ou https://www.qconcursos.com/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Observação / Material de Apoio</label>
          <input
            type="text"
            placeholder="Ex: PDF Aula 02 ou bateria de questões"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-field">
            <label>Dias para Atenção (🟡)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={yellow}
              onChange={(e) => setYellow(parseInt(e.target.value, 10) || 10)}
            />
          </div>

          <div className="form-field">
            <label>Dias para Atraso (🔴)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={red}
              onChange={(e) => setRed(parseInt(e.target.value, 10) || 15)}
            />
          </div>
        </div>

        {confirmDelete ? (
          <div className="bg-[var(--status-red-bg)] border border-[var(--status-red-border)] p-3 rounded-lg text-center mt-2 flex flex-col gap-2">
            <span className="text-xs font-bold text-[var(--status-red-text)]">
              Tem certeza que deseja excluir definitivamente este assunto?
            </span>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                className="btn-auth-submit bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] py-1 px-3 text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-auth-submit bg-[#e11d48] text-white py-1 px-3 text-xs"
                onClick={handleExecuteDelete}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between gap-2 mt-2">
            <button className="btn-auth-submit flex-1" onClick={handleSave}>
              Salvar Alterações
            </button>
            <button
              type="button"
              className="btn-auth-submit bg-[#e11d48] hover:bg-[#be123c]"
              onClick={() => setConfirmDelete(true)}
            >
              Excluir Assunto
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
