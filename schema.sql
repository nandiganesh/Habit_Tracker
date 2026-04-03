-- Complete SQL Schema for Brutal Habit Tracker Database setup
-- Run this completely inside your Supabase project's SQL Editor

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_xp INT DEFAULT 0,
    current_level INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Habits Table
CREATE TABLE public.habits (
    habit_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('boolean', 'numeric')),
    target_value INT,
    unit TEXT,
    frequency TEXT DEFAULT 'daily',
    consistency_rate FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habit Logs Table
CREATE TABLE public.habit_logs (
    log_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    habit_id UUID REFERENCES public.habits(habit_id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    completion_date DATE NOT NULL,
    status TEXT CHECK (status IN ('completed', 'partial', 'missed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, completion_date) 
);

-- 4. Goals Table
CREATE TABLE public.goals (
    goal_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    target_date DATE NOT NULL,
    target_value INT NOT NULL,
    completed_value INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 6. RLS Security Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own logs" ON habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
