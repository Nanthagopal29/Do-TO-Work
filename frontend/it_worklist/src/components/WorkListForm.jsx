import React, { useState, useEffect } from "react";

const BASE_API_URL = "https://hfapi.herofashion.com/software_cost";
const ATTENDANCE_API_URL = "https://hfapi.herofashion.com/n8n/ws_attendance/";

const WorkListForm = ({ onBack }) => {
  // Tab Management
  const [activeTab, setActiveTab] = useState("users");
  
  // Data State
  const [data, setData] = useState({
    users: [],
    projects: [],
    categories: [],
    subcategories: [],
  });
  
  // Photos State
  const [empPhotos, setEmpPhotos] = useState({});

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({});

  // Endpoints configuration
  const endpoints = {
    users: "/user_master/",
    projects: "/project_master/",
    categories: "/category_master/",
    subcategories: "/subcategory_master/",
  };

  useEffect(() => {
    fetchAllData();
    fetchPhotos();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, projectsRes, categoriesRes, subcategoriesRes] = await Promise.all([
        fetch(`${BASE_API_URL}${endpoints.users}`),
        fetch(`${BASE_API_URL}${endpoints.projects}`),
        fetch(`${BASE_API_URL}${endpoints.categories}`),
        fetch(`${BASE_API_URL}${endpoints.subcategories}`),
      ]);

      setData({
        users: await usersRes.json(),
        projects: await projectsRes.json(),
        categories: await categoriesRes.json(),
        subcategories: await subcategoriesRes.json(),
      });
    } catch (err) {
      setError("Failed to fetch data from the server.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch(ATTENDANCE_API_URL);
      const jsonResponse = await res.json();
      
      const attendanceData = Array.isArray(jsonResponse) 
        ? jsonResponse 
        : jsonResponse.data || jsonResponse.result || Object.values(jsonResponse);

      const photoMap = {};
      if (Array.isArray(attendanceData)) {
        attendanceData.forEach(emp => {
          if (emp && emp.emp_code && emp.pic) {
            photoMap[emp.emp_code.toString().trim()] = emp.pic;
          }
        });
      }
      
      setEmpPhotos(photoMap);
    } catch (err) {
      console.error("Failed to fetch employee photos.", err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({ ...item });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}${endpoints[activeTab]}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete record");
      await fetchAllData();
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
      const payload = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch(`${BASE_API_URL}${endpoints[activeTab]}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save data");
      await fetchAllData();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Soft UI Styling Constants ---
  const inputGroupStyle = "space-y-1.5 w-full";
  const labelStyle = "block text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1";
  const inputStyle = "w-full bg-slate-100/50 border border-transparent rounded-2xl px-4 py-3.5 text-sm text-slate-700 outline-none focus:bg-white focus:border-violet-300 focus:ring-4 focus:ring-violet-50 transition-all hover:bg-slate-100 placeholder:text-slate-400 shadow-sm";

  // --- Render Helpers --- //
  const renderHeader = () => (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6 mb-6 lg:mb-10">
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
        <h1 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 tracking-tight">
          System Setup
        </h1>
        <p className="text-slate-500 mt-1 lg:mt-2 font-medium text-sm lg:text-base">Manage and configure master records seamlessly.</p>
      </div>

      {/* Floating Pill Navigation */}
      <div className="bg-white/70 backdrop-blur-xl p-1.5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex overflow-x-auto custom-scrollbar w-full lg:w-auto snap-x">
        {[
          { id: "users", label: "Users", icon: "👩‍💻", count: data.users.length },
          { id: "projects", label: "Projects", icon: "🚀", count: data.projects.length },
          { id: "categories", label: "Categories", icon: "📂", count: data.categories.length },
          { id: "subcategories", label: "Sub", icon: "📁", count: data.subcategories.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 lg:gap-2 px-4 lg:px-5 py-2.5 rounded-full text-xs lg:text-sm font-bold transition-all whitespace-nowrap snap-start shrink-0 ${
              activeTab === tab.id
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "text-slate-500 hover:bg-white hover:text-slate-800"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFormFields = () => {
    switch (activeTab) {
      case "users":
        return (
          <>
            <div className={inputGroupStyle}>
              <label className={labelStyle}>Full Name <span className="text-rose-500">*</span></label>
              <input type="text" name="user_name" value={formData.user_name || ""} onChange={handleChange} required className={inputStyle} placeholder="Enter Name" />
            </div>
            {/* Switched from grid-cols-2 to responsive grid-cols-1 sm:grid-cols-2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={inputGroupStyle}>
                <label className={labelStyle}>User Code</label>
                <input type="text" name="code" value={formData.code || ""} onChange={handleChange} className={inputStyle} placeholder="Enter User Code" />
              </div>
              <div className={inputGroupStyle}>
                <label className={labelStyle}>Hourly Rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₹</span>
                  <input type="number" name="cost_per_hour" value={formData.cost_per_hour || ""} onChange={handleChange} className={`${inputStyle} pl-8`} placeholder="Enter Hourly Rate" />
                </div>
              </div>
            </div>
            <div className={inputGroupStyle}>
              <label className={labelStyle}>Designation / Role</label>
              <input type="text" name="user_role" value={formData.user_role || ""} onChange={handleChange} className={inputStyle} placeholder="UI/UX Designer" />
            </div>
            <div className="pt-2 w-full">
               <label className="flex items-center gap-3 cursor-pointer p-3 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors w-full">
                 <input type="checkbox" name="user_status" checked={formData.user_status || false} onChange={handleChange} className="w-5 h-5 shrink-0 rounded-md border-slate-300 text-violet-600 focus:ring-violet-500" />
                 <span className="text-sm font-bold text-slate-700">Account is Active</span>
               </label>
            </div>
          </>
        );
      case "projects":
        return (
          <>
            <div className={inputGroupStyle}>
              <label className={labelStyle}>Project Name <span className="text-rose-500">*</span></label>
              <input type="text" name="project_name" value={formData.project_name || ""} onChange={handleChange} required className={inputStyle} placeholder="HeroApp Redesign" />
            </div>
            <div className={inputGroupStyle}>
              <label className={labelStyle}>Description</label>
              <textarea name="project_description" value={formData.project_description || ""} onChange={handleChange} className={`${inputStyle} min-h-[120px] resize-y`} placeholder="Write a brief overview..."></textarea>
            </div>
          </>
        );
      case "categories":
        return (
          <div className={inputGroupStyle}>
            <label className={labelStyle}>Category Name <span className="text-rose-500">*</span></label>
            <input type="text" name="category_name" value={formData.category_name || ""} onChange={handleChange} required className={inputStyle} placeholder="Frontend Development" />
          </div>
        );
      case "subcategories":
        return (
          <>
            <div className={inputGroupStyle}>
              <label className={labelStyle}>Parent Category <span className="text-rose-500">*</span></label>
              <select name="category_id" value={formData.category_id || ""} onChange={handleChange} required className={inputStyle}>
                <option value="">Choose Parent</option>
                {data.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
            <div className={inputGroupStyle}>
              <label className={labelStyle}>Subcategory Name <span className="text-rose-500">*</span></label>
              <input type="text" name="subcategory_name" value={formData.subcategory_name || ""} onChange={handleChange} required className={inputStyle} placeholder="React Component" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderListItems = () => {
    const activeData = data[activeTab] || [];

    if (activeData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 lg:py-20 text-center">
          <div className="text-5xl lg:text-6xl mb-4 opacity-50">👻</div>
          <h3 className="text-lg font-bold text-slate-700">It's quiet in here...</h3>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">No {activeTab} have been created yet.</p>
        </div>
      );
    }

    if (activeTab === "users") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {activeData.map((user) => {
            const userPhotoUrl = user.code ? empPhotos[user.code.toString()] : null;

            return (
              <div key={user.id} className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100/50 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row gap-4 justify-between group">
                <div className="flex items-center gap-3 sm:gap-4 w-full">
                  {/* Added shrink-0 to prevent avatar from warping */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-50 flex items-center justify-center text-violet-600 font-bold text-lg sm:text-xl overflow-hidden shadow-inner border border-white">
                      {userPhotoUrl && (
                        <img 
                          src={userPhotoUrl} 
                          alt={user.user_name} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span className="absolute z-[-1]">{user.user_name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white ${user.user_status ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-800 text-sm sm:text-base truncate">{user.user_name}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
                      {user.user_role || "No Role Assigned"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {user.code && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold font-mono">#{user.code}</span>}
                      <span className="bg-violet-50 text-violet-600 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold">₹{user.cost_per_hour}/hr</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col justify-end sm:justify-start gap-2 pt-2 border-t sm:border-t-0 sm:pt-0 shrink-0">
                  <button onClick={() => handleEdit(user)} className="p-2 flex-1 sm:flex-none flex justify-center text-slate-400 bg-slate-50 hover:bg-violet-600 hover:text-white rounded-xl transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="p-2 flex-1 sm:flex-none flex justify-center text-slate-400 bg-slate-50 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {activeData.map((item) => {
          const title = item.project_name || item.category_name || item.subcategory_name;
          let subtitle = item.project_description;
          if (!subtitle && item.category_id) subtitle = `Linked Parent ID: ${item.category_id}`;

          return (
            <div key={item.id} className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-slate-800 text-base sm:text-lg truncate">{title}</h4>
                {subtitle && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{subtitle}</p>}
              </div>
              
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                 <div className="flex bg-slate-50 rounded-2xl p-1 border border-slate-100 w-full sm:w-auto">
                   <button onClick={() => handleEdit(item)} className="p-2.5 flex-1 flex justify-center text-slate-400 hover:bg-white hover:text-violet-600 rounded-xl transition-all shadow-sm">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                   </button>
                   <button onClick={() => handleDelete(item.id)} className="p-2.5 flex-1 flex justify-center text-slate-400 hover:bg-white hover:text-rose-500 rounded-xl transition-all shadow-sm">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                   </button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/50 p-3 sm:p-4 lg:p-8 font-sans w-full selection:bg-violet-200 selection:text-violet-900 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto">
        
        {renderHeader()}

        {error && (
          <div className="mb-6 lg:mb-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 p-4 lg:p-5 flex justify-between items-center text-rose-700 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 font-bold text-sm lg:text-base">
              <span className="bg-rose-500 text-white p-1 rounded-full"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></span>
              {error}
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-rose-500/20 rounded-full transition-colors">×</button>
          </div>
        )}

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* Left Panel Form (Floating Card) */}
          {/* Changed sticky behavior to only apply to large screens */}
          <div className="w-full lg:w-[420px] shrink-0 lg:sticky lg:top-8 z-10">
            {/* Reduced padding on mobile (p-5) to prevent overflow */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] lg:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-5 sm:p-6 lg:p-8 relative overflow-hidden">
              {/* Decorative Blur Bubble */}
              <div className="absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 bg-violet-400/10 rounded-full blur-2xl lg:blur-3xl -z-10 translate-x-8 -translate-y-8 lg:translate-x-10 lg:-translate-y-10"></div>
              
              <div className="mb-6 lg:mb-8">
                <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 font-bold text-[10px] lg:text-xs rounded-full uppercase tracking-widest mb-3">
                  {editingId ? 'Edit Mode' : 'Creation Mode'}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-slate-800 capitalize">
                   {editingId ? `Update ${activeTab.replace(/s$/, '')}` : `New ${activeTab.replace(/s$/, '')}`}
                </h2>
                <p className="text-slate-500 text-xs lg:text-sm mt-1">Fill in the details below to save to the database.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
                {renderFormFields()}
                
                <div className="pt-4 lg:pt-6 flex flex-col gap-3">
                  <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 lg:py-4 px-6 rounded-2xl transition-all shadow-lg shadow-violet-600/30 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-sm lg:text-base">
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    )}
                    {editingId ? "Update Record" : "Save Record"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 lg:py-4 px-6 rounded-2xl transition-all text-sm lg:text-base">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel Data Area */}
          <div className="flex-1 w-full min-w-0">
             <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6 px-1 lg:px-2">
               <div>
                 <h3 className="text-lg lg:text-xl font-extrabold text-slate-800 capitalize">
                   {activeTab} Overview
                 </h3>
                 <p className="text-slate-500 text-xs lg:text-sm mt-1">Showing {data[activeTab]?.length || 0} total records</p>
               </div>
               {isLoading && (
                 <div className="bg-white/50 self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-bold text-violet-600 flex items-center gap-2 border border-violet-100">
                   <div className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></div> Syncing
                 </div>
               )}
             </div>
             
             {/* List Render Area */}
             <div className="w-full">
               {renderListItems()}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkListForm;