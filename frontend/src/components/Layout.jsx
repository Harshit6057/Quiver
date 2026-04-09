import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children, user, handleLogin }) => {
  return (
    <div className="bg-background text-on-background min-h-screen font-body selection:bg-primary-fixed/30">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-[0_0_40px_-15px_rgba(168,85,247,0.2)] bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-600 font-headline">Ethereal</Link>
          <div className="hidden md:flex items-center gap-6 font-headline tracking-tighter text-sm uppercase">
          <Link to="/explore" className="text-purple-300 border-b-2 border-purple-500 pb-1">Explore</Link>
            <Link to="/" className="text-slate-400 hover:text-slate-200 transition-all duration-300">Activity</Link>
            <Link to="/" className="text-slate-400 hover:text-slate-200 transition-all duration-300">Vault</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-container-lowest rounded-full px-4 py-2 gap-3 outline-variant/10 border border-transparent focus-within:border-secondary transition-all">
            <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
            <input className="bg-transparent border-none focus:ring-0 outline-none text-sm w-64 text-on-surface" placeholder="Search the void..." type="text"/>
          </div>
          <div className="flex items-center gap-4">
          <Link to="/create-community" className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-full font-headline font-bold text-sm hover:opacity-90 active:scale-95 transition-all">Create</Link>
          <button className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">notifications</button>
            {!user ? (
                <button onClick={handleLogin} className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold px-6 py-2 rounded-full active:scale-95 transition-all duration-300 text-sm shadow-[0_0_20px_-5px_rgba(221,183,255,0.4)]">
                    Sign In
                </button>
            ) : (
                <Link to={`/u/${user?.username || 'me'}`} className="w-10 h-10 rounded-full border border-primary/20 overflow-hidden ml-4">
                  <img src={user?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder"} alt="User Avatar" className="w-full h-full object-cover" />
                </Link>
            )}
          </div>
        </div>
      </nav>

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
          <Link to="/" className="bg-purple-500/10 text-purple-300 border-r-4 border-purple-500 px-6 py-4 flex items-center gap-4 group transition-colors duration-300">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">Home</span>
          </Link>
          <Link to="/" className="text-slate-500 hover:text-slate-300 px-6 py-4 flex items-center gap-4 group transition-colors duration-300 hover:bg-white/5">
            <span className="material-symbols-outlined text-lg">trending_up</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">Trending</span>
          </Link>
          <Link to="/explore" className="text-slate-500 hover:text-slate-300 px-6 py-4 flex items-center gap-4 group transition-colors duration-300 hover:bg-white/5">
            <span className="material-symbols-outlined text-lg">groups</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">Communities</span>
          </Link>
          <Link to="/" className="text-slate-500 hover:text-slate-300 px-6 py-4 flex items-center gap-4 group transition-colors duration-300 hover:bg-white/5">
            <span className="material-symbols-outlined text-lg">bookmark</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">Bookmarks</span>
          </Link>
          <Link to="/" className="text-slate-500 hover:text-slate-300 px-6 py-4 flex items-center gap-4 group transition-colors duration-300 hover:bg-white/5">
            <span className="material-symbols-outlined text-lg">history</span>
            <span className="font-headline uppercase tracking-widest text-[10px]">History</span>
          </Link>
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
      <div className="md:ml-64 pt-24 px-4 pb-12">
        {children}
      </div>

      {/* Floating Action Button (FAB) */}
      <button className="fixed bottom-12 right-12 h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary shadow-[0_0_40px_rgba(221,183,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-50">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-xl flex justify-around items-center h-16 z-50 shadow-[0_-10px_30px_-15px_rgba(168,85,247,0.3)]">
        <Link to="/" className="material-symbols-outlined text-purple-300">grid_view</Link>
        <Link to="/" className="material-symbols-outlined text-slate-400">trending_up</Link>
        <div className="w-12 h-12 -mt-10 bg-gradient-to-r from-primary to-primary-container rounded-full flex items-center justify-center shadow-lg neon-glow-primary">
          <span className="material-symbols-outlined text-on-primary">add</span>
        </div>
        <Link to="/" className="material-symbols-outlined text-slate-400">groups</Link>
        <Link to="/" className="material-symbols-outlined text-slate-400">bookmark</Link>
      </nav>
    </div>
  );
};

export default Layout;
