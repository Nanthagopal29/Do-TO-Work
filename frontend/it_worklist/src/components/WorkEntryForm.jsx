import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const WorkEntryForm = () => {
  const navigate = useNavigate();
  const { username: rawUsername } = useParams();
  const username = decodeURIComponent(rawUsername || "");

  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  const storageKey = `workEntryForm_${username}`;

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
    return {
      username,
      entrydate: new Date().toISOString().split("T")[0],
      project: "",
      category: "",
      subcat: "",
      startdatetime: "",
      enddatetime: "",
      description: "",
    };
  });

  const [showDesc, setShowDesc] = useState(() => !!form.enddatetime);
  
  // NEW: State for form errors and submission status
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  useEffect(() => {
    loadMaster();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(form));
    // Clear specific field errors when user starts typing/selecting again
    if (Object.keys(errors).length > 0) {
      setErrors({}); 
    }
  }, [form, storageKey]);

  const loadMaster = async () => {
    try {
      const res = await axios.get(
        "http://10.1.21.80:8200/imp_reports/mas_worklist/"
      );
      const data = res.data;
      setProjects(data.filter((x) => x.type?.toLowerCase() === "app & report name"));
      setCategories(data.filter((x) => x.type?.toLowerCase() === "category"));
      setTasks(data.filter((x) => x.type?.toLowerCase() === "tasks"));
    } catch (err) {
      showToast("Failed to load master data.", "error");
    }
  };

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

  const startTime = () => {
    setForm((prev) => ({ ...prev, startdatetime: getDateTime() }));
  };

  const endTime = () => {
    setForm((prev) => ({ ...prev, enddatetime: getDateTime() }));
    setShowDesc(true);
  };

  // NEW: Comprehensive Validation Logic
  const validateForm = () => {
    const newErrors = {};

    if (!form.project) newErrors.project = "Project selection is required.";
    if (!form.category) newErrors.category = "Category selection is required.";
    if (!form.subcat) newErrors.subcat = "Task selection is required.";

    // Timer Validation
    if (!form.startdatetime) {
      newErrors.timer = "You must start the timer.";
    } else if (!form.enddatetime) {
      newErrors.timer = "You must stop the timer before submitting.";
    } else {
      // Logical check to ensure end time isn't mathematically before start time
      const start = new Date(form.startdatetime);
      const end = new Date(form.enddatetime);
      if (end < start) {
        newErrors.timer = "End time cannot be earlier than start time.";
      }
    }

    // Description String Validation (Length and emptiness)
    const desc = form.description.trim();
    if (!desc) {
      newErrors.description = "A description is required.";
    } else if (desc.length < 10) {
      newErrors.description = "Description is too short (minimum 10 characters).";
    } else if (desc.length > 500) {
      newErrors.description = "Description is too long (maximum 500 characters).";
    }

    setErrors(newErrors);
    
    // Return true if no errors exist
    return Object.keys(newErrors).length === 0;
  };

  const saveEntry = async () => {
    // Run Validation
    if (!validateForm()) {
      showToast("Please correct the highlighted errors.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const start = new Date(form.startdatetime);
      const end = new Date(form.enddatetime);
      
      // Ensure minutes is never negative if they stopped it in the same second
      const minutes = Math.max(0, Math.floor((end - start) / 60000)); 

      const payload = {
        username: form.username,
        entrydate: form.entrydate,
        project: form.project,
        category: form.category,
        subcat: form.subcat,
        startdatetime: form.startdatetime,
        startstatus: "Started",
        description: form.description.trim(), // Send trimmed description
        enddatetime: form.enddatetime,
        endstatus: "Completed",
        duration: minutes + " Minutes",
        durationminutes: minutes,
      };

      const res = await axios.post(
        "http://10.1.21.80:8200/imp_reports/trs_workentry/",
        payload
      );

      if (res.data.status) {
        showToast("Saved Successfully!", "success");
        localStorage.removeItem(storageKey);
        setTimeout(() => {
          navigate(`/user-report/${encodeURIComponent(username)}`);
        }, 1500);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Save Failed. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Base styling separated from validation states
  const baseInputClass = "w-full bg-slate-50 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:bg-white transition-all shadow-sm border";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  // Helper to dynamically apply error border classes
  const getInputClass = (fieldName) => {
    return `${baseInputClass} ${
      errors[fieldName] 
        ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500" 
        : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
    }`;
  };

  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}-${month}-${year}`;
  };

  const canStartTimer = form.project && form.category && form.subcat;

  return (
    <div className="min-h-screen bg-slate-100/50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-20 relative">
      
      {/* Toast Notification Popup */}
      {toast.show && (
        <div 
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ) : (
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          )}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Work Tracker
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              <p className="text-slate-600 text-sm font-medium">
                Active session for <span className="text-indigo-600 font-bold">{username}</span>
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
            onClick={() => navigate("/dashboard")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Switch User
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/40">
          
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">New Activity Log</h2>
              <p className="text-sm text-slate-500 mt-1">Select your task details below.</p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateForDisplay(form.entrydate)}
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Project Selection */}
            <div>
              <label className={labelClass}>Project Name <span className="text-red-500">*</span></label>
              <select
                className={getInputClass("project")}
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.description}>
                    {p.description}
                  </option>
                ))}
              </select>
              {errors.project && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.project}</p>}
            </div>

            {/* Category & Task Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                <select
                  className={getInputClass("category")}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.description}>
                      {c.description}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.category}</p>}
              </div>

              <div>
                <label className={labelClass}>Task <span className="text-red-500">*</span></label>
                <select
                  className={getInputClass("subcat")}
                  value={form.subcat}
                  onChange={(e) => setForm({ ...form, subcat: e.target.value })}
                >
                  <option value="">Select task...</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.description}>
                      {t.description}
                    </option>
                  ))}
                </select>
                {errors.subcat && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.subcat}</p>}
              </div>
            </div>

            {/* Time Tracking Section */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <label className={labelClass}>Time Tracking <span className="text-red-500">*</span></label>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                
                {/* Start Timer Button */}
                <button
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all duration-300 border-2 ${
                    form.startdatetime
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100 cursor-default"
                      : !canStartTimer 
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" 
                      : "bg-slate-900 text-white border-slate-900 hover:bg-indigo-600 hover:border-indigo-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                  disabled={!canStartTimer || !!form.startdatetime}
                  onClick={startTime}
                >
                  {form.startdatetime ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Started at {form.startdatetime.split(" ")[1]}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Start Timer
                    </>
                  )}
                </button>

                {/* Stop Timer Button */}
                <button
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all duration-300 border-2 ${
                    !form.startdatetime || form.enddatetime
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 shadow-sm"
                  }`}
                  disabled={!form.startdatetime || !!form.enddatetime}
                  onClick={endTime}
                >
                  {form.enddatetime ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      Ended at {form.enddatetime.split(" ")[1]}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                      Stop Timer
                    </>
                  )}
                </button>
              </div>
              {errors.timer && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.timer}</p>}
            </div>

            {/* Description & Submission */}
            {showDesc && (
              <div className="pt-6 mt-6 border-t border-slate-100 animate-in slide-in-from-top-4 fade-in duration-500">
                <div className="mb-6">
                  <label className={labelClass}>Activity Description <span className="text-red-500">*</span></label>
                  <textarea
                    className={`${getInputClass("description")} resize-none h-32 py-4`}
                    placeholder="Provide a brief summary of the work completed..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                  {/* Dynamic character counter and error text */}
                  <div className="flex justify-between items-center mt-2">
                    {errors.description ? (
                      <p className="text-rose-500 text-xs font-medium">{errors.description}</p>
                    ) : (
                      <p className="text-slate-400 text-xs">Minimum 10 characters.</p>
                    )}
                    <span className={`text-xs ${form.description.length > 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {form.description.length}/500
                    </span>
                  </div>
                </div>

                <button
                  className={`w-full font-bold py-4 rounded-xl transition-all duration-300 text-base shadow-lg flex items-center justify-center gap-2 ${
                    !form.description.trim() || isSubmitting
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none" 
                      : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:ring-4 focus:ring-indigo-100 text-white shadow-indigo-200 hover:-translate-y-0.5"
                  }`}
                  disabled={!form.description.trim() || isSubmitting}
                  onClick={saveEntry}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Submit Activity Log
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkEntryForm;