import React, { useState, useEffect } from 'react';
import { CycleDay } from '../../types';
import { SlidersHorizontal, Plus, Minus } from 'lucide-react';

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
    if (cycle && Array.isArray(cycle) && cycle.length > 0) {
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

  const handleChangeCycleLength = (newLength: number) => {
    if (newLength < 2 || newLength > 14) return;
    setLocalCycle((prev) => {
      if (newLength === prev.length) return prev;
      if (newLength < prev.length) {
        // Shrinking: keep days 1..newLength
        return prev.slice(0, newLength).map((item, idx) => ({
          ...item,
          day: idx + 1
        }));
      } else {
        // Expanding: keep existing days, append new empty days
        const expanded = [...prev];
        for (let i = prev.length + 1; i <= newLength; i++) {
          expanded.push({ day: i, subjects: [] });
        }
        return expanded;
      }
    });
  };

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
    const cleaned = localCycle.map((item, idx) => ({
      day: idx + 1,
      subjects: (item.subjects || []).filter(Boolean)
    }));
    onSaveCycle(cleaned);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-[520px]">
        <div className="modal-header">
          <h3 className="modal-title flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Configuração do Ciclo ({localCycle.length} Dias)</span>
          </h3>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        {/* 1. Duração do Ciclo de Estudos */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border)] p-3 rounded-xl mb-3">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div>
              <span className="text-xs font-extrabold text-[var(--text)] block">
                Duração do Ciclo de Estudos
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Quantos dias terá seu ciclo (ex: 4, 6 ou 7 dias)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] flex items-center justify-center hover:bg-[var(--surface-subtle)] disabled:opacity-30 cursor-pointer"
                onClick={() => handleChangeCycleLength(localCycle.length - 1)}
                disabled={localCycle.length <= 2}
                title="Diminuir 1 dia do ciclo"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] min-w-[58px] text-center">
                {localCycle.length} dias
              </span>
              <button
                type="button"
                className="w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] flex items-center justify-center hover:bg-[var(--surface-subtle)] disabled:opacity-30 cursor-pointer"
                onClick={() => handleChangeCycleLength(localCycle.length + 1)}
                disabled={localCycle.length >= 14}
                title="Aumentar 1 dia do ciclo"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Botões Rápidos de Preset */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border)]/60 flex-wrap">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-1">
              Atalhos:
            </span>
            {[3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleChangeCycleLength(num)}
                className={`text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all cursor-pointer ${
                  localCycle.length === num
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {num} dias
              </button>
            ))}
          </div>
        </div>

        {/* 2. Cadastrar Nova Matéria */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border)] p-3 rounded-xl mb-3">
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
              type="button"
              className="btn-auth-submit py-1 px-3 text-xs"
              onClick={handleAddNewSubject}
            >
              Adicionar
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-2">
          Selecione as matérias que você estudará em cada dia do seu ciclo:
        </p>

        {/* 3. Lista dos Dias do Ciclo */}
        <div className="flex flex-col gap-2.5 max-h-[45vh] overflow-y-auto pr-1">
          {localCycle.map((item, dayIdx) => {
            const currentSubs = item.subjects && item.subjects.length > 0 ? item.subjects : [""];

            return (
              <div
                key={dayIdx}
                className="bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <strong className="text-xs font-extrabold text-[var(--text)]">
                      Dia {item.day} {dayIdx === 0 ? '(Início / Hoje)' : ''}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="btn-add-topic py-1 px-2.5 text-[11px] font-bold"
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
                          type="button"
                          className="btn-topic-more w-6 h-6 text-xs text-red-500"
                          onClick={() => handleRemoveSubjectFromDay(dayIdx, subIdx)}
                          title="Remover matéria deste dia"
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

        <button type="button" className="btn-auth-submit mt-3" onClick={handleSave}>
          Salvar Ciclo de Estudos
        </button>
      </div>
    </div>
  );
};
