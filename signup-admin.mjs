import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgtxrytyojdzewjppbwq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndHhyeXR5b2pkemV3anBwYndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTE5ODU2MzAsImV4cCI6MjAyNzU2MTYzMH0.Xv-R6z5S8-H_58VjZ9Z-X_5Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z'; 
// Wait, the user provided the actual sb_publishable key above:
// `sb_publishable_nKMKnN0mokSPNFeEzX5D3A_0tVDrCoU` but that's a publishable key. Wait, I'll need to fetch the real ANON KEY from .env.local!
