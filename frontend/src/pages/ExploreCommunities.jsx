import React from 'react';
import { Link } from 'react-router-dom';

const ExploreCommunities = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* Hero Header Section */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest mb-4">Discovery Engine</span>
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter leading-none mb-6">Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Ether</span></h1>
            <p className="text-on-surface-variant text-lg max-w-lg font-body leading-relaxed">Connect with specialized clusters of creators, developers, and visionaries within the Ethereal network.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-background object-cover" alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5EgyDREVOYSly19otofEHSXlkhvF0fVm9No53i5u_JM2JvqKmqLlBTX3eB_SSqRdg4EDTMsj8_gK3Glx8s-0gQO2S-zNzcJutSV3cP4fyUJnkZGBMQxNo73DKQmhQ-64ikSRnPE5YEjPHRRuThTJMEFs2BURvf6IP1tepo2f9oWcA2MSTXFyehc0zzUC5CTQwJGCpkpcy3WFMSA2OnmkuOgRKQ68IZo0O4Y_ARBwRRvAjykHACNn3d0mQ-K4sH6lGrPI6xzxtYGW1" />
              <img className="w-10 h-10 rounded-full border-2 border-background object-cover" alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5H5AWQTIXuZOjK9iUYFqxS7nMKe9TMDV9oER8fJdvbMyPHRK2mJWnZGnEo78W7t4Ce4LsVd1ZxE5qU3btz04Jm94yM_1p9iPYI2PGlviUoHirNuFPweAxB7mayMqMsJXSvD0Ez-jAiRSRy9n_acZy0p-NndLu15ORs1Kp0BXQrIQsDWvgZPq_pv4k13FiFBMXGDnxGpXWeilDxfNxIjh1Fc6szkYC0q9HLvHyRwtfIbn2qCkBjLEya33TE4K7ugn2DQK_0QBdzJfH" />
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold border-2 border-background">+2.4k</div>
            </div>
            <span className="text-secondary text-sm font-label self-center">Active Now</span>
          </div>
        </div>
      </section>

      {/* Filters Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
        <div className="md:col-span-2 glass-card rounded-xl p-1 flex items-center shadow-lg">
          <span className="material-symbols-outlined px-4 text-slate-500">search</span>
          <input className="w-full bg-transparent border-none py-4 px-2 focus:ring-0 text-white placeholder:text-slate-500 outline-none" placeholder="Find communities..." type="text"/>
          <button className="bg-primary/20 text-primary px-6 py-2 rounded-lg m-1 font-bold text-xs uppercase tracking-widest hover:bg-primary/30 transition-all">Filter</button>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-surface-container-highest transition-all">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Nodes</div>
            <div className="text-2xl font-headline font-bold">12,842</div>
          </div>
          <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">hub</span>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-surface-container-highest transition-all">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Active Streams</div>
            <div className="text-2xl font-headline font-bold">894</div>
          </div>
          <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span>
        </div>
      </div>

      {/* Community Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Main Featured Card */}
        <div className="md:col-span-8 group relative overflow-hidden rounded-xl h-[450px]">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10"></div>
          <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Featured" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoD_M9VBjN70K93HWQk5psQFL45rbCI8s61rK-jwAz7KZDkgQy2DbY5PxwnrHD-REzzhXXHSsQ-9EZwRAgaqeTpZAfJ-FF1QAvduRJPAU6mi0vAYydIeM6ABQ8NYeev4DlrdybEsz6V9GbYucfp5x0plflq6vfAAsrm0wwx50j0xvT_kS98KJ4H3dhQDfYJmfOsHBaRD3zfKPYZiiidl7EbyI0ZOUEjMjXdrGDbvwPKV8Z2Y5paN4YxtKmRu4m7E6vXTdmTscew_AF" />
          <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Featured Node</span>
            </div>
            <h2 className="text-4xl font-headline font-bold mb-4">The Neural Archive</h2>
            <p className="text-slate-300 max-w-lg mb-8 leading-relaxed">Join the world's largest collaborative dataset for generative aesthetics and prompt engineering. Weekly challenges inside.</p>
            <div className="flex items-center gap-6">
              <Link to="/c/neural-archive" className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">Enter Archive</Link>
              <div className="flex flex-col">
                <span className="text-white font-bold">42.8k</span>
                <span className="text-slate-400 text-[10px] uppercase tracking-widest">Participants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Cards */}
        <div className="md:col-span-4 flex flex-col gap-8">
          <div className="glass-card rounded-xl p-8 h-full flex flex-col justify-between ambient-glow">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-3xl">psychology</span>
                </div>
                <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Trending</span>
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">Synth-Bio Ethics</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Discussing the boundaries of organic and mechanical integration.</p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <span className="text-xs text-slate-500">1.2k Members</span>
              <button className="text-secondary text-xs font-bold uppercase tracking-widest hover:underline">Join Cluster</button>
            </div>
          </div>
        </div>

        {/* More Community Cards */}
        <div className="md:col-span-4">
          <div className="glass-card rounded-xl p-8 h-full flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">token</span>
                </div>
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">Vault Operators</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Technical discussion for high-security liquidity providers.</p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <span className="text-xs text-slate-500">892 Active</span>
              <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">Connect</button>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="glass-card rounded-xl p-8 h-full flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-xl bg-tertiary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-3xl">globe</span>
                </div>
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">Terraformers</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Open-source environmental monitoring and simulation.</p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <span className="text-xs text-slate-500">5.6k Members</span>
              <button className="text-tertiary text-xs font-bold uppercase tracking-widest hover:underline">Sync</button>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="glass-card rounded-xl p-8 h-full flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">memory</span>
                </div>
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">Silicate Labs</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Experimental hardware hacking and low-level firmware.</p>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <span className="text-xs text-slate-500">342 Deep</span>
              <button className="text-white text-xs font-bold uppercase tracking-widest hover:underline">Authorize</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ExploreCommunities;
