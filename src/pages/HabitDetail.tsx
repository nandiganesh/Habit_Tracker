import { useParams, Link } from 'react-router-dom';
import { useHabitStore } from '../store/store';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, Calendar as CalendarIcon, TrendingUp, Award } from 'lucide-react';

export default function HabitDetail() {
  const { id } = useParams();
  const { habits, logs } = useHabitStore();
  
  const habit = habits.find(h => h.habit_id === id);
  if (!habit) return <div className="p-10 text-center">Habit not found.</div>;

  const habitLogs = logs.filter(l => l.habit_id === id);
  
  // Prepare Heatmap Data
  const heatmapData = habitLogs.map(l => ({
    date: l.completion_date,
    count: l.status === 'completed' ? 2 : l.status === 'partial' ? 1 : 0
  }));

  // Prepare Chart Data
  const last30Days = Array.from({length: 30}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = habitLogs.find(l => l.completion_date === dateStr);
    let val = 0;
    if (log?.status === 'completed') val = habit.type === 'numeric' ? (habit.target_value || 1) : 1;
    else if (log?.status === 'partial') val = log.value_logged || 0.5;
    return { name: dateStr.slice(5), value: val };
  });

  const completions = habitLogs.filter(l => l.status === 'completed').length;
  const consistencyRate = Math.round(habit.consistency_rate * 100);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{habit.title}</h1>
          <p className="text-muted">{habit.frequency === 'daily' ? 'Daily Goal' : 'Weekly Goal'}</p>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Total Completions</p>
            <p className="text-3xl font-bold">{completions}</p>
          </div>
          <Award className="w-10 h-10 text-primary opacity-20" />
        </div>
        <div className="bg-card p-6 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted font-medium mb-1">Consistency Rate</p>
            <p className="text-3xl font-bold text-primary">{consistencyRate}%</p>
          </div>
          <TrendingUp className="w-10 h-10 text-primary opacity-20" />
        </div>
      </div>

      {/* Consistency Heatmap */}
      <section className="bg-card rounded-xl border border-slate-100 p-6 sm:p-8 overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <CalendarIcon className="w-5 h-5 text-muted" />
          <h2 className="text-xl font-bold">Activity Heatmap</h2>
        </div>
        
        {/* Custom styling injected since rect requires global CSS targeting or custom class mapping */}
        <style dangerouslySetInnerHTML={{__html:`
          .react-calendar-heatmap .color-empty { fill: #ebedf0; }
          .react-calendar-heatmap .color-scale-1 { fill: #fbcfe8; }
          .react-calendar-heatmap .color-scale-2 { fill: #db2777; }
        `}} />
        
        <div className="overflow-x-auto w-full pb-4">
          <div className="min-w-[600px]">
            <CalendarHeatmap
              startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              endDate={new Date()}
              values={heatmapData}
              classForValue={(value: any) => {
                if (!value || value.count === 0) return 'color-empty';
                return `color-scale-${value.count}`;
              }}
              // @ts-ignore
              tooltipDataAttrs={(value: any) => {
                return { 'data-tooltip': value.date ? `${value.date}: ${value.count}` : 'No data' };
              }}
              showWeekdayLabels={true}
            />
          </div>
        </div>
      </section>

      {/* Trend Chart */}
      <section className="bg-card rounded-xl border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-muted" />
          <h2 className="text-xl font-bold">30 Day Trend</h2>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last30Days} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
              <Line type="monotone" dataKey="value" stroke="#DB2777" strokeWidth={3} dot={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
