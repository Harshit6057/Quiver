import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { fetchCurrentUser, fetchFeed } from './api';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import ExploreCommunities from './pages/ExploreCommunities';
import CommunityView from './pages/CommunityView';
import CreateCommunity from './pages/CreateCommunity';
import UserProfile from './pages/UserProfile';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadData(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        loadData(event === 'SIGNED_IN');
      } else {
        setUser(null);
        setFeed([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (isNewSignIn = false) => {
    try {
      const u = await fetchCurrentUser();
      if (u && u.success) {
        setUser(u.data);
        if (isNewSignIn) {
          window.location.href = `/u/${u.data.username}`;
          return;
        }
      }

      const f = await fetchFeed();
      if (f && f.success) setFeed(f.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <Layout user={user} handleLogin={handleLogin}>
        <Routes>
          <Route path="/" element={<Home feed={feed} />} />
          <Route path="/explore" element={<ExploreCommunities />} />
          <Route path="/c/:community" element={<CommunityView />} />
          <Route path="/create-community" element={<CreateCommunity />} />
          <Route path="/u/:username" element={<UserProfile />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
