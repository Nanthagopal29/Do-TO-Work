import { useState, useEffect } from "react";

function WorkListForm() {
  const API_URL = "http://10.1.21.80:8200/imp_reports/mas_worklist/";

  // State management
  const [workListData, setWorkListData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    Description: "",
    Type: "User",
    Active_Inactive: true,
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setWorkListData(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}${editingId}/` : API_URL;

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to save data. Check network tab.");

      await fetchData();
      resetForm();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.ID || item.id);
    const activeVal = item.active_inactive !== undefined ? item.active_inactive : item.Active_Inactive;
    
    setForm({
      Description: item.Description || item.description || "",
      Type: item.Type || item.type || "User",
      Active_Inactive: activeVal === 1 || activeVal === true,
    });
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}${itemId}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete data");
      
      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      Description: "",
      Type: "User",
      Active_Inactive: true,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans">
      
      {/* --- Left Panel: Form & Controls --- */}
      <div className="w-full lg:w-[400px] bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-8 flex-grow">
          
          {/* Header */}
          <div className="mb-10">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">WorkList Sync</h1>
            <p className="text-sm text-slate-500 mt-2">Manage and route your reporting assignments efficiently.</p>
          </div>

          {/* Form */}
          <div className={`p-6 rounded-2xl transition-all duration-300 ${editingId ? 'bg-indigo-50/50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
              {editingId ? <span className="text-indigo-600">✏️ Editing Record #{editingId}</span> : "✨ New Record"}
            </h2>
            
            <form onSubmit={submit} className="space-y-5">
              {/* Description */}
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-slate-700">Description</label>
                <input
                  type="text"
                  name="Description"
                  value={form.Description}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm"
                  placeholder="e.g. Daily Revenue Report"
                  required
                />
              </div>

              {/* Type Dropdown */}
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-slate-700">Type</label>
                <div className="relative">
                  <select
                    name="Type"
                    value={form.Type}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-3 text-sm appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm cursor-pointer"
                  >
                    <option value="User">User</option>
                    <option value="App & Report Name">App & Report Name</option>
                    <option value="Category">Category</option>
                    <option value="Tasks">Tasks</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2">
                <label className="block mb-2 text-sm font-semibold text-slate-700">Status</label>
                <label className="flex items-center cursor-pointer group w-max">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="Active_Inactive"
                      className="sr-only"
                      checked={form.Active_Inactive}
                      onChange={handleChange}
                    />
                    <div className={`block w-11 h-6 rounded-full transition-colors duration-300 ease-in-out ${form.Active_Inactive ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${form.Active_Inactive ? 'translate-x-5' : 'translate-x-0'} shadow-sm`}></div>
                  </div>
                  <span className={`ml-3 text-sm font-bold ${form.Active_Inactive ? 'text-indigo-700' : 'text-slate-500'}`}>
                    {form.Active_Inactive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !form.Description.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 active:scale-[0.98]"
                >
                  {isLoading ? "Processing..." : editingId ? "Update Record" : "Save Record"}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-lg transition-all active:scale-[0.98] border border-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Footer info inside sidebar */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Online • API v1.2
          </p>
        </div>
      </div>

      {/* --- Right Panel: Data Table --- */}
      <div className="flex-1 h-screen overflow-y-auto p-6 lg:p-10 relative">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
              <span className="font-medium text-sm">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Database Records</h2>
            <p className="text-slate-500 text-sm mt-1">Showing {workListData.length} entries</p>
          </div>
          
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold bg-indigo-50 px-4 py-2 rounded-full">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Syncing
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6 w-20">ID</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {workListData.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan="5" className="p-16 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      </div>
                      <h3 className="text-slate-900 font-semibold mb-1">No records found</h3>
                      <p className="text-slate-500">Create a new item in the panel to get started.</p>
                    </td>
                  </tr>
                ) : (
                  workListData.map((item, index) => {
                    const itemId = item.ID || item.id;
                    const itemDescription = item.Description || item.description || "";
                    const itemType = item.Type || item.type || "";
                    const rawActive = item.active_inactive !== undefined ? item.active_inactive : item.Active_Inactive;
                    const isActive = rawActive === 1 || rawActive === true;

                    return (
                      <tr key={itemId || index} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4 pl-6 font-medium text-slate-400">#{itemId}</td>
                        <td className="p-4 font-semibold text-slate-900">{itemDescription}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {itemType}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${
                            isActive 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 font-semibold p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(itemId)}
                            className="text-rose-500 hover:text-rose-700 font-semibold p-2 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkListForm;