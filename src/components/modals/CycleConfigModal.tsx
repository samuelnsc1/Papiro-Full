import React, { useState, useEffect } from 'react';
import { CycleDay } from '../../types';

interface CycleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: CycleDay[];
  registeredSubjects: string[];
  onSaveCycle: (newCycle: CycleDay[]) => void;
  onRegisterSubject: (name: string) => void;
}

export const CycleConfigModal: React.FC<CycleConfigModalProps> = ({
  isOpen,
  onClose,
  cycle,
  registeredSubjects,
  onSaveCycle,
  onRegisterSubject
}) => {
  const [localCycle, setLocalCycle] = useState<CycleDay[]>([]);
  const [newSubName, setNewSubName] = useState('');

  useEffect(() => {
    if (cycle && cycle.length === 7) {
      setLocalCycle(JSON.parse(JSON.stringify(cycle)));
    } else {
      setLocalCycle([
        { day: 1, subjects: [] },
        { day: 2, subjects: [] },
        { day: 3, subjects: [] },
        { day: 4, subjects: [] },
        { day: 5, subjects: [] },
        { day: 6, subjects: [] },
        { day: 7, subjects: [] }
      ]);
    }
  }, [cycle, isOpen]);

  if (!isOpen) return null;

  const handleAddNewSubject = () => {
    const clean = newSubName.trim().toUpperCase();
    if (!clean) {
      alert("Digite o nome da matéria.");
      return;
    }
    if (registeredSubjects.includes(clean)) {
      alert("Esta matéria já está na lista.");
      return;
    }
    onRegisterSubject(clean);
    setNewSubName('');
    alert(`Matéria "${clean}" cadastrada!`);
  };

  const handleAddSubjectToDay = (dayIndex: number) => {
    setLocalCycle((prev) => {
      const copy = [...prev];
      if (!copy[dayIndex].subjects) copy[dayIndex].subjects = [];
      copy[dayIndex].subjects.push(registeredSubjects[0] || "");
      return copy;
    });
  };

  const handleRemoveSubjectFromDay = (dayIndex: number, subIndex: number) => {
    setLocalCycle((prev) => {
      const copy = [...prev];
      copy[dayIndex].subjects.splice(subIndex, 1);
      return copy;
    });
  };

  const handleSelectSubject = (dayIndex: number, subIndex: number, val: string) => {
    setLocalCycle((prev) => {
      const copy = [...prev];
      copy[dayIndex].subjects[subIndex] = val;
      return copy;
    });
  };

  const handleSave = () => {
    // Filter empty selections
    const cleaned = localCycle.map((item) => ({
      ...item,
      subjects: (item.subjects || []).filter(Boolean)
    }));
    onSaveCycle(cleaned);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">⚙️ Configuração do Ciclo de 7 Dias</h3>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        {/* Cadastrar Nova Matéria */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border)] p-3 rounded-lg">
          <label className="text-xs font-extrabold block mb-1">Cadastrar Nova Matéria</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="inline-input flex-1"
              placeholder="Ex: DIREITO ELEITORAL"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNewSubject();
              }}
            />
            <button
              className="btn-auth-submit py-1 px-3 text-xs"
              onClick={handleAddNewSubject}
            >
              Adicionar
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-1">
          Selecione as matérias que você estudará em cada dia da semana:
        </p>

        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {localCycle.map((item, dayIdx) => {
            const currentSubs = item.subjects && item.subjects.length > 0 ? item.subjects : [""];

            return (
              <div
                key={dayIdx}
                className="bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg p-2.5"
              >
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-xs">Dia {item.day}</strong>
                  <button
                    className="btn-add-topic py-1 px-2 text-xs"
                    onClick={() => handleAddSubjectToDay(dayIdx)}
                  >
                    + Matéria
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {currentSubs.map((subVal, subIdx) => (
                    <div key={subIdx} className="flex items-center gap-1.5">
                      <select
                        className="inline-input flex-1 text-xs"
                        value={subVal}
                        onChange={(e) => handleSelectSubject(dayIdx, subIdx, e.target.value)}
                      >
                        <option value="">-- Selecione uma Matéria --</option>
                        {registeredSubjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {subIdx > 0 && (
                        <button
                          className="btn-topic-more w-6 h-6 text-xs text-red-500"
                          onClick={() => handleRemoveSubjectFromDay(dayIdx, subIdx)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn-auth-submit mt-2" onClick={handleSave}>
          Salvar Ciclo de Estudos
        </button>
      </div>
    </div>
  );
};
