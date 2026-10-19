import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
export const SUPABASE_URL = meta.env?.VITE_SUPABASE_URL || "https://omqprsqscgiexkjnkuey.supabase.co";
export const SUPABASE_ANON_KEY = meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcXByc3FzY2dpZXhram5rdWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNDY0NDcsImV4cCI6MjEwNzkyMjQ0N30.8lpbOY5-fmDRmt-KBB-_BSC9hkNa3yc-W7Lv1WvwwU4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
