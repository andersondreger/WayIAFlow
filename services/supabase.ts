
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qonrpzlkjhdmswjfxvtu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbnJwemxramhkbXN3amZ4dnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDYzNzYsImV4cCI6MjA2NTY4MjM3Nn0.29PrNjzmr7mAQ6YaxEyaW__ROmCEKkUr2VPTpvklJos';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
