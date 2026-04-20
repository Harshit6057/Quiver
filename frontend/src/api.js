import { supabase } from './supabaseClient'; // Make sure Supabase is set up in React too, or use purely fetch.

// Use the production URL if defined in environment variables, otherwise fall back to localhost
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = RAW_API_URL
    .trim()
    .replace(/([^:]\/)\/+?/g, '$1')
    .replace(/\/+$/, '');

const apiPath = (path) => `${API_URL}/${String(path).replace(/^\/+/, '')}`;

if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && API_URL.includes('localhost')) {
    console.warn('VITE_API_URL is pointing to localhost in production. Configure Vercel env to your Render backend URL.');
}

const parseApiResponse = async (res) => {
    const text = await res.text();
    let data;

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = null;
    }

    if (!res.ok) {
        return {
            success: false,
            error: data?.error || `Request failed with status ${res.status}`,
            status: res.status,
            raw: text
        };
    }

    return data || { success: true };
};

const apiRequest = async (path, options = {}) => {
    try {
        const res = await fetch(apiPath(path), options);
        return await parseApiResponse(res);
    } catch (error) {
        return {
            success: false,
            error: error?.message || 'Network error'
        };
    }
};

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

const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
};

// -- AUTH -- 
export const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
};

export const fetchCurrentUser = async () => {
    const headers = await getAuthHeaders();
    return apiRequest('user', { headers });
};

export const fetchProfile = async (username) => {
    return apiRequest(`user/profile/${username}`);
};

// -- COMMUNITY --
export const createCommunity = async (name, description, image_url = null) => {
    const headers = await getAuthHeaders();
    return apiRequest('community/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description, image_url })
    });
};

export const updateUserAvatar = async (avatar_url) => {
    const headers = await getAuthHeaders();
    return apiRequest('user/avatar', {
        method: 'POST',
        headers,
        body: JSON.stringify({ avatar_url })
    });
};

export const updateCommunityPhoto = async (community_id, image_url) => {
    const headers = await getAuthHeaders();
    return apiRequest('community/photo', {
        method: 'POST',
        headers,
        body: JSON.stringify({ community_id, image_url })
    });
};

export const joinCommunity = async (community_id) => {
    const headers = await getAuthHeaders();
    return apiRequest('community/join', {
        method: 'POST',
        headers,
        body: JSON.stringify({ community_id })
    });
};

export const fetchAllCommunities = async () => {
    return apiRequest('community/all');
};

export const fetchCommunityByName = async (name) => {
    const headers = await getAuthHeaders();
    return apiRequest(`community/name/${name}`, { headers });
};

export const fetchPostsByCommunityName = async (name) => {
    return apiRequest(`posts/comm-name/${name}`);
};

export const fetchStats = async () => {
    return apiRequest('stats');
};

// -- POSTS --
export const fetchFeed = async () => {
    const headers = await getAuthHeaders(); // required for tailored feed
    return apiRequest('posts/feed', { headers });
};

export const fetchTrendingPosts = async () => {
    return apiRequest('posts/trending');
};

export const createPost = async (community_id, title, content, media = []) => {
    const headers = await getAuthHeaders();
    return apiRequest('post/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ community_id, title, content, media })
    });
};

export const uploadPostMedia = async (file) => {
    const token = await getAuthToken();
    if (!token) {
        return { success: false, error: 'Not authenticated' };
    }

    const formData = new FormData();
    formData.append('file', file);

    return apiRequest('post/upload-media', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });
};

export const fetchPostById = async (id) => {
    return apiRequest(`post/${id}`);
};

// -- COMMENTS --
export const addComment = async (post_id, content, parent_comment_id = null) => {
    const headers = await getAuthHeaders();
    return apiRequest('comment/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({ post_id, content, parent_comment_id })
    });
};

export const fetchCommentsByPostId = async (postId) => {
    return apiRequest(`comments/${postId}`);
};

// -- VOTING --
export const vote = async (vote_type, post_id = null, comment_id = null) => {
    const headers = await getAuthHeaders();
    return apiRequest('vote', {
        method: 'POST',
        headers,
        body: JSON.stringify({ vote_type, post_id, comment_id })
    });
};


// -- BOOKMARKS --
export const toggleBookmark = async (post_id) => {
    const headers = await getAuthHeaders();
    return apiRequest('bookmark', {
        method: 'POST',
        headers,
        body: JSON.stringify({ post_id })
    });
};

export const fetchBookmarks = async () => {
    const headers = await getAuthHeaders();
    return apiRequest('bookmarks', { headers });
};

export const searchEverything = async (query) => {
    return apiRequest(`search?q=${encodeURIComponent(query || '')}`);
};

