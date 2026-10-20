import React, { useState } from 'react';
import { Topic } from '../types';
import { calcDays, evalStatus, formatShortDate } from '../utils/formatters';
import { AlertTriangle, Clock, Check, Plus, Settings, Download, Trash2, BookOpen, ExternalLink, ChevronDown } from 'lucide-react';

interface AccordionListProps {
  topics: Topic[];
  registeredSubjects: string[];
  todaySubjects: string[];
  onToggleDone: (topicId: string, completed: boolean) => void;
  onMarkToday: (topicId: string) => void;
  onQuickAddLink: (topicId: string) => void;
  onOpenTopicConfig: (topicId: string) => void;
  onAddNewTopic: (subject: string, title: string, link: string, obs: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onOpenAddNewSubject: () => void;
  onOpenManageSubjects: () => void;
  onLoadTRT3Template: () => void;
}

export const AccordionList: React.FC<AccordionListProps> = ({
  topics,
  registeredSubjects,
  todaySubjects,
  onToggleDone,
  onMarkToday,
  onQuickAddLink,
  onOpenTopicConfig,
  onAddNewTopic,
  onDeleteTopic,
  onOpenAddNewSubject,
  onOpenManageSubjects,
  onLoadTRT3Template
}) => {
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const [activeAddForm, setActiveAddForm] = useState<string | null>(null);
  const [confirmLoadTRT, setConfirmLoadTRT] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  // Form states per active add form
  const [newTitle, setNewTitle] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newObs, setNewObs] = useState('');

