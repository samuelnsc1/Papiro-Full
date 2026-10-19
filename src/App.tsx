import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { Topic, CycleDay, StudySession, UserProfile } from './types';
import { calcDays, evalStatus, getTodayString, getCycleDayIndexForDate } from './utils/formatters';

import { Header } from './components/Header';
import { AuthView } from './components/AuthView';
import { CalendarHero } from './components/CalendarHero';
import { MetricsRow } from './components/MetricsRow';
import { AccordionList } from './components/AccordionList';
import { FloatingTimer } from './components/FloatingTimer';
import { StatsPage } from './components/StatsPage';

import { CycleConfigModal } from './components/modals/CycleConfigModal';
import { TopicConfigModal } from './components/modals/TopicConfigModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { NewSubjectModal } from './components/modals/NewSubjectModal';
import { ManageSubjectsModal } from './components/modals/ManageSubjectsModal';

const DEFAULT_CYCLE: CycleDay[] = [
  { day: 1, subjects: [] },
  { day: 2, subjects: [] },
  { day: 3, subjects: [] },
  { day: 4, subjects: [] },
  { day: 5, subjects: [] },
  { day: 6, subjects: [] },
  { day: 7, subjects: [] }
];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'guest',
    name: 'Concurseiro',
    email: 'aluno@exemplo.com',
    project_name: 'MEU PROJETO',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [studyCycle, setStudyCycle] = useState<CycleDay[]>(DEFAULT_CYCLE);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [registeredSubjects, setRegisteredSubjects] = useState<string[]>([]);

  // Navigation & UI state
  const [currentView, setCurrentView] = useState<'dashboard' | 'stats'>('dashboard');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerTickingLabel, setTimerTickingLabel] = useState<string | null>(null);

  // Modals state
  const [isCycleConfigOpen, setIsCycleConfigOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isNewSubjectOpen, setIsNewSubjectOpen] = useState(false);
  const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
  const [selectedTopicForConfig, setSelectedTopicForConfig] = useState<Topic | null>(null);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem("papiro_theme_mode") === "dark";
  });

  // Apply theme to document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("papiro_theme_mode", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("papiro_theme_mode", "light");
    }
  }, [isDark]);

  // Load user data bootstrap
  const loadUserData = useCallback(async (user: any) => {
    if (!user) return;

    try {
      // 1. Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile({
          id: user.id,
          name: profile.name || user.user_metadata?.name || 'Concurseiro',
          email: profile.email || user.email || '',
          project_name: profile.project_name || 'MEU PROJETO',
          avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        });
      } else {
        setUserProfile((prev) => ({
          ...prev,
          id: user.id,
          name: user.user_metadata?.name || 'Concurseiro',
          email: user.email || ''
        }));
      }

      // 2. Settings / Cycle
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let currentCycle = DEFAULT_CYCLE;
      if (settings && Array.isArray(settings.cycle_config) && settings.cycle_config.length === 7) {
        currentCycle = settings.cycle_config;
      }
      setStudyCycle(currentCycle);

      // 3. Topics
      const { data: dbTopics } = await supabase
        .from('study_topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      const loadedTopics: Topic[] = (dbTopics || []).map((t: any) => ({
        id: String(t.id),
        subject: t.subject,
        title: t.title,
        completed: Boolean(t.completed),
        obs: t.obs || '',
        link: t.link || '',
        lastReview: t.last_review || '',
        green: t.green_limit || 20,
        yellow: t.yellow_limit || 30,
        red: t.red_limit || 40
      }));
      setTopics(loadedTopics);

      // Build registered subjects list
      const subs = new Set<string>();
      loadedTopics.forEach((t) => { if (t.subject) subs.add(t.subject.toUpperCase()); });
      currentCycle.forEach((c) => {
        if (c.subjects) {
          c.subjects.forEach((s) => { if (s) subs.add(s.toUpperCase()); });
        }
      });
      setRegisteredSubjects(Array.from(subs));

      // 4. Study Sessions for stats
      const { data: dbSessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('study_date', { ascending: true });

      setStudySessions(dbSessions || []);
    } catch (err) {
      console.warn("Could not load from Supabase directly, checking fallback cache", err);
    }
  }, []);

  // Check active session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          loadUserData(session.user);
        }
      } catch (err) {
        console.warn("Supabase auth check error", err);
      }
    }
    checkAuth();
  }, [loadUserData]);

  // Auth Handlers
  const handleLogin = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        setCurrentUser(data.user);
        await loadUserData(data.user);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || "Falha ao realizar login." };
    }
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { name } }
      });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        setCurrentUser(data.user);
        await loadUserData(data.user);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || "Falha ao criar conta." };
    }
  };

  const handleGuestAccess = () => {
    const guestUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'convidado@papirofull.local',
      user_metadata: { name: 'Concurseiro Convidado' }
    };
    setCurrentUser(guestUser);
    setUserProfile({
      id: guestUser.id,
      name: 'Concurseiro Convidado',
      email: guestUser.email,
      project_name: 'PROJETO TRT 3',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    // Load TRT-3 sample by default for guest
    handleLoadTRT3Template(guestUser.id);
  };

  const handleLogout = async () => {
    if (confirm("Deseja realmente sair?")) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
      setCurrentUser(null);
      setTopics([]);
      setStudyCycle(DEFAULT_CYCLE);
      setStudySessions([]);
      setRegisteredSubjects([]);
      setUserProfile({
        id: 'guest',
        name: 'Concurseiro',
        email: '',
        project_name: 'MEU PROJETO'
      });
      setCurrentView('dashboard');
    }
  };

  // Profile Save
  const handleSaveProfile = async (name: string, project: string) => {
    setUserProfile((prev) => ({
      ...prev,
      name,
      project_name: project
    }));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          name,
          project_name: project
        }, { onConflict: 'id' });
    }
  };

  // Avatar Upload
  const handleAvatarUpload = async (base64: string) => {
    setUserProfile((prev) => ({
      ...prev,
      avatar_url: base64
    }));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          avatar_url: base64
        }, { onConflict: 'id' });
    }
  };

  // Cycle Config Save
  const handleSaveCycle = async (newCycle: CycleDay[]) => {
    setStudyCycle(newCycle);

    // Update registered subjects
    const subs = new Set(registeredSubjects);
    newCycle.forEach((c) => {
      c.subjects.forEach((s) => { if (s) subs.add(s); });
    });
    setRegisteredSubjects(Array.from(subs));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          cycle_config: newCycle
        }, { onConflict: 'user_id' });
    }
  };

  // Register New Subject
  const handleRegisterSubject = (name: string) => {
    const clean = name.trim().toUpperCase();
    if (!registeredSubjects.includes(clean)) {
      setRegisteredSubjects((prev) => [...prev, clean]);
    }
  };

  // Add Direct New Subject
  const handleAddDirectSubject = async (subject: string, firstTopic = "Conteúdo Geral / Bloco 1") => {
    handleRegisterSubject(subject);

    const newTopic: Topic = {
      id: 'top_' + Math.random().toString(36).substring(2, 9),
      subject,
      title: firstTopic,
      completed: false,
      link: '',
      obs: '',
      lastReview: getTodayString(),
      green: 20,
      yellow: 30,
      red: 40
    };

    setTopics((prev) => [...prev, newTopic]);

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      const { data } = await supabase.from('study_topics').insert({
        user_id: currentUser.id,
        subject,
        title: firstTopic,
        completed: false,
        link: '',
        obs: '',
        last_review: getTodayString(),
        green_limit: 20,
        yellow_limit: 30,
        red_limit: 40
      }).select().single();

      if (data) {
        setTopics((prev) => prev.map((t) => t.id === newTopic.id ? { ...t, id: String(data.id) } : t));
      }
    }
  };

  // Delete Subject Entirely
  const handleDeleteSubject = async (subject: string) => {
    setTopics((prev) => prev.filter((t) => t.subject !== subject));
    setRegisteredSubjects((prev) => prev.filter((s) => s !== subject));

    const updatedCycle = studyCycle.map((c) => ({
      ...c,
      subjects: (c.subjects || []).filter((s) => s !== subject)
    }));
    setStudyCycle(updatedCycle);

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase.from('study_topics').delete().eq('user_id', currentUser.id).eq('subject', subject);
      await supabase.from('user_settings').upsert({
        user_id: currentUser.id,
        cycle_config: updatedCycle
      }, { onConflict: 'user_id' });
    }
  };

  // Add New Topic inside Subject
  const handleAddNewTopic = async (subject: string, title: string, link: string, obs: string) => {
    const tempId = 'top_' + Math.random().toString(36).substring(2, 9);
    const newTopic: Topic = {
      id: tempId,
      subject,
      title,
      completed: false,
      link,
      obs,
      lastReview: getTodayString(),
      green: 20,
      yellow: 30,
      red: 40
    };

    setTopics((prev) => [...prev, newTopic]);

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      const { data } = await supabase.from('study_topics').insert({
        user_id: currentUser.id,
        subject,
        title,
        completed: false,
        link,
        obs,
        last_review: getTodayString(),
        green_limit: 20,
        yellow_limit: 30,
        red_limit: 40
      }).select().single();

      if (data) {
        setTopics((prev) => prev.map((t) => t.id === tempId ? { ...t, id: String(data.id) } : t));
      }
    }
  };

  // Toggle Done
  const handleToggleDone = async (topicId: string, completed: boolean) => {
    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, completed } : t));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase
        .from('study_topics')
        .update({ completed })
        .eq('id', topicId)
        .eq('user_id', currentUser.id);
    }
  };

  // Mark Today
  const handleMarkToday = async (topicId: string) => {
    const todayStr = getTodayString();
    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, lastReview: todayStr } : t));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase
        .from('study_topics')
        .update({ last_review: todayStr })
        .eq('id', topicId)
        .eq('user_id', currentUser.id);
    }
  };

  // Quick Add Link
  const handleQuickAddLink = async (topicId: string) => {
    const t = topics.find((item) => item.id === topicId);
    if (!t) return;

    const link = prompt("Cole o link do TEC Concursos ou Qconcursos:", t.link || "");
    if (link !== null) {
      const cleanLink = link.trim();
      setTopics((prev) => prev.map((item) => item.id === topicId ? { ...item, link: cleanLink } : item));

      if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
        await supabase
          .from('study_topics')
          .update({ link: cleanLink })
          .eq('id', topicId)
          .eq('user_id', currentUser.id);
      }
    }
  };

  // Save Topic Updates from Modal
  const handleSaveTopicUpdates = async (topicId: string, updates: Partial<Topic>) => {
    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, ...updates } : t));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase
        .from('study_topics')
        .update({
          link: updates.link,
          obs: updates.obs,
          yellow_limit: updates.yellow,
          red_limit: updates.red
        })
        .eq('id', topicId)
        .eq('user_id', currentUser.id);
    }
  };

  // Delete Topic
  const handleDeleteTopic = async (topicId: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== topicId));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase
        .from('study_topics')
        .delete()
        .eq('id', topicId)
        .eq('user_id', currentUser.id);
    }
  };

  // Save Study Session
  const handleSaveSession = async (subject: string, seconds: number, studyDate: string) => {
    const newSession: StudySession = {
      id: 'ses_' + Math.random().toString(36).substring(2, 9),
      user_id: currentUser?.id,
      subject,
      seconds,
      study_date: studyDate
    };

    setStudySessions((prev) => [...prev, newSession]);

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase.from('study_sessions').insert({
        user_id: currentUser.id,
        subject,
        seconds,
        study_date: studyDate
      });
    }
  };

  // Load TRT-3 Sample Template
  const handleLoadTRT3Template = async (userId = currentUser?.id) => {
    if (topics.length > 0 && userId === currentUser?.id) {
      if (!confirm("Isso adicionará o edital base do TRT-3 à sua conta. Deseja continuar?")) {
        return;
      }
    }

    const payload = [
      { subject: "PORTUGUÊS", title: "Compreensão e interpretação de textos", completed: true, obs: "", link: "", last_review: "", green_limit: 20, yellow_limit: 30, red_limit: 40 },
      { subject: "PORTUGUÊS", title: "Ortografia e acentuação gráfica", completed: true, obs: "", link: "https://www.tecconcursos.com.br/s/Q6ok1", last_review: "2026-08-13", green_limit: 20, yellow_limit: 30, red_limit: 40 },
      { subject: "PORTUGUÊS", title: "Transitividade Verbal e Termos Integrantes", completed: false, obs: "exercícios", link: "https://www.tecconcursos.com.br/s/Q6wh7", last_review: "2026-09-21", green_limit: 20, yellow_limit: 30, red_limit: 40 },
      { subject: "DIREITO DO TRABALHO", title: "Princípios e fontes - FGTS e insalubridade", completed: true, obs: "", link: "", last_review: "2026-10-14", green_limit: 20, yellow_limit: 30, red_limit: 40 },
      { subject: "DIREITO DO TRABALHO", title: "Das férias (Período concessivo e faltas)", completed: true, obs: "", link: "", last_review: "2026-09-22", green_limit: 20, yellow_limit: 30, red_limit: 40 },
      { subject: "PROCESSO DO TRABALHO", title: "Atos, termos e prazos processuais (CLT)", completed: true, obs: "", link: "", last_review: "2026-09-01", green_limit: 20, yellow_limit: 30, red_limit: 40 },
      { subject: "RACIOCÍNIO LÓGICO", title: "Estruturas lógicas e tabelas-verdade", completed: true, obs: "", link: "", last_review: "2026-09-18", green_limit: 20, yellow_limit: 30, red_limit: 40 }
    ];

    const newTopics: Topic[] = payload.map((p, idx) => ({
      id: 'trt3_' + idx + '_' + Math.random().toString(36).substring(2, 6),
      subject: p.subject,
      title: p.title,
      completed: p.completed,
      obs: p.obs,
      link: p.link,
      lastReview: p.last_review,
      green: p.green_limit,
      yellow: p.yellow_limit,
      red: p.red_limit
    }));

    setTopics((prev) => [...prev, ...newTopics]);

    // Setup initial study cycle if empty
    const subjectsInPayload = Array.from(new Set(payload.map((p) => p.subject)));
    setRegisteredSubjects((prev) => Array.from(new Set([...prev, ...subjectsInPayload])));

    const initialCycle: CycleDay[] = [
      { day: 1, subjects: ["PORTUGUÊS"] },
      { day: 2, subjects: ["DIREITO DO TRABALHO"] },
      { day: 3, subjects: ["PROCESSO DO TRABALHO"] },
      { day: 4, subjects: ["RACIOCÍNIO LÓGICO"] },
      { day: 5, subjects: ["PORTUGUÊS", "DIREITO DO TRABALHO"] },
      { day: 6, subjects: ["PROCESSO DO TRABALHO"] },
      { day: 7, subjects: ["RACIOCÍNIO LÓGICO"] }
    ];
    setStudyCycle(initialCycle);

    if (userId && !userId.startsWith('guest_')) {
      try {
        const dbPayload = payload.map((p) => ({ ...p, user_id: userId }));
        await supabase.from('study_topics').insert(dbPayload);
        await supabase.from('user_settings').upsert({
          user_id: userId,
          cycle_config: initialCycle
        }, { onConflict: 'user_id' });
      } catch (e) {
        console.error(e);
      }
    }

    if (userId === currentUser?.id) {
      alert("Modelo TRT-3 carregado com sucesso!");
    }
  };

  // Metrics calculation
  const { redCount, yellowCount, greenCount } = useMemo(() => {
    let r = 0, y = 0, g = 0;
    topics.forEach((item) => {
      const diff = calcDays(item.lastReview);
      const st = evalStatus(diff, item.green, item.yellow);
      if (st.type === 'red') r++;
      if (st.type === 'yellow') y++;
      if (st.type === 'green') g++;
    });
    return { redCount: r, yellowCount: y, greenCount: g };
  }, [topics]);

  // Today's subjects in active cycle
  const todaySubjects = useMemo(() => {
    const cycleIdx = getCycleDayIndexForDate(new Date());
    const dayItem = studyCycle[cycleIdx];
    return dayItem?.subjects || [];
  }, [studyCycle]);

  // If not authenticated, show AuthView
  if (!currentUser) {
    return (
      <AuthView
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGuestAccess={handleGuestAccess}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen">
      {currentView === 'dashboard' ? (
        <div className="app-shell">
          <Header
            user={userProfile}
            isDark={isDark}
            onToggleTheme={setIsDark}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onAvatarUpload={handleAvatarUpload}
            onLogout={handleLogout}
          />

          {/* 1. Programação de Hoje (7 Dias) */}
          <CalendarHero
            studyCycle={studyCycle}
            onOpenCycleConfig={() => setIsCycleConfigOpen(true)}
          />

          {/* 2. Botões: Cronômetro e Estatísticas */}
          <div className="under-calendar-toolbar">
            <button
              className="btn-study-action primary-btn"
              onClick={() => setIsTimerOpen((prev) => !prev)}
            >
              <span>⏱️</span>
              <span>{timerTickingLabel || "Cronômetro"}</span>
            </button>
            <button
              className="btn-study-action"
              onClick={() => setCurrentView('stats')}
            >
              <span>📊</span>
              <span>Estatísticas</span>
            </button>
          </div>

          {/* 3. Meta da Prova e Diagnóstico */}
          <MetricsRow
            redCount={redCount}
            yellowCount={yellowCount}
            greenCount={greenCount}
          />

          {/* 4. Edital Verticalizado */}
          <AccordionList
            topics={topics}
            todaySubjects={todaySubjects}
            onToggleDone={handleToggleDone}
            onMarkToday={handleMarkToday}
            onQuickAddLink={handleQuickAddLink}
            onOpenTopicConfig={(id) => {
              const t = topics.find((item) => item.id === id);
              if (t) setSelectedTopicForConfig(t);
            }}
            onAddNewTopic={handleAddNewTopic}
            onOpenAddNewSubject={() => setIsNewSubjectOpen(true)}
            onOpenManageSubjects={() => setIsManageSubjectsOpen(true)}
            onLoadTRT3Template={() => handleLoadTRT3Template()}
          />
        </div>
      ) : (
        <StatsPage
          sessions={studySessions}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* Floating Timer Widget */}
      <FloatingTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        subjects={registeredSubjects}
        onSaveSession={handleSaveSession}
        onTimerTick={setTimerTickingLabel}
      />

      {/* Modals */}
      <CycleConfigModal
        isOpen={isCycleConfigOpen}
        onClose={() => setIsCycleConfigOpen(false)}
        cycle={studyCycle}
        registeredSubjects={registeredSubjects}
        onSaveCycle={handleSaveCycle}
        onRegisterSubject={handleRegisterSubject}
      />

      <TopicConfigModal
        topic={selectedTopicForConfig}
        onClose={() => setSelectedTopicForConfig(null)}
        onSave={handleSaveTopicUpdates}
        onDelete={handleDeleteTopic}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentName={userProfile.name}
        currentProject={userProfile.project_name}
        onSave={handleSaveProfile}
      />

      <NewSubjectModal
        isOpen={isNewSubjectOpen}
        onClose={() => setIsNewSubjectOpen(false)}
        onAddSubject={handleAddDirectSubject}
      />

      <ManageSubjectsModal
        isOpen={isManageSubjectsOpen}
        onClose={() => setIsManageSubjectsOpen(false)}
        subjects={registeredSubjects}
        onDeleteSubject={handleDeleteSubject}
      />
    </div>
  );
};

export default App;
