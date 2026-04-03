import { useState } from 'react';
import { useGoalStore } from '../store/store';
import { Clock, AlertTriangle, CheckCircle, AlertCircle, Plus, Minus, Trash2 } from 'lucide-react';

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useGoalStore();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetValue, setNewTargetValue] = useState(10);
  
  // Date input defaults to 30 days securely
  const getFutureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const [newTargetDate, setNewTargetDate] = useState(getFutureDate());

  const getPaceStatus = (goal: any) => {
    const today = new Date().getTime();
    const targetDate = new Date(goal.target_date).getTime();
    if (targetDate < today && goal.completed_value < goal.target_value) {
      return { msg: "Failed", color: "text-slate-500", bg: "bg-slate-100", icon: <AlertCircle className="w-4 h-4" /> };
    }
    if (goal.completed_value >= goal.target_value) {
      return { msg: "Completed", color: "text-green-600", bg: "bg-green-100", icon: <CheckCircle className="w-4 h-4" /> };
    }

    const remainingDays = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)));
    const requiredPace = (goal.target_value - goal.completed_value) / remainingDays;
    
    // Simplistic mock logic based on total period being around 30 days
    const currentPace = goal.completed_value / Math.max(1, (30 - remainingDays + 1));

    if (currentPace < requiredPace * 0.5) return { msg: "Behind Schedule", color: "text-red-500", bg: "bg-red-50", icon: <AlertTriangle className="w-4 h-4" /> };
    if (currentPace > requiredPace) return { msg: "On Track", color: "text-green-600", bg: "bg-green-50", icon: <CheckCircle className="w-4 h-4" /> };
    return { msg: "Needs Increased Effort", color: "text-orange-500", bg: "bg-orange-50", icon: <AlertCircle className="w-4 h-4" /> };
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    addGoal({
      title: newTitle,
      target_value: newTargetValue,
      target_date: newTargetDate
    });
    
    setNewTitle('');
    setNewTargetValue(10);
    setNewTargetDate(getFutureDate());
    setIsAddingGoal(false);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Goals</h1>
          <p className="text-muted">Long-term targets and pacing.</p>
        </div>
        <button 
          onClick={() => setIsAddingGoal(!isAddingGoal)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Goal
        </button>
      </header>
      
      {isAddingGoal && (
        <form onSubmit={handleAddGoal} className="bg-card rounded-xl border border-slate-100 p-6 flex flex-col gap-4 shadow-sm">
          <h3 className="font-bold text-slate-700">Add New Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              type="text" 
              placeholder="Goal Title (e.g. Read 10 Books)" 
              className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-500">Target Count:</label>
              <input 
                type="number" 
                min="1"
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary"
                value={newTargetValue}
                onChange={e => setNewTargetValue(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
               <label className="text-sm font-medium text-slate-500">End Date:</label>
               <input 
                 type="date"
                 className="flex-1 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary bg-white"
                 value={newTargetDate}
                 onChange={e => setNewTargetDate(e.target.value)}
                 required
               />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end mt-2">
            <button 
              type="button" 
              onClick={() => setIsAddingGoal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-pink-600 transition"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const pace = getPaceStatus(goal);
          const progressPercent = Math.min(100, Math.round((goal.completed_value / goal.target_value) * 100));
          
          return (
             <div key={goal.goal_id} className="bg-card rounded-xl border border-slate-100 p-6 flex flex-col gap-5 hover:shadow-md transition-shadow">
               <div className="flex items-start justify-between">
                 <div>
                   <h3 className="text-xl font-bold">{goal.title}</h3>
                   <div className="flex items-center gap-2 mt-1 text-sm text-muted">
                     <Clock className="w-4 h-4" />
                     Due {goal.target_date}
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold ${pace.bg} ${pace.color}`}>
                     {pace.icon} {pace.msg}
                   </div>
                   <button 
                     onClick={() => {
                        if(window.confirm(`Delete goal "${goal.title}"?`)) {
                          deleteGoal(goal.goal_id);
                        }
                     }}
                     className="text-slate-300 hover:text-red-500 transition-colors"
                     title="Delete Goal"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>

               <div>
                 <div className="flex items-center justify-between text-sm font-medium mb-3">
                   <span className="text-slate-600">Progress</span>
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={() => updateGoal(goal.goal_id, Math.max(0, goal.completed_value - 1))}
                       className="p-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
                     >
                       <Minus className="w-4 h-4" />
                     </button>
                     <span className="font-bold text-slate-800 text-base">{goal.completed_value} <span className="text-muted text-sm font-normal">/ {goal.target_value}</span></span>
                     <button 
                       onClick={() => updateGoal(goal.goal_id, Math.min(goal.target_value, goal.completed_value + 1))}
                       disabled={goal.completed_value >= goal.target_value}
                       className="p-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30"
                     >
                       <Plus className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                   <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                 </div>
               </div>
             </div>
          );
        })}
      </div>
    </div>
  );
}
