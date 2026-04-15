import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { fetchBookmarks, fetchCurrentUser, fetchFeed, toggleBookmark } from './api';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import ExploreCommunities from './pages/ExploreCommunities';
import CommunityView from './pages/CommunityView';
import CreateCommunity from './pages/CreateCommunity';
import CreatePost from './pages/CreatePost';
import UserProfile from './pages/UserProfile';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Bookmarks from './pages/Bookmarks';
import Trending from './pages/Trending';

function App() {
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session) {
          loadData(false);
        } else {
          setLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (session) {
        // Only consider SIGNED_IN as a redirect trigger if we are on login/landing
        // and it's not the initial mount session check.
        // Actually, let's just use loadData and manage navigation there.
        loadData(event === 'SIGNED_IN');
      } else {
        setUser(null);
        setFeed([]);
        setBookmarks([]);
        setVoteCounts({});
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async (shouldRedirect = false) => {
    try {
      const u = await fetchCurrentUser();
      if (u && u.success) {
        setUser(u.data);
        
        // Only redirect if explicitly requested (e.g. from SIGNED_IN event)
        // AND we are on a login or landing page.
        if (shouldRedirect && (location.pathname === '/login' || location.pathname === '/landing' || location.pathname === '/')) {
          navigate(`/u/${u.data.username}`);
        }
      }
      
      const f = await fetchFeed();
      if (f && f.success) {
        setFeed(f.data);
        const initialCounts = (f.data || []).reduce((acc, post) => {
          acc[post.id] = post.votes_count ?? 0;
          return acc;
        }, {});
        setVoteCounts(initialCounts);
      }

      const b = await fetchBookmarks();
      if (b && b.success) setBookmarks(b.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (postId) => {
    if (!user) {
      alert('Please sign in to bookmark posts');
      return { success: false, error: 'Not authenticated' };
    }

    const res = await toggleBookmark(postId);
    if (!res?.success) {
      return res;
    }

    const refreshed = await fetchBookmarks();
    if (refreshed?.success) {
      setBookmarks(refreshed.data);
      return res;
    }

    return { success: false, error: refreshed?.error || 'Failed to refresh bookmarks after toggle' };

  };

  const bookmarkedPostIds = bookmarks.map(item => item.post_id);

  const handleVoteCountChange = (postId, value) => {
    setVoteCounts(prev => ({ ...prev, [postId]: value }));
    setFeed(prev => prev.map(post => post.id === postId ? { ...post, votes_count: value } : post));
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Layout user={user} handleLogin={handleLogin}>
      <Routes>
        <Route path="/" element={<Home feed={feed} user={user} bookmarkedPostIds={bookmarkedPostIds} onToggleBookmark={handleToggleBookmark} voteCounts={voteCounts} onVoteCountChange={handleVoteCountChange} />} />
        <Route path="/explore" element={<ExploreCommunities user={user} />} />
        <Route path="/c/:community" element={<CommunityView user={user} />} />
        <Route path="/create-community" element={<CreateCommunity />} />
        <Route path="/create-post" element={<CreatePost user={user} />} />
        <Route path="/create-post/:community" element={<CreatePost user={user} />} />
        <Route path="/u/:username" element={<UserProfile />} />
        <Route path="/post/:id" element={<PostDetail user={user} bookmarkedPostIds={bookmarkedPostIds} onToggleBookmark={handleToggleBookmark} voteCounts={voteCounts} onVoteCountChange={handleVoteCountChange} />} />
        <Route path="/bookmarks" element={<Bookmarks user={user} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Layout>
  );
}

export default App;
