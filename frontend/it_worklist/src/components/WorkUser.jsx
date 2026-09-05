import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  User, ArrowLeft, Plus, FileText, 
  ClipboardList, Clock, Sparkles, Loader2, Play, Calendar
} from "lucide-react";

// IMPORTANT: Adjust the import path to wherever your context is defined
import { UserContext } from "../../../UserContext";

const UserSelect = () => {
  const navigate = useNavigate();
  
  // Data states
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  // Loading & UI states
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Consume the UserContext
  const { 
    username: currentUser, 
    setUsername, 
    setUserId,  
    setRole 
  } = useContext(UserContext);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [usersRes, tasksRes, attendanceRes] = await Promise.all([
        axios.get("https://hfapi.herofashion.com/software_cost/user_master/"),
        axios.get("https://hfapi.herofashion.com/software_cost/task_master/"),
        axios.get("https://hfapi.herofashion.com/n8n/ws_attendance/").catch(() => ({ data: [] }))
      ]);

      setUsers(usersRes.data.filter((x) => x.user_status === true));
      setTasks(tasksRes.data);
      
      const attendanceData = Array.isArray(attendanceRes.data) 
        ? attendanceRes.data 
        : (attendanceRes.data?.data || []);
      setAttendance(attendanceData);
      
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (user, actionType, e) => {
    e.stopPropagation();
    
    setUsername(user.user_name);
    setUserId(user.id);
    setRole(user.user_role);

    if (actionType === 'manual_entry') {
      navigate(`/work_list/work-entry/${encodeURIComponent(user.user_name)}`, {
        state: { entryType: 'manual' }
      });
    } else {
      navigate(`/work_list/user-report/${encodeURIComponent(user.user_name)}`);
    }
  };

  const handleTaskEntry = async (user, task, e) => {
    e.stopPropagation();
    
    setUsername(user.user_name);
    setUserId(user.id);
    setRole(user.user_role);

    try {
      const payload = {};
      
      // SQL-safe datetime formatter (YYYY-MM-DD HH:mm:ss)
      const formatDateTime = (date) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };

      const now = formatDateTime(new Date());

      // Update start date if it doesn't exist
      if (!task.task_start_date) {
        payload.task_start_date = now;
      }

      // Update end date only if the task is being marked as complete
      if (task.task_status === "Complete" || task.task_status === "Completed") {
        if (!task.task_end_date) {
          payload.task_end_date = now;
        }
      }

      // Execute PATCH if there's data to update
      if (Object.keys(payload).length > 0) {
        // NOTE: If your backend still returns 404 here, you need to fix Django (see below)
        await axios.patch(`https://hfapi.herofashion.com/software_cost/task_master/${task.id}/`, payload);
        
        // Alternative: If your API requires the ID in the body to the base URL, use this instead:
        // await axios.patch(`https://hfapi.herofashion.com/software_cost/task_master/`, { ...payload, id: task.id });
      }
    } catch (error) {
      console.error("Failed to update task dates", error);
    }

    // Navigate to entry screen
    navigate(`/work_list/work-entry/${encodeURIComponent(user.user_name)}`, {
      state: { 
        entryType: 'task',
        projectId: task.project_id,
        taskId: task.id
      }
    });
  };

  const goHome = () => {
    navigate("/work_list");
  };

  const filteredUsers = users.filter((u) => {
    return String(u.code) === String(currentUser) || String(u.user_name) === String(currentUser);
  });

  const activeUser = filteredUsers.length > 0 ? filteredUsers[0] : null;

  let userPhoto = null;
  if (activeUser) {
    if (attendance && attendance.length > 0) {
      const matchedRecord = attendance.find(a => 
        String(a.emp_code).trim() === String(activeUser.code).trim()
      );
      if (matchedRecord && matchedRecord.pic) {
        userPhoto = matchedRecord.pic;
      }
    }
    
    if (!userPhoto) {
      userPhoto = `https://app.herofashion.com/staff_images/${activeUser.code}.jpg`;
    }
  }

  const activeTasks = tasks.filter(t => 
    activeUser && 
    String(t.code_id) === String(activeUser.id) &&
    t.task_status !== "Complete" && 
    t.task_status !== "Completed"
  );

  const calculateAgeing = (assignDate) => {
    if (!assignDate) return "N/A";
    const start = new Date(assignDate);
    const now = new Date();
    
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}h`;
  };

  // Calculate Start Time Ageing (Start Date - Assign Date)
  const calculateStartTimeAgeing = (assignDate, startDate) => {
    if (!assignDate || !startDate) return "N/A";
    const assign = new Date(assignDate);
    const start = new Date(startDate);
    
    const diffTime = Math.abs(start - assign);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}h`;
  };

  // Indian Date Format Helper
  const formatIndianDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Status Display Helper
  const getStatusDisplay = (status) => {
    switch(status) {
      case "Pending": return "⏳ Pending";
      case "In Progress": return "🚀 In Progress";
      case "On Hold": return "⏸️ On Hold";
      case "Complete": return "✅ Complete";
      default: return `⏳ ${status || 'Pending'}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 selection:bg-blue-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <button 
            onClick={goHome}
            className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 group-hover:border-blue-200 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Back to Dashboard
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        )}

        {!isLoading && activeUser && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-50 h-50 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 -z-10 transform translate-x-20 -translate-y-10"></div>
            
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 shrink-0 overflow-hidden relative">
                {userPhoto && !imageError ? (
                  <img 
                    src={userPhoto} 
                    alt={activeUser.user_name} 
                    className="w-full h-full bg-gray-100"
                    onError={() => setImageError(true)} 
                  />
                ) : (
                  <span>
                    {activeUser.user_name ? activeUser.user_name.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </div>
              
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-1">
                  {activeUser.user_name}
                </h1>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span>{activeUser.user_role || "Employee"}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-400">ID: {activeUser.code}</span>
                </div>
              </div>
            </div>

            <div className="flex w-full md:w-auto items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 z-10">
              <button
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={(e) => handleAction(activeUser, 'manual_entry', e)}
              >
                <Plus size={18} strokeWidth={2.5} />
                Manual Entry
              </button>
              <button
                className="flex-1 md:flex-none bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={(e) => handleAction(activeUser, 'report', e)}
              >
                <FileText size={18} />
                Report
              </button>
            </div>
          </div>
        )}

        {!isLoading && !activeUser && (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <User className="text-slate-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h3>
            <p className="text-slate-500 max-w-md">
              We couldn't find a matching profile for <span className="font-semibold text-slate-700">{currentUser}</span>. 
            </p>
          </div>
        )}

        {!isLoading && activeUser && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <ClipboardList size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Active Tasks</h2>
              </div>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                {activeTasks.length} Pending
              </span>
            </div>
            
            {activeTasks.length === 0 ? (
               <div className="py-16 px-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                   <Sparkles size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">You're all caught up!</h3>
                 <p className="text-slate-500 font-medium">There are no pending tasks assigned to you right now.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {activeTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative"
                  >
                    {/* Left: Task Details */}
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-base font-bold text-slate-800 mb-1 truncate">
                        {task.task_name}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {task.task_description || "No specific details provided."}
                      </p>
                    </div>
                    
                    {/* Right: Side-by-Side Metadata & Actions */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      
                      {/* Assigned Date - Indian Format */}
                      <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        Assigned: {formatIndianDate(task.assing_date)}
                      </div>
                      
                      {/* Current Ageing */}
                      <div className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 text-sm font-bold rounded-lg flex items-center gap-1.5">
                        <Clock size={14} />
                        Ageing: {calculateAgeing(task.assing_date)} 
                      </div>

                      {/* Start Time Ageing */}
                      {task.task_start_date && (
                        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 text-sm font-bold rounded-lg flex items-center gap-1.5">
                          <Clock size={14} />
                          Start Ageing: {calculateStartTimeAgeing(task.assing_date, task.task_start_date)} 
                        </div>
                      )}

                        {/* Status Display Field */}
                      <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg flex items-center gap-1.5">
                        {getStatusDisplay(task.task_status)}
                      </div>

                      {/* Task Entry Button */}
                      <button
                        onClick={(e) => handleTaskEntry(activeUser, task, e)}
                        className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-sm font-semibold py-1.5 px-4 rounded-lg transition-colors ml-2"
                      >
                        <Play size={14} className="fill-indigo-600" />
                        Task Entry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSelect;