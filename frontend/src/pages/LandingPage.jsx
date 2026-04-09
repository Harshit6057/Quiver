import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="relative pt-12 pb-20 px-8 max-w-7xl mx-auto min-h-screen">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full -z-10"></div>
      
      <section className="grid lg:grid-cols-2 gap-16 items-center min-h-[716px]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest uppercase text-secondary font-body">Network Online • V 2.0.4</span>
          </div>
          <h1 className="text-7xl lg:text-8xl font-black font-space-grotesk tracking-tighter leading-[0.9] text-on-background">
            Beyond the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary-container">Interface.</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed font-body">
            A hyper-curated space for architects of the future. Connect, trade data, and build within the pressurized vacuum of the Ethereal Terminal.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link to="/" className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold px-10 py-4 rounded-xl active:scale-95 duration-200 transition-all text-lg shadow-[0_0_40px_rgba(183,109,255,0.2)]">
              Join the Network
            </Link>
            <Link to="/explore" className="bg-surface-container-highest/40 backdrop-blur-md text-white border border-white/10 font-bold px-10 py-4 rounded-xl hover:bg-white/10 transition-all active:scale-95 duration-200 text-lg">
              Explore Vault
            </Link>
          </div>
        </div>

        {/* Bento Preview */}
        <div className="grid grid-cols-6 grid-rows-6 gap-4 h-[600px]">
          <div className="col-span-4 row-span-4 rounded-xl overflow-hidden relative group">
            <img alt="Network" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZoCqwES_gqUW5Ap1_lZopLR6CTmIyhLYEaj9U9CxG-o5DbZ7IpnEQlvduNlivhAsuMH4eCAOWrJKaIonWScCvnpAywbpdWkg9sepuGBC0INMDwvikD3ntwNyVsQ7tUyACUkg6HtDApMzlFQlA2caQUQxXvM1U6hentSyY5DlBEzaH-Jd4EboSmuf6YncNLrUURAhiqLk2olCO9x1Mv7zoaMrh3pAYHtnsEbzF4rOT8LuUEIuhjB3LfcztQYBZI63tiDeUePT_Cf1W" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <span className="bg-primary/20 backdrop-blur-md text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Featured Community</span>
              <h3 className="text-2xl font-bold font-space-grotesk">Neural Architects</h3>
            </div>
          </div>
          <div className="col-span-2 row-span-2 bg-surface-container-highest/40 backdrop-blur-xl rounded-xl border border-white/5 flex flex-col items-center justify-center p-6 text-center">
            <span className="material-symbols-outlined text-secondary text-4xl mb-2">trending_up</span>
            <span className="text-3xl font-black font-space-grotesk text-white">4.2%</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Network Growth</span>
          </div>
          <div className="col-span-2 row-span-4 rounded-xl overflow-hidden relative">
            <img alt="Interface" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAibJNfQfrU5E4julnzJ2M2y_meHqOyKDpBxL5X_Jusbguga6h8twKW5g7PazL0YNpISHtirkqUxF7nATl6IPp-rsNMSR3UovxELrzTcgRsn0wHUkqPCot1mUg-QtQHRK6aH-FYi0_XSnq1FeqESODwAlRG0C3STZSHX5cCCTmnjbv60UYlD20ib4Tk-L2S4g_Q_b5n_Hi7oM7YjumfteQOan3aJgLVSKUPCoyMUGGvOJJ3mPL0K4Ezafe0QdDp15iX6ad8VA-0Snfs" />
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px]"></div>
          </div>
          <div className="col-span-4 row-span-2 bg-surface-container-low rounded-xl border border-white/5 p-6 flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-secondary font-black uppercase tracking-widest">Latest Activity</span>
              <p className="text-on-surface text-sm max-w-[200px]">Data cluster #882 synchronized with main vault.</p>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default LandingPage;
