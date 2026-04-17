import React from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/`,
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error.message);
      alert(error.message);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-[calc(100vh-5rem)] flex items-center justify-center relative px-6 mt-10">
      {/* Abstract Background Patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,_rgba(221,183,255,0.15)_0%,_rgba(183,109,255,0.05)_50%,_rgba(11,19,38,0)_70%)] blur-[80px] top-[-200px] left-[-200px]"></div>
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,_rgba(76,215,246,0.1)_0%,_rgba(3,181,211,0.05)_50%,_rgba(11,19,38,0)_70%)] blur-[60px] bottom-[-100px] right-[-100px]"></div>
        <svg className="absolute top-0 right-0 w-full h-full opacity-10" height="100%" width="100%">
          <defs>
            <pattern height="100" id="grid" patternUnits="userSpaceOnUse" width="100">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5"></path>
            </pattern>
          </defs>
          <rect fill="url(#grid)" height="100%" width="100%"></rect>
        </svg>
      </div>

      {/* Login Container */}
      <main className="w-full max-w-xl relative z-10">
        {/* Brand Anchor Header */}
        <div className="text-center mb-12">
          <h1 className="font-headline font-extrabold text-5xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
            Ethereal
          </h1>
          <p className="font-label text-secondary tracking-widest uppercase text-[11px] font-medium opacity-80">
            Sublime Intelligence • Secure Protocol
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-[rgba(45,52,73,0.4)] backdrop-blur-[40px] rounded-xl shadow-[0_0_80px_-15px_rgba(221,183,255,0.1)] p-10 md:p-14 border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 border border-outline-variant/10 rounded-xl pointer-events-none"></div>
          
          <header className="mb-10">
            <h2 className="font-headline text-3xl text-on-surface font-bold tracking-tight mb-2">Initialize Session</h2>
            <p className="text-on-surface-variant font-body text-sm leading-relaxed">Enter the terminal to manage your digital vault and activity across the ethereal network.</p>
          </header>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin} 
              className="w-full flex items-center justify-center gap-4 bg-white text-surface-container-lowest py-4 px-6 rounded-lg font-bold tracking-tight hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-300"
            >
              <img alt="Google Logo" className="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCKEzYb-A2W87aNbmOO4-UZkvIAmu7rXA7Y4XcMreaDUT7nNomjlhCGtAAF-T3K3SYG_8fzBqK3b0wQUzmqWhU_DlEmYrad-I_fZyKbs--zL9fKKnFoWURSEWNCoex3HNO7zqevWgsN8M15ach1-maImNKUvGsV-61smcCKuCqr-bnzYg3Hm0Hc2iQ9JcuJBGpiG7umvB9fhAbYKjomfCbJTcGDHxH6qaepelieChQ0XJze4l0bByNyfBJLZ2rVD4jfFxI_IdwvcLY"/>
              <span className="text-lg">Continue with Google Account</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent"></div>
              <span className="text-outline text-[10px] font-bold tracking-widest uppercase">OR MANUAL ACCESS</span>
              <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/30 via-outline-variant/30 to-transparent"></div>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); navigate('/'); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] ml-1">Identity Token</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-xl">alternate_email</span>
                  <input className="w-full bg-surface-container-lowest border-none text-on-surface placeholder:text-outline-variant/50 pl-12 pr-4 py-4 rounded-lg focus:ring-2 focus:ring-secondary/40 focus:bg-surface-container transition-all outline-none" placeholder="email@nexus.com" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Access Key</label>
                  <a className="text-[10px] font-bold text-outline uppercase tracking-widest hover:text-primary transition-colors" href="#">Recover Key?</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-xl">lock</span>
                  <input className="w-full bg-surface-container-lowest border-none text-on-surface placeholder:text-outline-variant/50 pl-12 pr-4 py-4 rounded-lg focus:ring-2 focus:ring-secondary/40 focus:bg-surface-container transition-all outline-none" placeholder="••••••••" type="password" />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-lg font-bold text-lg tracking-tight hover:shadow-[0_0_30px_-5px_rgba(221,183,255,0.4)] active:scale-[0.98] transition-all duration-300"
              >
                Authorize Access
              </button>
            </form>
          </div>

          <footer className="mt-10 text-center">
            <p className="text-on-surface-variant font-body text-sm">
              New entity? <a className="text-primary font-bold hover:underline decoration-primary/30 underline-offset-4" href="#">Register new account</a>
            </p>
          </footer>
        </div>

        <div className="mt-12 flex justify-between items-center px-4 opacity-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-widest text-outline uppercase">Network Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">security</span>
              <span className="text-[10px] font-bold tracking-widest text-outline uppercase">AES-256 Locked</span>
            </div>
          </div>
          <div className="text-[10px] font-bold tracking-widest text-outline uppercase">
            © 2024 Ethereal Systems
          </div>
        </div>
      </main>
      
      {/* Decorative Corner Elements */}
      <div className="fixed top-12 left-12 w-24 h-24 border-t-2 border-l-2 border-primary/20 rounded-tl-xl pointer-events-none hidden md:block"></div>
      <div className="fixed bottom-12 right-12 w-24 h-24 border-b-2 border-r-2 border-secondary/20 rounded-br-xl pointer-events-none hidden md:block"></div>
    </div>
  );
};

export default Login;
