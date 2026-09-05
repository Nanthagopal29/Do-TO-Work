import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const WorkEntryForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username: rawUsername } = useParams();
  const username = decodeURIComponent(rawUsername || "");

  // --- API CONFIGURATION ---
  const WORK_ENTRY_API = "https://hfapi.herofashion.com/software_cost/trs_workentry/";
  const PAUSE_API = "https://hfapi.herofashion.com/software_cost/workentry_pause/";
  const TASK_MASTER_API = "https://hfapi.herofashion.com/software_cost/task_master/";

  // Master Data States
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  // Pause Modal State
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  const storageKey = `workEntryForm_${username}`;
  const pausedTasksKey = `pausedTasks_${username}`;

  // Helper to generate a fresh form state
  const getInitialForm = () => ({
    username,
    entrydate: new Date().toISOString().split("T")[0],
    project_id: "",
    project_name: "",
    category_id: "",
    category_name: "",
    subcategory_id: "",
    subcategory_name: "",
    task_id: "",
    task_name: "",
    startdatetime: "",
    enddatetime: "",
    description: "",
    totalPausedMs: 0,
    lastPauseTime: null,
    pause_start_str: null,
    startTimestamp: null,
    endTimestamp: null,
    formId: Date.now(),
    server_id: null,
    current_pause_id: null,
    isTaskLocked: false
  });

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.formId) parsed.formId = Date.now();
      return parsed;
    }
    return getInitialForm();
  });

  const [pausedTasks, setPausedTasks] = useState(() => {
    const saved = localStorage.getItem(pausedTasksKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [showDesc, setShowDesc] = useState(() => !!form.enddatetime);
  
  // State for form errors and UI locks
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // --- CONSOLIDATED DATA LOAD & SYNC ---
  useEffect(() => {
    let isMounted = true;
    
    const initData = async () => {
      try {
        // 1. Fetch Master Data First
        const [projRes, catRes, subcatRes, taskRes, userRes] = await Promise.all([
          axios.get("https://hfapi.herofashion.com/software_cost/project_master/"),
          axios.get("https://hfapi.herofashion.com/software_cost/category_master/"),
          axios.get("https://hfapi.herofashion.com/software_cost/subcategory_master/"),
          axios.get("https://hfapi.herofashion.com/software_cost/task_master/"),
          axios.get("https://hfapi.herofashion.com/software_cost/user_master/")
        ]);

        if (!isMounted) return;

        const projData = projRes.data || [];
        const catData = catRes.data || [];
        const subcatData = subcatRes.data || [];
        const taskData = taskRes.data || [];
        const usersList = userRes.data || [];

        setProjects(projData);
        setCategories(catData);
        setSubCategories(subcatData);
        setTasks(taskData);

        const matchedUser = usersList.find((u) => {
          const uName = (u.username || u.user_name || u.name || "").toLowerCase();
          return uName === username.toLowerCase() || String(u.id) === String(username);
        });
        setCurrentUser(matchedUser || null);

        // 2. Fetch Active Session
        let sessionRes;
        try {
          sessionRes = await axios.get(`${WORK_ENTRY_API}?name=${username}`);
        } catch(e) {
          sessionRes = { data: [] };
        }
        
        if (!isMounted) return;

        const runningSession = (sessionRes.data || []).find(
          e => e.username === username && e.endstatus === "Running"
        );

        if (runningSession) {
          // Robust ID Resolution: Protects against API dropping IDs by falling back to name mapping, route state, or local cache.
          const resolveId = (apiId, apiName, dataList, nameKey, fallbackId) => {
            if (apiId && apiId !== "null" && apiId !== "None") return apiId;
            if (apiName) {
              const match = dataList.find(item => String(item[nameKey]).trim().toLowerCase() === String(apiName).trim().toLowerCase());
              if (match) return match.id;
            }
            return fallbackId || "";
          };

          const routePId = location.state?.entryType === 'task' ? location.state?.projectId : null;
          const routeTId = location.state?.entryType === 'task' ? location.state?.taskId : null;

          setForm(prev => {
            const pId = resolveId(runningSession.project_id, runningSession.project, projData, 'project_name', routePId || prev.project_id);
            const cId = resolveId(runningSession.category_id, runningSession.category, catData, 'category_name', prev.category_id);
            const sId = resolveId(runningSession.subcategory_id, runningSession.subcat, subcatData, 'subcategory_name', prev.subcategory_id);
            const tId = resolveId(runningSession.task_id, runningSession.task_name || runningSession.task, taskData, 'task_name', routeTId || prev.task_id);

            return {
              ...prev,
              server_id: runningSession.id,
              project_id: pId,
              project_name: runningSession.project || prev.project_name || "",
              category_id: cId,
              category_name: runningSession.category || prev.category_name || "",
              subcategory_id: sId,
              subcategory_name: runningSession.subcat || prev.subcategory_name || "",
              task_id: tId,
              task_name: runningSession.task_name || runningSession.task || prev.task_name || "",
              startdatetime: runningSession.startdatetime,
              startTimestamp: prev.startTimestamp || new Date(runningSession.startdatetime.replace(" ", "T")).getTime(),
              description: runningSession.description === "Activity running..." ? (prev.description || "") : runningSession.description,
              isTaskLocked: true
            };
          });
          
          showToast("Resumed active session from server.", "success");
        } 
        else {
          // 3. Process Route Navigation State (Only if NO session is running)
          if (location.state?.entryType === 'task' && location.state.projectId && location.state.taskId) {
            const p = projData.find(x => String(x.id) === String(location.state.projectId));
            const t = taskData.find(x => String(x.id) === String(location.state.taskId));
            
            if (p && t) {
              setForm(prev => ({
                ...getInitialForm(),
                project_id: p.id,
                project_name: p.project_name,
                category_id: "", 
                category_name: "", 
                subcategory_id: "", 
                subcategory_name: "", 
                task_id: t.id,
                task_name: t.task_name,
                isTaskLocked: true // Lock dropdowns for Project & Task
              }));
            }
          } else if (location.state?.entryType === 'manual') {
            setForm(getInitialForm());
            localStorage.removeItem(storageKey);
          }
        }

        // 4. Safely clear the route state so it doesn't trigger repeatedly
        if (location.state?.entryType) {
          setTimeout(() => {
            navigate(location.pathname, { replace: true, state: {} });
          }, 10);
        }

      } catch (err) {
        if (isMounted) showToast("Failed to load master data.", "error");
      }
    };

    initData();

    return () => {
      isMounted = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, storageKey]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({}); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.project_id, form.category_id, form.subcategory_id, form.task_id, form.description]);

  const getDateTime = () => {
    const d = new Date();
    return (
      d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0") + " " +
      String(d.getHours()).padStart(2, "0") + ":" +
      String(d.getMinutes()).padStart(2, "0") + ":" +
      String(d.getSeconds()).padStart(2, "0")
    );
  };

  const updateTaskStatus = async (newStatus) => {
    if (!form.task_id) return;
    const taskObj = tasks.find(t => Number(t.id) === Number(form.task_id));
    if (!taskObj) return;

    try {
      await axios.put(TASK_MASTER_API, {
        ...taskObj,
        task_status: newStatus,
        updated_at: new Date().toISOString()
      });
      setTasks(prev => prev.map(t => Number(t.id) === Number(form.task_id) ? { ...t, task_status: newStatus } : t));
    } catch (error) {
      console.error(`Failed to update task status to ${newStatus}`, error);
    }
  };

  const startTime = async () => {
    if (!form.project_id || !form.category_id || !form.subcategory_id || !form.task_id) {
      showToast("Please ensure all fields are selected.", "error");
      return;
    }

    setIsStarting(true);
    const nowStr = getDateTime();
    const startMs = Date.now();

    setForm((prev) => ({ 
      ...prev, 
      startdatetime: nowStr,
      startTimestamp: startMs 
    }));

    try {
      const payload = {
        username: form.username,
        entrydate: form.entrydate,
        project: form.project_name,
        project_id: form.project_id,
        category: form.category_name,
        category_id: form.category_id,
        subcat: form.subcategory_name, 
        subcategory_id: form.subcategory_id,
        task_name: form.task_name,
        task_id: form.task_id,
        startdatetime: nowStr,
        startstatus: "Started",
        description: "Activity running...",
        enddatetime: null,
        endstatus: "Running",
        duration: "0 Minutes",
        durationminutes: 0,
      };

      const res = await axios.post(WORK_ENTRY_API, payload);
      
      setForm((prev) => ({
        ...prev,
        server_id: res.data?.id || null 
      }));

      await updateTaskStatus("In Progress");

      showToast("Timer started and synced to server.", "success");
    } catch (err) {
      showToast("Timer started locally.", "warning");
    } finally {
      setIsStarting(false);
    }
  };

  const endTime = () => {
    setForm((prev) => ({ 
      ...prev, 
      enddatetime: getDateTime(),
      endTimestamp: Date.now()
    }));
    setShowDesc(true);
  };

  const handlePauseCurrentTask = async (reason = "") => {
    if (!form.startdatetime || form.enddatetime) return null;
    if (!form.server_id) {
      showToast("Cannot pause. Session is not synced with server.", "error");
      return null;
    }

    const pauseStartStr = getDateTime();
    const pauseStartMs = Date.now();

    try {
      const res = await axios.post(PAUSE_API, {
        workentry_id: form.server_id,
        pause_start_time: pauseStartStr,
        pause_reason: reason 
      });

      const db_pause_id = res.data?.id || res.data?.data?.id;

      return { 
        ...form, 
        lastPauseTime: pauseStartMs,
        pause_start_str: pauseStartStr,
        current_pause_id: db_pause_id, 
        formId: form.formId || Date.now()
      };
    } catch (err) {
      showToast("Failed to save pause to server.", "error");
      return null;
    }
  };

  const pauseTask = async (reason) => {
    setIsPausing(true);
    const pausedForm = await handlePauseCurrentTask(reason);
    
    if (pausedForm) {
      await updateTaskStatus("On Hold");

      const newPaused = [...pausedTasks, pausedForm];
      setPausedTasks(newPaused);
      localStorage.setItem(pausedTasksKey, JSON.stringify(newPaused));
      
      setForm(getInitialForm()); 
      setShowDesc(false);
      showToast("Task paused successfully.", "success");
    }
    setIsPausing(false);
  };

  const resumeTask = async (taskId) => {
    const taskToResume = pausedTasks.find(t => t.formId === taskId);
    if (!taskToResume) return;

    let newPausedList = [...pausedTasks];

    if (form.startdatetime && !form.enddatetime) {
      setIsPausing(true);
      const pausedForm = await handlePauseCurrentTask("Switched to resume another task");
      setIsPausing(false);
      
      if (!pausedForm) return; 
      
      newPausedList.push(pausedForm);
      await updateTaskStatus("On Hold"); 
    }

    const pauseEndStr = getDateTime();
    const nowMs = Date.now();

    if (taskToResume.current_pause_id) {
      try {
        await axios.put(PAUSE_API, {
          id: taskToResume.current_pause_id, 
          workentry_id: taskToResume.server_id,
          pause_start_time: taskToResume.pause_start_str,
          pause_end_time: pauseEndStr
        });
      } catch (apiErr) {
        showToast("Server rejected pause update. Check console.", "error");
        console.error("Resume Update Error:", apiErr.response?.data || apiErr.message);
      }
    }

    try {
      const pauseStartMs = taskToResume.lastPauseTime;
      const pausedDuration = pauseStartMs ? (nowMs - pauseStartMs) : 0;
      
      taskToResume.totalPausedMs = (taskToResume.totalPausedMs || 0) + pausedDuration;
      taskToResume.lastPauseTime = null;
      taskToResume.current_pause_id = null; 
      
      newPausedList = newPausedList.filter(t => t.formId !== taskId);
      
      setPausedTasks(newPausedList);
      localStorage.setItem(pausedTasksKey, JSON.stringify(newPausedList));
      
      setForm({
        ...taskToResume,
        project_id: taskToResume.project_id ? Number(taskToResume.project_id) : "",
        category_id: taskToResume.category_id ? Number(taskToResume.category_id) : "",
        subcategory_id: taskToResume.subcategory_id ? Number(taskToResume.subcategory_id) : "",
        task_id: taskToResume.task_id ? Number(taskToResume.task_id) : "",
        isTaskLocked: true
      });
      setShowDesc(!!taskToResume.enddatetime); 
      
      const tObj = tasks.find(t => Number(t.id) === Number(taskToResume.task_id));
      if (tObj) {
        axios.put(TASK_MASTER_API, { ...tObj, task_status: "In Progress", updated_at: new Date().toISOString() })
             .then(() => setTasks(prev => prev.map(t => Number(t.id) === Number(tObj.id) ? { ...t, task_status: "In Progress" } : t)));
      }

      showToast("Task resumed successfully.", "success");
    } catch (err) {
      showToast("Failed to process resume locally.", "error");
    }
  };

  const clearForm = () => {
    if (window.confirm("Are you sure you want to discard this current entry?")) {
      setForm(getInitialForm()); 
      setShowDesc(false);
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.project_id) newErrors.project = "Required";
    if (!form.category_id) newErrors.category = "Required";
    if (!form.subcategory_id) newErrors.subcategory = "Required";
    if (!form.task_id) newErrors.task = "Required";

    if (!form.startdatetime) {
      newErrors.timer = "Start the timer before submitting.";
    } else if (!form.enddatetime) {
      newErrors.timer = "Stop the timer before submitting.";
    }

    const desc = form.description.trim();
    if (!desc) {
      newErrors.description = "Required";
    } else if (desc.length < 10) {
      newErrors.description = "Min 10 characters required.";
    } else if (desc.length > 500) {
      newErrors.description = "Max 500 characters allowed.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseTime = (timeStr, timestamp) => {
    if (timestamp) return timestamp;
    if (!timeStr) return Date.now();
    return new Date(timeStr.replace(" ", "T")).getTime();
  };

  const saveEntry = async () => {
    if (!validateForm()) {
      showToast("Please correct the highlighted errors.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const startMs = parseTime(form.startdatetime, form.startTimestamp);
      const endMs = parseTime(form.enddatetime, form.endTimestamp);
      const pausedMs = form.totalPausedMs || 0;
      
      const activeMs = (endMs - startMs) - pausedMs;
      const minutes = Math.max(0, Math.floor(activeMs / 60000)); 

      const payload = {
        username: form.username,
        entrydate: form.entrydate,
        project: form.project_name,
        project_id: form.project_id,
        category: form.category_name,
        category_id: form.category_id,
        subcat: form.subcategory_name, 
        subcategory_id: form.subcategory_id,
        task_name: form.task_name,
        task_id: form.task_id,
        startdatetime: form.startdatetime,
        startstatus: "Started",
        description: form.description.trim(),
        enddatetime: form.enddatetime || null, 
        endstatus: "Completed",
        duration: minutes + " Minutes",
        durationminutes: minutes,
      };

      let res;
      if (form.server_id) {
        res = await axios.put(`${WORK_ENTRY_API}${form.server_id}/`, payload);
      } else {
        res = await axios.post(WORK_ENTRY_API, payload);
      }

      if (res.data.status) {
        await updateTaskStatus("Complete");

        showToast("Saved Successfully!", "success");
        setForm(getInitialForm()); 
        localStorage.removeItem(storageKey);
        setTimeout(() => {
          navigate(`/work_list/user-report/${encodeURIComponent(username)}`);
        }, 1500);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Save Failed. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseInputClass = "block w-full bg-slate-50 text-slate-900 text-sm rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:bg-white transition-all shadow-sm disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  const getInputClass = (fieldName) => {
    return `${baseInputClass} ${
      errors[fieldName] 
        ? "border-rose-300 focus:ring-rose-200 focus:border-rose-400" 
        : "border-slate-200 focus:ring-indigo-100 focus:border-indigo-400"
    }`;
  };

  // Improved tasks filter to ensure currently selected task is always visible
  const userTasks = tasks.filter((t) => {
    if (form.task_id && String(t.id) === String(form.task_id)) return true;

    const matchesProject = form.project_id ? String(t.project_id) === String(form.project_id) : true;
    
    let matchesUser = true;
    if (currentUser) {
      const targetUserId = currentUser.id;
      const targetUserCode = currentUser.code_id || currentUser.user_code;
      matchesUser = 
        String(t.code_id) === String(targetUserId) ||
        (targetUserCode && String(t.code_id) === String(targetUserCode)) ||
        (t.user_id && String(t.user_id) === String(targetUserId));
    }

    return matchesProject && matchesUser;
  });

  const canStartTimer = form.project_id && form.category_id && form.subcategory_id && form.task_id;
  const isLocked = !!form.startdatetime;
  const isTaskLocked = form.isTaskLocked || false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-20 relative">
      
      {/* TOAST UI */}
      {toast.show && (
        <div 
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in border ${
            toast.type === "success" 
              ? "bg-emerald-500/90 text-white border-emerald-400" 
              : "bg-rose-500/90 text-white border-rose-400"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01"></path></svg>
          )}
          <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* PAUSE MODAL UI */}
      {showPauseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                 <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Pause Task
              </h3>
              <button onClick={() => setShowPauseModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 hover:bg-slate-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Reason for pausing <span className="text-slate-400 normal-case font-medium">(Optional)</span>
              </label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none h-28 transition-all shadow-inner"
                placeholder="e.g., Waiting for client feedback, taking a break, switching priorities..."
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              ></textarea>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowPauseModal(false)} 
                className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPauseModal(false);
                  pauseTask(pauseReason);
                  setPauseReason("");
                }}
                className="px-5 py-2.5 font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 hover:shadow-amber-300 hover:-translate-y-0.5 text-sm flex items-center gap-2"
              >
                Save & Pause
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Work Entry Log</h1>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              <p className="text-slate-500 text-sm font-medium">
                Session active for <span className="text-slate-900 font-bold">{username}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {(form.project_id || form.startdatetime) && (
              <button onClick={clearForm} className="text-sm font-semibold text-rose-600 hover:bg-rose-50 px-5 py-2.5 rounded-xl transition-colors border border-transparent hover:border-rose-200">
                Discard Draft
              </button>
            )}
            <button
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-indigo-600 px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 transition-all duration-200"
              onClick={() => navigate("/work_list/dashboard")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Switch User
            </button>
          </div>
        </div>

        {/* --- MAIN FORM GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Context Selection */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm shadow-slate-200/50 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Task Details</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {/* PROJECT */}
              <div>
                <label className={labelClass}>Project <span className="text-rose-500">*</span></label>
                <select
                  className={getInputClass("project")}
                  value={form.project_id}
                  onChange={(e) => {
                    const selected = projects.find(p => Number(p.id) === Number(e.target.value));
                    setForm({ ...form, project_id: selected ? selected.id : "", project_name: selected ? selected.project_name : "", task_id: "", task_name: "" });
                  }}
                  disabled={isLocked || isTaskLocked}
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
                {errors.project && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.project}</p>}
              </div>

              {/* CATEGORY */}
              <div>
                <label className={labelClass}>Category <span className="text-rose-500">*</span></label>
                <select
                  className={getInputClass("category")}
                  value={form.category_id}
                  onChange={(e) => {
                    const selected = categories.find(c => Number(c.id) === Number(e.target.value));
                    setForm({ ...form, category_id: selected ? selected.id : "", category_name: selected ? selected.category_name : "", subcategory_id: "", subcategory_name: "" });
                  }}
                  disabled={isLocked}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
                {errors.category && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.category}</p>}
              </div>

              {/* SUBCATEGORY */}
              <div>
                <label className={labelClass}>Subcategory <span className="text-rose-500">*</span></label>
                <select
                  className={getInputClass("subcategory")}
                  value={form.subcategory_id}
                  onChange={(e) => {
                    const selected = subCategories.find(s => Number(s.id) === Number(e.target.value));
                    setForm({ ...form, subcategory_id: selected ? selected.id : "", subcategory_name: selected ? (selected.subcategory_name || `Subcategory ${selected.id}`) : "" });
                  }}
                  disabled={!form.category_id || isLocked}
                >
                  <option value="">Select subcategory...</option>
                  {form.category_id && subCategories.filter(s => Number(s.category_id) === Number(form.category_id)).map((s) => (
                    <option key={s.id} value={s.id}>{s.subcategory_name || `Subcategory ${s.id}`}</option>
                  ))}
                </select>
                {errors.subcategory && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.subcategory}</p>}
              </div>

              {/* TASK */}
              <div>
                <label className={labelClass}>Task <span className="text-rose-500">*</span></label>
                <select
                  className={getInputClass("task")}
                  value={form.task_id}
                  onChange={(e) => {
                    const selected = tasks.find(t => Number(t.id) === Number(e.target.value));
                    setForm({ ...form, task_id: selected ? selected.id : "", task_name: selected ? selected.task_name : "" });
                  }}
                  disabled={!form.project_id || isLocked || isTaskLocked}
                >
                  <option value="">Select task...</option>
                  {userTasks.map((t) => <option key={t.id} value={t.id}>{t.task_name} {t.task_description ? `- ${t.task_description}` : ""}</option>)}
                </select>
                {errors.task && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.task}</p>}
              </div>
            </div>

            {/* DESCRIPTION FIELD (Revealed on Stop) */}
            {showDesc && (
              <div className="mt-10 animate-in slide-in-from-top-4 fade-in duration-500">
                <label className={labelClass}>Work Description <span className="text-rose-500">*</span></label>
                <textarea
                  className={`${getInputClass("description")} resize-none h-32 py-3`}
                  placeholder="Summarize the work completed in detail..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.description ? (
                    <p className="text-rose-500 text-xs font-medium">{errors.description}</p>
                  ) : (
                    <p className="text-slate-400 text-xs font-medium">Minimum 10 characters required.</p>
                  )}
                  <span className={`text-xs font-bold ${form.description.length > 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {form.description.length}/500
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Time Tracking & Submission */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Timer Card */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm shadow-slate-200/50 p-6 sm:p-8 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-80"></div>
              
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Time Tracking</h2>
              </div>
              
              <div className="flex-1 flex flex-col justify-center gap-5">
                
                {/* START BUTTON */}
                <button
                  className={`w-full flex items-center justify-center gap-2.5 font-bold py-3.5 px-5 rounded-xl transition-all duration-300 ${
                    form.startdatetime
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default"
                      : !canStartTimer 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent" 
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5"
                  }`}
                  disabled={!canStartTimer || !!form.startdatetime || isStarting}
                  onClick={startTime}
                >
                  {isStarting ? (
                     <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : form.startdatetime ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Started at {form.startdatetime.split(" ")[1]}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Start Timer
                    </>
                  )}
                </button>

                {/* PAUSE BUTTON (Triggers Modal now) */}
                {form.startdatetime && !form.enddatetime && (
                  <button
                    className="w-full flex items-center justify-center gap-2.5 font-bold py-3.5 px-5 rounded-xl transition-all duration-300 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 hover:shadow-amber-300 hover:-translate-y-0.5 disabled:opacity-70"
                    onClick={() => setShowPauseModal(true)}
                    disabled={isPausing}
                  >
                    {isPausing ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Pause & Switch Task
                      </>
                    )}
                  </button>
                )}

                {/* STOP BUTTON */}
                <button
                  className={`w-full flex items-center justify-center gap-2.5 font-bold py-3.5 px-5 rounded-xl transition-all duration-300 ${
                    !form.startdatetime || form.enddatetime
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent"
                      : "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5"
                  }`}
                  disabled={!form.startdatetime || !!form.enddatetime}
                  onClick={endTime}
                >
                  {form.enddatetime ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      Ended at {form.enddatetime.split(" ")[1]}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                      Stop Timer
                    </>
                  )}
                </button>
                
                {errors.timer && <p className="text-rose-500 text-sm font-medium text-center mt-1">{errors.timer}</p>}
              </div>

              {/* SUBMIT BUTTON */}
              {showDesc && (
                <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-4 fade-in">
                  <button
                    className={`w-full font-bold py-3.5 px-5 rounded-xl transition-all duration-300 text-base flex items-center justify-center gap-2.5 ${
                      !form.description.trim() || isSubmitting
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent" 
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
                    }`}
                    disabled={!form.description.trim() || isSubmitting}
                    onClick={saveEntry}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Saving Entry...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Submit Work Log
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- PAUSED TASKS SECTION --- */}
        {pausedTasks.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm shadow-slate-200/50 p-6 sm:p-8 mt-4 animate-in slide-in-from-bottom-4 fade-in duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
            
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Paused Tasks 
              <span className="bg-amber-50 text-amber-600 py-1 px-2.5 rounded-md text-sm">{pausedTasks.length}</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pausedTasks.map(task => (
                <div key={task.formId} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all duration-300 group">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base truncate" title={task.project_name || task.project}>
                      {task.project_name || task.project}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-1.5 truncate">
                      {task.category_name || task.category} <span className="text-slate-300 mx-1.5">&bull;</span> <span className="text-slate-700">{task.task_name || "No Task"}</span>
                    </p>
                    <div className="text-xs font-bold text-amber-700 bg-amber-100/80 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mt-4 border border-amber-200/50">
                      Started at {task.startdatetime?.split(" ")[1]}
                    </div>
                  </div>
                  <button
                    onClick={() => resumeTask(task.formId)}
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-indigo-600 font-bold py-2.5 px-4 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm transition-all text-sm group-hover:text-indigo-700"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Resume Task
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkEntryForm;