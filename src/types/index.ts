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
}

export type TimerMode = 'up' | 'down' | 'manual';
