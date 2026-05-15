import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { fetchBookmarks, fetchCurrentUser, fetchFeed, toggleBookmark } from './api';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const ExploreCommunities = lazy(() => import('./pages/ExploreCommunities'));
const CommunityView = lazy(() => import('./pages/CommunityView'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Trending = lazy(() => import('./pages/Trending'));
const History = lazy(() => import('./pages/History'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Connect = lazy(() => import('./pages/Connect'));
const Messages = lazy(() => import('./pages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications'));

const RouteLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
    let authStateReceived = false;

    // On production with OAuth fragments, let onAuthStateChange handle everything
    // Don't do initial getSession() as it may not have processed fragment yet
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      authStateReceived = true;
      console.log('[Auth Event]', event, { hasSession: !!session, userId: session?.user?.id });

      if (session) {
        // Redirect on SIGNED_IN event (successful OAuth) or INITIAL_SESSION (page refresh with active session)
        loadData(event === 'SIGNED_IN' || event === 'INITIAL_SESSION');
      } else {
        setUser(null);
        setFeed([]);
        setBookmarks([]);
        setVoteCounts({});
        setLoading(false);
        console.log('[Auth] No session found');
      }
    });

    // Fallback: if auth state never fires after 4 seconds, stop loading
    const timeout = setTimeout(() => {
      if (mounted && !authStateReceived) {
        console.warn('[Auth Timeout] No auth state received after 4s, stopping loader');
        setLoading(false);
      }
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async (shouldRedirect = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setFeed([]);
      setBookmarks([]);
      setVoteCounts({});
      setLoading(false);
      return;
    }

    try {
      let resolvedUser = null;
      const u = await fetchCurrentUser();
      if (u && u.success) {
        resolvedUser = u.data;
      } else {
        const fallbackUsername = (session.user?.email || 'user').split('@')[0];
        resolvedUser = {
          id: session.user?.id,
          email: session.user?.email,
          username: fallbackUsername,
          avatar_url: session.user?.user_metadata?.avatar_url || null,
          joined_communities: []
        };
        console.warn('Backend profile fetch failed; using session fallback user until API is reachable.');
      }

      setUser(resolvedUser);

      // Only redirect if explicitly requested (e.g. from SIGNED_IN event)
      // AND we are on a login or landing page.
      if (shouldRedirect && (location.pathname === '/login' || location.pathname === '/landing' || location.pathname === '/')) {
        navigate(`/u/${resolvedUser.username}`);
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

  const handleUserUpdated = (updatedUser) => {
    setUser((prev) => ({ ...(prev || {}), ...updatedUser }));
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
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Home feed={feed} user={user} bookmarkedPostIds={bookmarkedPostIds} onToggleBookmark={handleToggleBookmark} voteCounts={voteCounts} onVoteCountChange={handleVoteCountChange} />} />
          <Route path="/explore" element={<ExploreCommunities user={user} />} />
          <Route path="/c/:community" element={<CommunityView user={user} />} />
          <Route path="/create-community" element={<CreateCommunity />} />
          <Route path="/create-post" element={<CreatePost user={user} />} />
          <Route path="/create-post/:community" element={<CreatePost user={user} />} />
          <Route path="/u/:username" element={<UserProfile user={user} onUserUpdated={handleUserUpdated} />} />
          <Route path="/post/:id" element={<PostDetail user={user} bookmarkedPostIds={bookmarkedPostIds} onToggleBookmark={handleToggleBookmark} voteCounts={voteCounts} onVoteCountChange={handleVoteCountChange} />} />
          <Route path="/bookmarks" element={<Bookmarks user={user} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />} />
          <Route path="/history" element={<History user={user} bookmarks={bookmarks} />} />
          <Route path="/search" element={<SearchResults user={user} />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/connect" element={<Connect user={user} onUserUpdated={handleUserUpdated} />} />
          <Route path="/messages" element={<Messages user={user} />} />
          <Route path="/notifications" element={<Notifications user={user} />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
