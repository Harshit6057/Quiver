import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Layout = ({ children, user, handleLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  const activeClass = "bg-purple-500/10 text-purple-300 border-r-4 border-purple-500 px-6 py-4 flex items-center gap-4 group transition-all duration-300";
  const inactiveClass = "text-slate-500 hover:text-slate-300 px-6 py-4 flex items-center gap-4 group transition-all duration-300 hover:bg-white/5 border-r-4 border-transparent";

  return (
    <div className="bg-background text-on-background min-h-screen overflow-x-hidden font-body selection:bg-primary-fixed/30">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16 md:h-20 shadow-[0_0_40px_-15px_rgba(168,85,247,0.2)] bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-white/15 text-slate-200 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-600 font-headline whitespace-nowrap">Ethereal</Link>
          <div className="hidden md:flex items-center gap-6 font-headline tracking-tighter text-sm uppercase">
            <NavLink to="/explore" className={({ isActive }) => isActive ? "text-purple-300 border-b-2 border-purple-500 pb-1" : "text-slate-400 hover:text-slate-200 transition-all duration-300"}>Explore</NavLink>
            <Link to="/" className="text-slate-400 hover:text-slate-200 transition-all duration-300">Activity</Link>
            <Link to="/" className="text-slate-400 hover:text-slate-200 transition-all duration-300">Vault</Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          <div className="hidden lg:flex items-center bg-surface-container-lowest rounded-full px-4 py-2 gap-3 outline-variant/10 border border-transparent focus-within:border-secondary transition-all">
            <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
            <input className="bg-transparent border-none focus:ring-0 outline-none text-sm w-44 xl:w-64 text-on-surface" placeholder="Search the void..." type="text"/>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/create-community" className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-4 sm:px-6 py-2 rounded-full font-headline font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all">Create</Link>
            <button className="material-symbols-outlined text-slate-400 hover:text-white transition-colors hidden sm:inline-flex">notifications</button>
            {!user ? (
                <button onClick={handleLogin} className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold px-6 py-2 rounded-full active:scale-95 transition-all duration-300 text-sm shadow-[0_0_20px_-5px_rgba(221,183,255,0.4)]">
                    Sign In
                </button>
            ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-white/15 text-slate-200 hover:text-white hover:bg-white/5 transition-all"
                    aria-label="Logout"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                  </button>
                  <button onClick={handleLogout} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-slate-300 border border-white/10 hover:text-white hover:bg-white/5 transition-all">
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Logout
                  </button>
                  <Link to={`/u/${user?.username}`} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-primary/20 overflow-hidden shrink-0">
                    <img src={user?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder"} alt="User Avatar" className="w-full h-full object-cover" />
                  </Link>
                </div>
            )}
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
          />
          <aside className="md:hidden fixed top-16 left-0 w-[88vw] max-w-xs h-[calc(100vh-4rem)] z-[60] bg-slate-950/95 border-r border-white/10 backdrop-blur-xl flex flex-col">
            <div className="px-5 pt-5 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                </div>
                <span className="text-lg font-black text-white font-headline">Terminal</span>
              </div>
              <span className="font-headline uppercase tracking-widest text-[10px] text-slate-500">V 2.0.4</span>
            </div>

            <nav className="flex flex-col gap-1 px-2 py-4 flex-1 overflow-y-auto">
              <NavLink to="/" end className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                <span className="font-headline uppercase tracking-widest text-[10px]">Home</span>
              </NavLink>
              <NavLink to="/trending" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <span className="material-symbols-outlined text-lg">trending_up</span>
                <span className="font-headline uppercase tracking-widest text-[10px]">Trending</span>
              </NavLink>
              <NavLink to="/explore" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <span className="material-symbols-outlined text-lg">groups</span>
                <span className="font-headline uppercase tracking-widest text-[10px]">Communities</span>
              </NavLink>
              <NavLink to="/bookmarks" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <span className="material-symbols-outlined text-lg">bookmark</span>
                <span className="font-headline uppercase tracking-widest text-[10px]">Bookmarks</span>
              </NavLink>
              <NavLink to="/history" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <span className="material-symbols-outlined text-lg">history</span>
                <span className="font-headline uppercase tracking-widest text-[10px]">History</span>
              </NavLink>
            </nav>

            <div className="p-5 border-t border-white/10 space-y-3">
              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-200 border border-white/15 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Logout
                </button>
              )}
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(221,183,255,0.4)] transition-all">
                Join Beta
              </button>
            </div>
          </aside>
        </>
      )}

      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 pt-24 hidden md:flex flex-col gap-2 bg-slate-950/40 backdrop-blur-2xl bg-gradient-to-r from-white/5 to-transparent border-none z-40">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
            </div>
            <span className="text-lg font-black text-white font-headline">Terminal</span>
          </div>
          <span className="font-headline uppercase tracking-widest text-[10px] text-slate-500">V 2.0.4</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <NavLink to="/" end className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">Home</span>
          </NavLink>
          <NavLink to="/trending" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <span className="material-symbols-outlined text-lg">trending_up</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">Trending</span>
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <span className="material-symbols-outlined text-lg">groups</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">Communities</span>
          </NavLink>
          <NavLink to="/bookmarks" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <span className="material-symbols-outlined text-lg">bookmark</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">Bookmarks</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <span className="material-symbols-outlined text-lg">history</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">History</span>
          </NavLink>
        </nav>
        <div className="mt-auto p-6 space-y-4">
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(221,183,255,0.4)] transition-all">
            Join Beta
          </button>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/" className="flex items-center gap-3 text-slate-500 hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined text-sm">help</span>
              <span className="font-headline uppercase tracking-widest text-[10px]">Help</span>
            </Link>
            <Link to="/" className="flex items-center gap-3 text-slate-500 hover:text-slate-300 transition-colors">
              <span className="material-symbols-outlined text-sm">shield</span>
              <span className="font-headline uppercase tracking-widest text-[10px]">Privacy</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:ml-64 pt-20 md:pt-24 px-3 sm:px-4 pb-24 md:pb-12">
        {children}
      </div>

      {/* Floating Action Button (FAB) */}
      <Link to="/create-post" className="fixed bottom-20 md:bottom-12 right-4 md:right-12 h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary shadow-[0_0_40px_rgba(221,183,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-50 group">
        <span className="material-symbols-outlined text-2xl md:text-3xl group-hover:rotate-90 transition-transform duration-300">add</span>
      </Link>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-xl flex justify-around items-center h-16 z-50 shadow-[0_-10px_30px_-15px_rgba(168,85,247,0.3)]">
        <NavLink to="/" className={({ isActive }) => isActive ? "material-symbols-outlined text-purple-300" : "material-symbols-outlined text-slate-400"}>grid_view</NavLink>
        <NavLink to="/trending" className={({ isActive }) => isActive ? "material-symbols-outlined text-purple-300" : "material-symbols-outlined text-slate-400"}>trending_up</NavLink>
        <button 
          onClick={() => navigate('/create-community')}
          className="w-12 h-12 -mt-10 bg-gradient-to-r from-primary to-primary-container rounded-full flex items-center justify-center shadow-lg neon-glow-primary active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-on-primary">add</span>
        </button>
        <NavLink to="/explore" className={({ isActive }) => isActive ? "material-symbols-outlined text-purple-300" : "material-symbols-outlined text-slate-400"}>groups</NavLink>
        <NavLink to="/bookmarks" className={({ isActive }) => isActive ? "material-symbols-outlined text-purple-300" : "material-symbols-outlined text-slate-400"}>bookmark</NavLink>
      </nav>
    </div>
  );
};

export default Layout;
