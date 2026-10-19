export const CYCLE_ANCHOR_DATE = "2026-10-18";
export const DAYS_ABBR = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTime(sec: number): string {
  const safeSec = Math.max(0, sec);
  const h = String(Math.floor(safeSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((safeSec % 3600) / 60)).padStart(2, '0');
  const s = String(safeSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function calcDays(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const rev = new Date(y, m - 1, d);
  rev.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - rev.getTime()) / (1000 * 60 * 60 * 24));
}

export interface StatusResult {
  cls: string;
  badge: string;
  type: 'green' | 'yellow' | 'red' | 'none';
}

export function evalStatus(diff: number | null, g?: number, y?: number): StatusResult {
  if (diff === null) return { cls: "status-none", badge: "Sem Registro", type: "none" };
  const greenLim = Number(g) || 20;
  const yellowLim = Number(y) || 30;

  if (diff <= greenLim) return { cls: "status-green", badge: "Em dia", type: "green" };
  if (diff > greenLim && diff <= yellowLim) return { cls: "status-yellow", badge: "Atenção", type: "yellow" };
  return { cls: "status-red", badge: "Atrasado", type: "red" };
}

export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return "--";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

export function formatFullDateBR(dateStr?: string | null): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getCycleDayIndexForDate(targetDate: Date | string): number {
  const anchor = new Date(CYCLE_ANCHOR_DATE + "T00:00:00");
  anchor.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((target.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
  return (((diffDays % 7) + 7) % 7);
}

export function getDaysUntilExam(targetDateStr = "2027-02-17"): number {
  if (!targetDateStr) return 0;
  // Support both YYYY-MM-DD and full ISO strings
  const cleanDateStr = targetDateStr.split('T')[0];
  const parts = cleanDateStr.split('-');
  if (parts.length !== 3) return 0;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  const exam = new Date(y, m - 1, d);
  const today = new Date();
  exam.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}
