import React from 'react';
import { useParams } from 'react-router-dom';

const UserProfile = () => {
  const { username } = useParams();
  const displayUsername = username || 'CuriousFox123';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* Profile Hero Asymmetric Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end mb-20">
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-8 items-center md:items-end">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-125 group-hover:bg-primary/40 transition-all duration-700"></div>
            <img className="relative w-48 h-48 rounded-xl glass-card p-2 border-2 border-primary/40 object-cover" alt="User avatar" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUsername}`} />
          </div>
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-secondary font-headline tracking-[0.2em] text-xs uppercase font-bold">Verified Architect</span>
            <h1 className="text-6xl font-bold font-headline tracking-tighter leading-none">{displayUsername}</h1>
            <p className="text-on-surface-variant max-w-md mt-4 text-sm leading-relaxed">Synthesizing digital realities at the intersection of neural networks and ethereal aesthetics. Exploring the silent spaces of the vault.</p>
            <div className="flex justify-center md:justify-start gap-6 mt-6">
              <div className="flex flex-col">
                <span className="text-2xl font-bold font-headline">12.4k</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Reputation</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold font-headline">842</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Transmissions</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold font-headline">4.1k</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Connected</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 flex justify-center lg:justify-end gap-3 z-10 relative">
          <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold shadow-[0_0_20px_rgba(221,183,255,0.3)] hover:shadow-[0_0_40px_rgba(221,183,255,0.5)] transition-all">Engage</button>
          <button className="p-4 glass-card rounded-xl text-white hover:bg-white/10 transition-all border border-white/10">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </section>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-headline text-2xl font-bold tracking-tight">Recent Transmissions</h3>
            <span className="text-secondary text-xs font-bold uppercase tracking-widest cursor-pointer hover:underline">Archive</span>
          </div>
          
          <div className="glass-card rounded-xl p-6 md:p-8 group hover:border-primary/30 transition-all duration-500 border border-white/5">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">Neural Synthesis</span>
              <span className="text-slate-500 text-xs font-headline">2h ago</span>
            </div>
            <h4 className="text-2xl font-headline font-bold mb-4 leading-tight group-hover:text-primary transition-colors">The paradox of generative architectures in low-latency environments.</h4>
            <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Observations on how latent space navigation correlates with user cognitive load during peak synchronization periods...</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-sm">favorite</span>
                <span className="text-xs">1.2k</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-sm">mode_comment</span>
                <span className="text-xs">42</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Modules */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-surface-container-highest to-surface-container border border-white/5">
            <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Activity Matrix</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <span className="text-[10px] text-secondary font-bold block mb-1">STREAK</span>
                <span className="text-2xl font-headline font-bold">142</span>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <span className="text-[10px] text-primary font-bold block mb-1">TIER</span>
                <span className="text-2xl font-headline font-bold">ELITE</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>NEXT EVOLUTION</span>
                <span>82%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary w-[82%]"></div>
              </div>
            </div>
          </div>
          
          {/* Joined Communities */}
          <div className="glass-card rounded-xl p-6 border border-white/5">
            <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Nexus Circles</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">terminal</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold font-headline group-hover:text-primary transition-colors">Core_Protocol</span>
                  <span className="text-[10px] text-slate-500">24.5k Members</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
