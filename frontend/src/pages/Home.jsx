import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ feed }) => {
  return (
    <div className="max-w-5xl mx-auto md:px-8">
      {/* Feed Header & Tabs */}
      <header className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tighter headline-font text-white">The Void</h1>
          <p className="text-slate-400 font-light">Synthesizing real-time interactions across the network.</p>
        </div>
        <div className="flex items-center bg-surface-container-lowest p-1 rounded-xl">
          <button className="px-6 py-2 rounded-lg bg-surface-container-highest text-primary font-medium text-sm transition-all">For You</button>
          <button className="px-6 py-2 rounded-lg text-slate-500 hover:text-slate-200 font-medium text-sm transition-all">Trending</button>
        </div>
      </header>

      {/* Bento Feed Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Main Feed Column */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {feed.length === 0 && (
              <p className="text-slate-400">No new API posts available. Showing simulated data.</p>
          )}
          
          {feed.map(post => (
              <div key={post.id} className="glass-card rounded-xl p-8 border border-white/5 space-y-6 group relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border border-secondary/30 p-0.5">
                      <img alt="Author avatar" className="rounded-full w-full h-full object-cover" src={post.author?.avatar_url || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{post.author?.username || 'Unknown'}</h4>
                      <span className="text-[10px] text-secondary font-headline uppercase tracking-widest">3 hours ago</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-surface-variant/40 text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">{post.community?.name || 'Void'}</span>
                  </div>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <Link to={`/post/${post.id}`} className="hover:underline">
                    <h2 className="text-2xl font-bold headline-font text-on-background leading-tight">{post.title}</h2>
                  </Link>
                  <p className="text-slate-400 leading-relaxed font-light line-clamp-3">{post.content}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-surface-container-lowest rounded-full p-1 border border-white/5">
                      <button className="h-8 w-8 flex items-center justify-center text-secondary hover:bg-secondary/10 rounded-full transition-all">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stat_1</span>
                      </button>
                      <span className="px-3 text-sm font-bold headline-font text-white">{post.votes_count || 0}</span>
                      <button className="h-8 w-8 flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-all rotate-180">
                        <span className="material-symbols-outlined text-lg">stat_1</span>
                      </button>
                    </div>
                    <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                      <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">chat_bubble</span>
                      <span className="text-sm font-medium">Comments</span>
                    </Link>
                  </div>
                  <button className="material-symbols-outlined text-slate-500 hover:text-white">more_horiz</button>
                </div>
              </div>
          ))}

          {/* Fallback Post 1 */}
          <div className="glass-card rounded-xl p-8 border border-white/5 space-y-6 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-secondary/30 p-0.5">
                  <img alt="Author" className="rounded-full w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaa8cW_HrkjxX6DAi9DC7ecwSskmx5c8d895sBZfszDoynN5f7vBIZolNGxp9BWnxqoDfmcPE7pW5zLCpv5HTXa7x9kfIBPtZ4zuXgEldxuM_x4S5uFs2MuQ6BOR2V8m2o_HYedjfACTwnglML4Siqmcs2CAH4n0SVpFyQ-PDJUKVG4uqnZ774dL3rd76PiGAIhlBXHVAQR_fxSMPRezo4qgyaHSCmdw73dEzYpr3UYAZXpIwINdpnBVc_XzqwfCctnUgUGtDRKBc2" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">luna_void</h4>
                  <span className="text-[10px] text-secondary font-headline uppercase tracking-widest">3 hours ago</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-surface-variant/40 text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Neural_Networks</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link to="/post/placeholder" className="hover:underline">
                <h2 className="text-2xl font-bold headline-font text-on-background leading-tight">Implementing Sub-Zero Latency in Distributed Quantum Ledgers</h2>
              </Link>
              <p className="text-slate-400 leading-relaxed font-light">We've finally breached the 0.4ms barrier using the new Ethereal SDK. The implications for real-time asset mirroring are staggering. Check out the refraction patterns in the data stream below.</p>
              <div className="aspect-video rounded-lg overflow-hidden relative">
                <img alt="Quantum" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG_Q9M_7nRKGeBdPQXCoTGwhFMTQc1wj39ftoiU3ILRFNqIqNxepJChxuqkUMUqRGI4HFBqjhlaeJk0hSJLzaA994y7HfCyhZUl7MLfw5Hb4JLGZlljRiBnt8Idbuhd7YehR7XxKHkfOuvbdGlS8Xj57WvMb5PhAIK527uUe8N6fxCeGNSfPWMs9xthoEl2Pa0EpJX-iK-kvKpjyRRUltjjQ20Kz9cMp1fwsbUHiRmFGMRvfp4nPUnNhlUT7ycDXr1HRc513xaSaSj" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-surface-container-lowest rounded-full p-1 border border-white/5">
                  <button className="h-8 w-8 flex items-center justify-center text-secondary hover:bg-secondary/10 rounded-full transition-all">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stat_1</span>
                  </button>
                  <span className="px-3 text-sm font-bold headline-font text-white">2.4k</span>
                  <button className="h-8 w-8 flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-all rotate-180">
                    <span className="material-symbols-outlined text-lg">stat_1</span>
                  </button>
                </div>
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                  <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">chat_bubble</span>
                  <span className="text-sm font-medium">128</span>
                </button>
              </div>
              <button className="material-symbols-outlined text-slate-500 hover:text-white">more_horiz</button>
            </div>
          </div>

          {/* Fallback Post 2 */}
          <div className="glass-card rounded-xl p-8 border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-purple-500/30 p-0.5">
                  <img alt="Author avatar" className="rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv3tb0nl0UMfan4NZJddc17ATWrEDhELF63a4g8KCtVxvjJsI-hxssFg7NVu3foCR6N_oUlatt8hWUFz2Z4YhW4UuLqjwFaBTYe7_T52AuNPIkvVhsEX6stVCRhI1CJptnj_TEJSJKFzJKQeOjkfklUKn_1Nik9wavrA6ROFSgowzLF8B3RRQmgALVHYsKIM1BEZBBJSbsx49NCvtaCbImM4wh4mS2hVWQKRNnfHjYAId_1LWg-2PL6eYH2vlEnA5a-DiuXyC-oxXi" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">xero_point</h4>
                  <span className="text-[10px] text-secondary font-headline uppercase tracking-widest">5 hours ago</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Link to="/post/placeholder" className="hover:underline">
                <h2 className="text-xl font-bold headline-font text-on-background">Has anyone successfully bypassed the Level 4 firewall on the Neo-Tokyo node?</h2>
              </Link>
              <p className="text-slate-400 leading-relaxed font-light">Been stuck on the secondary handshake for three days. It seems like the encryption key rotates every 400ms based on atmospheric noise in the sector. Any advice from the elders?</p>
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-surface-container-lowest rounded-full p-1 border border-white/5">
                  <button className="h-8 w-8 flex items-center justify-center text-secondary hover:bg-secondary/10 rounded-full transition-all">
                    <span className="material-symbols-outlined text-lg">stat_1</span>
                  </button>
                  <span className="px-3 text-sm font-bold headline-font text-white">842</span>
                  <button className="h-8 w-8 flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-all rotate-180">
                    <span className="material-symbols-outlined text-lg">stat_1</span>
                  </button>
                </div>
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">chat_bubble</span>
                  <span className="text-sm font-medium">42</span>
                </button>
              </div>
              <button className="material-symbols-outlined text-slate-500 hover:text-white">more_horiz</button>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Community Spotlight */}
          <div className="glass-card rounded-xl p-6 border border-white/5">
            <h3 className="text-xs font-bold headline-font uppercase tracking-widest text-secondary mb-6">Active Nodes</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                    <span className="material-symbols-outlined text-purple-400">psychology</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Cognitive_Arch</h5>
                    <p className="text-[10px] text-slate-500">14.2k active syncs</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward_ios</span>
              </div>
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center border border-secondary/40">
                    <span className="material-symbols-outlined text-secondary">database</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-secondary transition-colors">The_Archive</h5>
                    <p className="text-[10px] text-slate-500">8.9k active syncs</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward_ios</span>
              </div>
            </div>
          </div>
          
          {/* Trending Tags */}
          <div className="glass-card rounded-xl p-6 border border-white/5">
            <h3 className="text-xs font-bold headline-font uppercase tracking-widest text-secondary mb-6">Trending Fragments</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-surface-variant/40 text-[10px] text-on-surface-variant font-bold border border-white/5 hover:border-primary/50 cursor-pointer transition-all">#QuantumLeap</span>
              <span className="px-3 py-1 rounded-full bg-surface-variant/40 text-[10px] text-on-surface-variant font-bold border border-white/5 hover:border-primary/50 cursor-pointer transition-all">#NeuralSync</span>
              <span className="px-3 py-1 rounded-full bg-surface-variant/40 text-[10px] text-on-surface-variant font-bold border border-white/5 hover:border-primary/50 cursor-pointer transition-all">#ZeroG_Living</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
