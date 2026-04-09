import { supabase } from './supabaseClient'; // Make sure Supabase is set up in React too, or use purely fetch.

const API_URL = 'http://localhost:5000/api';

/**
 * Helper to get the JWT token.
 * Assumes the frontend uses Supabase Auth directly to login with Google Oauth.
 */
const getAuthHeaders = async () => {
    // Requires supabase client inside the React app
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return {};
    
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
};

// -- AUTH -- 
export const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
};

export const fetchCurrentUser = async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/user`, { headers });
    return res.json();
};

export const fetchProfile = async (username) => {
    const res = await fetch(`${API_URL}/user/profile/${username}`);
    return res.json();
};

// -- COMMUNITY --
export const createCommunity = async (name, description) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/community/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description })
    });
    return res.json();
};

export const joinCommunity = async (community_id) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/community/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ community_id })
    });
    return res.json();
};

export const fetchAllCommunities = async () => {
    const res = await fetch(`${API_URL}/community/all`);
    return res.json();
};

export const fetchCommunityByName = async (name) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/community/name/${name}`, { headers });
    return res.json();
};

export const fetchPostsByCommunityName = async (name) => {
    const res = await fetch(`${API_URL}/posts/comm-name/${name}`);
    return res.json();
};

export const fetchStats = async () => {
    const res = await fetch(`${API_URL}/stats`);
    return res.json();
};

// -- POSTS --
export const fetchFeed = async () => {
    const headers = await getAuthHeaders(); // required for tailored feed
    const res = await fetch(`${API_URL}/posts/feed`, { headers });
    return res.json();
};

export const fetchTrendingPosts = async () => {
    const res = await fetch(`${API_URL}/posts/trending`);
    return res.json();
};

export const createPost = async (community_id, title, content) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/post/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ community_id, title, content })
    });
    return res.json();
};

// -- COMMENTS --
export const addComment = async (post_id, content, parent_comment_id = null) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/comment/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ post_id, content, parent_comment_id })
    });
    return res.json();
};

// -- VOTING --
export const vote = async (vote_type, post_id = null, comment_id = null) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ vote_type, post_id, comment_id })
    });
    return res.json();
};
