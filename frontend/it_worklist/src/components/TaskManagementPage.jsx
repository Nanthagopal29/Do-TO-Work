import React, { useState, useEffect } from "react";

const BASE_API_URL = "https://hfapi.herofashion.com/software_cost";

const TaskManagementPage = ({ onBack }) => {
  // Data State
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // Added Users State

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ task_status: "Pending" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tasks, projects, AND users
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        fetch(`${BASE_API_URL}/task_master/`),
        fetch(`${BASE_API_URL}/project_master/`),
        fetch(`${BASE_API_URL}/user_master/`), // Assuming this endpoint exists
      ]);

      setTasks(await tasksRes.json());
      setProjects(await projectsRes.json());
      setUsers(await usersRes.json());
    } catch (err) {
      setError("Failed to fetch data from the server.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ task_status: "Pending" });
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    // Task directly sets form data, allowing code_id to populate correctly
    setFormData({ ...task });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/task_master/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete task");
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const method = editingId ? "PUT" : "POST";
      
      // Grab the user ID, checking both possible keys DRF might use
      const userId = formData.code_id || formData.code;
      const projectId = formData.project_id;

      const payload = { 
        ...formData,
        // Send BOTH keys to guarantee Django catches it
        code: userId ? parseInt(userId, 10) : null,
        code_id: userId ? parseInt(userId, 10) : null,
        project_id: projectId ? parseInt(projectId, 10) : null,
      };

      if (editingId) {
        payload.id = editingId;
      }

      const response = await fetch(`${BASE_API_URL}/task_master/`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save task");
      await fetchData();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Soft UI Styling Constants ---
  const inputGroupStyle = "space-y-1.5";
  const labelStyle = "block text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1";
  const inputStyle = "w-full bg-slate-100/50 border border-transparent rounded-2xl px-4 py-3.5 text-sm text-slate-700 outline-none focus:bg-white focus:border-violet-300 focus:ring-4 focus:ring-violet-50 transition-all hover:bg-slate-100 placeholder:text-slate-400 shadow-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/50 p-4 lg:p-8 font-sans w-full selection:bg-violet-200 selection:text-violet-900 overflow-hidden">
      <div className="max-w-[1400px] mx-auto h-full flex flex-col">
        
        {/* Header section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 shrink-0">
          <div>
            <button
              onClick={onBack || (() => window.history.back())}
              className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors mb-4"
            >
              <div className="bg-white p-2 rounded-full shadow-sm group-hover:shadow border border-slate-100 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              Return to Dashboard
            </button>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 tracking-tight">
              Task Management
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Assign tasks to users and track progress.</p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl px-5 py-3 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex items-center gap-2">
             <span className="text-2xl">📝</span>
             <span className="font-bold text-slate-700">Total Tasks:</span>
             <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-black">{tasks.length}</span>
          </div>
        </div>

        {error && (
          <div className="mb-8 shrink-0 rounded-3xl bg-rose-500/10 border border-rose-500/20 p-5 flex justify-between items-center text-rose-700 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 font-bold">
              <span className="bg-rose-500 text-white p-1 rounded-full"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></span>
              {error}
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-rose-500/20 rounded-full transition-colors">×</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start flex-1 min-h-0">
          
          {/* Left Panel Form (Floating Card) */}
          <div className="w-full lg:w-[420px] shrink-0 sticky top-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10"></div>
              
              <div className="mb-8">
                <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 font-bold text-xs rounded-full uppercase tracking-widest mb-3">
                  {editingId ? 'Edit Mode' : 'Creation Mode'}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-800">
                   {editingId ? 'Update Task' : 'Assign New Task'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">First select a user, then assign the task.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. SELECT USER FIRST (Mandatory) */}
                <div className={inputGroupStyle}>
                  <label className={labelStyle}>Assign to User <span className="text-rose-500">*</span></label>
                  <select 
                    name="code_id" 
                    value={formData.code_id || formData.code || ""} 
                    onChange={handleChange} 
                    required 
                    className={`${inputStyle} border-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.1)]`}
                  >
                    <option value="">-- Select a User --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.user_name || user.name || `User ${user.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. SELECT PROJECT */}
                <div className={inputGroupStyle}>
                  <label className={labelStyle}>Link to Project</label>
                  <select name="project_id" value={formData.project_id || ""} onChange={handleChange} className={inputStyle}>
                    <option value="">-- Unassigned --</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.project_name}</option>
                    ))}
                  </select>
                </div>
                
                {/* 3. TASK DETAILS */}
                <div className={inputGroupStyle}>
                  <label className={labelStyle}>Task Name <span className="text-rose-500">*</span></label>
                  <input type="text" name="task_name" value={formData.task_name || ""} onChange={handleChange} required className={inputStyle} placeholder="Design System Update" />
                </div>
                
                <div className={inputGroupStyle}>
                  <label className={labelStyle}>Task Description</label>
                  <textarea name="task_description" value={formData.task_description || ""} onChange={handleChange} className={`${inputStyle} min-h-[100px] resize-y`} placeholder="Add task specifics..."></textarea>
                </div>
                
                <div className={inputGroupStyle}>
                  <label className={labelStyle}>Status</label>
                  <select name="task_status" value={formData.task_status || "Pending"} onChange={handleChange} className={inputStyle}>
                    <option value="Pending">🚧 Pending</option>
                    <option value="In Progress">⏳ In Progress</option>
                    <option value="Completed">✅ Completed</option>
                  </select>
                </div>
                
                <div className="pt-6 flex flex-col gap-3">
                  <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-violet-600/30 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    )}
                    {editingId ? "Update Assigned Task" : "Assign Task"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel Data Area */}
          <div className="flex-1 w-full min-w-0 flex flex-col">
             <div className="flex justify-between items-end mb-6 px-2 shrink-0">
               <div>
                 <h3 className="text-xl font-extrabold text-slate-800">Task Directory</h3>
                 <p className="text-slate-500 text-sm mt-1">Manage and update your ongoing workflows.</p>
               </div>
               {isLoading && (
                 <div className="bg-white/50 px-3 py-1.5 rounded-full text-xs font-bold text-violet-600 flex items-center gap-2 border border-violet-100">
                   <div className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></div> Syncing
                 </div>
               )}
             </div>
             
             {/* SCROLLABLE LIST CONTAINER ADDED HERE */}
             <div className="w-full space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 pb-6 custom-scrollbar">
               {tasks.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 rounded-[2rem] border border-dashed border-slate-300">
                   <div className="text-6xl mb-4 opacity-50">📋</div>
                   <h3 className="text-lg font-bold text-slate-700">No Tasks Yet</h3>
                   <p className="text-slate-500 mt-1">Start by creating a task using the form.</p>
                 </div>
               ) : (
                 tasks.map((task) => {
                   const linkedProject = projects.find(p => p.id === parseInt(task.project_id));
                   const linkedUser = users.find(u => u.id === parseInt(task.code_id));
                   
                   // Format assigning date (Checks for backend created_at or assign_date field, defaults to today if undefined)
                   const rawDate = task.assign_date || task.created_at || task.date;
                   const displayDate = rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString();

                   return (
                     <div key={task.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                       <div className="flex-1">
                         <div className="flex flex-wrap items-center gap-2 mb-2">
                           <span className="text-[10px] font-black uppercase tracking-wider text-violet-500 bg-violet-50 px-2 py-0.5 rounded-md">
                             {linkedProject ? linkedProject.project_name : 'No Project'}
                           </span>
                           <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                             👤 {linkedUser ? (linkedUser.user_name || linkedUser.name) : 'Unassigned'}
                           </span>
                           {/* NEW DATE BADGE ADDED HERE */}
                           <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                             📅 {displayDate}
                           </span>
                         </div>
                         <h4 className="font-extrabold text-slate-800 text-lg">{task.task_name}</h4>
                         {task.task_description && (
                           <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.task_description}</p>
                         )}
                       </div>
                       
                       <div className="flex items-center gap-4 shrink-0 mt-3 sm:mt-0">
                          {task.task_status && (
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                              task.task_status.toLowerCase() === 'completed' || task.task_status.toLowerCase() === 'complete' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : task.task_status.toLowerCase() === 'in progress' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {task.task_status}
                            </span>
                          )}
                          
                          <div className="flex bg-slate-50 rounded-2xl p-1 border border-slate-100">
                            <button onClick={() => handleEdit(task)} className="p-2 text-slate-400 hover:bg-white hover:text-violet-600 rounded-xl transition-all shadow-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button onClick={() => handleDelete(task.id)} className="p-2 text-slate-400 hover:bg-white hover:text-rose-500 rounded-xl transition-all shadow-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskManagementPage;