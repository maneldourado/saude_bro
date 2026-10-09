import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nihnoztvhainisjtoytm.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paG5venR2aGFpbmlzanRveXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzkxNDksImV4cCI6MjEwNzExNTE0OX0.xoXlpOWQS9K24sq0t578oOUS-R4FKMd4uumK9QuQjVs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
