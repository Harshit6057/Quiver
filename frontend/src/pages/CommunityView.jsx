import React from 'react';
import { Link, useParams } from 'react-router-dom';

const CommunityView = () => {
  const { community } = useParams();
  const name = community ? community.replace('-', ' ') : 'Synthetica Deep-Net';

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
      {/* Hero Header Section */}
      <section className="relative rounded-xl overflow-hidden mb-12 bg-surface-container-low">
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover opacity-40" alt="Hero background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7MuctIvesPapKOGRKxERR-W-MJ8KGiTm1POlNXrIZztgztCOtgUCnK1Ti7ANIJfNkJE52wgf-v9EnTy1ESA70hpqcHXPDnQ5B2lAulS5Vc4BXBxT3IL8IIqmyhz8Z12xFLUQFQkZkVW7CgORUCMjPvnZNg8I4o5PZusy9qnwEMz0iEwHC6EadOmtB2OeirCdh0mNzvYB1BYZTlsxETaLBibqdipC9paarhVQLgiIlEn_vpqA4OGMBA1s24vP9BwYDjX_7_4sY5y_F" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        </div>
        <div className="relative z-10 p-8 lg:p-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="flex items-center gap-4 mb-2">
              <span className="px-4 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-space-grotesk tracking-widest uppercase">Verified Nexus</span>
              <span className="text-slate-400 text-sm font-space-grotesk">Since June 2042</span>
            </div>
            <h1 className="text-6xl font-headline font-bold tracking-tighter leading-none text-white capitalize">{name}</h1>
            <p className="text-on-surface-variant text-lg leading-relaxed font-light">The premier collective for experimental neuro-architecture and high-fidelity virtual construction. Building the next layer of the Ethereal experience.</p>
            <div className="flex items-center gap-8 mt-4">
              <div className="flex flex-col">
                <span className="text-3xl font-headline font-bold text-primary tracking-tight">1.2M</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-space-grotesk">Archivists</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-3xl font-headline font-bold text-secondary tracking-tight">42.8K</span>
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-space-grotesk">Active Now</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-headline font-bold text-tertiary tracking-tight">Top 0.1%</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-space-grotesk">Global Rank</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="bg-surface-container-highest border border-white/10 px-8 py-4 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-all backdrop-blur-md">
              <span className="material-symbols-outlined text-slate-300">share</span>
              <span className="font-space-grotesk uppercase tracking-widest text-xs">Share</span>
            </button>
            <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-xl font-headline font-bold text-lg hover:shadow-[0_0_30px_rgba(221,183,255,0.3)] transition-all active:scale-95">
              Join Collective
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Posts Feed (Main) */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          {/* Feed Filter Bar */}
          <div className="flex justify-between items-center px-2 overflow-x-auto hide-scrollbar">
            <div className="flex gap-8 whitespace-nowrap">
              <button className="text-primary font-headline font-semibold text-lg border-b-2 border-primary pb-2">Latest Nodes</button>
              <button className="text-slate-500 hover:text-slate-300 font-headline font-semibold text-lg pb-2 transition-colors">Trending Pulse</button>
              <button className="text-slate-500 hover:text-slate-300 font-headline font-semibold text-lg pb-2 transition-colors">Hall of Fame</button>
            </div>
            <span className="material-symbols-outlined text-slate-500 cursor-pointer hidden md:block">tune</span>
          </div>

          <article className="bg-surface-container-highest/40 backdrop-blur-xl rounded-xl p-8 outline outline-1 outline-variant/10 hover:outline-variant/30 transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <img className="w-12 h-12 rounded-full border border-primary/20" alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYAjT-S-N8M-e1P15J5E001-rNiehomO6_sQ_1oth06SyPBOpKchwP_PFpHW65TxialQbfN5Oy_uQbicikba2EIYpZcSeWU91AOmwHjfaGMelGN4bm14siDOyPFuJdHe8dPa5VRM7KT4u55ymu_4hvXpxLJXwKX4njIl-2--Wf91Sl1qaEj7FhvbbKsTilDzSmcdi7CHer_lpfJiqRJzzSGUtfwTjq1jh5oE3VHA3oilTaHOSvW5UDRPkYtEJVeMuCq77BOBxBZAsb" />
              <div>
                <h4 className="text-white font-headline font-bold text-lg leading-none">Voxel_Void</h4>
                <p className="text-secondary text-xs font-space-grotesk tracking-wide mt-1">Lead Architect • 4h ago</p>
              </div>
              <span className="material-symbols-outlined text-slate-500 ml-auto">more_vert</span>
            </div>
            <h3 className="text-2xl font-headline font-bold mb-4 text-primary-fixed leading-tight">Implementing Sub-Atomic Shaders in Virtual Hubs</h3>
            <p className="text-on-surface-variant text-base leading-relaxed mb-6">We've finally cracked the latency issues when rendering multi-dimensional glass textures. This new patch will allow for 8k refractive surfaces in the community hub without dropping below 120fps. Thoughts on the implementation?</p>
            <div className="rounded-lg overflow-hidden mb-6 border border-white/5">
              <img className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-700" alt="Post" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKlUyoFjQkefnYv8LOV4byuKq3IgVp-zJKi18kPiwfofic4ngZMPtCKl-x_L29TlWAvK6wYOngp_6cmRnoPS3rG9fYMBfRf-ylGFkYGrXMUgAjbiJS40XYjvuCZx6Lg0vNGSyC7a7EXSchlORvsNN4k5uGVDMs1MN2jVQSLjwTix1K2z5oA6JeqJY2VKSFn3zbhQT-4ZCBNc3vvnIj2t-w6Rdyds3MeI3gsda7sdf4Il6J7CRAXrIpnLynATUKOHvox6V4T03PS8tE"/>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  <span className="font-space-grotesk text-sm">2.4k</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 hover:text-secondary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">chat_bubble_outline</span>
                  <span className="font-space-grotesk text-sm">158</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 hover:text-white transition-colors cursor-pointer">bookmark_border</span>
            </div>
          </article>
        </div>

        {/* Right Column: Sidebar Stats & Info */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-surface-container-high/80 backdrop-blur-2xl rounded-xl p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h3 className="font-headline font-bold text-2xl text-white mb-6">Nexus Protocols</h3>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-secondary">info</span>
                <div>
                  <h5 className="text-sm font-bold text-slate-200">About {name}</h5>
                  <p className="text-sm text-slate-400 mt-1">A decentralized hub for collective intelligence and immersive world-building.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">security</span>
                <div>
                  <h5 className="text-sm font-bold text-slate-200">Safety Rating: AAA</h5>
                  <p className="text-sm text-slate-400 mt-1">End-to-end neural encryption enabled for all community channels.</p>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-white/5">
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-space-grotesk mb-6">Top Contributors</h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-lowest border border-white/10 overflow-hidden">
                      <img alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwniiUP6javOlNULzE27YcMOUzZ5RclXEu66dVJyZrHjGPjdLIFJezNHqxt36jfhpr6tKdHLebcSefUK2RckIYU08gJ-UQsMw3ronm-p6SQBc3ezaRIESGUccY5SvTAccog3TEz0bOWnlVRFWUFMVSIAGuFtXaZp5ZWGgA_OzumZeef4o3AvOwOTDMJIulRJ5eIFHIdLv26kKqvcBuEYGNbXEnkkntAiEYyNcU1Bu3BTMbk9-ztdS-MqDPYKU6hfTlhITQNtfK6PVB"/>
                    </div>
                    <span className="text-sm font-medium text-white">Nova_Construct</span>
                  </div>
                  <span className="text-xs text-secondary font-mono">1.2k pts</span>
                </div>
                {/* Other contributors omitted for brevity */}
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest border border-white/5 rounded-xl p-8">
            <h4 className="text-xs uppercase tracking-widest text-slate-500 font-space-grotesk mb-6">Directory</h4>
            <ul className="flex flex-col gap-4">
              <li>
                <Link to="#" className="flex items-center justify-between text-on-surface hover:text-primary transition-colors group">
                  <span className="font-headline font-semibold">Community Wiki</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </li>
              <li>
                <Link to="#" className="flex items-center justify-between text-on-surface hover:text-primary transition-colors group">
                  <span className="font-headline font-semibold">Active Projects</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityView;
