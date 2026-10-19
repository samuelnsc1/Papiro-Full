import React, { useState } from 'react';
import { Topic } from '../types';
import { calcDays, evalStatus, formatShortDate } from '../utils/formatters';

interface AccordionListProps {
  topics: Topic[];
  todaySubjects: string[];
  onToggleDone: (topicId: string, completed: boolean) => void;
  onMarkToday: (topicId: string) => void;
  onQuickAddLink: (topicId: string) => void;
  onOpenTopicConfig: (topicId: string) => void;
  onAddNewTopic: (subject: string, title: string, link: string, obs: string) => void;
  onOpenAddNewSubject: () => void;
  onOpenManageSubjects: () => void;
  onLoadTRT3Template: () => void;
}

export const AccordionList: React.FC<AccordionListProps> = ({
  topics,
  todaySubjects,
  onToggleDone,
  onMarkToday,
  onQuickAddLink,
  onOpenTopicConfig,
  onAddNewTopic,
  onOpenAddNewSubject,
  onOpenManageSubjects,
  onLoadTRT3Template
}) => {
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const [activeAddForm, setActiveAddForm] = useState<string | null>(null);

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

  if (topics.length === 0) {
    return (
      <div>
        <div className="section-header">EDITAL VERTICALIZADO E REVISÃO POR BLOCOS</div>
        <div className="accordion-list mt-2">
          <div className="empty-topics-box">
            <div style={{ fontSize: '2.5rem' }}>📝</div>
            <h3>Nenhuma matéria cadastrada</h3>
            <p>Seu edital está zerado. Clique no botão <strong>+ Nova Matéria</strong> abaixo para cadastrar suas disciplinas e começar!</p>
          </div>
        </div>

        <div className="manage-subjects-toolbar">
          <button className="btn-manage-sub" onClick={onOpenAddNewSubject}>
            <span>➕</span> Nova Matéria
          </button>
          <button className="btn-manage-sub" onClick={onOpenManageSubjects}>
            <span>⚙️</span> Gerenciar / Excluir Matéria
          </button>
          <button className="btn-manage-sub text-xs opacity-80" onClick={onLoadTRT3Template}>
            <span>📥</span> Carregar Modelo TRT-3 (Opcional)
          </button>
        </div>
      </div>
    );
  }

  // Group by subject
  const grouped: { [subject: string]: Topic[] } = {};
  topics.forEach((t) => {
    const cat = (t.subject || "OUTROS").toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  });

  const allSubjects = Object.keys(grouped);

  return (
    <div>
      <div className="section-header">EDITAL VERTICALIZADO E REVISÃO POR BLOCOS</div>

      <div className="accordion-list mt-2">
        {allSubjects.map((sub) => {
          const list = grouped[sub] || [];
          if (list.length === 0) return null;

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
                  {isToday && <span className="chip-today">Estudar Hoje</span>}
                  <span className="subject-progress-badge">
                    {percent}% ({completedCount}/{list.length})
                  </span>
                </div>

                <div className="header-right-sub">
                  {subRed > 0 && (
                    <span className="status-chip red" title={`${subRed} atrasados`}>
                      <span className="chip-text-full">{subRed} atrasados</span>
                      <span className="chip-text-mobile">⚠️ {subRed}</span>
                    </span>
                  )}
                  {subYellow > 0 && (
                    <span className="status-chip yellow" title={`${subYellow} atenção`}>
                      <span className="chip-text-full">{subYellow} atenção</span>
                      <span className="chip-text-mobile">⚡ {subYellow}</span>
                    </span>
                  )}
                  {subGreen > 0 && (
                    <span className="status-chip green" title={`${subGreen} em dia`}>
                      <span className="chip-text-full">{subGreen} em dia</span>
                      <span className="chip-text-mobile">✓ {subGreen}</span>
                    </span>
                  )}
                  <span className="text-xs font-bold">{list.length}</span>
                  <span className="text-sm font-extrabold transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                    ▼
                  </span>
                </div>
              </div>

              {isOpen && (
                <div className="subject-content">
                  <div className="accordion-action-bar">
                    <button
                      className="btn-add-topic"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAddForm(activeAddForm === sub ? null : sub);
                      }}
                    >
                      + Adicionar Bloco / Conteúdo em {sub}
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
                              onQuickAddLink(item.id);
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
                              className="link-pill generic"
                              title="Abrir Link Externo"
                            >
                              🔗 ↗
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
                              className="btn-topic-more"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTopicConfig(item.id);
                              }}
                              title="Configurar prazos e link"
                            >
                              ⋮
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botões de Gerenciar Disciplinas */}
      <div className="manage-subjects-toolbar">
        <button className="btn-manage-sub" onClick={onOpenAddNewSubject}>
          <span>➕</span> Nova Matéria
        </button>
        <button className="btn-manage-sub" onClick={onOpenManageSubjects}>
          <span>⚙️</span> Gerenciar / Excluir Matéria
        </button>
        <button className="btn-manage-sub text-xs opacity-80" onClick={onLoadTRT3Template}>
          <span>📥</span> Carregar Modelo TRT-3 (Opcional)
        </button>
      </div>
    </div>
  );
};
