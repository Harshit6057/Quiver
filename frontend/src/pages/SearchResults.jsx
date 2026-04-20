import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchEverything } from '../api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({ posts: [], communities: [], users: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults({ posts: [], communities: [], users: [] });
        return;
      }

      setLoading(true);
      try {
        const res = await searchEverything(trimmed);
        if (res.success) {
          setResults(res.data || { posts: [], communities: [], users: [] });
        } else {
          setResults({ posts: [], communities: [], users: [] });
        }
      } catch (error) {
        console.error('Search failed:', error);
        setResults({ posts: [], communities: [], users: [] });
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black font-headline text-white">Search Results</h1>
        <p className="text-slate-400 mt-2">Showing results for <span className="text-primary font-semibold">{query || 'nothing'}</span></p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Posts</h2>
            {results.posts.length === 0 ? <p className="text-slate-500 text-sm">No matching posts.</p> : results.posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="block glass-card rounded-2xl p-4 border border-white/5 hover:border-primary/40 transition-all">
                <p className="text-white font-semibold break-words">{post.title}</p>
                <p className="text-slate-400 text-sm line-clamp-2 mt-2">{post.content}</p>
                <p className="text-[10px] uppercase tracking-widest text-secondary mt-3">c/{post.community?.name || 'Void'}</p>
              </Link>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Communities</h2>
            {results.communities.length === 0 ? <p className="text-slate-500 text-sm">No matching communities.</p> : results.communities.map((community) => (
              <Link key={community.id} to={`/c/${community.name}`} className="block glass-card rounded-2xl p-4 border border-white/5 hover:border-secondary/40 transition-all">
                <p className="text-white font-semibold break-words">{community.name}</p>
                <p className="text-slate-400 text-sm line-clamp-2 mt-2">{community.description}</p>
              </Link>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Users</h2>
            {results.users.length === 0 ? <p className="text-slate-500 text-sm">No matching users.</p> : results.users.map((profile) => (
              <Link key={profile.id} to={`/u/${profile.username}`} className="block glass-card rounded-2xl p-4 border border-white/5 hover:border-primary/40 transition-all">
                <div className="flex items-center gap-3">
                  <img src={profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`} alt={profile.username} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  <p className="text-white font-semibold break-words">{profile.username}</p>
                </div>
              </Link>
            ))}
          </section>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
