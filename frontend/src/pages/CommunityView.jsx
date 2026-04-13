import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCommunityByName, fetchPostsByCommunityName, joinCommunity } from '../api';

const CommunityView = ({ user }) => {
  const { community: communityName } = useParams();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [communityName]);

  const loadData = async () => {
    setLoading(true);
    try {
      const commRes = await fetchCommunityByName(communityName);
      if (commRes.success) {
        setCommunity(commRes.data);
      }
      const postRes = await fetchPostsByCommunityName(communityName);
      if (postRes.success) {
        setPosts(postRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      alert("Please sign in to join communities");
      return;
    }
    const res = await joinCommunity(community.id);
    if (res.success) {
      loadData(); // Refresh membership status and counts
      window.location.reload(); // Refresh to update global joined communities if needed
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Nexus Not Found</h1>
        <p className="text-slate-400 mb-8">This community cluster does not exist in the Ethereal archive.</p>
        <Link to="/explore" className="bg-primary text-white px-8 py-3 rounded-full font-bold">Explore Other Nodes</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
      {/* Hero Header Section */}
      <section className="relative rounded-xl overflow-hidden mb-12 bg-surface-container-low min-h-[300px]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        </div>
        <div className="relative z-10 p-8 lg:p-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8 h-full">
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="flex items-center gap-4 mb-2">
              <span className="px-4 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Verified Nexus</span>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Since {new Date(community.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-headline font-bold tracking-tighter leading-none text-white capitalize">{community.name}</h1>
            <p className="text-on-surface-variant text-lg leading-relaxed font-light">{community.description || "The premier collective for high-fidelity virtual construction and collaboration."}</p>
            <div className="flex items-center gap-12 mt-6">
              <div className="flex flex-col">
                <span className="text-4xl font-headline font-bold text-primary tracking-tight">{community.member_count}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Archivists</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-4xl font-headline font-bold text-green-400 tracking-tight">{Math.floor(community.member_count * 0.1) + 1}</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Now</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all backdrop-blur-md">
              <span className="material-symbols-outlined text-slate-300">share</span>
              <span className="font-bold uppercase tracking-widest text-[10px]">Share</span>
            </button>
            {community.owner_id === user?.id ? null : community.is_member || user?.joined_communities?.includes(community.id) ? (
              <button disabled className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-xl font-headline font-bold text-lg opacity-80 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-400">check_circle</span>
                Joined
              </button>
            ) : (
              <button 
                onClick={handleJoin}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-xl font-headline font-bold text-lg hover:shadow-[0_0_30px_rgba(221,183,255,0.3)] transition-all active:scale-95"
              >
                Join Collective
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Bento Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Posts Feed (Main) */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          {/* Feed Filter Bar */}
          <div className="flex justify-between items-center px-2">
            <div className="flex gap-8 overflow-x-auto hide-scrollbar">
              <button className="text-primary font-headline font-bold text-lg border-b-2 border-primary pb-2 whitespace-nowrap">Latest Nodes</button>
              <button className="text-slate-500 hover:text-slate-300 font-headline font-bold text-lg pb-2 transition-colors whitespace-nowrap">Trending Pulse</button>
              <button className="text-slate-500 hover:text-slate-300 font-headline font-bold text-lg pb-2 transition-colors whitespace-nowrap">Top Feed</button>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {posts.length === 0 ? (
              <div className="bg-white/5 rounded-3xl p-16 border border-dashed border-white/10 text-center">
                <h3 className="text-2xl font-bold text-slate-500 mb-2">Sector is empty</h3>
                <p className="text-slate-600 mb-8">No transmissions have been recorded in this nexus cluster yet.</p>
                <Link to={`/create-post/${community.name}`} className="bg-primary text-white px-8 py-3 rounded-xl font-bold inline-block">Create Post</Link>
              </div>
            ) : (
              posts.map(post => (
                <article key={post.id} className="bg-surface-container-highest/40 backdrop-blur-xl rounded-xl p-8 outline outline-1 outline-variant/10 hover:outline-variant/30 transition-all group">
                  <div className="flex items-center gap-4 mb-6">
                    <img className="w-12 h-12 rounded-full border border-primary/20" alt="User" src={post.author?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author?.username}`} />
                    <div>
                      <h4 className="text-white font-headline font-bold text-lg leading-none">{post.author?.username}</h4>
                      <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mt-1">Fragment • {new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 ml-auto cursor-pointer">more_vert</span>
                  </div>
                  <Link to={`/post/${post.id}`}>
                    <h3 className="text-3xl font-headline font-bold mb-4 text-white leading-tight hover:text-primary transition-colors">{post.title}</h3>
                  </Link>
                  <p className="text-slate-400 text-base leading-relaxed mb-6 font-light">{post.content}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stat_1</span>
                        <span className="font-bold text-sm tracking-tight">{post.votes_count}</span>
                      </div>
                      <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-slate-400 hover:text-secondary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-lg">chat_bubble</span>
                        <span className="font-bold text-sm tracking-tight">Discussion</span>
                      </Link>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 hover:text-white transition-colors cursor-pointer">bookmark</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Sidebar Stats & Info */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-surface-container-high/80 backdrop-blur-2xl rounded-xl p-8 border border-white/10">
            <h3 className="font-headline font-bold text-2xl text-white mb-6">Nexus Protocols</h3>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-secondary">info</span>
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">About Cluster</h5>
                  <p className="text-sm text-slate-300 leading-relaxed">{community.description || "A decentralized cluster for high-fidelity collective intelligence."}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Created At</h5>
                  <p className="text-sm text-slate-300">{new Date(community.created_at).toDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-white/5">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6">Active Archivists</h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                       <span className="material-symbols-outlined text-primary text-sm">person</span>
                    </div>
                    <span className="text-sm font-bold text-white">Top Members</span>
                  </div>
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">{community.member_count} Total</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/5 rounded-xl p-8">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6">Directory Links</h4>
            <ul className="flex flex-col gap-4">
              <li>
                <Link to="#" className="flex items-center justify-between text-slate-300 hover:text-white transition-colors group">
                  <span className="font-headline font-bold text-sm">Cluster Wiki</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </li>
              <li>
                <Link to="#" className="flex items-center justify-between text-slate-300 hover:text-white transition-colors group">
                  <span className="font-headline font-bold text-sm">Nexus Protocols</span>
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
