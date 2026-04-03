import { useState } from 'react';
import { useHabitStore } from '../store/store';
import { CheckCircle2, Circle, XCircle, Plus, Calendar, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HabitsPage() {
  const { habits, logs, logHabit, addHabit, deleteHabit } = useHabitStore();

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'boolean' | 'numeric'>('boolean');
  const [newTarget, setNewTarget] = useState(1);
  const [newUnit, setNewUnit] = useState('times');

  // Get today's completion status for a habit
  const today = new Date().toISOString().split('T')[0];
  const getLogStatus = (habit_id: string) => {
    return logs.find(l => l.habit_id === habit_id && l.completion_date === today)?.status;
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    addHabit({
      title: newTitle,
      type: newType,
      frequency: 'daily',
      ...(newType === 'numeric' ? { target_value: newTarget, unit: newUnit } : {})
    });
    
    setNewTitle('');
    setNewType('boolean');
    setNewTarget(1);
    setNewUnit('times');
    setIsAddingHabit(false);
  };

  const totalLogsToday = habits.filter(h => getLogStatus(h.habit_id)).length;
  const progressPercent = habits.length ? Math.round((totalLogsToday / habits.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habit Tracker</h1>
          <p className="text-muted">Manage your daily habits and log today's progress.</p>
        </div>
        <button 
          onClick={() => setIsAddingHabit(!isAddingHabit)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Habit
        </button>
      </header>

      {/* New Habit Form */}
      {isAddingHabit && (
        <form onSubmit={handleAddHabit} className="bg-card rounded-xl border border-slate-100 p-6 flex flex-col gap-4 shadow-sm">
          <h3 className="font-bold text-slate-700">Create New Habit</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Target Habit (e.g. Read Pages)" 
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
            <select 
              className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary bg-white"
              value={newType} 
              onChange={(e) => setNewType(e.target.value as any)}
            >
              <option value="boolean">Yes/No</option>
              <option value="numeric">Numeric Target</option>
            </select>
          </div>
          
          {newType === 'numeric' && (
            <div className="flex gap-4">
              <input 
                type="number" 
                min="1"
                className="w-24 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary"
                value={newTarget}
                onChange={e => setNewTarget(Number(e.target.value))}
              />
              <input 
                type="text" 
                placeholder="Unit (e.g. pages, kg, mins)"
                className="w-48 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary"
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
              />
            </div>
          )}
          
          <div className="flex gap-2 justify-end mt-2">
            <button 
              type="button" 
              onClick={() => setIsAddingHabit(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-pink-600 transition"
            >
              Save Habit
            </button>
          </div>
        </form>
      )}

      {/* Habit List */}
      <section className="bg-card rounded-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted" />
            <h2 className="text-xl font-bold">Today's List</h2>
          </div>
          <span className="text-sm font-medium text-muted">{progressPercent}% Completed</span>
        </div>

        <div className="divide-y divide-slate-100">
          {habits.map((habit) => {
            const status = getLogStatus(habit.habit_id);
            return (
              <div key={habit.habit_id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <Link to={`/habit/${habit.habit_id}`} className="flex-1 font-medium text-slate-800 hover:text-primary transition-colors">
                  {habit.title} {habit.type === 'numeric' && <span className="text-sm text-muted ml-2 font-normal">({habit.target_value} {habit.unit})</span>}
                </Link>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete "${habit.title}"?`)) {
                        deleteHabit(habit.habit_id);
                      }
                    }}
                    className="p-2 mr-2 rounded-full transition-all text-slate-300 hover:bg-red-50 hover:text-red-500"
                    title="Delete Tracker"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => logHabit(habit.habit_id, today, 'missed')}
                    className={`p-2 rounded-full transition-all ${status === 'missed' ? 'bg-red-100 text-red-600' : 'text-slate-300 hover:text-red-500'}`}
                    title="Missed"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => logHabit(habit.habit_id, today, 'completed')}
                    className={`p-2 rounded-full transition-all ${status === 'completed' ? 'bg-green-100 text-green-600' : 'text-slate-300 hover:text-green-500'}`}
                    title="Completed"
                  >
                    {status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            );
          })}
          {habits.length === 0 && (
            <div className="p-10 text-center text-muted">
              No habits created yet. Get started setting a goal.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
