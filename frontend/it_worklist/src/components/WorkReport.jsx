import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';

const WorkReport = () => {
  // --- Data states ---
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Filter states ---
  const [nameFilter, setNameFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // --- Admin Edit States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // --- Notification State ---
  const [toast, setToast] = useState(null); // { message: '', type: 'error' | 'success' }

  const reportRef = useRef(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('http://10.1.21.80:8200/imp_reports/trs_workentry/');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setReports(Array.isArray(data) ? data : [data]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // --- Toast Notification Helper ---
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Formatting Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // --- Filters ---
  const uniqueNames = [...new Set(reports.map((r) => r.username))].filter(Boolean);
  const uniqueProjects = [...new Set(reports.map((r) => r.project))].filter(Boolean);

  const filteredReports = reports.filter((entry) => {
    const matchName = nameFilter ? entry.username === nameFilter : true;
    const matchProject = projectFilter ? entry.project === projectFilter : true;
    let matchDate = true;
    if (dateFilter && entry.entrydate) {
      const entryDateStr = new Date(entry.entrydate).toISOString().split('T')[0];
      matchDate = entryDateStr === dateFilter;
    }
    return matchName && matchProject && matchDate;
  });

  const clearFilters = () => {
    setNameFilter('');
    setProjectFilter('');
    setDateFilter('');
  };

  // --- Actions ---
  const handleBack = () => window.location.href = '/';

  const handlePrintImage = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await toPng(reportRef.current, { 
        pixelRatio: 2, backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth, height: reportRef.current.scrollHeight,
        style: { overflow: 'visible' }
      });
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `Work_Report_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      showToast("There was an issue generating the report image.", "error");
    }
  };

  // --- Admin Edit Functions ---
  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setNewStartTime(formatForInput(entry.startdatetime));
    setNewEndTime(formatForInput(entry.enddatetime));
    setAdminPassword('');
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
    setAdminPassword('');
  };

  const handleUpdateTime = async () => {
    if (!newStartTime || !newEndTime) {
      showToast('Please select both a start and end time.', 'error');
      return;
    }

    const start = new Date(newStartTime);
    const end = new Date(newEndTime);

    if (start >= end) {
      showToast('End time must be after the start time.', 'error');
      return;
    }

    // --- Time Overlap Validation ---
    // Check if the modified time overlaps with ANY existing entry for this specific user
    const otherEntriesForUser = reports.filter(
      (r) => r.username === selectedEntry.username && r.id !== selectedEntry.id
    );

    const hasOverlap = otherEntriesForUser.some((entry) => {
      if (!entry.startdatetime || !entry.enddatetime) return false;
      const existingStart = new Date(entry.startdatetime);
      const existingEnd = new Date(entry.enddatetime);
      
      // Standard interval overlap condition: (Start A < End B) && (End A > Start B)
      return start < existingEnd && end > existingStart;
    });

    if (hasOverlap) {
      showToast('Validation Error: Time conflicts with an existing log for this user.', 'error');
      return;
    }

    if (adminPassword !== 'Admin@26') {
      showToast('Authentication Failed: Incorrect admin password.', 'error');
      return;
    }

    setUpdateLoading(true);
    try {
      const payload = {
        startdatetime: start.toISOString(),
        enddatetime: end.toISOString()
      };

      const response = await fetch(`http://10.1.21.80:8200/imp_reports/trs_workentry/${selectedEntry.id}/`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed to update. Status: ${response.status}`);

      const durationInMinutes = Math.max(0, Math.floor((end - start) / 60000));

      setReports((prev) => prev.map((r) => 
        r.id === selectedEntry.id ? { 
          ...r, 
          startdatetime: payload.startdatetime, 
          enddatetime: payload.enddatetime,
          durationminutes: durationInMinutes 
        } : r
      ));

      showToast('Time log successfully updated.', 'success');
      closeEditModal();
    } catch (err) {
      showToast(`Update Error: ${err.message}`, 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  // --- Render States ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-12 h-12 rounded-full bg-violet-400 opacity-20"></div>
          <svg className="animate-spin h-10 w-10 text-violet-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">Syncing work entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white border-t-4 border-rose-500 p-8 rounded-2xl shadow-xl max-w-md w-full text-center mx-4">
          <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="font-bold text-2xl mb-2 text-gray-800">Connection Failed</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full px-5 py-3 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200">
            Refresh Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-10 font-sans text-gray-800 relative">
      
      {/* --- Toast Notification System --- */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-xl transition-all duration-300 w-max max-w-[90vw] ${
          toast.type === 'error' ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-emerald-600 text-white shadow-emerald-600/20'
        }`}>
          {toast.type === 'error' ? (
             <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          ) : (
             <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <p className="font-medium text-sm sm:text-base leading-snug">{toast.message}</p>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent pb-1">
              Work Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Monitor and manage team project developments.</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button onClick={handlePrintImage} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-gray-800 transition-all shadow-md shadow-gray-900/20 text-sm font-semibold active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Report
            </button>
            <button onClick={handleBack} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white border-2 border-gray-100 text-gray-700 px-6 py-2.5 rounded-full hover:bg-gray-50 hover:border-gray-200 transition-all text-sm font-semibold active:scale-95">
              Go Back
            </button>
            
            {/* Mobile Filter Toggle */}
            <button onClick={() => setShowFilters(!showFilters)} className="md:hidden flex-1 flex justify-center items-center gap-2 bg-violet-50 text-violet-700 px-6 py-2.5 rounded-full hover:bg-violet-100 transition-all text-sm font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-col lg:flex-row gap-5 items-end ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex-1 w-full relative">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Member</label>
            <select value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer">
              <option value="">All Members</option>
              {uniqueNames.map((name, idx) => <option key={idx} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full relative">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Project Name</label>
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer">
              <option value="">All Projects</option>
              {uniqueProjects.map((project, idx) => <option key={idx} value={project}>{project}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Date Logged</label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:bg-white outline-none transition-all cursor-pointer" />
          </div>
          <button onClick={clearFilters} className="w-full lg:w-auto px-8 py-3 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">
            Reset
          </button>
        </div>

        {/* Table Area */}
        <div ref={reportRef} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div style={{ display: 'none' }} className="hidden print:block p-8 font-extrabold text-3xl text-center text-gray-900 border-b">
            Work Entries Report - {new Date().toLocaleDateString('en-IN')}
          </div>
          
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-4 sm:px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">ID</th>
                  <th className="px-4 sm:px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">User Details</th>
                  <th className="px-4 sm:px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Project Scope</th>
                  <th className="px-4 sm:px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Time Logs</th>
                  <th className="px-4 sm:px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">State</th>
                  <th className="px-4 sm:px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Time Spent</th>
                  <th className="px-4 sm:px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.length > 0 ? (
                  filteredReports.map((entry) => {
                    const isShortDuration = entry.durationminutes !== null && entry.durationminutes < 10;
                    
                    return (
                      <tr key={entry.id} className={`group transition-all duration-200 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:z-10 relative ${isShortDuration ? 'bg-rose-50/30' : 'hover:bg-violet-50/30 bg-white'}`}>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="text-sm font-bold text-gray-300">{entry.id}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{entry.username}</div>
                          <div className="text-[13px] text-gray-500 mt-0.5">{formatDateOnly(entry.entrydate)}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{entry.project}</div>
                          <div className="text-[13px] text-gray-500 mt-0.5"><span className="text-violet-600 font-medium">{entry.category}</span> • {entry.subcat}</div>
                        </td>
                        
                        {/* Time Entry - Click to Edit */}
                        <td 
                          className="px-4 sm:px-6 py-4 cursor-pointer whitespace-nowrap"
                          onClick={() => openEditModal(entry)}
                          title="Click to modify times"
                        >
                          <div className="flex items-center justify-between p-2 rounded-lg group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-violet-100 transition-all">
                            <div>
                              <div className="text-gray-800 text-[13px]"><span className="font-semibold text-gray-400 w-9 inline-block">Start:</span> {formatDate(entry.startdatetime)}</div>
                              <div className="text-gray-800 text-[13px] mt-1"><span className="font-semibold text-gray-400 w-9 inline-block">End:</span> {formatDate(entry.enddatetime)}</div>
                            </div>
                            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity bg-violet-100 text-violet-600 p-1.5 rounded-md hidden sm:block">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${entry.endstatus === 'Completed' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-amber-100/50 text-amber-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${entry.endstatus === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            {entry.endstatus}
                          </span>
                        </td>
                        
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className={`font-extrabold text-sm ${isShortDuration ? 'text-rose-600' : 'text-gray-700'}`}>
                            {entry.durationminutes
                              ? `${Math.floor(entry.durationminutes / 60) > 0 ? `${Math.floor(entry.durationminutes / 60)}h ` : ""}${entry.durationminutes % 60}m`
                              : "-"}
                          </div>
                          {isShortDuration && <div className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-1 bg-rose-100 inline-block px-1.5 py-0.5 rounded">Review</div>}
                        </td>
                        
                        <td className="px-4 sm:px-6 py-4 min-w-[200px]">
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">{entry.description}</p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        <p className="text-lg font-medium text-gray-600">No records found</p>
                        <p className="text-sm mt-1">Try adjusting your filters to see more results.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin Override Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred Backdrop */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={closeEditModal}></div>
          
          {/* Modal Content - Mobile Optimized Width & Margins */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto p-6 sm:p-8 transform transition-all scale-100 opacity-100 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Modify Log</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Entry ID #{selectedEntry?.id} • {selectedEntry?.username}</p>
              </div>
              <button onClick={closeEditModal} className="bg-gray-50 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Start Timeline</label>
                <input 
                  type="datetime-local" 
                  value={newStartTime} 
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">End Timeline</label>
                <input 
                  type="datetime-local" 
                  value={newEndTime} 
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="pt-3 border-t border-gray-100">
                <label className="block text-[11px] font-bold text-rose-500 uppercase tracking-widest mb-1.5">Admin Authentication</label>
                <input 
                  type="password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full bg-rose-50/30 border border-rose-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
              <button onClick={closeEditModal} className="w-full sm:flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Discard
              </button>
              <button onClick={handleUpdateTime} disabled={updateLoading} className="w-full sm:flex-1 px-4 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors text-sm flex justify-center items-center shadow-md shadow-violet-200">
                {updateLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Confirm Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkReport;