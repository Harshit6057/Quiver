import { supabase } from './supabaseClient'; // Make sure Supabase is set up in React too, or use purely fetch.

// Use the production URL if defined in environment variables, otherwise fall back to localhost
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = RAW_API_URL
    .trim()
    .replace(/([^:]\/)\/+?/g, '$1')
    .replace(/\/+$/, '');

const apiPath = (path) => `${API_URL}/${String(path).replace(/^\/+/, '')}`;

const apiCache = new Map();

const readCache = (key) => {
    const entry = apiCache.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
        apiCache.delete(key);
        return null;
    }
    return entry.value;
};

const writeCache = (key, value, ttlMs) => {
    apiCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs
    });
};

const getCachedOrFetch = async (key, ttlMs, fetcher) => {
    const cached = readCache(key);
    if (cached) return cached;

    const value = await fetcher();
    if (value?.success) {
        writeCache(key, value, ttlMs);
    }
    return value;
};

const invalidateCache = (prefixes = []) => {
    if (!Array.isArray(prefixes) || prefixes.length === 0) return;
    const keys = Array.from(apiCache.keys());
    keys.forEach((key) => {
        if (prefixes.some((prefix) => key.startsWith(prefix))) {
            apiCache.delete(key);
        }
    });
};

const getAuthScope = (headers = {}) => String(headers?.Authorization || 'anon').slice(-24);

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
    const scope = getAuthScope(headers);
    return getCachedOrFetch(`user:self:${scope}`, 20 * 1000, () => apiRequest('user', { headers }));
};

export const fetchProfile = async (username) => {
    const headers = await getAuthHeaders();
    const scope = getAuthScope(headers);
    const key = `profile:${scope}:${String(username || '').toLowerCase()}`;
    return getCachedOrFetch(key, 30 * 1000, () => apiRequest(`user/profile/${encodeURIComponent(username)}`, { headers }));
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

export const updateUserAvatar = async (avatar_url = null) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest('user/avatar', {
        method: 'POST',
        headers,
        body: JSON.stringify({ avatar_url })
    });
    if (res?.success) {
        invalidateCache(['user:self:', 'profile:']);
    }
    return res;
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

// -- CONNECT --
export const toggleFollow = async (target_user_id) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest('connect/follow', {
        method: 'POST',
        headers,
        body: JSON.stringify({ target_user_id })
    });
    if (res?.success) {
        invalidateCache(['connect:', 'profile:']);
    }
    return res;
};

export const fetchFollowSuggestions = async () => {
    const headers = await getAuthHeaders();
    const scope = getAuthScope(headers);
    return getCachedOrFetch(`connect:suggestions:${scope}`, 12 * 1000, () => apiRequest('connect/suggestions', { headers }));
};

export const fetchFollowers = async (username) => {
    const key = `connect:followers:${String(username || '').toLowerCase()}`;
    return getCachedOrFetch(key, 20 * 1000, () => apiRequest(`connect/followers/${encodeURIComponent(username)}`));
};

export const fetchFollowing = async (username) => {
    const key = `connect:following:${String(username || '').toLowerCase()}`;
    return getCachedOrFetch(key, 20 * 1000, () => apiRequest(`connect/following/${encodeURIComponent(username)}`));
};

export const fetchFollowStatus = async (targetUserId) => {
    const headers = await getAuthHeaders();
    const scope = getAuthScope(headers);
    return getCachedOrFetch(`connect:status:${scope}:${targetUserId}`, 10 * 1000, () => apiRequest(`connect/status/${encodeURIComponent(targetUserId)}`, { headers }));
};

export const fetchFollowRequests = async () => {
    const headers = await getAuthHeaders();
    const scope = getAuthScope(headers);
    return getCachedOrFetch(`connect:requests:${scope}`, 8 * 1000, () => apiRequest('connect/requests', { headers }));
};

export const respondFollowRequest = async (request_id, action) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest('connect/request/respond', {
        method: 'POST',
        headers,
        body: JSON.stringify({ request_id, action })
    });
    if (res?.success) {
        invalidateCache(['connect:', 'profile:']);
    }
    return res;
};

export const updatePrivacy = async (is_private) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest('connect/privacy', {
        method: 'POST',
        headers,
        body: JSON.stringify({ is_private })
    });
    if (res?.success) {
        invalidateCache(['connect:', 'profile:', 'user:self:']);
    }
    return res;
};

// -- CHAT --
export const startChat = async (other_user_id) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest('chat/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ other_user_id })
    });
    if (res?.success) {
        invalidateCache(['chat:conversations:', 'connect:suggestions:', 'notifications:']);
    }
    return res;
};

export const fetchConversations = async () => {
    const headers = await getAuthHeaders();
    const scope = getAuthScope(headers);
    return getCachedOrFetch(`chat:conversations:${scope}`, 4 * 1000, () => apiRequest('chat/conversations', { headers }));
};

export const fetchMessages = async (conversationId, limit = 40, before = null) => {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    const scope = getAuthScope(headers);
    const key = `chat:messages:${scope}:${conversationId}:${limit}:${before || ''}`;
    return getCachedOrFetch(key, 2 * 1000, () => apiRequest(`chat/${conversationId}/messages?${params.toString()}`, { headers }));
};

export const sendMessage = async (conversationId, content) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest(`chat/${conversationId}/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content })
    });
    if (res?.success) {
        const scope = getAuthScope(headers);
        invalidateCache([
            `chat:messages:${scope}:${conversationId}:`,
            `chat:conversations:${scope}`,
            'notifications:'
        ]);
    }
    return res;
};

export const markConversationRead = async (conversationId) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest(`chat/${conversationId}/read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
    });
    if (res?.success) {
        const scope = getAuthScope(headers);
        invalidateCache([`chat:messages:${scope}:${conversationId}:`, `notifications:${scope}`]);
    }
    return res;
};

export const setTypingStatus = async (conversationId, is_typing) => {
    const headers = await getAuthHeaders();
    return apiRequest(`chat/${conversationId}/typing`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ is_typing })
    });
};

export const fetchTypingStatus = async (conversationId) => {
    const headers = await getAuthHeaders();
    return apiRequest(`chat/${conversationId}/typing`, { headers });
};

// -- MODERATION --
export const toggleBlockUser = async (target_user_id) => {
    const headers = await getAuthHeaders();
    return apiRequest('moderation/block', {
        method: 'POST',
        headers,
        body: JSON.stringify({ target_user_id })
    });
};

export const fetchBlockedUsers = async () => {
    const headers = await getAuthHeaders();
    return apiRequest('moderation/blocks', { headers });
};

export const createReport = async (payload) => {
    const headers = await getAuthHeaders();
    return apiRequest('moderation/report', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
};

// -- NOTIFICATIONS --
export const fetchNotifications = async () => {
    const headers = await getAuthHeaders();
    const scope = getAuthScope(headers);
    return getCachedOrFetch(`notifications:list:${scope}`, 6 * 1000, () => apiRequest('notifications', { headers }));
};

export const markNotificationsRead = async (ids = []) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest('notifications/read', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids })
    });
    if (res?.success) {
        const scope = getAuthScope(headers);
        invalidateCache([`notifications:list:${scope}`]);
    }
    return res;
};

export const fetchNotificationPreferences = async () => {
    const headers = await getAuthHeaders();
    const scope = getAuthScope(headers);
    return getCachedOrFetch(`notifications:prefs:${scope}`, 30 * 1000, () => apiRequest('notifications/preferences', { headers }));
};

export const updateNotificationPreferences = async (prefs) => {
    const headers = await getAuthHeaders();
    const res = await apiRequest('notifications/preferences', {
        method: 'POST',
        headers,
        body: JSON.stringify(prefs)
    });
    if (res?.success) {
        const scope = getAuthScope(headers);
        invalidateCache([`notifications:prefs:${scope}`]);
    }
    return res;
};

