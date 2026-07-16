import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  // Navigation data array with distinct SVG icons and gradients
  const navItems = [
    {
      title: 'Work List Form',
      description: 'View, edit, and manage your current work lists and active forms with ease.',
      path: '/list_form',
      gradient: 'from-blue-500 to-cyan-400',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      title: 'Work Entry',
      description: 'Log new work items, assign tasks, and input data entries into the system directly.',
      path: '/dashboard',
      gradient: 'from-emerald-500 to-teal-400',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      title: 'Work Report',
      description: 'Generate comprehensive insights, view analytics, and track your team progress.',
      path: '/work_report',
      gradient: 'from-violet-500 to-purple-400',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 pt-20 pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background radial glow */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
            Welcome to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Workspace</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-indigo-100/80">
            Streamline your workflow today. Select a module below to get started with your tasks, entries, and reports.
          </p>
        </div>
      </div>

      {/* Navigation Grid (Overlapping the hero section) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="group bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-out border border-slate-100 flex flex-col h-full relative overflow-hidden"
            >
              {/* Decorative subtle background blur on hover */}
              <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${item.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

              {/* Icon Container */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md mb-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                {item.icon}
              </div>
              
              {/* Card Content */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Action Link */}
              <div className="mt-8 flex items-center text-sm font-semibold text-indigo-600">
                <span className="relative">
                  Launch Module
                  {/* Animated underline */}
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                </span>
                {/* Arrow animation */}
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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