  const toggleSubject = (sub: string) => {
    setOpenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(sub)) {
        next.delete(sub);
      } else {
        next.add(sub);
      }
      return next;
    });
  };

  const handleSaveTopic = (sub: string) => {
    if (!newTitle.trim()) {
      alert("Digite o nome do conteúdo.");
      return;
    }
    onAddNewTopic(sub, newTitle.trim(), newLink.trim(), newObs.trim());
    setNewTitle('');
    setNewLink('');
    setNewObs('');
    setActiveAddForm(null);
  };

  const handleTriggerLoadTRT = () => {
    if (topics.length > 0) {
      setConfirmLoadTRT(true);
    } else {
      onLoadTRT3Template();
    }
  };

  // Group topics by subject (strictly ignore system configs or internal keys)
  const grouped: { [subject: string]: Topic[] } = {};
  topics.forEach((t) => {
    if (!t.subject || t.subject.startsWith('__')) return;
    const cat = t.subject.toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  });

  // Combine registered subjects with any subject that has topics
  const combinedSubjectsSet = new Set<string>();
  registeredSubjects.forEach((s) => {
    if (s && !s.startsWith('__')) combinedSubjectsSet.add(s.toUpperCase());
  });
  Object.keys(grouped).forEach((s) => {
    if (s && !s.startsWith('__')) combinedSubjectsSet.add(s);
  });

  // Keep today's subjects at the very top of the list
  const todayNormalized = (todaySubjects || []).map((s) => (s ? s.trim().toUpperCase() : ''));
  const allSubjects = Array.from(combinedSubjectsSet).sort((a, b) => {
    const aIsToday = todayNormalized.includes(a.toUpperCase());
    const bIsToday = todayNormalized.includes(b.toUpperCase());
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    return a.localeCompare(b, 'pt-BR');
  });

  if (allSubjects.length === 0) {
    return (
      <div>
        <div className="section-header">EDITAL VERTICALIZADO E REVISÃO POR BLOCOS</div>
        <div className="accordion-list mt-2">
          <div className="empty-topics-box">
            <BookOpen className="w-10 h-10 text-[var(--text-muted)] opacity-50 mx-auto mb-2" />
            <h3>Nenhuma matéria cadastrada</h3>
            <p>Seu edital está zerado. Clique no botão <strong>+ Nova Matéria</strong> abaixo para cadastrar suas disciplinas e começar!</p>
          </div>
        </div>

        <div className="manage-subjects-toolbar">
          <button className="btn-manage-sub" onClick={onOpenAddNewSubject}>
            <Plus className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Nova Matéria</span>
          </button>
          <button className="btn-manage-sub" onClick={onOpenManageSubjects}>
            <Settings className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Gerenciar / Excluir Matéria</span>
          </button>
          <button className="btn-manage-sub opacity-80" onClick={handleTriggerLoadTRT}>
            <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Carregar Modelo TRT-3</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">EDITAL VERTICALIZADO E REVISÃO POR BLOCOS</div>

      {confirmLoadTRT && (
        <div className="bg-[var(--status-yellow-bg)] border border-[var(--status-yellow-border)] p-3 rounded-lg text-center mt-2 flex flex-col gap-2">
          <span className="text-xs font-bold text-[var(--status-yellow-text)]">
            Isso adicionará o edital base do TRT-3 aos seus tópicos atuais. Deseja continuar?
          </span>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              className="btn-auth-submit bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] py-1 px-3 text-xs"
              onClick={() => setConfirmLoadTRT(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-auth-submit py-1 px-3 text-xs"
              onClick={() => {
                setConfirmLoadTRT(false);
                onLoadTRT3Template();
              }}
            >
              Sim, Carregar Modelo
            </button>
          </div>
        </div>
      )}

      <div className="accordion-list mt-2">
        {allSubjects.map((sub) => {
          const list = grouped[sub] || [];

          let subRed = 0;
          let subYellow = 0;
          let subGreen = 0;
          let completedCount = 0;

          list.forEach((item) => {
            if (item.completed) completedCount++;
            const diff = calcDays(item.lastReview);
            const st = evalStatus(diff, item.green, item.yellow);
            if (st.type === 'red') subRed++;
            if (st.type === 'yellow') subYellow++;
            if (st.type === 'green') subGreen++;
          });

          const percent = list.length > 0 ? Math.round((completedCount / list.length) * 100) : 0;
          const isToday = todaySubjects.some((s) => s && s.toUpperCase() === sub.toUpperCase());
          const isOpen = openSubjects.has(sub);

          return (
            <div
              key={sub}
              className={`subject-box ${isToday ? 'is-today-active' : ''} ${isOpen ? 'open' : ''}`}
            >
              <div className="subject-header" onClick={() => toggleSubject(sub)}>
                <div className="header-left-sub">
                  <span className="subject-name">{sub}</span>
                  {isToday && (
                    <span className="chip-today">
                      <span className="chip-today-dot" />
                      Hoje
                    </span>
                  )}
                  <span className="subject-progress-badge">
                    {percent}% ({completedCount}/{list.length})
                  </span>
                </div>

                <div className="header-right-sub">
                  {subRed > 0 && (
                    <span className="status-chip red" title={`${subRed} atrasados`}>
                      <span className="chip-text-full">{subRed} atrasados</span>
                      <span className="chip-text-mobile flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> {subRed}</span>
                    </span>
                  )}
                  {subYellow > 0 && (
                    <span className="status-chip yellow" title={`${subYellow} atenção`}>
                      <span className="chip-text-full">{subYellow} atenção</span>
                      <span className="chip-text-mobile flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {subYellow}</span>
                    </span>
                  )}
                  {subGreen > 0 && (
                    <span className="status-chip green" title={`${subGreen} em dia`}>
                      <span className="chip-text-full">{subGreen} em dia</span>
                      <span className="chip-text-mobile flex items-center gap-1"><Check className="w-2.5 h-2.5" /> {subGreen}</span>
                    </span>
                  )}
                  <span className="text-xs font-bold text-[var(--text-muted)]">{list.length}</span>
                  <ChevronDown
                    className="w-4 h-4 text-[var(--text-muted)] transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                  />
                </div>
              </div>

              {isOpen && (
                <div className="subject-content">
                  <div className="accordion-action-bar">
                    <button
                      className="btn-add-topic inline-flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAddForm(activeAddForm === sub ? null : sub);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Bloco / Conteúdo em {sub}</span>
                    </button>
                  </div>

                  {activeAddForm === sub && (
                    <div className="inline-add-form" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        className="inline-input"
                        placeholder="Nome do Bloco ou Conteúdo"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        autoFocus
                      />
                      <input
                        type="text"
                        className="inline-input"
                        placeholder="Link TEC ou Qconcursos"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                      />
                      <input
                        type="text"
                        className="inline-input"
                        placeholder="Obs (Opcional)"
                        value={newObs}
                        onChange={(e) => setNewObs(e.target.value)}
                      />
                      <button
                        className="btn-auth-submit py-1 px-3 text-xs"
                        onClick={() => handleSaveTopic(sub)}
                      >
                        Salvar
                      </button>
                      <button
                        className="btn-topic-more"
                        onClick={() => setActiveAddForm(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {list.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-lg bg-[var(--surface-subtle)] my-1">
                      Nenhum conteúdo cadastrado em <strong>{sub}</strong> ainda.
                      <br />
                      Clique em <strong>+ Adicionar Bloco / Conteúdo</strong> acima para cadastrar os tópicos desta matéria.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {list.map((item) => {
                        const diff = calcDays(item.lastReview);
                        const st = evalStatus(diff, item.green, item.yellow);
                        const daysText = diff !== null ? `${diff} dias` : "Nunca";

                        // Link badge rendering
                        let linkBadge = null;
                        if (!item.link) {
                          linkBadge = (
                            <button
                              className="btn-quick-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTopicConfig(item.id);
                              }}
                              title="Inserir Link do TEC ou Qconcursos"
                            >
                              + Link
                            </button>
                          );
                        } else {
                          const u = item.link.toLowerCase();
                          if (u.includes("tecconcursos.com.br")) {
                            linkBadge = (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="link-pill tec"
                                title="Abrir TEC Concursos"
                              >
                                TEC ↗
                              </a>
                            );
                          } else if (u.includes("qconcursos.com")) {
                            linkBadge = (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="link-pill qc"
                                title="Abrir Qconcursos"
                              >
                                QC ↗
                              </a>
                            );
                          } else {
                            linkBadge = (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="link-pill generic flex items-center gap-1"
                                title="Abrir Link Externo"
                              >
                                <span>Link</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            );
                          }
                        }

                        return (
                          <div
                            key={item.id}
                            className={`topic-row-item ${st.cls}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="topic-info-side">
                              <input
                                type="checkbox"
                                className="check-topic-done"
                                title="Marcar concluído"
                                checked={Boolean(item.completed)}
                                onChange={(e) => onToggleDone(item.id, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                              />

                              <div className="topic-text-group">
                                <span className={`topic-title ${item.completed ? 'is-done' : ''}`}>
                                  {item.title}
                                </span>
                                <div className="topic-tags-row">
                                  {linkBadge}
                                  {item.obs && <span className="obs-pill">{item.obs}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="topic-actions-side">
                              <div className="topic-days-box" title="Tempo desde a última revisão">
                                <span className="topic-days-main">{daysText}</span>
                                <span className="topic-days-sub">Rev: {formatShortDate(item.lastReview)}</span>
                              </div>

                              <div className="topic-status-badge">{st.badge}</div>

                              <button
                                className="btn-rev-topic"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkToday(item.id);
                                }}
                                title="Marcar como revisado hoje"
                              >
                                ✓ Revisar
                              </button>

                              <button
                                className="btn-topic-more hover:text-[var(--primary)] flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenTopicConfig(item.id);
                                }}
                                title="Configurar prazos e link"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>

                              {deletingTopicId === item.id ? (
                                <div className="flex items-center gap-1 bg-[var(--surface-subtle)] p-1 rounded border border-[var(--border)]">
                                  <span className="text-[10px] text-red-600 font-bold">Apagar?</span>
                                  <button
                                    className="text-xs bg-red-600 text-white rounded px-1.5 py-0.5 font-bold hover:bg-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTopic(item.id);
                                      setDeletingTopicId(null);
                                    }}
                                  >
                                    Sim
                                  </button>
                                  <button
                                    className="text-xs text-[var(--text-muted)] px-1 font-bold"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingTopicId(null);
                                    }}
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn-topic-more hover:text-red-600 flex items-center justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingTopicId(item.id);
                                  }}
                                  title="Excluir este conteúdo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botões de Gerenciar Disciplinas - Minimalistas */}
      <div className="manage-subjects-toolbar">
        <button className="btn-manage-sub" onClick={onOpenAddNewSubject}>
          <Plus className="w-4 h-4 text-[var(--text-muted)]" />
          <span>Nova Matéria</span>
        </button>
        <button className="btn-manage-sub" onClick={onOpenManageSubjects}>
          <Settings className="w-4 h-4 text-[var(--text-muted)]" />
          <span>Gerenciar / Excluir Matéria</span>
        </button>
        <button className="btn-manage-sub opacity-80" onClick={handleTriggerLoadTRT}>
          <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Carregar Modelo TRT-3</span>
        </button>
      </div>
    </div>
  );
};
