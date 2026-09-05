import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

const TeamWorkFeed = () => {
  const navigate = useNavigate();

  // --- State ---
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Edit & Auth States ---
  const [authModal, setAuthModal] = useState({ show: false, originalIndex: null, rowData: null });
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [editingRowIndex, setEditingRowIndex] = useState(null); 
  const [editForm, setEditForm] = useState({ start: '', end: '' });
  
  // --- Toast State ---
  const [toast, setToast] = useState(null);

  // --- Filters ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    user: '',
    project: '',
    category: '',
    period: 'Today' // Defaulting to Today
  });

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entriesRes, usersRes] = await Promise.all([
          fetch('https://hfapi.herofashion.com/software_cost/trs_workentry/'),
          fetch('https://hfapi.herofashion.com/software_cost/user_master/')
        ]);

        if (!entriesRes.ok || !usersRes.ok) throw new Error('Failed to fetch data');

        const entriesData = await entriesRes.json();
        const usersData = await usersRes.json();

        setEntries(Array.isArray(entriesData) ? entriesData : [entriesData]);
        setUsers(Array.isArray(usersData) ? usersData : [usersData]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Formatting Helpers ---
  const formatForInput = (dateStr) => {
    if (!dateStr || dateStr === 'NULL') return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatIndianDate = (dateStr) => {
    if (!dateStr || dateStr === 'NULL') return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  };

  const formatTimeOnly = (dateStr) => {
    if (!dateStr || dateStr === 'NULL') return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return '-';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDuration = (totalMins) => {
    if (!totalMins || isNaN(totalMins) || totalMins === 0) return '0 mins';
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    if (h > 0 && m > 0) return `${h} hr ${m} mins`;
    if (h > 0) return `${h} hr`;
    return `${m} mins`;
  };

  // --- Handlers ---
  const initiateEdit = (row) => {
    const originalIndex = entries.findIndex(e => e === row);
    setAuthModal({ show: true, originalIndex, rowData: row });
    setAdminPassword('');
    setAuthError('');
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (adminPassword === 'Admin@26') {
      setAuthModal({ show: false, originalIndex: null, rowData: null });
      setEditingRowIndex(authModal.originalIndex);
      
      const startDT = authModal.rowData.startdatetime || authModal.rowData.start_datetime || authModal.rowData.StartDateTime;
      const endDT = authModal.rowData.enddatetime || authModal.rowData.end_datetime || authModal.rowData.EndDateTime;
      
      setEditForm({
        start: formatForInput(startDT),
        end: formatForInput(endDT)
      });
    } else {
      setAuthError('Incorrect Admin Password');
    }
  };

  const cancelEdit = () => {
    setEditingRowIndex(null);
    setEditForm({ start: '', end: '' });
  };

  const saveEdit = async (originalIndex, row) => {
    try {
      const s = new Date(editForm.start);
      const e = editForm.end ? new Date(editForm.end) : new Date();
      let diffMins = 0;
      
      if (!isNaN(s) && !isNaN(e)) {
        diffMins = Math.round(Math.max(0, (e - s) / (1000 * 60)));
      }

      const rowId = row.id || row.Id || row.ID || row.entry_id;
      
      if (!rowId) {
        showToast("Error: Missing record ID for update", "error");
        return;
      }

      // Using PUT instead of PATCH. We spread the existing row data first to ensure 
      // all required fields are sent back to the server.
      const response = await fetch(`https://hfapi.herofashion.com/software_cost/trs_workentry/${rowId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...row, 
          start_datetime: editForm.start,
          end_datetime: editForm.end,
          duration_minutes: diffMins
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update the time entry in the database');
      }

      // Optimistic local state update
      const updatedEntries = [...entries];
      
      updatedEntries[originalIndex] = {
        ...updatedEntries[originalIndex],
        startdatetime: editForm.start, 
        start_datetime: editForm.start, 
        StartDateTime: editForm.start, 
        enddatetime: editForm.end,
        end_datetime: editForm.end,
        EndDateTime: editForm.end,
        durationminutes: diffMins,
        duration_minutes: diffMins,
        DurationMinutes: diffMins
      };

      setEntries(updatedEntries);
      setEditingRowIndex(null);
      showToast("Time entry updated successfully", "success");

    } catch (err) {
      console.error("Save Edit Error:", err);
      showToast("Error updating time entry", "error");
    }
  };

  // --- Data Mapping ---
  const userMap = users.reduce((acc, user) => {
    const uName = user.user_name || user.username || user.UserName || 'Unknown';
    const empCode = user.emp_code || user.code || user.EmpCode || user.Code;
    
    acc[uName] = {
      rate: parseFloat(user.cost_per_hour || user.CostPerHour) || 0,
      role: user.user_role || user.UserRole || 'Developer',
      empCode: empCode,
      pic: empCode ? `https://app.herofashion.com/staff_images/${empCode}.jpg` : null
    };
    return acc;
  }, {});

  // Extract unique filter options
  const uniqueUsers = [...new Set(entries.map(e => e.username || e.UserName))].filter(Boolean);
  const uniqueProjects = [...new Set(entries.map(e => e.project || e.project_name || e.Project))].filter(Boolean);
  const uniqueCategories = [...new Set(entries.map(e => e.category || e.Category))].filter(Boolean);

  // --- Filtering Logic ---
  const getFilteredData = () => {
    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    return entries.filter(entry => {
      // 1. Date Period Filter
      const eDate = entry.entrydate || entry.entry_date || entry.EntryDate;
      let dateMatch = true;
      if (eDate) {
        const entryDate = new Date(eDate);
        const entryDateStr = entryDate.toISOString().split('T')[0];
        
        switch (filters.period) {
          case 'Today': dateMatch = entryDateStr === todayStr; break;
          case 'Last Week': {
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            dateMatch = entryDate >= lastWeek && entryDate <= now;
            break;
          }
          case 'Last Month': {
            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);
            dateMatch = entryDate >= lastMonth && entryDate <= now;
            break;
          }
          default: dateMatch = true;
        }
      }

      // 2. Dropdown Filters
      const uName = entry.username || entry.UserName;
      const pName = entry.project || entry.project_name || entry.Project;
      const cat = entry.category || entry.Category;
      
      const userMatch = filters.user ? uName === filters.user : true;
      const projMatch = filters.project ? pName === filters.project : true;
      const catMatch = filters.category ? cat === filters.category : true;

      // 3. Search Filter
      const searchStr = searchTerm.toLowerCase();
      const desc = entry.description || entry.Description || '';
      const sMatch = searchStr ? (
        (uName && uName.toLowerCase().includes(searchStr)) ||
        (pName && pName.toLowerCase().includes(searchStr)) ||
        (desc && desc.toLowerCase().includes(searchStr))
      ) : true;

      return dateMatch && userMatch && projMatch && catMatch && sMatch;
    });
  };

  const filteredEntries = getFilteredData();

  // --- Aggregations for Header ---
  let totalFilteredMins = 0;
  let totalFilteredCost = 0;

  filteredEntries.forEach(entry => {
    const uName = entry.username || entry.UserName || 'Unknown';
    let durationMins = entry.durationminutes || entry.duration_minutes || entry.DurationMinutes || 0;
    
    // Fallback calculation if duration is 0
    const startDT = entry.startdatetime || entry.start_datetime || entry.StartDateTime;
    const endDT = entry.enddatetime || entry.end_datetime || entry.EndDateTime;
    if (durationMins === 0 && startDT) {
      const start = new Date(startDT);
      const end = (endDT && endDT !== 'NULL') ? new Date(endDT) : new Date();
      durationMins = Math.max(0, (end - start) / (1000 * 60));
    }

    const rate = userMap[uName]?.rate || 0;
    totalFilteredMins += durationMins;
    totalFilteredCost += ((durationMins / 60) * rate);
  });

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="animate-pulse font-medium text-gray-500">Loading Team Activity...</p></div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-gray-50 text-red-500">{error}</div>;

  return (
    <div className="h-screen bg-[#F4F7FB] p-4 md:p-8 font-sans text-gray-800 flex flex-col">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[150] text-white px-6 py-3 rounded-xl shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Admin Auth Modal */}
      {authModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Authorization</h2>
            <p className="text-sm text-gray-500 mb-5">Please enter the admin password to edit time records.</p>
            
            <form onSubmit={handleAuthSubmit}>
              <input
                type="password"
                placeholder="Enter password..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 mb-2"
                autoFocus
              />
              {authError && <p className="text-xs text-red-500 mb-4">{authError}</p>}
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setAuthModal({ show: false, originalIndex: null, rowData: null })} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition">Verify</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Container */}
      <div className="max-w-[1600px] w-full mx-auto flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1">
        
        {/* --- Header Section --- */}
        <div className="p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            
            {/* Titles */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Work Entries & Activity Feed</h1>
              </div>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Showing {filteredEntries.length} logged records ({formatDuration(totalFilteredMins)} total time spent, ₹{totalFilteredCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })} est. cost)
              </p>
            </div>

            {/* Badges & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm border border-indigo-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Filtered Time: {formatDuration(totalFilteredMins)}
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm border border-emerald-100">
                Total Cost: ₹{totalFilteredCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <button 
                onClick={() => navigate('/work_list/work_entry')} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
              >
                + Log New Work
              </button>
              <button 
                onClick={() => navigate(-1)} 
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
              >
                Go Back
              </button>
            </div>
          </div>

          {/* --- Filters Bar --- */}
          <div className="mt-8 flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search description, user..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            
            {/* User Filter */}
            <select 
              value={filters.user} 
              onChange={(e) => setFilters({...filters, user: e.target.value})}
              className="w-[200px] px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-indigo-500 transition-all text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Team Members</option>
              {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>

            {/* Project Filter */}
            <select 
              value={filters.project} 
              onChange={(e) => setFilters({...filters, project: e.target.value})}
              className="w-[200px] px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-indigo-500 transition-all text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Projects</option>
              {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Category Filter */}
            <select 
              value={filters.category} 
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-[200px] px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-indigo-500 transition-all text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Date Filter */}
            <select 
              value={filters.period} 
              onChange={(e) => setFilters({...filters, period: e.target.value})}
              className="w-[160px] px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-indigo-500 transition-all text-slate-700 font-medium cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="Last Week">Last Week</option>
              <option value="Last Month">Last Month</option>
              <option value="All Time">All Time</option>
            </select>
          </div>
        </div>

        {/* --- Table Section (Scrollable Area) --- */}
        <div className="overflow-auto relative flex-1 min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest whitespace-nowrap bg-white">User</th>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest whitespace-nowrap bg-white">Project</th>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest whitespace-nowrap bg-white">Category & Subcategory</th>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest whitespace-nowrap bg-white">Date</th>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest whitespace-nowrap bg-white">Timing</th>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest whitespace-nowrap bg-white">Time Spent</th>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest min-w-[300px] bg-white">Work Description</th>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest whitespace-nowrap bg-white">Total Cost</th>
                <th className="px-6 py-4 text-xs font-black text-gray-700 uppercase tracking-widest text-center whitespace-nowrap bg-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredEntries.map((row, idx) => {
                
                const originalIndex = entries.findIndex(e => e === row);
                const isEditing = editingRowIndex === originalIndex;

                // Data Extraction
                const uName = row.username || row.UserName || 'Unknown User';
                const pName = row.project || row.project_name || row.Project;
                const cName = row.category || row.Category;
                const subCat = row.subcat || row.SubCat;
                const eDate = row.entrydate || row.entry_date || row.EntryDate;
                const desc = row.description || row.Description || '';
                
                // Fetch user specific info
                const userInfo = userMap[uName];

                // Duration & Cost calc
                let durationMins = row.durationminutes || row.duration_minutes || row.DurationMinutes || 0;
                const startDT = row.startdatetime || row.start_datetime || row.StartDateTime;
                const endDT = row.enddatetime || row.end_datetime || row.EndDateTime;

                if (durationMins === 0 && startDT) {
                  const start = new Date(startDT);
                  const end = (endDT && endDT !== 'NULL') ? new Date(endDT) : new Date();
                  durationMins = Math.max(0, (end - start) / (1000 * 60));
                }

                const hrs = durationMins / 60;
                const rate = userInfo?.rate || 0;
                const taskCost = hrs * rate;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    
                    {/* User */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-sm">{uName}</span>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                        {pName}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="font-bold text-indigo-700 text-sm">{cName}</div>
                      {subCat && <div className="text-xs text-slate-400 font-medium mt-0.5">{subCat}</div>}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5 whitespace-nowrap font-medium text-slate-500 text-sm">
                      {formatIndianDate(eDate)}
                    </td>

                    {/* Timing (Start & End) OR Inputs */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      {isEditing ? (
                         <div className="flex flex-col gap-2">
                           <input 
                             type="datetime-local" 
                             value={editForm.start} 
                             onChange={(e) => setEditForm({ ...editForm, start: e.target.value })} 
                             className="text-xs border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-indigo-500" 
                           />
                           <input 
                             type="datetime-local" 
                             value={editForm.end} 
                             onChange={(e) => setEditForm({ ...editForm, end: e.target.value })} 
                             className="text-xs border border-gray-300 rounded px-2 py-1.5 outline-none focus:border-indigo-500" 
                           />
                         </div>
                      ) : (
                        <div className="flex flex-col text-xs text-slate-600 gap-1.5">
                          <div className="flex items-center gap-1.5"><span className="font-bold text-slate-400 w-8">In:</span> {formatTimeOnly(startDT)}</div>
                          <div className="flex items-center gap-1.5"><span className="font-bold text-slate-400 w-8">Out:</span> {formatTimeOnly(endDT)}</div>
                        </div>
                      )}
                    </td>

                    {/* Time Spent (Badge) */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm">
                        <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDuration(durationMins)}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-5">
                      <p className="text-sm text-slate-600 line-clamp-2 leading-snug pr-4">
                        {desc}
                      </p>
                    </td>

                    {/* Total Cost */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="font-black text-emerald-600 text-sm mb-0.5">
                        ₹{taskCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        (@ ₹{rate}/hr)
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      {isEditing ? (
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <button onClick={() => saveEdit(originalIndex, row)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-200 transition font-bold w-full">Save</button>
                          <button onClick={cancelEdit} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200 transition font-bold w-full">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => initiateEdit(row)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center text-slate-400 bg-white">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-sm font-medium">No work records found for the applied filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamWorkFeed;