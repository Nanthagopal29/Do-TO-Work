import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const UserReports = () => {
  const navigate = useNavigate();
  const { username: rawUsername } = useParams();
  const username = decodeURIComponent(rawUsername || "");

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [username]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://10.1.21.80:8200/imp_reports/trs_workentry/",
        { params: { username } }
      );
      // Filter client-side too, in case the API ignores the query param
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setEntries(data.filter((e) => e.username === username));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Helper to format Date to Indian format (DD/MM/YYYY)
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // fallback if invalid
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // 2. Helper to safely extract and format Time (12-hour AM/PM format)
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return "-";

    // Handle case where API might send space-separated 'YYYY-MM-DD HH:MM:SS'
    // JS Date parsing prefers 'T' for ISO strings, safely replace it
    const safeDateStr = dateTimeStr.replace(" ", "T");
    const date = new Date(safeDateStr);

    if (isNaN(date.getTime())) {
      // Fallback if parsing completely fails 
      return dateTimeStr.includes(" ") ? dateTimeStr.split(" ")[1] : dateTimeStr;
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Work Tracker</h1>
            <p className="text-slate-500 mt-1 text-sm flex items-center gap-2">
              Viewing reports for 
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {username}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all py-2.5 px-4 rounded-xl shadow-sm flex items-center gap-2 focus:ring-2 focus:ring-slate-200 focus:outline-none"
              onClick={() => navigate("/dashboard")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Switch User
            </button>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 px-5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              onClick={() => navigate(`/work-entry/${encodeURIComponent(username)}`)}
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
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 h-full">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100 shadow-inner">
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No entries found</h3>
              <p className="text-slate-500 text-sm max-w-sm">There are no work entries logged for {username} yet. Click "New Entry" to get started.</p>
            </div>
          ) : (
            /* SCROLLABLE CONTAINER: max-height applied here so only the table scrolls */
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
                  {entries.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-slate-50/80 even:bg-slate-50/40 transition-colors group">
                      <td className="py-4 px-6 font-medium text-slate-900 whitespace-nowrap">
                        {formatDate(e.entrydate)}
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">{e.project || "-"}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-white transition-colors">
                          {e.category || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{e.subcat || "-"}</td>
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {formatTime(e.startdatetime)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {formatTime(e.enddatetime)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">
                          {e.durationminutes
                            ? `${
                                Math.floor(e.durationminutes / 60) > 0
                                  ? `${Math.floor(e.durationminutes / 60)}h `
                                  : ""
                              }${e.durationminutes % 60}m`
                            : "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 max-w-[250px] truncate" title={e.description}>
                        {e.description || "-"}
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