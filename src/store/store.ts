import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// User Store
export interface UserState {
  id: string;
  total_xp: number;
  current_level: number;
  addXp: (amount: number) => void;
  loadProfile: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  id: '',
  total_xp: 0,
  current_level: 1,
  addXp: async (amount) => {
    const state = get();
    const newXp = Math.max(0, state.total_xp + amount);
    const newLevel = Math.max(1, Math.floor(newXp / 100));
    set({ total_xp: newXp, current_level: newLevel });

    // Sync to Supabase
    await supabase
      .from('profiles')
      .update({ total_xp: newXp, current_level: newLevel })
      .eq('id', state.id);
  },
  loadProfile: async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (data) {
      set({
        id: data.id,
        total_xp: data.total_xp ?? 0,
        current_level: data.current_level ?? 1,
      });
    } else {
      // Fallback: If the SQL trigger failed or ran late, insert the profile manually so the app doesn't break
      await supabase.from('profiles').insert({ id: userId });
      set({ id: userId, total_xp: 0, current_level: 1 });
    }
  }
}));

// Habit Store
export type HabitType = 'boolean' | 'numeric';
export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  habit_id: string;
  title: string;
  type: HabitType;
  target_value?: number;
  unit?: string;
  frequency: HabitFrequency;
  consistency_rate: number;
}

export interface HabitLog {
  log_id: string;
  habit_id: string;
  completion_date: string;
  value_logged?: number;
  status: 'completed' | 'partial' | 'missed';
}

export interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  logHabit: (habit_id: string, date: string, status: 'completed' | 'partial' | 'missed') => void;
  addHabit: (habit: Omit<Habit, 'habit_id' | 'consistency_rate'>) => void;
  loadHabits: (userId: string) => Promise<void>;
  loadLogs: (userId: string) => Promise<void>;
  deleteHabit: (habit_id: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],
  logs: [],
  logHabit: async (habit_id, date, status) => {
    const userId = useUserStore.getState().id;

    // XP Logic
    let xpChange = 0;
    if (status === 'completed') xpChange = 10;
    else if (status === 'partial') xpChange = 5;
    else if (status === 'missed') xpChange = -2;

    useUserStore.getState().addXp(xpChange);

    // Upsert into Supabase
    const { data } = await supabase
      .from('habit_logs')
      .upsert(
        { habit_id, user_id: userId, completion_date: date, status },
        { onConflict: 'habit_id,completion_date' }
      )
      .select()
      .single();

    if (data) {
      set((state) => ({
        logs: [
          ...state.logs.filter(l => !(l.habit_id === habit_id && l.completion_date === date)),
          { log_id: data.log_id, habit_id: data.habit_id, completion_date: data.completion_date, status: data.status }
        ]
      }));
    }
  },
  addHabit: async (habitData) => {
    const userId = useUserStore.getState().id;
    const { data } = await supabase
      .from('habits')
      .insert({ ...habitData, user_id: userId, consistency_rate: 0 })
      .select()
      .single();

    if (data) {
      set((state) => ({
        habits: [...state.habits, {
          habit_id: data.habit_id,
          title: data.title,
          type: data.type,
          target_value: data.target_value,
          unit: data.unit,
          frequency: data.frequency,
          consistency_rate: data.consistency_rate ?? 0,
        }]
      }));
    }
  },
  loadHabits: async (userId: string) => {
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (data) {
      set({
        habits: data.map(h => ({
          habit_id: h.habit_id,
          title: h.title,
          type: h.type,
          target_value: h.target_value,
          unit: h.unit,
          frequency: h.frequency,
          consistency_rate: h.consistency_rate ?? 0,
        }))
      });
    }
  },
  loadLogs: async (userId: string) => {
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('completion_date', { ascending: false });

    if (data) {
      set({
        logs: data.map(l => ({
          log_id: l.log_id,
          habit_id: l.habit_id,
          completion_date: l.completion_date,
          status: l.status,
        }))
      });
    }
  },
  deleteHabit: async (habit_id: string) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('habit_id', habit_id);

    if (!error) {
      set((state) => ({
        habits: state.habits.filter(h => h.habit_id !== habit_id),
        logs: state.logs.filter(l => l.habit_id !== habit_id)
      }));
    }
  }
}));

// Goals Store
export interface Goal {
  goal_id: string;
  title: string;
  target_date: string;
  target_value: number;
  completed_value: number;
}

export interface GoalState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'goal_id' | 'completed_value'>) => void;
  loadGoals: (userId: string) => Promise<void>;
  updateGoal: (goal_id: string, completed_value: number) => Promise<void>;
  deleteGoal: (goal_id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  addGoal: async (goalData) => {
    const userId = useUserStore.getState().id;
    const { data } = await supabase
      .from('goals')
      .insert({ ...goalData, user_id: userId, completed_value: 0 })
      .select()
      .single();

    if (data) {
      set((state) => ({
        goals: [...state.goals, {
          goal_id: data.goal_id,
          title: data.title,
          target_date: data.target_date,
          target_value: data.target_value,
          completed_value: data.completed_value ?? 0,
        }]
      }));
    }
  },
  loadGoals: async (userId: string) => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (data) {
      set({
        goals: data.map(g => ({
          goal_id: g.goal_id,
          title: g.title,
          target_date: g.target_date,
          target_value: g.target_value,
          completed_value: g.completed_value ?? 0,
        }))
      });
    }
  },
  updateGoal: async (goal_id, completed_value) => {
    // Prevent updating beyond constraints if needed, but UI usually handles this.
    // For pure brutalism, let them update to whatever.
    const { error } = await supabase
      .from('goals')
      .update({ completed_value })
      .eq('goal_id', goal_id);

    if (!error) {
      set((state) => ({
        goals: state.goals.map(g => g.goal_id === goal_id ? { ...g, completed_value } : g)
      }));
    }
  },
  deleteGoal: async (goal_id) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('goal_id', goal_id);

    if (!error) {
      set((state) => ({
        goals: state.goals.filter(g => g.goal_id !== goal_id)
      }));
    }
  }
}));
