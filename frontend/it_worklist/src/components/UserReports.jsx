import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const UserReports = () => {
  const navigate = useNavigate();
  const { username: rawUsername } = useParams();
  const username = decodeURIComponent(rawUsername || "").trim();

  // Helper to get today's date in YYYY-MM-DD format for the input default
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString()); // Date filter state defaulted to today

  const USER_MASTER_API = "https://hfapi.herofashion.com/software_cost/user_master/";
  const WORK_ENTRY_REPORT_API = "https://hfapi.herofashion.com/software_cost/trs_workentry/";

  useEffect(() => {
    loadUserAndEntries();
  }, [username]);

  const loadUserAndEntries = async () => {
    setLoading(true);
    try {
      // 1. Fetch user master to get user details
      const userRes = await axios.get(USER_MASTER_API);
      const usersList = Array.isArray(userRes.data) ? userRes.data : userRes.data?.results || [];

      const targetSearch = username.toLowerCase();

      const matchedUser = usersList.find((u) => {
        const uName = String(u.user_name || u.username || u.name || "").toLowerCase();
        const uCode = String(u.code || u.user_code || "").toLowerCase();
        const uId = String(u.id || "");
        return uName === targetSearch || uCode === targetSearch || uId === targetSearch;
      });

      setCurrentUser(matchedUser || null);

      // 2. Fetch Work Entries
      const searchName = matchedUser?.user_name || username;
      const searchId = matchedUser?.id;

      const namePromise = axios.get(WORK_ENTRY_REPORT_API, { 
        params: { username: searchName } 
      }).catch(() => ({ data: [] })); 
      
      const idPromise = searchId 
        ? axios.get(WORK_ENTRY_REPORT_API, { params: { username: searchId } }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      const [nameRes, idRes] = await Promise.all([namePromise, idPromise]);

      const nameData = Array.isArray(nameRes.data) ? nameRes.data : nameRes.data?.results || [];
      const idData = Array.isArray(idRes.data) ? idRes.data : idRes.data?.results || [];

      // Combine and remove duplicate rows
      const combinedData = [...nameData, ...idData];
      const uniqueData = Array.from(new Map(combinedData.map(item => [item.id || item.ID, item])).values());

      // 3. Final local filter
      const filtered = uniqueData.filter((e) => {
        const entryUserField = String(
          e.UserName || e.username || e.user_name || e.name || e.user_id || e.user || ""
        ).toLowerCase();

        if (!matchedUser) {
          return entryUserField === targetSearch;
        }

        const targetId = String(matchedUser.id || "").toLowerCase();
        const targetName = String(matchedUser.user_name || matchedUser.username || matchedUser.name || "").toLowerCase();
        const targetCode = String(matchedUser.code || matchedUser.user_code || "").toLowerCase();

        return (
          (targetId !== "" && entryUserField === targetId) ||
          (targetName !== "" && entryUserField === targetName) ||
          (targetCode !== "" && entryUserField === targetCode)
        );
      });

      setEntries(filtered);
    } catch (err) {
      console.error("Error loading user report entries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to safely format Date to Indian format (DD/MM/YYYY) for table UI
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper to format Time (12-hour AM/PM format)
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return "-";

    const safeDateStr = dateTimeStr.replace(" ", "T");
    const date = new Date(safeDateStr);

    if (isNaN(date.getTime())) {
      return dateTimeStr.includes(" ") ? dateTimeStr.split(" ")[1] : dateTimeStr;
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper to convert entry date format to YYYY-MM-DD strictly for comparison with the date picker
  const getComparisonDate = (dateStr) => {
    if (!dateStr) return "";
    if (typeof dateStr === 'string' && dateStr.length >= 10) {
      const prefix = dateStr.substring(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return prefix; // Matches YYYY-MM-DD
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter entries based on the selected date
  const displayedEntries = entries.filter((e) => {
    if (!selectedDate) return true; // If filter is cleared, show all
    const entryDateStr = e.EntryDate || e.entrydate;
    return getComparisonDate(entryDateStr) === selectedDate;
  });

  const displayName = currentUser?.user_name || currentUser?.name || username;
  const userCodeBadge = currentUser?.code ? `(#${currentUser.code})` : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Work Tracker</h1>
            <p className="text-slate-500 mt-1 text-sm flex items-center gap-2">
              Viewing reports for 
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {displayName} {userCodeBadge}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* Date Filter Input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0 p-0 cursor-pointer"
                title="Filter by date"
              />
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate("")} 
                  className="text-slate-400 hover:text-slate-700 bg-slate-200/50 hover:bg-slate-200 rounded-full p-1 transition-colors" 
                  title="Clear filter to see all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 px-5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              onClick={() => navigate(`/work_list/work-entry/${encodeURIComponent(username)}`)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              New Entry
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 h-full">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Fetching entries...</p>
            </div>
          ) : displayedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 h-full">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100 shadow-inner">
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No entries found</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                {selectedDate 
                  ? `There are no work entries logged for ${displayName} on ${new Date(selectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}.`
                  : `There are no work entries logged for ${displayName} yet.`}
              </p>
              {/* Offer a button to clear the filter if there are no entries for the selected day */}
              {selectedDate && entries.length > 0 && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="mt-2 text-indigo-600 text-sm font-semibold hover:text-indigo-800 flex items-center gap-1"
                >
                  View all dates
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-auto max-h-[70vh] custom-scrollbar w-full">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-4 px-6 whitespace-nowrap border-b border-slate-200">Date</th>
                    <th className="py-4 px-6 border-b border-slate-200">Project</th>
                    <th className="py-4 px-6 border-b border-slate-200">Category</th>
                    <th className="py-4 px-6 border-b border-slate-200">Task</th>
                    <th className="py-4 px-6 whitespace-nowrap border-b border-slate-200">Start</th>
                    <th className="py-4 px-6 whitespace-nowrap border-b border-slate-200">End</th>
                    <th className="py-4 px-6 whitespace-nowrap border-b border-slate-200">Duration</th>
                    <th className="py-4 px-6 border-b border-slate-200">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedEntries.map((e, idx) => (
                    <tr key={e.id || e.ID || idx} className="hover:bg-slate-50/80 even:bg-slate-50/40 transition-colors group">
                      <td className="py-4 px-6 font-medium text-slate-900 whitespace-nowrap">
                        {formatDate(e.EntryDate || e.entrydate)}
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {e.Project || e.project || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-white transition-colors">
                          {e.Category || e.category || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {e.SubCat || e.subcat || e.task_name || "-"}
                      </td>
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {formatTime(e.StartDateTime || e.startdatetime)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {formatTime(e.EndDateTime || e.enddatetime)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">
                          {e.durationminutes !== undefined && e.durationminutes !== null
                            ? `${
                                Math.floor(Number(e.durationminutes) / 60) > 0
                                  ? `${Math.floor(Number(e.durationminutes) / 60)}h `
                                  : ""
                              }${Number(e.durationminutes) % 60}m`
                            : e.duration || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 max-w-[250px] truncate" title={e.Description || e.description}>
                        {e.Description || e.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReports;