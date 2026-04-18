import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrendingPosts } from '../api';
import PostMediaRenderer from '../components/PostMediaRenderer';

const Trending = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const res = await fetchTrendingPosts();
        if (res.success) {
          setPosts(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch trending:", e);
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto md:px-8 overflow-x-hidden">
      {/* Header */}
      <header className="mb-12 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter headline-font text-white">Heat Waves</h1>
            <p className="text-sm sm:text-base text-slate-400 font-light">The most resonated transmissions across the network in the last 7 cycles.</p>
          </div>
        </div>
      </header>

      {/* Trending Posts Feed */}
      <div className="flex flex-col gap-8">
        {posts.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 border border-dashed border-white/10 flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-slate-500">The sector is quiet...</h3>
            <p className="text-slate-600 mt-2">No transmissions have gained enough resonance to trend yet.</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <div key={post.id} className="glass-card rounded-xl p-5 sm:p-8 border border-white/5 space-y-6 group relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Rank Badge */}
              <div className="absolute top-0 right-0 p-4">
                  <span className="text-4xl sm:text-6xl font-black text-white/5 headline-font">#{index + 1}</span>
              </div>

              <div className="flex-1 space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border border-secondary/30 p-0.5">
                      <img alt="Author" className="rounded-full w-full h-full object-cover" src={post.author?.avatar_url || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{post.author?.username || 'Unknown'}</h4>
                      <span className="text-[10px] text-secondary font-headline uppercase tracking-widest">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-[10px] text-primary uppercase tracking-wider font-bold">{post.community?.name || 'Void'}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Link to={`/post/${post.id}`} className="hover:underline block">
                    <h2 className="text-2xl sm:text-3xl font-bold headline-font text-on-background leading-tight break-words">{post.title}</h2>
                  </Link>
                  <p className="text-slate-400 leading-relaxed font-light line-clamp-2">{post.content}</p>
                  <PostMediaRenderer media={post.media} />
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>stat_1</span>
                      <span className="text-lg font-bold text-white">{post.votes_count} resonance</span>
                    </div>
                    <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                      <span className="material-symbols-outlined">chat_bubble</span>
                      <span className="text-sm">View Discussion</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Trending;
