import React from 'react';
import { Link } from 'react-router-dom';

const Bookmarks = ({ user }) => {
  return (
    <div className="max-w-5xl mx-auto md:px-8">
      <header className="mb-12">
        <h1 className="text-5xl font-bold tracking-tighter headline-font text-white">Saved Fragments</h1>
        <p className="text-slate-400 font-light mt-2">Access your bookmarked transmissions across the Ethereal network.</p>
      </header>

      <div className="flex flex-col items-center justify-center py-20 glass-card rounded-3xl border border-dashed border-white/10">
        <div className="h-20 w-20 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-secondary">bookmark_border</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No bookmarks yet</h3>
        <p className="text-slate-500 max-w-sm text-center mb-8">
          Save interesting posts to your personal vault by clicking the bookmark icon on any transmission.
        </p>
        <Link to="/" className="bg-secondary text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          Browse The Void
        </Link>
      </div>
    </div>
  );
};

export default Bookmarks;
