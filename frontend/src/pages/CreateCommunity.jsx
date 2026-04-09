import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateCommunity = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !description) return;
    
    // In a real app we'd POST to backend here
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/c/${slug}`);
  };

  return (
    <div className="pt-12 pb-12 pr-8 relative overflow-hidden min-h-[calc(100vh-5rem)]">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div class="absolute bottom-[-5%] left-[20%] w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10 p-4 md:p-8">
        {/* Header Section */}
        <header className="mb-12">
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-background mb-4 leading-none font-headline">Spawn New <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Community</span></h1>
          <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed font-body">Initialize a new sovereign cluster in the Ethereal network. Set your parameters and manifest your collective.</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Card */}
          <section className="lg:col-span-7 bg-surface-container-highest/80 backdrop-blur-xl p-6 md:p-10 rounded-xl glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="block font-headline text-secondary text-xs uppercase tracking-[0.2em] font-bold" htmlFor="community-name">Protocol Identifier</label>
                <input 
                  id="community-name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-6 text-on-surface placeholder:text-slate-600 focus:ring-2 focus:ring-secondary/50 focus:shadow-[0_0_15px_rgba(76,215,246,0.3)] transition-all outline-none" 
                  placeholder="Enter community name..." 
                  type="text"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block font-headline text-secondary text-xs uppercase tracking-[0.2em] font-bold" htmlFor="community-desc">Collective Directive</label>
                <textarea 
                  id="community-desc" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 px-6 text-on-surface placeholder:text-slate-600 focus:ring-2 focus:ring-secondary/50 focus:shadow-[0_0_15px_rgba(76,215,246,0.3)] transition-all resize-none outline-none" 
                  placeholder="Define the purpose and rules of your cluster..." 
                  rows="5"
                  required
                ></textarea>
              </div>
              <div className="pt-4">
                <button 
                  className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-5 rounded-xl font-headline font-black text-lg tracking-tight hover:shadow-[0_0_30px_rgba(221,183,255,0.5)] transition-all active:scale-[0.98]" 
                  type="submit"
                >
                  Initialize Community
                </button>
              </div>
            </form>
          </section>

          {/* Info/Metadata Section */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-high/40 p-8 rounded-xl border border-white/5">
              <h3 className="font-headline text-white text-xl mb-4">Initialization Specs</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">database</span>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-headline">Storage Tier</p>
                    <p className="text-on-surface font-body text-sm">Decentralized IPFS</p>
                  </div>
                </li>
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">verified_user</span>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-headline">Access Control</p>
                    <p className="text-on-surface font-body text-sm">ZK-Proof Encryption</p>
                  </div>
                </li>
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">hub</span>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-headline">Network Node</p>
                    <p className="text-on-surface font-body text-sm">Ether-Delta-9</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="p-8 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-tighter">Pro Feature</span>
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
              </div>
              <h4 className="font-headline text-white font-bold mb-2">Neural Moderation</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-body">Enable our local LLM to assist in community management and sentiment analysis.</p>
              <button className="mt-4 text-primary font-headline text-xs font-bold uppercase tracking-widest hover:underline">Learn More</button>
            </div>
          </aside>
        </div>

        {/* Footer Stats or Context */}
        <footer className="mt-20 pt-8 border-t border-white/5 flex flex-wrap gap-12">
          <div className="flex flex-col">
            <span className="text-secondary font-headline text-2xl font-bold">12.4k</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-headline">Active Clusters</span>
          </div>
          <div className="flex flex-col">
            <span className="text-secondary font-headline text-2xl font-bold">2.1M</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-headline">Total Nodes</span>
          </div>
          <div className="flex flex-col">
            <span className="text-secondary font-headline text-2xl font-bold">0.04s</span>
            <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-headline">Sync Latency</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CreateCommunity;
