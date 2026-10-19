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
  const [yellow, setYellow] = useState(30);
  const [red, setRed] = useState(40);

  useEffect(() => {
    if (topic) {
      setLink(topic.link || '');
      setObs(topic.obs || '');
      setYellow(topic.yellow || 30);
      setRed(topic.red || 40);
    }
  }, [topic]);

  if (!topic) return null;

  const handleSave = () => {
    onSave(topic.id, {
      link: link.trim(),
      obs: obs.trim(),
      yellow: Number(yellow) || 30,
      red: Number(red) || 40
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Deseja realmente excluir este assunto?")) {
      onDelete(topic.id);
      onClose();
    }
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
              onChange={(e) => setYellow(parseInt(e.target.value, 10) || 30)}
            />
          </div>

          <div className="form-field">
            <label>Dias para Atraso (🔴)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={red}
              onChange={(e) => setRed(parseInt(e.target.value, 10) || 40)}
            />
          </div>
        </div>

        <div className="flex justify-between gap-2 mt-2">
          <button className="btn-auth-submit flex-1" onClick={handleSave}>
            Salvar Alterações
          </button>
          <button
            className="btn-auth-submit bg-[#e11d48] hover:bg-[#be123c]"
            onClick={handleDelete}
          >
            Excluir Assunto
          </button>
        </div>
      </div>
    </div>
  );
};
