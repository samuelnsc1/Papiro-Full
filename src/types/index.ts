export interface Topic {
  id: string;
  subject: string;
  title: string;
  completed: boolean;
  obs?: string;
  link?: string;
  lastReview?: string;
  green?: number;
  yellow?: number;
  red?: number;
}

export interface CycleDay {
  day: number;
  subjects: string[];
}

export interface StudySession {
  id?: string;
  user_id?: string;
  subject: string;
  seconds: number;
  study_date: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  project_name: string;
  avatar_url?: string;
  exam_published?: boolean;
  exam_date?: string;
  exam_days?: number | null;
  edital_title?: string;
  edital_url?: string;
  edital_notes?: string;
  edital_file_name?: string;
  edital_file_base64?: string;
}

export interface ContestWorkspace {
  id: string;
  name: string;
  created_at: string;
  is_standby?: boolean;
  exam_published?: boolean;
  exam_date?: string;
  exam_days?: number | null;
  study_cycle: CycleDay[];
  registered_subjects: string[];
  topics: Topic[];
  study_sessions: StudySession[];
  edital?: {
    edital_title?: string;
    edital_url?: string;
    edital_notes?: string;
    edital_file_name?: string;
    edital_file_base64?: string;
  };
}

export type TimerMode = 'up' | 'down' | 'manual';
