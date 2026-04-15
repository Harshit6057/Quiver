import React from 'react';
import { Link } from 'react-router-dom';

const Bookmarks = ({ user, bookmarks = [], onToggleBookmark }) => {
  const validBookmarks = bookmarks.filter(item => item.post);

  const handleRemove = async (postId) => {
    if (!onToggleBookmark) return;
    await onToggleBookmark(postId);
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto md:px-8">
        <header className="mb-12">
          <h1 className="text-5xl font-bold tracking-tighter headline-font text-white">Saved Fragments</h1>
          <p className="text-slate-400 font-light mt-2">Sign in to access your bookmarked transmissions.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto md:px-8">
      <header className="mb-12">
        <h1 className="text-5xl font-bold tracking-tighter headline-font text-white">Saved Fragments</h1>
        <p className="text-slate-400 font-light mt-2">Access your bookmarked transmissions across the Ethereal network.</p>
      </header>

      {validBookmarks.length === 0 ? (
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
      ) : (
        <div className="space-y-6">
          {validBookmarks.map(item => (
            <article key={item.id || item.post_id} className="glass-card rounded-xl p-6 border border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{item.post.community?.name || 'Void'}</p>
                  <Link to={`/post/${item.post.id}`} className="text-2xl font-bold text-white hover:text-secondary transition-colors">
                    {item.post.title}
                  </Link>
                  <p className="text-slate-400 line-clamp-2">{item.post.content}</p>
                  <p className="text-xs text-slate-500">by {item.post.author?.username || 'Unknown'} • {(item.post.votes_count || 0)} votes</p>
                </div>
                <button onClick={() => handleRemove(item.post_id)} className="material-symbols-outlined text-secondary hover:text-white transition-colors" title="Remove bookmark">
                  bookmark
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
