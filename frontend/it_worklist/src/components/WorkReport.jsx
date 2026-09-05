import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const WorkReport = () => {
  // --- Data States ---
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // --- Refs ---
  const reportRef = useRef(null);
  const exportModalRef = useRef(null);

  // --- Filter States (Main Dashboard) ---
  const [period, setPeriod] = useState('Today');
  const [filters, setFilters] = useState({
    user: '',
    project: '',
    category: '',
    subcategory: ''
  });

  // --- Export Modal States ---
  const [showExportModal, setShowExportModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [exportFilters, setExportFilters] = useState({
    startDate: today,
    endDate: today,
    user: '',
    project: ''
  });

  // --- Toast State ---
  const [toast, setToast] = useState(null);

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

  const handleBack = () => navigate("/work_list");
  const handleGoToLogs = () => navigate("/work_list/work_log");

  const resetMainFilters = () => {
    setPeriod('Today');
    setFilters({ user: '', project: '', category: '', subcategory: '' });
  };

  const resetExportFilters = () => {
    const currentToday = new Date().toISOString().split('T')[0];
    setExportFilters({ startDate: currentToday, endDate: currentToday, user: '', project: '' });
  };

  const handleExportDownload = async () => {
    if (!exportModalRef.current) return;
    try {
      const dataUrl = await toPng(exportModalRef.current, {
        pixelRatio: 2, 
        backgroundColor: '#FFFFFF',
        style: { margin: 0, padding: '24px' }
      });
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `Work_Cost_Report_${exportFilters.startDate}_to_${exportFilters.endDate}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setShowExportModal(false);
    } catch (error) {
      showToast("Issue generating the report image.", "error");
    }
  };

  // --- Data Processing & Maps ---
  const userMap = users.reduce((acc, user) => {
    const uName = user.user_name || user.username || user.UserName || 'Unknown';
    acc[uName] = { 
      rate: parseFloat(user.cost_per_hour || user.CostPerHour) || 0, 
      role: user.user_role || user.UserRole || 'Developer'
    };
    return acc;
  }, {});

  const uniqueUsers = [...new Set(entries.map(e => e.username || e.UserName))].filter(Boolean);
  const uniqueProjects = [...new Set(entries.map(e => e.project || e.project_name || e.Project))].filter(Boolean);
  const uniqueCategories = [...new Set(entries.map(e => e.category || e.Category))].filter(Boolean);

  // --- Main Dashboard Data Filtering ---
  const getFilteredData = () => {
    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    let dateFiltered = entries.filter(entry => {
      const eDate = entry.entrydate || entry.entry_date || entry.EntryDate;
      if (!eDate) return false;
      const entryDate = new Date(eDate);
      const entryDateStr = entryDate.toISOString().split('T')[0];

      switch (period) {
        case 'Today': return entryDateStr === todayStr;
        case 'Last Week': {
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 7);
          return entryDate >= lastWeek && entryDate <= now;
        }
        case 'Last Month': {
          const lastMonth = new Date(now);
          lastMonth.setMonth(now.getMonth() - 1);
          return entryDate >= lastMonth && entryDate <= now;
        }
        case 'Last 3 Months': {
          const last3 = new Date(now);
          last3.setMonth(now.getMonth() - 3);
          return entryDate >= last3 && entryDate <= now;
        }
        case 'Last Year': {
          const lastYear = new Date(now);
          lastYear.setFullYear(now.getFullYear() - 1);
          return entryDate >= lastYear && entryDate <= now;
        }
        case 'All Time': return true;
        default: return true;
      }
    });

    return dateFiltered.filter(entry => {
      const uName = entry.username || entry.UserName;
      const pName = entry.project || entry.project_name || entry.Project;
      const cat = entry.category || entry.Category;
      const sCat = entry.subcat || entry.SubCat;

      const matchUser = filters.user ? uName === filters.user : true;
      const matchProj = filters.project ? pName === filters.project : true;
      const matchCat = filters.category ? cat === filters.category : true;
      const matchSubCat = filters.subcategory ? sCat === filters.subcategory : true;
      return matchUser && matchProj && matchCat && matchSubCat;
    });
  };

  const currentData = getFilteredData();

  // Dashboard Aggregations
  let totalCost = 0;
  const activeProjects = new Set();
  const userAggregations = {};
  const projectCosts = {};

  currentData.forEach(entry => {
    const uName = entry.username || entry.UserName || 'Unknown';
    const pName = entry.project || entry.project_name || entry.Project || 'Unknown';
    
    const durationMins = entry.durationminutes || entry.duration_minutes || entry.DurationMinutes || 0;
    let hours = durationMins / 60;
    
    const startDT = entry.startdatetime || entry.start_datetime || entry.StartDateTime;
    const endDT = entry.enddatetime || entry.end_datetime || entry.EndDateTime;

    if (hours === 0 && startDT) {
      const start = new Date(startDT);
      const end = (endDT && endDT !== 'NULL') ? new Date(endDT) : new Date();
      hours = Math.max(0, (end - start) / (1000 * 60 * 60)); 
    }

    const rate = userMap[uName]?.rate || 0;
    const cost = hours * rate;

    totalCost += cost;
    if (pName !== 'Unknown') activeProjects.add(pName);

    if (!userAggregations[uName]) {
      userAggregations[uName] = { hours: 0, cost: 0, projects: new Set() };
    }
    userAggregations[uName].hours += hours;
    userAggregations[uName].cost += cost;
    if (pName !== 'Unknown') userAggregations[uName].projects.add(pName);

    if (!projectCosts[pName]) projectCosts[pName] = 0;
    projectCosts[pName] += cost;
  });

  const pieData = Object.keys(projectCosts).map(key => ({
    name: key,
    value: projectCosts[key]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#6366F1', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

  // --- Export Modal Data Processing ---
  const getExportData = () => {
    return entries.filter(entry => {
      const eDate = entry.entrydate || entry.entry_date || entry.EntryDate;
      if (!eDate) return false;
      
      const entryDateStr = new Date(eDate).toISOString().split('T')[0];
      const uName = entry.username || entry.UserName;
      const pName = entry.project || entry.project_name || entry.Project;
      
      const matchStart = exportFilters.startDate ? entryDateStr >= exportFilters.startDate : true;
      const matchEnd = exportFilters.endDate ? entryDateStr <= exportFilters.endDate : true;
      const matchUser = exportFilters.user ? uName === exportFilters.user : true;
      const matchProj = exportFilters.project ? pName === exportFilters.project : true;
      
      return matchStart && matchEnd && matchUser && matchProj;
    });
  };

  const exportData = getExportData();
  let exportTotalCost = 0;
  let exportTotalHours = 0;
  const exportActiveProjects = new Set();
  
  exportData.forEach(entry => {
    const uName = entry.username || entry.UserName || 'Unknown';
    const pName = entry.project || entry.project_name || entry.Project || 'Unknown';

    const durationMins = entry.durationminutes || entry.duration_minutes || entry.DurationMinutes || 0;
    let hours = durationMins / 60;
    
    const startDT = entry.startdatetime || entry.start_datetime || entry.StartDateTime;
    const endDT = entry.enddatetime || entry.end_datetime || entry.EndDateTime;

    if (hours === 0 && startDT) {
      const start = new Date(startDT);
      const end = (endDT && endDT !== 'NULL') ? new Date(endDT) : new Date();
      hours = Math.max(0, (end - start) / (1000 * 60 * 60));
    }

    const rate = userMap[uName]?.rate || 0;
    exportTotalHours += hours;
    exportTotalCost += (hours * rate);
    if (pName !== 'Unknown') exportActiveProjects.add(pName);
  });

  // --- Renders ---
  if (loading) return <div className="flex h-screen items-center justify-center"><p className="animate-pulse">Loading dashboard...</p></div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 sm:p-6 lg:p-8 font-sans text-gray-800">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[150] text-white px-6 py-3 rounded-xl shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Main Dashboard UI */}
      <div className="max-w-[1400px] mx-auto space-y-6" ref={reportRef}>
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Costing Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Financial overview of software development efforts.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleGoToLogs} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-5 py-2.5 rounded-full hover:bg-indigo-100 transition text-sm font-semibold shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              View Work Logs
            </button>
            <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition text-sm font-semibold shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Dashboard
            </button>
            <button onClick={handleBack} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full hover:bg-gray-50 transition text-sm font-semibold shadow-sm">
              Go Back
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
             <span className="font-semibold text-sm text-gray-700 ml-3 mr-1">Period:</span>
             {['Today', 'Last Week', 'Last Month', 'Last 3 Months', 'Last Year', 'All Time'].map(p => (
               <button 
                 key={p} 
                 onClick={() => setPeriod(p)}
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
               >
                 {p}
               </button>
             ))}
          </div>

          <div className="flex-1 flex gap-3 min-w-[300px] items-center">
             <select value={filters.user} onChange={(e) => setFilters({...filters, user: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
               <option value="">All Users</option>
               {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
             </select>
             <select value={filters.project} onChange={(e) => setFilters({...filters, project: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
               <option value="">All Projects</option>
               {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
             <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
               <option value="">All Categories</option>
               {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <button
               type="button"
               onClick={resetMainFilters}
               className="whitespace-nowrap px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
             >
               Clear
             </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center relative overflow-hidden">
             <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Active Projects</h3>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-extrabold text-gray-900">{activeProjects.size}</span>
                 <span className="text-sm font-medium text-gray-500">/ {uniqueProjects.length} total</span>
               </div>
             </div>
             <div className="bg-cyan-50 p-4 rounded-xl text-cyan-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center relative overflow-hidden">
             <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Cost ({period})</h3>
               <div className="text-4xl font-extrabold text-gray-900">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
             </div>
             <div className="bg-amber-50 p-4 rounded-xl text-amber-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
             </div>
          </div>
        </div>

        {/* Team Members Table & Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Left Panel: Table */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Team Members Working Hours & Cost
                </h2>
                <span className="text-xs font-medium text-gray-400">Showing {period}</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Team Member</th>
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Projects</th>
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Hourly Rate</th>
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Working Hours</th>
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.keys(userAggregations).map((username, idx) => {
                      const agg = userAggregations[username];
                      const userMeta = userMap[username] || { rate: 0, role: 'Unknown' };
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                              {username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{username}</div>
                              <div className="text-xs text-gray-500">{userMeta.role}</div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              {Array.from(agg.projects).map(proj => (
                                <span key={proj} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap">
                                  {proj}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 text-right text-sm text-gray-600">₹{userMeta.rate}/hr</td>
                          <td className="py-4 text-right text-sm font-medium text-gray-800">
                            <span className="flex items-center justify-end gap-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {agg.hours.toFixed(2)} hrs
                            </span>
                          </td>
                          <td className="py-4 text-right font-bold text-indigo-700 text-sm">₹{agg.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      );
                    })}
                    {Object.keys(userAggregations).length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-gray-400 text-sm">No data found for selected filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Right Panel: Chart */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                  Work Share by Project
                </h2>
                <span className="text-xs font-medium text-gray-400">Showing {period}</span>
              </div>
              
              <div className="flex-1 min-h-[300px] relative flex items-center justify-center">
                 {pieData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={pieData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={100}
                         paddingAngle={2}
                         dataKey="value"
                         labelLine={true}
                         label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                       >
                         {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} />
                     </PieChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="text-gray-400 text-sm">No project data available</div>
                 )}
              </div>
           </div>
        </div>

      </div>

      {/* EXPORT MODAL POPUP */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1000px] flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Export Work & Cost Report</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Select dates and filter parameters to generate a downloadable image report.</p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body & Filters */}
            <div className="p-6 bg-[#F8FAFC] flex-1 overflow-y-auto custom-scrollbar">
              
              {/* Export Filters Area */}
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={resetExportFilters}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors"
                >
                  Clear Filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                
                {/* Start Date */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Start Date
                  </label>
                  <input type="date" value={exportFilters.startDate} onChange={(e) => setExportFilters({...exportFilters, startDate: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"/>
                </div>

                {/* End Date */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    End Date
                  </label>
                  <input type="date" value={exportFilters.endDate} onChange={(e) => setExportFilters({...exportFilters, endDate: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"/>
                </div>

                {/* Team Member */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Team Member
                  </label>
                  <select value={exportFilters.user} onChange={(e) => setExportFilters({...exportFilters, user: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                    <option value="">All Team Members</option>
                    {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                {/* Project */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Project
                  </label>
                  <select value={exportFilters.project} onChange={(e) => setExportFilters({...exportFilters, project: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                    <option value="">All Projects</option>
                    {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

              </div>

              {/* REPORT PREVIEW (This div gets converted to Image) */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6" ref={exportModalRef}>
                
                {/* Report Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200"></div>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Work & Cost Activity Report</h3>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-md">
                    Generated: {today}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-6 font-medium">
                  Report Period: <span className="font-bold text-gray-800">{exportFilters.startDate}</span> to <span className="font-bold text-gray-800">{exportFilters.endDate}</span>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Project Count</h4>
                    <p className="text-2xl font-extrabold text-indigo-900">{exportActiveProjects.size} <span className="text-sm font-medium text-indigo-700">Projects</span></p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Entries</h4>
                    <p className="text-2xl font-extrabold text-slate-900">{exportData.length} <span className="text-sm font-medium text-slate-500">({exportTotalHours.toFixed(1)} hrs)</span></p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Total Cost</h4>
                    <p className="text-2xl font-extrabold text-emerald-900">₹{exportTotalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>

                {/* Data Table / Empty State */}
                {exportData.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl py-16 flex flex-col items-center justify-center text-center bg-gray-50/50">
                    <p className="text-gray-400 font-medium text-sm">No work logs found for the selected dates and filter criteria.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left bg-white text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Team Member</th>
                          <th className="px-4 py-3">Project</th>
                          <th className="px-4 py-3">Start</th>
                          <th className="px-4 py-3">End</th>
                          <th className="px-4 py-3 text-right">Duration</th>
                          <th className="px-4 py-3 text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {exportData.map((row, idx) => {
                          const uName = row.username || row.UserName;
                          const pName = row.project || row.project_name || row.Project;
                          const eDate = row.entrydate || row.entry_date || row.EntryDate;
                          
                          const durationMins = row.durationminutes || row.duration_minutes || row.DurationMinutes || 0;
                          let hrs = durationMins / 60;
                          const startDT = row.startdatetime || row.start_datetime || row.StartDateTime;
                          const endDT = row.enddatetime || row.end_datetime || row.EndDateTime;

                          if (hrs === 0 && startDT) {
                            const start = new Date(startDT);
                            const end = (endDT && endDT !== 'NULL') ? new Date(endDT) : new Date();
                            hrs = Math.max(0, (end - start) / (1000 * 60 * 60));
                          }
                          
                          const rate = userMap[uName]?.rate || 0;
                          
                          // Simplified format for export preview
                          const startStr = startDT && startDT !== 'NULL' ? new Date(startDT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
                          const endStr = endDT && endDT !== 'NULL' ? new Date(endDT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
                          const durStr = `${Math.floor(hrs)}h ${Math.round((hrs - Math.floor(hrs)) * 60)}m`;

                          return (
                            <tr key={idx}>
                              <td className="px-4 py-3 font-medium text-gray-700">{eDate?.split('T')[0]}</td>
                              <td className="px-4 py-3">{uName}</td>
                              <td className="px-4 py-3">{pName}</td>
                              <td className="px-4 py-3">{startStr}</td>
                              <td className="px-4 py-3">{endStr}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="font-medium text-gray-800">{durStr}</div>
                                <div className="text-[10px] text-gray-400">({hrs.toFixed(2)} hr)</div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-emerald-700">₹{(hrs * rate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={resetExportFilters} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors">
                Clear
              </button>
              <button onClick={() => setShowExportModal(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleExportDownload} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-400 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Report Image (PNG)
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkReport;