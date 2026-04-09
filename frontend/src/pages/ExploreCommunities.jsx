import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllCommunities, joinCommunity } from '../api';

const ExploreCommunities = ({ user }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const res = await fetchAllCommunities();
      if (res.success) {
        setCommunities(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id) => {
    if (!user) {
      alert("Please sign in to join communities");
      return;
    }
    const res = await joinCommunity(id);
    if (res.success) {
      loadCommunities(); // Refresh member counts
      // Note: In a real app, you'd also want to update the user's joined_communities in global state.
      // For now, let's just refresh the counts.
      window.location.reload(); // Quick fix to sync global state for now, but better to update context
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* Hero Header Section */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest mb-4">Discovery Engine</span>
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter leading-none mb-6">Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Ether</span></h1>
            <p className="text-on-surface-variant text-lg max-w-lg font-body leading-relaxed">Connect with specialized clusters of creators, developers, and visionaries within the Ethereal network.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold border-2 border-background">+{communities.length * 12}</div>
            </div>
            <span className="text-secondary text-sm font-label self-center">Nodes Active</span>
          </div>
        </div>
      </section>

      {/* Community Grid */}
      {communities.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <h3 className="text-2xl font-bold text-slate-400 mb-4">No communities found</h3>
          <p className="text-slate-500 mb-8">Be the first to create a new cluster in the Ethereal network.</p>
          <Link to="/create-community" className="bg-primary text-white px-8 py-3 rounded-full font-bold">Create Community</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communities.map((c) => {
            const isJoined = user?.joined_communities?.includes(c.id);
            return (
              <div key={c.id} className="glass-card rounded-xl p-8 h-full flex flex-col justify-between hover:-translate-y-1 transition-transform border border-white/5 group">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-3xl">hub</span>
                    </div>
                    {isJoined && (
                      <span className="bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Joined</span>
                    )}
                  </div>
                  <Link to={`/c/${c.name}`} className="block group-hover:text-primary transition-colors">
                    <h3 className="text-2xl font-headline font-bold mb-2">{c.name}</h3>
                  </Link>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">{c.description}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{c.member_count}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Members</span>
                  </div>
                  {isJoined ? (
                    <Link to={`/c/${c.name}`} className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">View Node</Link>
                  ) : (
                    <button 
                      onClick={() => handleJoin(c.id)}
                      className="bg-primary/20 text-primary px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExploreCommunities;
