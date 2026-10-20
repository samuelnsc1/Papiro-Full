import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { ExamDateModal } from './components/modals/ExamDateModal';
import { NewSubjectModal } from './components/modals/NewSubjectModal';
import { ManageSubjectsModal } from './components/modals/ManageSubjectsModal';
import { LogoutConfirmModal } from './components/modals/LogoutConfirmModal';
import { EditalModal } from './components/modals/EditalModal';
import { Timer, BarChart3, FileText } from 'lucide-react';

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
    email: '',
    project_name: 'MEU PROJETO',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    exam_published: true,
    exam_date: '2027-02-17',
    exam_days: null
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [studyCycle, setStudyCycle] = useState<CycleDay[]>(DEFAULT_CYCLE);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [registeredSubjects, setRegisteredSubjects] = useState<string[]>([]);

  // Navigation & UI state
  const [currentView, setCurrentView] = useState<'dashboard' | 'stats'>('dashboard');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerTickingLabel, setTimerTickingLabel] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals state
  const [isCycleConfigOpen, setIsCycleConfigOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isExamConfigOpen, setIsExamConfigOpen] = useState(false);
  const [isEditalOpen, setIsEditalOpen] = useState(false);
  const [isNewSubjectOpen, setIsNewSubjectOpen] = useState(false);
  const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [selectedTopicForConfig, setSelectedTopicForConfig] = useState<Topic | null>(null);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem("papiro_theme_mode") === "dark";
  });

  // Track latest state for sync persistence
  const latestStateRef = useRef({
    studyCycle,
    userProfile,
    registeredSubjects
  });

  useEffect(() => {
    latestStateRef.current = {
      studyCycle,
      userProfile,
      registeredSubjects
    };
  }, [studyCycle, userProfile, registeredSubjects]);

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

  // Completely reset all application state in memory
  const resetAppState = useCallback(() => {
    setCurrentUser(null);
    setTopics([]);
    setStudyCycle(DEFAULT_CYCLE);
    setStudySessions([]);
    setRegisteredSubjects([]);
    setUserProfile({
      id: '',
      name: 'Concurseiro',
      email: '',
      project_name: 'MEU PROJETO',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      exam_published: true,
      exam_date: '2027-02-17',
      exam_days: null
    });
    setCurrentView('dashboard');
  }, []);

  // Load user data bootstrap strictly scoped to user.id and synchronized across devices
  const loadUserData = useCallback(async (user: any) => {
    if (!user?.id || user.id.startsWith('guest_')) return;

    try {
      // Refresh user details from server to get latest server-side metadata on all devices
      let currentServerUser = user;
      try {
        const { data: fresh } = await supabase.auth.getUser();
        if (fresh?.user) {
          currentServerUser = fresh.user;
          setCurrentUser(fresh.user);
        }
      } catch (e) {
        console.warn("Could not refresh server user:", e);
      }

      // 1. Profile from DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // 2. Settings & Cycle from DB
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let currentCycle = DEFAULT_CYCLE;
      let dbProjectName: string | null = null;
      let dbExamPublished: boolean = true;
      let dbExamDate: string = settings?.exam_date || '2027-02-17';
      let dbExamDays: number | null = null;
      let dbCustomSubjects: string[] = [];

      if (settings?.cycle_config) {
        if (Array.isArray(settings.cycle_config)) {
          currentCycle = settings.cycle_config;
        } else if (typeof settings.cycle_config === 'object') {
          if (Array.isArray(settings.cycle_config.cycle)) {
            currentCycle = settings.cycle_config.cycle;
          } else if (Array.isArray(settings.cycle_config.days)) {
            currentCycle = settings.cycle_config.days;
          }

          if (settings.cycle_config.project_name) {
            dbProjectName = settings.cycle_config.project_name;
          }
          if (settings.cycle_config.exam_published !== undefined) {
            dbExamPublished = Boolean(settings.cycle_config.exam_published);
          }
          if (settings.cycle_config.exam_date) {
            dbExamDate = settings.cycle_config.exam_date;
          }
          if (settings.cycle_config.exam_days !== undefined) {
            dbExamDays = settings.cycle_config.exam_days;
          }
          if (Array.isArray(settings.cycle_config.registered_subjects)) {
            dbCustomSubjects = settings.cycle_config.registered_subjects;
          }
        }
      }

      // 3. Topics strictly for this user + System Config extraction
      const { data: dbTopics } = await supabase
        .from('study_topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      let topicProjectName: string | null = null;
      let topicUserName: string | null = null;
      let topicExamPublished: boolean | null = null;
      let topicExamDate: string | null = null;
      let topicExamDays: number | null = null;
      let topicEdital: any = null;

      const loadedTopics: Topic[] = [];

      (dbTopics || []).forEach((t: any) => {
        // Intercept System Config entries so they NEVER leak into syllabus topics
        if (t.subject === '__SYSTEM_CONFIG__' || (t.subject && t.subject.startsWith('__'))) {
          if (t.title === '__PROJECT_NAME__' && t.obs) {
            topicProjectName = t.obs;
          } else if (t.title === '__USER_NAME__' && t.obs) {
            topicUserName = t.obs;
          } else if (t.title === '__EXAM_CONFIG__' && t.obs) {
            try {
              const parsed = JSON.parse(t.obs);
              if (parsed.exam_published !== undefined) topicExamPublished = parsed.exam_published;
              if (parsed.exam_date) topicExamDate = parsed.exam_date;
              if (parsed.exam_days !== undefined) topicExamDays = parsed.exam_days;
            } catch (e) {
              console.warn("Could not parse exam config topic:", e);
            }
          } else if (t.title === '__EDITAL_CONFIG__' && t.obs) {
            try {
              topicEdital = JSON.parse(t.obs);
            } catch (e) {
              console.warn("Could not parse edital config topic:", e);
            }
          }
          return; // Strictly exclude from syllabus topics
        }

        loadedTopics.push({
          id: String(t.id),
          subject: (t.subject || "GERAL").toUpperCase(),
          title: t.title,
          completed: Boolean(t.completed),
          obs: t.obs || '',
          link: t.link || '',
          lastReview: t.last_review || '',
          green: t.green_limit || 20,
          yellow: t.yellow_limit || 30,
          red: t.red_limit || 40
        });
      });

      // Priority resolution: topic config (which syncs across mobile/desktop) > db user_settings > auth metadata > default
      const finalProject = topicProjectName || dbProjectName || currentServerUser.user_metadata?.project_name || 'MEU PROJETO';
      const finalName = topicUserName || profile?.name || currentServerUser.user_metadata?.name || 'Concurseiro';
      const finalExamPublished = topicExamPublished !== null ? topicExamPublished : (dbExamPublished !== undefined ? dbExamPublished : true);
      const finalExamDate = topicExamDate || dbExamDate || '2027-02-17';
      const finalExamDays = topicExamDays !== null ? topicExamDays : dbExamDays;

      let cachedEdital: any = null;
      try {
        const raw = localStorage.getItem(`papiro_edital_${user.id}`);
        if (raw) cachedEdital = JSON.parse(raw);
      } catch (e) {
        console.warn("LocalStorage edital read error:", e);
      }
      const finalEdital = topicEdital || cachedEdital || {};

      setUserProfile({
        id: user.id,
        name: finalName,
        email: profile?.email || user.email || '',
        project_name: finalProject,
        avatar_url: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        exam_published: finalExamPublished,
        exam_date: finalExamDate,
        exam_days: finalExamDays,
        edital_title: finalEdital.edital_title || '',
        edital_url: finalEdital.edital_url || '',
        edital_notes: finalEdital.edital_notes || '',
        edital_file_name: finalEdital.edital_file_name || '',
        edital_file_base64: finalEdital.edital_file_base64 || ''
      });

      setTopics(loadedTopics);
      setStudyCycle(currentCycle);

      // Build registered subjects list strictly from THIS user's data (filtering system internal names)
      const subs = new Set<string>();
      dbCustomSubjects.forEach((s) => { if (s && !s.startsWith('__')) subs.add(s.toUpperCase()); });
      loadedTopics.forEach((t) => { if (t.subject && !t.subject.startsWith('__')) subs.add(t.subject.toUpperCase()); });
      currentCycle.forEach((c) => {
        if (c.subjects) {
          c.subjects.forEach((s) => { if (s && !s.startsWith('__')) subs.add(s.toUpperCase()); });
        }
      });
      subs.delete('__SYSTEM_CONFIG__');
      setRegisteredSubjects(Array.from(subs));

      // 4. Study Sessions strictly for this user
      const { data: dbSessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('study_date', { ascending: true });

      setStudySessions(dbSessions || []);
    } catch (err) {
      console.warn("Could not load from Supabase directly", err);
    }
  }, []);

  // Real-time synchronization across desktop, tablet, and mobile
  useEffect(() => {
    if (!currentUser?.id || currentUser.id.startsWith('guest_')) return;

    // 1. Supabase Realtime channel for instant cross-device updates
    const channel = supabase.channel(`papiro-sync-${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_topics',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        loadUserData(currentUser);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_settings',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        loadUserData(currentUser);
      })
      .subscribe();

    // 2. Visibility change & window focus: when user switches back to browser tab on mobile/tablet
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadUserData(currentUser);
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [currentUser?.id, loadUserData]);

  // Check active session on mount and listen to auth changes
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          await loadUserData(session.user);
        }
      } catch (err) {
        console.warn("Supabase auth check error", err);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        resetAppState();
      } else if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user);
        await loadUserData(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData, resetAppState]);

  // Manual Triggered Refresh (Header Button)
  const handleManualSync = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    await loadUserData(currentUser);
    setTimeout(() => setIsSyncing(false), 500);
  };

  // Auth Handlers: Resilient Login with mobile keyboard trimming & case compensation
  const handleLogin = async (email: string, pass: string) => {
    try {
      resetAppState();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = pass.trim();

      // Strategy 1: Clean email + clean password
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      // Strategy 2: If error and pass had raw spaces, try untrimmed pass
      if (error && pass !== cleanPassword) {
        const retry1 = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass
        });
        if (!retry1.error) {
          data = retry1.data;
          error = null;
        }
      }

      // Strategy 3: Mobile keyboard often auto-capitalizes first character of password
      if (error && cleanPassword.length > 0) {
        const firstLower = cleanPassword.charAt(0).toLowerCase() + cleanPassword.slice(1);
        if (firstLower !== cleanPassword) {
          const retry2 = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: firstLower
          });
          if (!retry2.error) {
            data = retry2.data;
            error = null;
          }
        }
      }

      // Strategy 4: Try with first char uppercase if user created it capitalized
      if (error && cleanPassword.length > 0) {
        const firstUpper = cleanPassword.charAt(0).toUpperCase() + cleanPassword.slice(1);
        if (firstUpper !== cleanPassword) {
          const retry3 = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: firstUpper
          });
          if (!retry3.error) {
            data = retry3.data;
            error = null;
          }
        }
      }

      // Strategy 5: Raw untrimmed email (just in case)
      if (error && email.trim() !== cleanEmail) {
        const retry4 = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: cleanPassword
        });
        if (!retry4.error) {
          data = retry4.data;
          error = null;
        }
      }

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          return {
            error: "E-mail ou senha incorretos. Dica: use o botão 'Mostrar 👁️' na senha para verificar se o teclado do celular não adicionou letras maiúsculas ou espaços indesejados."
          };
        }
        return { error: error.message };
      }

      if (data?.user) {
        setCurrentUser(data.user);
        await loadUserData(data.user);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || "Falha ao realizar login." };
    }
  };

  // Auth Handlers: Register with GUARANTEED ZEROED OUT STATE
  const handleRegister = async (name: string, email: string, pass: string) => {
    try {
      resetAppState();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = pass.trim();
      const cleanName = name.trim() || 'Concurseiro';

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            name: cleanName,
            project_name: 'MEU PROJETO',
            exam_published: true,
            exam_date: '2027-02-17'
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const userId = data.user.id;

        // 1. Wipe database auto-seeded topics for this new user so edital starts 100% ZERADO
        try {
          await supabase.from('study_topics').delete().eq('user_id', userId);
        } catch (e) {
          console.warn("Clean initial topics error", e);
        }

        // 2. Clear any study sessions
        try {
          await supabase.from('study_sessions').delete().eq('user_id', userId);
        } catch (e) {
          console.warn("Clean initial sessions error", e);
        }

        // 3. Initialize fresh empty 7-day cycle and project_name in database
        const cleanCycle: CycleDay[] = [
          { day: 1, subjects: [] },
          { day: 2, subjects: [] },
          { day: 3, subjects: [] },
          { day: 4, subjects: [] },
          { day: 5, subjects: [] },
          { day: 6, subjects: [] },
          { day: 7, subjects: [] }
        ];

        const settingsPayload = {
          cycle: cleanCycle,
          project_name: 'MEU PROJETO',
          exam_published: true,
          exam_date: '2027-02-17',
          exam_days: null,
          registered_subjects: []
        };

        try {
          await supabase.from('user_settings').upsert({
            user_id: userId,
            cycle_config: settingsPayload,
            exam_date: '2027-02-17'
          }, { onConflict: 'user_id' });
        } catch (e) {
          console.warn("Clean cycle error", e);
        }

        // 4. Set profile name in database
        try {
          await supabase.from('profiles').update({
            name: cleanName
          }).eq('id', userId);
        } catch (e) {
          console.warn("Update profile error", e);
        }

        // 5. Initialize system config in study_topics for guaranteed mobile/tablet synchronization
        try {
          await supabase.from('study_topics').insert([
            {
              user_id: userId,
              subject: '__SYSTEM_CONFIG__',
              title: '__PROJECT_NAME__',
              obs: 'MEU PROJETO',
              completed: false
            },
            {
              user_id: userId,
              subject: '__SYSTEM_CONFIG__',
              title: '__USER_NAME__',
              obs: cleanName,
              completed: false
            },
            {
              user_id: userId,
              subject: '__SYSTEM_CONFIG__',
              title: '__EXAM_CONFIG__',
              obs: JSON.stringify({ exam_published: true, exam_date: '2027-02-17', exam_days: null }),
              completed: false
            }
          ]);
        } catch (e) {
          console.warn("Init system config in study_topics error", e);
        }

        // 6. Update application state in memory: 100% clean, empty edital, fresh name
        setCurrentUser(data.user);
        setUserProfile({
          id: userId,
          name: cleanName,
          email: cleanEmail,
          project_name: 'MEU PROJETO',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          exam_published: true,
          exam_date: '2027-02-17',
          exam_days: null
        });
        setTopics([]);
        setStudyCycle(cleanCycle);
        setStudySessions([]);
        setRegisteredSubjects([]);
        setCurrentView('dashboard');
      }

      return {};
    } catch (err: any) {
      return { error: err.message || "Falha ao criar conta." };
    }
  };

  // Guest Mode Access (for demonstration / testing)
  const handleGuestAccess = () => {
    resetAppState();
    const guestUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'convidado@papirofull.local',
      user_metadata: { name: 'Concurseiro Convidado', project_name: 'MEU PROJETO' }
    };
    setCurrentUser(guestUser);
    setUserProfile({
      id: guestUser.id,
      name: 'Concurseiro Convidado',
      email: guestUser.email,
      project_name: 'MEU PROJETO',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      exam_published: true,
      exam_date: '2027-02-17',
      exam_days: null
    });
    setTopics([]);
    setRegisteredSubjects([]);
    setStudyCycle(DEFAULT_CYCLE);
  };

  // Confirmed Logout (iframe-safe, zero window.confirm)
  const handleExecuteLogout = async () => {
    setIsLogoutModalOpen(false);

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut error:", e);
    }

    // Clear Supabase session keys from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.startsWith('supabase.'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("LocalStorage clear error:", e);
    }

    resetAppState();
  };

  // Profile Save with guaranteed multi-device synchronization (study_topics + user_settings + profiles + auth metadata)
  const handleSaveProfile = async (
    name: string,
    project: string,
    examPublished: boolean = true,
    examDate: string = '2027-02-17',
    examDays: number | null = null
  ) => {
    const cleanName = name.trim() || 'Concurseiro';
    const cleanProject = project.trim().toUpperCase() || 'MEU PROJETO';

    // 1. Immediately update in-memory React state so the UI updates with zero delay
    setUserProfile((prev) => ({
      ...prev,
      name: cleanName,
      project_name: cleanProject,
      exam_published: examPublished,
      exam_date: examDate,
      exam_days: examDays
    }));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      const userId = currentUser.id;

      try {
        // 2. Persist in study_topics (guaranteed cross-device sync table verified on mobile)
        const { data: exProj } = await supabase
          .from('study_topics')
          .select('id')
          .eq('user_id', userId)
          .eq('subject', '__SYSTEM_CONFIG__')
          .eq('title', '__PROJECT_NAME__')
          .maybeSingle();

        if (exProj?.id) {
          await supabase.from('study_topics').update({ obs: cleanProject }).eq('id', exProj.id);
        } else {
          await supabase.from('study_topics').insert({
            user_id: userId,
            subject: '__SYSTEM_CONFIG__',
            title: '__PROJECT_NAME__',
            obs: cleanProject,
            completed: false
          });
        }

        const { data: exName } = await supabase
          .from('study_topics')
          .select('id')
          .eq('user_id', userId)
          .eq('subject', '__SYSTEM_CONFIG__')
          .eq('title', '__USER_NAME__')
          .maybeSingle();

        if (exName?.id) {
          await supabase.from('study_topics').update({ obs: cleanName }).eq('id', exName.id);
        } else {
          await supabase.from('study_topics').insert({
            user_id: userId,
            subject: '__SYSTEM_CONFIG__',
            title: '__USER_NAME__',
            obs: cleanName,
            completed: false
          });
        }

        // Exam config in study_topics
        const { data: exExam } = await supabase
          .from('study_topics')
          .select('id')
          .eq('user_id', userId)
          .eq('subject', '__SYSTEM_CONFIG__')
          .eq('title', '__EXAM_CONFIG__')
          .maybeSingle();

        const examJson = JSON.stringify({
          exam_published: examPublished,
          exam_date: examDate,
          exam_days: examDays
        });

        if (exExam?.id) {
          await supabase.from('study_topics').update({ obs: examJson }).eq('id', exExam.id);
        } else {
          await supabase.from('study_topics').insert({
            user_id: userId,
            subject: '__SYSTEM_CONFIG__',
            title: '__EXAM_CONFIG__',
            obs: examJson,
            completed: false
          });
        }
      } catch (err) {
        console.warn("Error saving system config to study_topics:", err);
      }

      try {
        // 3. Persist name in PostgreSQL 'profiles' table
        await supabase
          .from('profiles')
          .update({ name: cleanName })
          .eq('id', userId);
      } catch (err) {
        console.warn("Error updating profile name:", err);
      }

      try {
        // 4. Persist in PostgreSQL 'user_settings' JSONB
        const payload = {
          cycle: studyCycle,
          project_name: cleanProject,
          exam_published: examPublished,
          exam_date: examDate,
          exam_days: examDays,
          registered_subjects: registeredSubjects
        };
        await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            cycle_config: payload,
            exam_date: examDate
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn("Error updating user_settings:", err);
      }

      try {
        // 5. Persist in Supabase Auth server metadata
        const { data: updatedAuth } = await supabase.auth.updateUser({
          data: { name: cleanName, project_name: cleanProject }
        });
        if (updatedAuth?.user) {
          setCurrentUser(updatedAuth.user);
        }
      } catch (err) {
        console.warn("Error updating auth metadata:", err);
      }
    }
  };

  // Exam Date & "Edital Não Publicado" Save handler
  const handleSaveExamConfig = async (isPublished: boolean, examDate: string, examDays: number | null) => {
    setUserProfile((prev) => ({
      ...prev,
      exam_published: isPublished,
      exam_date: examDate,
      exam_days: examDays
    }));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      const userId = currentUser.id;

      try {
        // 1. Update user_settings
        const payload = {
          cycle: studyCycle,
          project_name: userProfile.project_name || 'MEU PROJETO',
          exam_published: isPublished,
          exam_date: examDate,
          exam_days: examDays,
          registered_subjects: registeredSubjects
        };

        await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            cycle_config: payload,
            exam_date: examDate
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.warn("Error updating user_settings exam config:", err);
      }

      try {
        // 2. Persist in study_topics (__EXAM_CONFIG__) for instant multi-device replication
        const { data: exExam } = await supabase
          .from('study_topics')
          .select('id')
          .eq('user_id', userId)
          .eq('subject', '__SYSTEM_CONFIG__')
          .eq('title', '__EXAM_CONFIG__')
          .maybeSingle();

        const examJson = JSON.stringify({
          exam_published: isPublished,
          exam_date: examDate,
          exam_days: examDays
        });

        if (exExam?.id) {
          await supabase.from('study_topics').update({ obs: examJson }).eq('id', exExam.id);
        } else {
          await supabase.from('study_topics').insert({
            user_id: userId,
            subject: '__SYSTEM_CONFIG__',
            title: '__EXAM_CONFIG__',
            obs: examJson,
            completed: false
          });
        }
      } catch (err) {
        console.warn("Error updating exam config in study_topics:", err);
      }

      try {
        // 3. Update auth metadata
        await supabase.auth.updateUser({
          data: {
            exam_published: isPublished,
            exam_date: examDate,
            exam_days: examDays
          }
        });
      } catch (e) {
        console.warn("Error updating auth metadata exam config:", e);
      }
    }
  };

  // Edital Save Handler (Document, Link, Notes & PDF)
  const handleSaveEdital = async (data: {
    edital_title: string;
    edital_url: string;
    edital_notes: string;
    edital_file_name?: string;
    edital_file_base64?: string;
  }) => {
    // 1. Instant React state update
    setUserProfile((prev) => ({
      ...prev,
      edital_title: data.edital_title,
      edital_url: data.edital_url,
      edital_notes: data.edital_notes,
      edital_file_name: data.edital_file_name,
      edital_file_base64: data.edital_file_base64
    }));

    // 2. Cache locally immediately for instant reload on any device/offline
    try {
      const uid = currentUser?.id || 'guest';
      localStorage.setItem(`papiro_edital_${uid}`, JSON.stringify(data));
    } catch (e) {
      console.warn("LocalStorage edital save error:", e);
    }

    // 3. Multi-device cloud sync via study_topics __EDITAL_CONFIG__
    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      const userId = currentUser.id;
      try {
        const { data: exEdital } = await supabase
          .from('study_topics')
          .select('id')
          .eq('user_id', userId)
          .eq('subject', '__SYSTEM_CONFIG__')
          .eq('title', '__EDITAL_CONFIG__')
          .maybeSingle();

        const editalJson = JSON.stringify(data);

        if (exEdital?.id) {
          await supabase.from('study_topics').update({ obs: editalJson }).eq('id', exEdital.id);
        } else {
          await supabase.from('study_topics').insert({
            user_id: userId,
            subject: '__SYSTEM_CONFIG__',
            title: '__EDITAL_CONFIG__',
            obs: editalJson,
            completed: false
          });
        }
      } catch (err) {
        console.warn("Error saving edital config to study_topics:", err);
      }
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
        .update({ avatar_url: base64 })
        .eq('id', currentUser.id);
    }
  };

  // Cycle Config Save (preserves project_name and exam config in user_settings)
  const handleSaveCycle = async (newCycle: CycleDay[]) => {
    setStudyCycle(newCycle);

    // Update registered subjects
    const subs = new Set(registeredSubjects);
    newCycle.forEach((c) => {
      c.subjects.forEach((s) => { if (s && !s.startsWith('__')) subs.add(s.toUpperCase()); });
    });
    subs.delete('__SYSTEM_CONFIG__');
    const updatedSubs = Array.from(subs);
    setRegisteredSubjects(updatedSubs);

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      const payload = {
        cycle: newCycle,
        project_name: userProfile.project_name || 'MEU PROJETO',
        exam_published: userProfile.exam_published !== false,
        exam_date: userProfile.exam_date || '2027-02-17',
        exam_days: userProfile.exam_days ?? null,
        registered_subjects: updatedSubs
      };
      await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          cycle_config: payload
        }, { onConflict: 'user_id' });
    }
  };

  // Register New Subject
  const handleRegisterSubject = (name: string) => {
    const clean = name.trim().toUpperCase();
    if (clean.startsWith('__')) return;
    if (!registeredSubjects.includes(clean)) {
      setRegisteredSubjects((prev) => {
        const next = [...prev, clean];
        if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
          const payload = {
            cycle: studyCycle,
            project_name: userProfile.project_name || 'MEU PROJETO',
            exam_published: userProfile.exam_published !== false,
            exam_date: userProfile.exam_date || '2027-02-17',
            exam_days: userProfile.exam_days ?? null,
            registered_subjects: next
          };
          supabase.from('user_settings').upsert({
            user_id: currentUser.id,
            cycle_config: payload
          }, { onConflict: 'user_id' }).then(() => {});
        }
        return next;
      });
    }
  };

  // Add Direct New Subject: NEVER auto-create unwanted placeholder topics!
  const handleAddDirectSubject = async (subject: string, firstTopic?: string) => {
    const cleanSubject = subject.trim().toUpperCase();
    if (cleanSubject.startsWith('__')) return;

    handleRegisterSubject(cleanSubject);

    // Only create a topic if the user explicitly provided an initial topic name!
    if (firstTopic && firstTopic.trim()) {
      const tempId = 'top_' + Math.random().toString(36).substring(2, 9);
      const newTopic: Topic = {
        id: tempId,
        subject: cleanSubject,
        title: firstTopic.trim(),
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
          subject: cleanSubject,
          title: firstTopic.trim(),
          completed: false,
          link: '',
          obs: '',
          last_review: getTodayString(),
          green_limit: 20,
          yellow_limit: 30,
          red_limit: 40
        }).select().single();

        if (data) {
          setTopics((prev) => prev.map((t) => t.id === tempId ? { ...t, id: String(data.id) } : t));
        }
      }
    }
  };

  // Delete Subject Entirely (will never delete __SYSTEM_CONFIG__)
  const handleDeleteSubject = async (subject: string) => {
    if (subject === '__SYSTEM_CONFIG__' || subject.startsWith('__')) return;

    setTopics((prev) => prev.filter((t) => t.subject !== subject));
    const nextSubs = registeredSubjects.filter((s) => s !== subject);
    setRegisteredSubjects(nextSubs);

    const updatedCycle = studyCycle.map((c) => ({
      ...c,
      subjects: (c.subjects || []).filter((s) => s !== subject)
    }));
    setStudyCycle(updatedCycle);

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      await supabase.from('study_topics').delete().eq('user_id', currentUser.id).eq('subject', subject);
      const payload = {
        cycle: updatedCycle,
        project_name: userProfile.project_name || 'MEU PROJETO',
        exam_published: userProfile.exam_published !== false,
        exam_date: userProfile.exam_date || '2027-02-17',
        exam_days: userProfile.exam_days ?? null,
        registered_subjects: nextSubs
      };
      await supabase.from('user_settings').upsert({
        user_id: currentUser.id,
        cycle_config: payload
      }, { onConflict: 'user_id' });
    }
  };

  // Add New Topic inside Subject
  const handleAddNewTopic = async (subject: string, title: string, link: string, obs: string) => {
    const cleanSub = subject.trim().toUpperCase();
    const tempId = 'top_' + Math.random().toString(36).substring(2, 9);
    const newTopic: Topic = {
      id: tempId,
      subject: cleanSub,
      title: title.trim(),
      completed: false,
      link: link.trim(),
      obs: obs.trim(),
      lastReview: getTodayString(),
      green: 20,
      yellow: 30,
      red: 40
    };

    setTopics((prev) => [...prev, newTopic]);

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      const { data } = await supabase.from('study_topics').insert({
        user_id: currentUser.id,
        subject: cleanSub,
        title: title.trim(),
        completed: false,
        link: link.trim(),
        obs: obs.trim(),
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
  const handleQuickAddLink = (topicId: string) => {
    const t = topics.find((item) => item.id === topicId);
    if (t) {
      setSelectedTopicForConfig(t);
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

  // Delete Topic (works from both AccordionList and TopicConfigModal)
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
  const handleLoadTRT3Template = async () => {
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

    // Update registered subjects
    const subjectsInPayload = Array.from(new Set(payload.map((p) => p.subject)));
    setRegisteredSubjects((prev) => Array.from(new Set([...prev, ...subjectsInPayload])));

    if (currentUser?.id && !currentUser.id.startsWith('guest_')) {
      try {
        const dbPayload = payload.map((p) => ({ ...p, user_id: currentUser.id }));
        await supabase.from('study_topics').insert(dbPayload);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Metrics calculation
  const { redCount, yellowCount, greenCount } = useMemo(() => {
    let r = 0, y = 0, g = 0;
    topics.forEach((item) => {
      if (item.subject?.startsWith('__')) return;
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
    const dayItem = studyCycle.find(c => c.day === cycleIdx + 1) || studyCycle[cycleIdx];
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
            onLogout={() => setIsLogoutModalOpen(true)}
            onSyncNow={handleManualSync}
            isSyncing={isSyncing}
          />

          {/* 1. Programação de Hoje (7 Dias) */}
          <CalendarHero
            studyCycle={studyCycle}
            onOpenCycleConfig={() => setIsCycleConfigOpen(true)}
          />

          {/* 2. Botões Principais: Cronômetro, Estatísticas e Edital do Concurso */}
          <div className="under-calendar-toolbar">
            <button
              className={`btn-study-action ${timerTickingLabel ? 'ticking' : 'secondary-btn'}`}
              onClick={() => setIsTimerOpen((prev) => !prev)}
              title="Cronômetro de estudo"
            >
              <Timer className="w-4 h-4" />
              <span>{timerTickingLabel || "Cronômetro"}</span>
            </button>
            <button
              className="btn-study-action secondary-btn"
              onClick={() => setCurrentView('stats')}
              title="Relatório de tempo e estatísticas"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Estatísticas</span>
            </button>
            <button
              className="btn-study-action secondary-btn relative"
              onClick={() => setIsEditalOpen(true)}
              title="Inserir e consultar o Edital do concurso"
            >
              <FileText className="w-4 h-4" />
              <span>Edital</span>
              {(userProfile.edital_url || userProfile.edital_file_name) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-0.5" title="Edital anexado" />
              )}
            </button>
          </div>

          {/* 3. Meta da Prova e Diagnóstico */}
          <MetricsRow
            redCount={redCount}
            yellowCount={yellowCount}
            greenCount={greenCount}
            examPublished={userProfile.exam_published !== false}
            examDate={userProfile.exam_date || "2027-02-17"}
            examDays={userProfile.exam_days}
            onOpenExamConfig={() => setIsEditProfileOpen(true)}
            onOpenEdital={() => setIsEditalOpen(true)}
            hasEdital={Boolean(userProfile.edital_url || userProfile.edital_file_name)}
          />

          {/* 4. Edital Verticalizado */}
          <AccordionList
            topics={topics}
            registeredSubjects={registeredSubjects}
            todaySubjects={todaySubjects}
            onToggleDone={handleToggleDone}
            onMarkToday={handleMarkToday}
            onQuickAddLink={handleQuickAddLink}
            onOpenTopicConfig={(id) => {
              const t = topics.find((item) => item.id === id);
              if (t) setSelectedTopicForConfig(t);
            }}
            onAddNewTopic={handleAddNewTopic}
            onDeleteTopic={handleDeleteTopic}
            onOpenAddNewSubject={() => setIsNewSubjectOpen(true)}
            onOpenManageSubjects={() => setIsManageSubjectsOpen(true)}
            onLoadTRT3Template={handleLoadTRT3Template}
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
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleExecuteLogout}
      />

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
        currentPublished={userProfile.exam_published !== false}
        currentExamDate={userProfile.exam_date || "2027-02-17"}
        currentExamDays={userProfile.exam_days ?? null}
        onSave={handleSaveProfile}
        onOpenEdital={() => setIsEditalOpen(true)}
      />

      <EditalModal
        isOpen={isEditalOpen}
        onClose={() => setIsEditalOpen(false)}
        projectName={userProfile.project_name}
        currentTitle={userProfile.edital_title}
        currentUrl={userProfile.edital_url}
        currentNotes={userProfile.edital_notes}
        currentFileName={userProfile.edital_file_name}
        currentFileBase64={userProfile.edital_file_base64}
        onSave={handleSaveEdital}
      />

      <ExamDateModal
        isOpen={isExamConfigOpen}
        onClose={() => setIsExamConfigOpen(false)}
        currentPublished={userProfile.exam_published !== false}
        currentExamDate={userProfile.exam_date || "2027-02-17"}
        currentExamDays={userProfile.exam_days ?? null}
        onSave={handleSaveExamConfig}
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
