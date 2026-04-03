import { useUserStore, useHabitStore } from '../store/store';
import { Flame, Target } from 'lucide-react';

export default function Dashboard() {
  const { total_xp, current_level } = useUserStore();
  const { habits, logs } = useHabitStore();

  const getBrutalFeedback = () => {
    const avgConsistency = habits.reduce((acc, h) => acc + h.consistency_rate, 0) / (habits.length || 1);
    if (avgConsistency < 0.5) return "Your consistency is pathetic. You're barely trying. Step it up.";
    if (avgConsistency < 0.8) return "Mediocre at best. You're slipping on your commitments. Stop making excuses.";
    return "You're actually maintaining a decent streak. Don't ruin it now.";
  };

  // Generate last 30 days metrics
  const last30Days = Array.from({length: 30}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const completedLogs = logs.filter(l => l.completion_date === dateStr && l.status === 'completed').length;
    const activeHabits = habits.length || 1;
    const percent = Math.round((completedLogs / activeHabits) * 100);
    
    return {
      date: dateStr,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayOfMonth: d.getDate(),
      percent: Math.min(100, Math.max(0, percent))
    };
  });

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted">A brutal look at your stats. Don't break the chain.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted font-medium">Total XP</p>
            <p className="text-2xl font-bold">{total_xp}</p>
          </div>
          <Flame className="text-orange-500 w-8 h-8 opacity-20" />
        </div>
        <div className="bg-card p-6 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-muted font-medium">Current Level</p>
            <p className="text-2xl font-bold">Lvl {current_level}</p>
          </div>
          <Target className="text-blue-500 w-8 h-8 opacity-20" />
        </div>
        <div className="lg:col-span-2 bg-pink-50 p-6 rounded-xl border border-pink-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-primary font-bold uppercase tracking-wider mb-1">Feedback</p>
            <p className="text-md font-medium text-slate-800">{getBrutalFeedback()}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Active Heatmap Matrix - Moved Up & 30 Days */}
        <section className="bg-card rounded-xl border border-slate-100 flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">30-Day Heatmap Matrix</h2>
            <p className="text-sm text-muted">Daily individual habit breakdown for the past month</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-6">
              {habits.map(h => (
                <div key={h.habit_id} className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-6">
                  <div className="w-full xl:w-40 text-sm font-bold text-slate-800 truncate" title={h.title}>{h.title}</div>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {last30Days.slice().reverse().map(day => {
                      const logStatus = logs.find(l => l.habit_id === h.habit_id && l.completion_date === day.date)?.status;
                      return (
                        <div 
                          key={day.date} 
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[4px] transition-colors border border-black/5 hover:border-black/20 cursor-pointer ${
                            logStatus === 'completed' ? 'bg-primary' :
                            logStatus === 'partial' ? 'bg-pink-300' :
                            logStatus === 'missed' ? 'bg-red-400' :
                            'bg-slate-100'
                          }`}
                          title={`${day.date}: ${logStatus || 'No entry'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              {habits.length === 0 && (
                <div className="text-center text-sm text-muted py-4">No habits to display...</div>
              )}
            </div>
          </div>
        </section>

        {/* 30-Day Aggregate Consistency - Moved Down */}
        <section className="bg-card rounded-xl border border-slate-100 p-6 sm:p-8 overflow-hidden shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-slate-800">Aggregate Consistency (30 Days)</h2>
          <div className="flex justify-between items-end gap-1 h-32">
            {last30Days.map(day => (
              <div key={day.date} className="flex flex-col items-center gap-1 w-full group cursor-pointer h-full justify-end">
                <div className="w-full bg-slate-50 rounded flex flex-col justify-end overflow-hidden flex-1 relative border border-slate-100 border-b-0">
                  <div 
                    className="bg-primary hover:bg-pink-500 rounded-t-sm w-full transition-all duration-300 min-h-[2px]" 
                    style={{ height: `${Math.max(2, day.percent)}%` }} 
                    title={`${day.date}: ${day.percent}%`}
                  ></div>
                </div>
                {/* Only show day label for a few bars so it doesn't clutter */}
                <div className="text-[10px] text-muted font-medium w-full text-center truncate">
                   {day.dayOfMonth}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
