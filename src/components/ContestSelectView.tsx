import React, { useState } from 'react';
import { ContestWorkspace, UserProfile } from '../types';
import { getDaysUntilExam, formatFullDateBR } from '../utils/formatters';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Pause,
  Play,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Sun,
  Moon,
  LogOut,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface ContestSelectViewProps {
  user: UserProfile;
  contests: ContestWorkspace[];
  activeContestId: string | null;
  onSelectContest: (contestId: string) => void;
  onCreateContest: (
    name: string,
    examPublished: boolean,
    examDate: string,
    templateType: 'blank' | 'trt3'
  ) => void;
  onToggleStandby: (contestId: string) => void;
  onRenameContest: (contestId: string, newName: string) => void;
  onDeleteContest: (contestId: string) => void;
  isDark: boolean;
  onToggleTheme: (dark: boolean) => void;
  onLogout: () => void;
}

export const ContestSelectView: React.FC<ContestSelectViewProps> = ({
  user,
  contests,
  activeContestId,
  onSelectContest,
  onCreateContest,
  onToggleStandby,
  onRenameContest,
  onDeleteContest,
  isDark,
  onToggleTheme,
  onLogout
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'standby'>('all');

  // Modals inside selection view
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newContestName, setNewContestName] = useState('');
  const [newExamPublished, setNewExamPublished] = useState(true);
  const [newExamDate, setNewExamDate] = useState('2027-02-17');
  const [newTemplateType, setNewTemplateType] = useState<'blank' | 'trt3'>('blank');

  // Rename modal
  const [renamingContest, setRenamingContest] = useState<ContestWorkspace | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Delete modal
  const [deletingContest, setDeletingContest] = useState<ContestWorkspace | null>(null);

  const filteredContests = contests.filter((c) => {
    if (filter === 'active') return !c.is_standby;
    if (filter === 'standby') return Boolean(c.is_standby);
    return true;
  });

  const activeCount = contests.filter((c) => !c.is_standby).length;
  const standbyCount = contests.filter((c) => c.is_standby).length;

  const handleOpenCreate = () => {
    setNewContestName('');
    setNewExamPublished(true);
    setNewExamDate('2027-02-17');
    setNewTemplateType('blank');
    setIsCreateOpen(true);
  };

  const handleConfirmCreate = () => {
    const clean = newContestName.trim();
    if (!clean) {
      alert('Digite o nome ou sigla do concurso (ex: TRT-3, INSS, TJSP).');
      return;
    }
    onCreateContest(clean, newExamPublished, newExamDate, newTemplateType);
    setIsCreateOpen(false);
  };

  const handleOpenRename = (c: ContestWorkspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingContest(c);
    setRenameInput(c.name);
  };

  const handleConfirmRename = () => {
    if (!renamingContest) return;
    const clean = renameInput.trim();
    if (!clean) {
      alert('O nome do concurso não pode ficar vazio.');
      return;
    }
    onRenameContest(renamingContest.id, clean);
    setRenamingContest(null);
  };

  const handleOpenDelete = (c: ContestWorkspace, e: React.MouseEvent) => {
    e.stopPropagation();
    if (contests.length <= 1) {
      alert('Você precisa manter pelo menos um concurso cadastrado.');
      return;
    }
    setDeletingContest(c);
  };

  const handleConfirmDelete = () => {
    if (!deletingContest) return;
    onDeleteContest(deletingContest.id);
    setDeletingContest(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="border-b border-[var(--border)] bg-[var(--surface)] px-4 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center text-sky-500 font-extrabold shadow-sm">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block leading-tight">
                PAPIRO FULL
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                Workspaces de Concursos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-muted)] pr-2 border-r border-[var(--border)]">
              <span className="font-semibold text-[var(--text)]">{user.name || 'Concurseiro'}</span>
              <span>•</span>
              <span>{user.email}</span>
            </div>

            <label className="theme-switch" title="Alternar tema Claro/Escuro">
              <input
                type="checkbox"
                checked={isDark}
                onChange={(e) => onToggleTheme(e.target.checked)}
              />
              <span className="theme-slider">
                <span className="theme-icon flex items-center justify-center">
                  <Sun className="w-3 h-3 text-amber-500" />
                </span>
                <span className="theme-icon flex items-center justify-center">
                  <Moon className="w-3 h-3 text-indigo-400" />
                </span>
              </span>
            </label>

            <button
              type="button"
              className="btn-logout flex items-center gap-1.5"
              onClick={onLogout}
              title="Sair da conta"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8 md:py-12">
        {/* Hero Title Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-500 uppercase tracking-wider mb-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Painel de Concursos</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text)] tracking-tight">
              Escolha seu Concurso
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
              Cada concurso possui seu próprio edital verticalizado, ciclo de estudos de até 7 dias, cronômetro e histórico de revisões de forma 100% independente.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-study-action !bg-[var(--primary)] !text-white !border-transparent hover:!opacity-95 shadow-md flex items-center gap-2 self-start md:self-auto py-2 px-4 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Concurso</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6 border-b border-[var(--border)] pb-3">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-[var(--surface-subtle)] text-[var(--text)] border border-[var(--border)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Todos ({contests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all ${
              filter === 'active'
                ? 'bg-[var(--surface-subtle)] text-[var(--text)] border border-[var(--border)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Ativos ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('standby')}
            className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all ${
              filter === 'standby'
                ? 'bg-[var(--surface-subtle)] text-[var(--text)] border border-[var(--border)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Em Standby ({standbyCount})
          </button>
        </div>

        {/* Contest Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredContests.map((c) => {
            const isStandby = Boolean(c.is_standby);
            const topicCount = c.topics?.length || 0;
            const completedCount = c.topics?.filter((t) => t.completed).length || 0;
            const percent = topicCount > 0 ? Math.round((completedCount / topicCount) * 100) : 0;
            const subjectsCount = c.registered_subjects?.length || 0;

            // Exam countdown calculation
            let examLabel = '';
            if (c.exam_published === false) {
              examLabel = 'Edital não publicado';
            } else if (c.exam_days !== null && c.exam_days !== undefined) {
              examLabel = `${c.exam_days} dias até a prova`;
            } else if (c.exam_date) {
              const days = getDaysUntilExam(c.exam_date);
              examLabel = `${days} dias (${formatFullDateBR(c.exam_date)})`;
            } else {
              examLabel = 'Data não definida';
            }

            return (
              <div
                key={c.id}
                onClick={() => onSelectContest(c.id)}
                className={`group relative bg-[var(--surface)] border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between ${
                  isStandby
                    ? 'border-[var(--border)] opacity-75 hover:opacity-100 bg-[var(--surface-subtle)]/50'
                    : 'border-[var(--border)] hover:border-sky-500/50'
                }`}
              >
                <div>
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <h3 className="font-extrabold text-base md:text-lg text-[var(--text)] tracking-tight truncate group-hover:text-sky-500 transition-colors">
                          {c.name}
                        </h3>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 opacity-60" />
                        {examLabel}
                      </span>
                    </div>

                    {isStandby ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold py-0.5 px-2 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Pause className="w-2.5 h-2.5" />
                        <span>Standby</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold py-0.5 px-2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Ativo</span>
                      </span>
                    )}
                  </div>

                  {/* Metrics & Progress */}
                  <div className="space-y-3 my-4">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                      <span>Progresso do Edital</span>
                      <span className="font-bold text-[var(--text)]">
                        {percent}% ({completedCount}/{topicCount})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border)]/40">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 opacity-60" />
                        <strong>{subjectsCount}</strong> matérias
                      </span>
                      <span>•</span>
                      <span>
                        <strong>{topicCount}</strong> conteúdos
                      </span>
                      <span>•</span>
                      <span>
                        <strong>{c.study_sessions?.length || 0}</strong> sessões
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row / Actions */}
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStandby(c.id);
                      }}
                      className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-subtle)] transition-colors text-[11px] font-semibold flex items-center gap-1"
                      title={isStandby ? 'Reativar este concurso' : 'Colocar este concurso em standby'}
                    >
                      {isStandby ? (
                        <>
                          <Play className="w-3 h-3 text-emerald-500" />
                          <span className="hidden sm:inline">Reativar</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 text-amber-500" />
                          <span className="hidden sm:inline">Pausar</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenRename(c, e)}
                      className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-subtle)] transition-colors"
                      title="Renomear concurso"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    {contests.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenDelete(c, e)}
                        className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 transition-colors"
                        title="Excluir concurso"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-500 group-hover:translate-x-0.5 transition-transform">
                    <span>Acessar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}

          {/* "+ Novo Concurso" Card */}
          <div
            onClick={handleOpenCreate}
            className="border-2 border-dashed border-[var(--border)] hover:border-sky-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all hover:bg-[var(--surface-subtle)]/40 group"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] border border-[var(--border)] group-hover:border-sky-500/50 flex items-center justify-center text-[var(--text-muted)] group-hover:text-sky-500 mb-3 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-[var(--text)] mb-1">
              Adicionar Outro Concurso
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-xs">
              Crie um novo workspace independente para outro certame sem misturar dados.
            </p>
          </div>
        </div>
      </main>

      {/* Modal: Novo Concurso */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-card max-w-[480px]">
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-sky-500" />
                <span>Novo Concurso</span>
              </h3>
              <button className="btn-close-modal" onClick={() => setIsCreateOpen(false)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-field">
                <label>Nome do Concurso ou Cargo *</label>
                <input
                  type="text"
                  placeholder="Ex: TRT-3, TJMG, INSS, RECEITA FEDERAL"
                  value={newContestName}
                  onChange={(e) => setNewContestName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmCreate();
                  }}
                  autoFocus
                />
              </div>

              {/* Status do Edital */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)] block">
                  Status do Edital
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewExamPublished(true)}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      newExamPublished
                        ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--primary)]'
                        : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Data Definida</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExamPublished(false)}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      !newExamPublished
                        ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--primary)]'
                        : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Não Publicado</span>
                  </button>
                </div>
              </div>

              {newExamPublished && (
                <div className="form-field">
                  <label>Data Prevista da Prova</label>
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                  />
                </div>
              )}

              {/* Template Inicial */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)] block">
                  Ponto de Partida
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTemplateType('blank')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      newTemplateType === 'blank'
                        ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--primary)] font-bold'
                        : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="font-bold">Edital Zerado</div>
                    <div className="text-[10px] opacity-75 font-normal">Cadastre suas próprias disciplinas</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTemplateType('trt3')}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      newTemplateType === 'trt3'
                        ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--primary)] font-bold'
                        : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="font-bold">Modelo TRT-3</div>
                    <div className="text-[10px] opacity-75 font-normal">Inclui tópicos base do TRT-3</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn-auth-submit bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] py-1.5 px-4 text-xs"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-auth-submit py-1.5 px-4 text-xs font-bold"
                onClick={handleConfirmCreate}
              >
                Criar Concurso & Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Renomear Concurso */}
      {renamingContest && (
        <div className="modal-overlay">
          <div className="modal-card max-w-[420px]">
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-500" />
                <span>Renomear Concurso</span>
              </h3>
              <button className="btn-close-modal" onClick={() => setRenamingContest(null)}>
                ✕
              </button>
            </div>

            <div className="form-field">
              <label>Nome do Concurso</label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                }}
                autoFocus
              />
            </div>

            <div className="modal-actions mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-auth-submit bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] py-1.5 px-3 text-xs"
                onClick={() => setRenamingContest(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-auth-submit py-1.5 px-3 text-xs font-bold"
                onClick={handleConfirmRename}
              >
                Salvar Nome
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Excluir Concurso */}
      {deletingContest && (
        <div className="modal-overlay">
          <div className="modal-card max-w-[420px]">
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Excluir Concurso</span>
              </h3>
              <button className="btn-close-modal" onClick={() => setDeletingContest(null)}>
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Tem certeza que deseja excluir o concurso <strong>"{deletingContest.name}"</strong>?
              Todos os tópicos, cronograma e anotações deste certame serão apagados permanentemente. Seus outros concursos não serão afetados.
            </p>

            <div className="modal-actions mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-auth-submit bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] py-1.5 px-3 text-xs"
                onClick={() => setDeletingContest(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-auth-submit !bg-red-600 !text-white py-1.5 px-3 text-xs font-bold"
                onClick={handleConfirmDelete}
              >
                Sim, Excluir Concurso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
