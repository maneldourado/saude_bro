import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vkeqmejjqlaikagpwjvb.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZXFtZWpqcWxhaWthZ3B3anZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTc2NTYsImV4cCI6MjA5NTk5MzY1Nn0.t05Nd5a1L1MgLg19cVus1Mq1xmpvsfgT6dKj_c7fhgE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
