import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllCommunities, vote } from '../api';
import PostMediaRenderer from '../components/PostMediaRenderer';

const Home = ({ feed, user, bookmarkedPostIds = [], onToggleBookmark, voteCounts = {}, onVoteCountChange }) => {
  const [sidebarCommunities, setSidebarCommunities] = useState([]);

  useEffect(() => {
    const loadSidebar = async () => {
      const res = await fetchAllCommunities();
      if (res.success) {
        setSidebarCommunities(res.data.slice(0, 5)); // Show top 5
      }
    };
    loadSidebar();
  }, []);

  const getDisplayVotes = (post) => {
    if (Object.prototype.hasOwnProperty.call(voteCounts, post.id)) {
      return voteCounts[post.id];
    }
    return post.votes_count ?? 0;
  };

  const handleVote = async (postId, voteType) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    const base = voteCounts[postId] ?? (feed.find(p => p.id === postId)?.votes_count ?? 0);
    const nextValue = Math.max(0, base + voteType);
    onVoteCountChange?.(postId, nextValue);

    const res = await vote(voteType, postId);
    if (!res?.success) {
      onVoteCountChange?.(postId, base);
      alert(res?.error || 'Unable to register vote right now');
      return;
    }

    if (typeof res.totalVotes === 'number') {
      onVoteCountChange?.(postId, res.totalVotes);
    }
  };

  const handleBookmark = async (postId) => {
    if (!onToggleBookmark) return;
    const res = await onToggleBookmark(postId);
    if (!res?.success) {
      alert(res?.error || 'Unable to update bookmark right now');
    }
  };

  return (
    <div className="max-w-5xl mx-auto md:px-8 overflow-x-hidden">
      {/* Feed Header & Tabs */}
      <header className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter headline-font text-white">The Void</h1>
          <p className="text-sm sm:text-base text-slate-400 font-light max-w-xl">Synthesizing real-time interactions across the network.</p>
        </div>
        <div className="flex items-center bg-surface-container-lowest p-1 rounded-xl">
          <button className="px-6 py-2 rounded-lg bg-surface-container-highest text-primary font-medium text-sm transition-all">For You</button>
          <Link to="/trending" className="px-6 py-2 rounded-lg text-slate-500 hover:text-slate-200 font-medium text-sm transition-all">Trending</Link>
        </div>
      </header>

      {/* Bento Feed Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Main Feed Column */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {feed.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 border border-dashed border-white/10 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-primary">sensors_off</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Your connection is silent</h2>
              <p className="text-slate-400 max-w-sm mb-8 text-sm sm:text-base">You haven't joined any communities yet, or there are no transmissions from your network clusters.</p>
              <div className="flex gap-4">
                <Link to="/explore" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Explore Nodes</Link>
                <Link to="/create-community" className="glass-card px-8 py-3 rounded-xl font-bold text-white hover:bg-white/5 transition-colors">Start a Cluster</Link>
              </div>
            </div>
          ) : (
            feed.map(post => (
              <div key={post.id} className="glass-card rounded-xl p-8 border border-white/5 space-y-6 group relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border border-secondary/30 p-0.5">
                      <img alt="Author avatar" className="rounded-full w-full h-full object-cover" src={post.author?.avatar_url || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{post.author?.username || 'Unknown'}</h4>
                      <span className="text-[10px] text-secondary font-headline uppercase tracking-widest">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-surface-variant/40 text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">{post.community?.name || 'Void'}</span>
                  </div>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <Link to={`/post/${post.id}`} className="hover:underline">
                    <h2 className="text-xl sm:text-2xl font-bold headline-font text-on-background leading-tight break-words">{post.title}</h2>
                  </Link>
                  <p className="text-slate-400 leading-relaxed font-light line-clamp-3">{post.content}</p>
                  <PostMediaRenderer media={post.media} />
                </div>
                
                <div className="flex items-center justify-between pt-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-surface-container-lowest rounded-full p-1 border border-white/5">
                      <button onClick={() => handleVote(post.id, 1)} className="h-8 w-8 flex items-center justify-center text-secondary hover:bg-secondary/10 rounded-full transition-all">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stat_1</span>
                      </button>
                      <span className="px-3 text-sm font-bold headline-font text-white">{getDisplayVotes(post)}</span>
                      <button onClick={() => handleVote(post.id, -1)} className="h-8 w-8 flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-all rotate-180">
                        <span className="material-symbols-outlined text-lg">stat_1</span>
                      </button>
                    </div>
                    <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                      <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">chat_bubble</span>
                      <span className="text-sm font-medium">Comments</span>
                    </Link>
                  </div>
                  <button onClick={() => handleBookmark(post.id)} className={`material-symbols-outlined transition-colors ${bookmarkedPostIds.includes(post.id) ? 'text-secondary' : 'text-slate-500 hover:text-white'}`}>
                    {bookmarkedPostIds.includes(post.id) ? 'bookmark' : 'bookmark_add'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Content */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Community Spotlight */}
          <div className="glass-card rounded-xl p-6 border border-white/5">
            <h3 className="text-xs font-bold headline-font uppercase tracking-widest text-secondary mb-6">Active Nodes</h3>
            <div className="space-y-6">
              {sidebarCommunities.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">No active nodes in the sector.</p>
              ) : (
                sidebarCommunities.map(c => (
                  <Link to={`/c/${c.name}`} key={c.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/40">
                        <span className="material-symbols-outlined text-primary">hub</span>
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{c.name}</h5>
                        <p className="text-[10px] text-slate-500">{c.member_count} members</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-sm">arrow_forward_ios</span>
                  </Link>
                ))
              )}
            </div>
            <Link to="/explore" className="block text-center mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">View All Clusters</Link>
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
