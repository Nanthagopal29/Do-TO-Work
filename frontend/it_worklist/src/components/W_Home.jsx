  import React from 'react';
  import { Link } from 'react-router-dom';

  const Home = () => {
    // Navigation data array with distinct SVG icons, updated gradients, and shadow colors
    const navItems = [
      {
        title: 'Work List Master',
        description: 'View, edit, and manage your current work lists and active forms with ease.',
        path: '/work_list/list_form',
        gradient: 'from-blue-500 to-indigo-500',
        shadowColor: 'shadow-blue-500/30',
        icon: (
          // Clipboard icon
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        title: 'Task Management',
        description: 'Organize your priorities, track project statuses, and assign tasks effectively.',
        path: '/work_list/task_management',
        gradient: 'from-rose-400 to-orange-500',
        shadowColor: 'shadow-rose-500/30',
        icon: (
          // Kanban / Board icon
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        ),
      },
      {
        title: 'Work Entry',
        description: 'Log new work items, assign tasks, and input data entries into the system directly.',
        path: '/work_list/dashboard',
        gradient: 'from-emerald-400 to-teal-500',
        shadowColor: 'shadow-emerald-500/30',
        icon: (
          // Document Add icon
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        title: 'Work Report',
        description: 'Generate comprehensive insights, view analytics, and track your team progress.',
        path: '/work_list/work_report',
        gradient: 'from-violet-500 to-fuchsia-500',
        shadowColor: 'shadow-violet-500/30',
        icon: (
          // Analytics Chart icon
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        ),
      },
    ];

    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-900">
        
        {/* Soft Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/80 to-transparent -z-10"></div>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-15 pb-20">
          
          {/* Modern Clean Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
              Streamline your <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-500 to-violet-500">
                Daily Workflow
              </span>
            </h1>
            <p className="max-w-2xl text-lg text-slate-500 leading-relaxed">
              Access your tools, track progress, and manage tasks from one centralized hub. Select a module below to begin.
            </p>
          </div>

          {/* Enhanced Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 lg:p-8 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all duration-300 overflow-hidden"
              >
                {/* Subtle hover overlay tint */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>

                {/* Icon Container */}
                <div className={`shrink-0 p-4 rounded-2xl bg-gradient-to-br ${item.gradient} ${item.shadowColor} shadow-lg transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300 relative z-10`}>
                  {item.icon}
                </div>
                
                {/* Card Content */}
                <div className="flex-1 relative z-10">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm lg:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Floating Action Arrow */}
                <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-full border border-slate-100 items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all duration-300 relative z-10">
                  <svg className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Mobile Action Text */}
                <div className="sm:hidden w-full flex items-center text-sm font-semibold text-indigo-600 mt-2">
                  Open Module
                  <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    );
  };

  export default Home;