import React, { useEffect, useState } from "react";
import axios from "axios";

const WorkEntry = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const [form, setForm] = useState({
    username: "",
    entrydate: "",
    project: "",
    category: "",
    subcat: "",
    startdatetime: "",
    enddatetime: "",
    description: "",
  });

  useEffect(() => {
    loadMaster();
  }, []);

  const loadMaster = async () => {
    try {
      const res = await axios.get(
        "http://10.1.21.80:8200/imp_reports/mas_worklist/"
      );

      const data = res.data;

      setUsers(data.filter((x) => x.type?.toLowerCase() === "user"));
      setProjects(data.filter((x) => x.type?.toLowerCase() === "app & report name"));
      setCategories(data.filter((x) => x.type?.toLowerCase() === "category"));
      setTasks(data.filter((x) => x.type?.toLowerCase() === "tasks"));
    } catch (err) {
      console.log(err);
    }
  };

  const selectUser = (name) => {
    const today = new Date().toISOString().split("T")[0];

    setForm({
      username: name,
      entrydate: today,
      project: "",
      category: "",
      subcat: "",
      startdatetime: "",
      enddatetime: "",
      description: "",
    });

    setShowForm(false);
    setShowDesc(false);
  };

  const getDateTime = () => {
    const d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0") +
      " " +
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0") +
      ":" +
      String(d.getSeconds()).padStart(2, "0")
    );
  };

  const startTime = () => {
    setForm((prev) => ({
      ...prev,
      startdatetime: getDateTime(),
    }));
  };

  const endTime = () => {
    setForm((prev) => ({
      ...prev,
      enddatetime: getDateTime(),
    }));
    setShowDesc(true);
  };

  const saveEntry = async () => {
    try {
      const start = new Date(form.startdatetime);
      const end = new Date(form.enddatetime);
      const minutes = Math.floor((end - start) / 60000);

      const payload = {
        username: form.username,
        entrydate: form.entrydate,
        project: form.project,
        category: form.category,
        subcat: form.subcat,
        startdatetime: form.startdatetime,
        startstatus: "Started",
        description: form.description,
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
        alert("Saved Successfully");
        setForm({
          username: "",
          entrydate: "",
          project: "",
          category: "",
          subcat: "",
          startdatetime: "",
          enddatetime: "",
          description: "",
        });
        setShowForm(false);
        setShowDesc(false);
      }
    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.message || "Save Failed");
    }
  };

  // Common input/select styling for reuse
  const inputClass = "w-full border border-gray-300 bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: User List */}
        <div className="w-full md:w-1/3">
          <h4 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">User List</h4>

          <div className="grid grid-cols-2 gap-3">
            {users.map((u) => (
              <button
                key={u.id}
                className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  form.username === u.description
                    ? "bg-blue-700 text-white shadow-md"
                    : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                }`}
                onClick={() => selectUser(u.description)}
              >
                {u.description}
              </button>
            ))}
          </div>

          {form.username && (
            <div className="mt-8 flex gap-3">
              <button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors"
                onClick={() => setShowForm(true)}
              >
                From
              </button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition-colors">
                Report
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Work Entry Form */}
        {showForm && (
          <div className="w-full md:w-2/3 bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
            <h5 className="text-lg font-semibold text-gray-800 mb-6 flex items-center justify-between">
              <span>Work Entry</span>
              <span className="text-sm font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Date: {form.entrydate}
              </span>
            </h5>

            <div className="space-y-5">
              {/* Project Selection */}
              <div>
                <label className={labelClass}>Project</label>
                <select
                  className={inputClass}
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.description}>
                      {p.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Sub-Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.description}>
                        {c.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Sub Category (Task)</label>
                  <select
                    className={inputClass}
                    value={form.subcat}
                    onChange={(e) => setForm({ ...form, subcat: e.target.value })}
                  >
                    <option value="">Select Task</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.description}>
                        {t.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timer Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md transition-colors"
                  disabled={!!form.startdatetime}
                  onClick={startTime}
                >
                  {form.startdatetime ? `Started: ${form.startdatetime.split(" ")[1]}` : "Start Time"}
                </button>

                <button
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md transition-colors"
                  disabled={!form.startdatetime || !!form.enddatetime}
                  onClick={endTime}
                >
                   {form.enddatetime ? `Ended: ${form.enddatetime.split(" ")[1]}` : "End Time"}
                </button>
              </div>

              {/* Description & Confirm */}
              {showDesc && (
                <div className="pt-4 border-t border-gray-200 mt-6">
                  <div className="mb-4">
                    <label className={labelClass}>Description</label>
                    <textarea
                      className={`${inputClass} resize-none`}
                      rows="4"
                      placeholder="Describe the work done..."
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>

                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md shadow-md transition-colors text-lg"
                    onClick={saveEntry}
                  >
                    Confirm & Save Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkEntry;