import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProfile } from '../api';

const History = ({ user, bookmarks = [] }) => {
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.username) {
        setRecentPosts([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetchProfile(user.username);
        if (res?.success) {
          setRecentPosts(res.data?.recentPosts || []);
        } else {
          setRecentPosts([]);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
        setRecentPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.username]);

  const bookmarkTimeline = useMemo(() => {
    return bookmarks
      .filter((item) => item?.post)
      .map((item) => ({
        id: `bookmark-${item.id || item.post_id}`,
        type: 'bookmark',
        date: item.created_at || item.post?.created_at,
        title: item.post?.title || 'Bookmarked post',
        postId: item.post_id,
      }));
  }, [bookmarks]);

  const postTimeline = useMemo(() => {
    return recentPosts.map((post) => ({
      id: `post-${post.id}`,
      type: 'post',
      date: post.created_at,
      title: post.title,
      postId: post.id,
    }));
  }, [recentPosts]);

  const timeline = useMemo(() => {
    return [...postTimeline, ...bookmarkTimeline]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 30);
  }, [postTimeline, bookmarkTimeline]);

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto md:px-8 overflow-x-hidden">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter headline-font text-white">History</h1>
          <p className="text-sm sm:text-base text-slate-400 font-light mt-2">Sign in to view your activity timeline.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto md:px-8 overflow-x-hidden">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter headline-font text-white">History</h1>
        <p className="text-sm sm:text-base text-slate-400 font-light mt-2">Your recent posts and bookmark activity.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : timeline.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 border border-dashed border-white/10 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No activity yet</h3>
          <p className="text-slate-500 text-sm sm:text-base">Your recent posts and bookmark events will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {timeline.map((item) => (
            <article key={item.id} className="glass-card rounded-xl p-5 sm:p-6 border border-white/5 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                  {item.type === 'post' ? 'Post Published' : 'Post Bookmarked'}
                </p>
                <Link to={`/post/${item.postId}`} className="text-white text-base sm:text-lg font-bold hover:text-primary transition-colors break-words">
                  {item.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {item.date ? new Date(item.date).toLocaleString() : 'Unknown time'}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-500">
                {item.type === 'post' ? 'edit_square' : 'bookmark'}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
