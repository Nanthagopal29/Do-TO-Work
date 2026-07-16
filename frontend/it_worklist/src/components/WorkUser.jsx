import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, ChevronUp, ChevronDown, ArrowLeft, Plus, FileText } from "lucide-react";

const UserSelect = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  
  // Track which user accordion is currently open by their ID
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await axios.get(
        "http://10.1.21.80:8200/imp_reports/mas_worklist/"
      );
      const data = res.data;
      setUsers(data.filter((x) => x.type?.toLowerCase() === "user"));
    } catch (err) {
      console.log(err);
    }
  };

  const toggleExpand = (id) => {
    // If clicking the already open accordion, close it. Otherwise, open the new one.
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  const goToEntry = (name, e) => {
    e.stopPropagation(); // Prevent accordion from toggling when clicking button
    navigate(`/work-entry/${encodeURIComponent(name)}`);
  };

  const goToReport = (name, e) => {
    e.stopPropagation(); // Prevent accordion from toggling when clicking button
    navigate(`/user-report/${encodeURIComponent(name)}`);
  };

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-12 pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section with Back Button */}
        <div className="space-y-4">
          <button 
            onClick={goHome}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
            Back to Home
          </button>
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Select User Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose a user profile to initiate work entry or view reports.
            </p>
          </div>
        </div>

        {/* Dynamic Accordion List */}
        <div className="space-y-4">
          {users.map((u) => {
            const isExpanded = expandedUserId === u.id;

            return (
              <div 
                key={u.id} 
                className="bg-white border border-gray-300 rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* Accordion Header (Click to expand) */}
                <div 
                  className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleExpand(u.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon changes color based on active state like the image */}
                    <div className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
                      isExpanded 
                        ? "bg-[#0B1121] text-white shadow-md" 
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      <User size={24} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-gray-900">
                        {u.description}
                      </h2>
                      <p className="text-sm text-slate-400 font-medium mt-0.5">
                        Active User Profile
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    {isExpanded ? (
                      <ChevronUp className="text-slate-400" size={20} strokeWidth={2.5} />
                    ) : (
                      <ChevronDown className="text-slate-400" size={20} strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {/* Accordion Body (Action Buttons) */}
                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-gray-200 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                        Quick Actions
                      </h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="bg-black hover:bg-gray-800 text-white text-sm font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        onClick={(e) => goToEntry(u.description, e)}
                      >
                        <Plus size={16} strokeWidth={2.5} />
                        New Entry
                      </button>
                      
                      <button
                        className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        onClick={(e) => goToReport(u.description, e)}
                      >
                        <FileText size={16} strokeWidth={2.5} />
                        View Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
              Loading users or no users found...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSelect;