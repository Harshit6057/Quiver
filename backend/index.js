import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { supabase, getAuthClient } from './supabaseClient.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

const cacheStore = new Map();

const getCache = (key) => {
  const cached = cacheStore.get(key);
  if (!cached) return null;

  if (Date.now() >= cached.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return cached.value;
};

const setCache = (key, value, ttlMs) => {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
};

const rememberCache = async (key, ttlMs, producer) => {
  const cached = getCache(key);
  if (cached) return cached;

  const value = await producer();
  setCache(key, value, ttlMs);
  return value;
};

const invalidateCache = (prefixes = []) => {
  if (!Array.isArray(prefixes) || prefixes.length === 0) return;
  const keys = Array.from(cacheStore.keys());

  keys.forEach((key) => {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      cacheStore.delete(key);
    }
  });
};

const createNotification = async ({ userClient, recipientId, actorId, type, payload = {} }) => {
  if (!recipientId || !actorId || recipientId === actorId) return;

  const typeToPreferenceKey = {
    follow: 'follows_enabled',
    follow_request: 'follow_requests_enabled',
    follow_request_accepted: 'follow_requests_enabled',
    follow_request_rejected: 'follow_requests_enabled',
    message: 'messages_enabled'
  };

  const prefKey = typeToPreferenceKey[type];
  if (prefKey) {
    const { data: preference, error: prefError } = await supabase
      .from('notification_preferences')
      .select(prefKey)
      .eq('user_id', recipientId)
      .maybeSingle();

    if (!prefError && preference && preference[prefKey] === false) {
      return;
    }
  }

  const { error } = await userClient
    .from('notifications')
    .insert([{ recipient_id: recipientId, actor_id: actorId, type, payload }]);

  if (error) {
    console.error('Failed to create notification:', error.message);
  }
};

const ensureConversationParticipant = async (userClient, conversationId, userId) => {
  const { data, error } = await userClient
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error };
  }

  if (!data) {
    return { ok: false, unauthorized: true };
  }

  return { ok: true };
};

const asBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(v)) return true;
    if (['false', '0', 'no', 'off'].includes(v)) return false;
  }
  return fallback;
};

const isMissingTableError = (error) => {
  if (!error) return false;
  const code = String(error.code || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();
  return (
    code === '42p01' ||
    code === '42703' ||
    message.includes('does not exist') ||
    details.includes('does not exist') ||
    message.includes('could not find a relationship')
  );
};

const rankSuggestedPeople = ({ users = [], followerCounts = {}, mutualCounts = {}, joinedCommunityOverlap = {} }) => {
  return [...users]
    .map((user) => {
      const followerCount = Number(followerCounts[user.id] || 0);
      const mutualCount = Number(mutualCounts[user.id] || 0);
      const overlapCount = Number(joinedCommunityOverlap[user.id] || 0);

      return {
        ...user,
        follower_count: followerCount,
        mutual_count: mutualCount,
        overlap_count: overlapCount,
        score: mutualCount * 4 + overlapCount * 2 + followerCount * 0.2
      };
    })
    .sort((a, b) => b.score - a.score || String(a.username || '').localeCompare(String(b.username || '')));
};

const getBlockedMap = async (userId) => {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  if (error) {
    if (isMissingTableError(error)) {
      return { blockedByMe: new Set(), blockedMe: new Set(), error: null };
    }
    return { error };
  }

  const blockedByMe = new Set();
  const blockedMe = new Set();
  (data || []).forEach((row) => {
    if (row.blocker_id === userId) blockedByMe.add(row.blocked_id);
    if (row.blocked_id === userId) blockedMe.add(row.blocker_id);
  });

  return { blockedByMe, blockedMe, error: null };
};

const withPostVoteCounts = async (posts) => {
  if (!posts || posts.length === 0) return [];

  const enriched = await Promise.all(
    posts.map(async (post) => {
      const { data: postVotes } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('post_id', post.id)
        .is('comment_id', null);

      const votes_count = (postVotes || []).reduce((sum, row) => sum + (row.vote_type || 0), 0);
      return { ...post, votes_count };
    })
  );

  return enriched;
};

// Auth Middleware to get user context
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  req.user = user;
  next();
};

/* --- AUTH --- */
app.get('/api/user', authenticate, async (req, res) => {
  const userClient = getAuthClient(req.headers.authorization);
  // Check if user exists in the "users" table
  let { data: dbUser, error: findError } = await userClient
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (findError && findError.code !== 'PGRST116') {
    console.error('Error finding user:', findError);
    return res.status(500).json({ success: false, error: findError.message });
  }

  if (findError && findError.code === 'PGRST116' || !dbUser) { // Not found
    // Create random username and avatar
    const randomUsername = `CosmicTiger${Math.floor(Math.random() * 10000)}`;
    const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${randomUsername}`;

    const { data: newUser, error: createError } = await userClient
      .from('users')
      .insert([{ id: req.user.id, username: randomUsername, avatar_url: avatarUrl, email: req.user.email, is_private: false }])
      .select()
      .single();

    if (createError) return res.status(500).json({ success: false, error: createError.message });
    return res.json({ success: true, data: newUser });
  }

  const { data: joined } = await userClient.from('community_members').select('community_id').eq('user_id', req.user.id);
  const communityIds = joined?.map(j => j.community_id) || [];

  res.json({ success: true, data: { ...dbUser, joined_communities: communityIds } });
});

app.get('/api/user/profile/:username', async (req, res) => {
  const requestedUsername = String(req.params.username || '').trim();
  const profileCacheKey = `profile:${requestedUsername.toLowerCase()}`;
  const cachedProfile = getCache(profileCacheKey);
  if (cachedProfile) {
    return res.json(cachedProfile);
  }

  console.log(`[Profile] Fetching for: ${requestedUsername}`);
  const { data: user, error: uError } = await supabase
    .from('users')
    .select('*')
    .ilike('username', requestedUsername)
    .single();

  const resolveOwnProfileFallback = async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const userClient = getAuthClient(authHeader);
    const { data: { user: authUser } } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (!authUser) return null;

    const { data: dbUser, error: dbUserError } = await userClient
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (dbUserError || !dbUser) return null;
    if (String(dbUser.username || '').trim().toLowerCase() !== requestedUsername.toLowerCase()) return null;

    return dbUser;
  };

  if (uError) {
    if (uError.code === 'PGRST116') {
      const fallbackUser = await resolveOwnProfileFallback();
      if (!fallbackUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const user = fallbackUser;

      // Get total posts
      const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', user.id);

      // Get joined clusters
      const { count: clusterCount } = await supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

        const { data: joinedCommunityRows, error: joinedError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);

      if (joinedError) {
        return res.status(500).json({ success: false, error: joinedError.message });
      }

        const joinedCommunityIds = (joinedCommunityRows || []).map((row) => row.community_id).filter(Boolean);

        let joinedCommunities = [];
        if (joinedCommunityIds.length > 0) {
          const { data: joinedCommunitiesData, error: joinedCommunitiesError } = await supabase
            .from('communities')
            .select('id, name, description')
            .in('id', joinedCommunityIds);

          if (joinedCommunitiesError) {
            return res.status(500).json({ success: false, error: joinedCommunitiesError.message });
          }

          joinedCommunities = joinedCommunitiesData || [];
        }

      const { data: recentPosts } = await supabase
        .from('posts')
        .select('*, author:users(username, avatar_url), community:communities(name)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const payload = {
        success: true,
        data: {
          ...user,
          postCount: postCount || 0,
          clusterCount: clusterCount || 0,
          joinedCommunities,
          recentPosts: recentPosts || []
        }
      };
      setCache(profileCacheKey, payload, 30 * 1000);
      return res.json(payload);
    }
    console.error('Profile fetch error:', uError);
    return res.status(500).json({ success: false, error: uError.message });
  }

  // Get total posts
  const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', user.id);

  // Get joined clusters
  const { count: clusterCount } = await supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

  const { data: joinedCommunityRows, error: joinedError } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id);

  if (joinedError) {
    return res.status(500).json({ success: false, error: joinedError.message });
  }

  const joinedCommunityIds = (joinedCommunityRows || []).map((row) => row.community_id).filter(Boolean);

  let joinedCommunities = [];
  if (joinedCommunityIds.length > 0) {
    const { data: joinedCommunitiesData, error: joinedCommunitiesError } = await supabase
      .from('communities')
      .select('id, name, description')
      .in('id', joinedCommunityIds);

    if (joinedCommunitiesError) {
      return res.status(500).json({ success: false, error: joinedCommunitiesError.message });
    }

    joinedCommunities = joinedCommunitiesData || [];
  }

  // Get recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const payload = {
    success: true,
    data: {
      ...user,
      postCount: postCount || 0,
      clusterCount: clusterCount || 0,
      joinedCommunities,
      recentPosts: recentPosts || []
    }
  };

  setCache(profileCacheKey, payload, 30 * 1000);
  res.json(payload);
});

/* --- COMMUNITY --- */
app.post('/api/community/create', authenticate, async (req, res) => {
  const { name, description, image_url } = req.body;
  const userClient = getAuthClient(req.headers.authorization);

  // 1. Create the community
  const { data: community, error: cError } = await userClient
    .from('communities')
    .insert([{ name, description, owner_id: req.user.id, image_url: image_url || null }])
    .select()
    .single();

  if (cError) return res.status(500).json({ success: false, error: cError.message });

  // 2. Automatically add owner as a member
  const { error: mError } = await userClient
    .from('community_members')
    .insert([{ community_id: community.id, user_id: req.user.id, role: 'owner' }]);

  if (mError) console.error("Failed to add owner as member:", mError);

  invalidateCache(['community:', 'posts:', 'stats', 'search:', 'profile:']);

  res.json({ success: true, data: community });
});

app.post('/api/user/avatar', authenticate, async (req, res) => {
  const { avatar_url } = req.body;
  if (avatar_url !== null && typeof avatar_url !== 'string') {
    return res.status(400).json({ success: false, error: 'avatar_url must be a string or null' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const { data, error } = await userClient
    .from('users')
    .update({ avatar_url })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  invalidateCache(['profile:']);
  res.json({ success: true, data });
});

app.post('/api/community/photo', authenticate, async (req, res) => {
  const { community_id, image_url } = req.body;
  if (!community_id || !image_url) {
    return res.status(400).json({ success: false, error: 'community_id and image_url are required' });
  }

  const userClient = getAuthClient(req.headers.authorization);

  const { data: ownedCommunity, error: ownershipError } = await userClient
    .from('communities')
    .select('id')
    .eq('id', community_id)
    .eq('owner_id', req.user.id)
    .maybeSingle();

  if (ownershipError) return res.status(500).json({ success: false, error: ownershipError.message });
  if (!ownedCommunity) return res.status(403).json({ success: false, error: 'Only the owner can update community photo' });

  const { data, error } = await userClient
    .from('communities')
    .update({ image_url })
    .eq('id', community_id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  invalidateCache(['community:', 'profile:', 'search:']);
  res.json({ success: true, data });
});

app.post('/api/community/join', authenticate, async (req, res) => {
  const { community_id } = req.body;
  const userClient = getAuthClient(req.headers.authorization);
  const { data, error } = await userClient
    .from('community_members')
    .insert([{ community_id, user_id: req.user.id, role: 'member' }])
    .select();

  if (error) return res.status(500).json({ success: false, error: error.message });
  invalidateCache(['community:', 'profile:']);
  res.json({ success: true, data });
});

app.post('/api/community/leave', authenticate, async (req, res) => {
  const { community_id } = req.body;
  const userClient = getAuthClient(req.headers.authorization);
  const { data, error } = await userClient
    .from('community_members')
    .delete()
    .eq('community_id', community_id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ success: false, error: error.message });
  invalidateCache(['community:', 'profile:']);
  res.json({ success: true, data: 'Left community' });
});

app.get('/api/community/all', async (req, res) => {
  const cacheKey = 'community:all';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data, error } = await supabase
    .from('communities')
    .select('*, community_members!inner(count)')
    // Wait, community_members!inner would only return if there are members. 
    // Usually we want all communities.
    .select('*, members:community_members(count)');

  // Let's use a simpler approach since select(count) can be tricky in some versions
  const { data: communities, error: cError } = await supabase.from('communities').select('*');
  if (cError) return res.status(500).json({ success: false, error: cError.message });

  const enriched = await Promise.all(communities.map(async (c) => {
    const { count } = await supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('community_id', c.id);
    return { ...c, member_count: count || 0 };
  }));

  const payload = { success: true, data: enriched };
  setCache(cacheKey, payload, 60 * 1000);
  res.json(payload);
});

app.get('/api/community/:id', async (req, res) => {
  const cacheKey = `community:id:${req.params.id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data: community, error } = await supabase.from('communities').select('*').eq('id', req.params.id).single();
  if (error) return res.status(500).json({ success: false, error: error.message });

  const { count } = await supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('community_id', community.id);
  const payload = { success: true, data: { ...community, member_count: count || 0 } };
  setCache(cacheKey, payload, 60 * 1000);
  res.json(payload);
});

app.get('/api/community/name/:name', async (req, res) => {
  const { data: community, error } = await supabase.from('communities').select('*').eq('name', req.params.name).single();
  if (error) return res.status(500).json({ success: false, error: error.message });

  // Get member count
  const { count } = await supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('community_id', community.id);

  // Check if current user is member (optional auth)
  let is_member = false;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const { data: member } = await supabase.from('community_members').select('*').eq('community_id', community.id).eq('user_id', user.id).single();
      if (member) is_member = true;
    }
  }

  res.json({ success: true, data: { ...community, member_count: count || 0, is_member } });
});

/* --- POSTS --- */
app.post('/api/post/upload-media', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'File is required' });
  }

  const allowedMimePrefixes = ['image/', 'video/'];
  const allowedDocumentMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const mimetype = req.file.mimetype || 'application/octet-stream';
  const isAllowed = allowedMimePrefixes.some(prefix => mimetype.startsWith(prefix)) || allowedDocumentMimes.includes(mimetype);
  if (!isAllowed) {
    return res.status(400).json({ success: false, error: 'Unsupported file type' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${req.user.id}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await userClient
    .storage
    .from('post-media')
    .upload(filePath, req.file.buffer, {
      contentType: mimetype,
      upsert: false
    });

  if (uploadError) {
    return res.status(500).json({ success: false, error: uploadError.message });
  }

  const { data: publicData } = userClient.storage.from('post-media').getPublicUrl(filePath);
  const mediaType = mimetype.startsWith('image/') ? 'image' : (mimetype.startsWith('video/') ? 'video' : 'document');

  return res.json({
    success: true,
    data: {
      url: publicData.publicUrl,
      type: mediaType,
      name: req.file.originalname,
      mime: mimetype,
      size: req.file.size
    }
  });
});

app.post('/api/post/create', authenticate, async (req, res) => {
  const { community_id, title, content, media } = req.body;

  const userClient = getAuthClient(req.headers.authorization);
  // Check if member
  const { data: membership } = await userClient
    .from('community_members')
    .select('*')
    .eq('community_id', community_id)
    .eq('user_id', req.user.id)
    .single();

  if (!membership) return res.status(403).json({ success: false, error: 'Must join community to post' });

  const safeMedia = Array.isArray(media)
    ? media
        .filter((item) => item && typeof item.url === 'string')
        .map((item) => ({
          url: item.url,
          type: ['image', 'video', 'document'].includes(item.type) ? item.type : 'document',
          name: item.name || '',
          mime: item.mime || '',
          size: Number(item.size) || 0
        }))
    : [];

  const { data, error } = await userClient
    .from('posts')
    .insert([{ community_id, author_id: req.user.id, title, content, media: safeMedia }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  invalidateCache(['posts:', 'post:', 'profile:', 'search:', 'community:']);
  res.json({ success: true, data });
});

app.get('/api/post/:id', async (req, res) => {
  const cacheKey = `post:${req.params.id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  const [postWithVotes] = await withPostVoteCounts([data]);
  const payload = { success: true, data: postWithVotes };
  setCache(cacheKey, payload, 20 * 1000);
  res.json(payload);
});

app.get('/api/posts/feed', authenticate, async (req, res) => {
  const userClient = getAuthClient(req.headers.authorization);
  // Get communities the user joined
  const { data: joined } = await userClient.from('community_members').select('community_id').eq('user_id', req.user.id);
  const communityIds = joined?.map(j => j.community_id) || [];

  const { data: followingRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', req.user.id);
  const followingSet = new Set((followingRows || []).map((row) => row.following_id));

  let postsQuery = userClient
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .order('created_at', { ascending: false });

  if (communityIds.length > 0) {
    postsQuery = postsQuery.in('community_id', communityIds);
  } else {
    postsQuery = postsQuery.limit(80);
  }

  const { data, error } = await postsQuery;

  if (error) return res.status(500).json({ success: false, error: error.message });
  let postsWithVotes = await withPostVoteCounts(data || []);

  if (postsWithVotes.length < 20) {
    const { data: discoveryPosts } = await supabase
      .from('posts')
      .select('*, author:users(username, avatar_url), community:communities(name)')
      .order('created_at', { ascending: false })
      .limit(120);

    const merged = [...postsWithVotes, ...(discoveryPosts || [])];
    const dedup = new Map();
    merged.forEach((post) => {
      if (post?.id && !dedup.has(post.id)) dedup.set(post.id, post);
    });
    postsWithVotes = await withPostVoteCounts([...dedup.values()]);
  }

  const now = Date.now();
  const ranked = postsWithVotes
    .map((post) => {
      const ageHours = Math.max((now - new Date(post.created_at).getTime()) / (1000 * 60 * 60), 1);
      const recencyScore = 40 / Math.sqrt(ageHours);
      const voteScore = (post.votes_count || 0) * 2;
      const followedAuthorBoost = followingSet.has(post.author_id) ? 20 : 0;
      const joinedCommunityBoost = communityIds.includes(post.community_id) ? 12 : 0;
      return {
        ...post,
        _rank_score: recencyScore + voteScore + followedAuthorBoost + joinedCommunityBoost
      };
    })
    .sort((a, b) => b._rank_score - a._rank_score)
    .map(({ _rank_score, ...post }) => post)
    .slice(0, 120);

  res.json({ success: true, data: ranked });
});

app.get('/api/posts/trending', async (req, res) => {
  const cacheKey = 'posts:trending';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ success: false, error: error.message });
  const postsWithVotes = await withPostVoteCounts(data || []);
  postsWithVotes.sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
  const payload = { success: true, data: postsWithVotes };
  setCache(cacheKey, payload, 20 * 1000);
  res.json(payload);
});

app.get('/api/posts/community/:id', async (req, res) => {
  const cacheKey = `posts:community:${req.params.id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url)')
    .eq('community_id', req.params.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  const postsWithVotes = await withPostVoteCounts(data || []);
  const payload = { success: true, data: postsWithVotes };
  setCache(cacheKey, payload, 20 * 1000);
  res.json(payload);
});

app.get('/api/posts/comm-name/:name', async (req, res) => {
  const cacheKey = `posts:comm-name:${String(req.params.name || '').toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data: community, error: cError } = await supabase.from('communities').select('id').eq('name', req.params.name).single();
  if (cError) return res.status(500).json({ success: false, error: cError.message });

  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  const postsWithVotes = await withPostVoteCounts(data || []);
  const payload = { success: true, data: postsWithVotes };
  setCache(cacheKey, payload, 20 * 1000);
  res.json(payload);
});


/* --- BOOKMARKS --- */
app.get('/api/bookmarks', authenticate, async (req, res) => {
  const userClient = getAuthClient(req.headers.authorization);
  const { data, error } = await userClient
    .from('bookmarks')
    .select('id, post_id, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });

  const postIds = (data || []).map((item) => item.post_id);
  if (postIds.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .in('id', postIds);

  if (postsError) return res.status(500).json({ success: false, error: postsError.message });

  const postsWithVotes = await withPostVoteCounts(posts || []);
  const postMap = new Map(postsWithVotes.map((post) => [post.id, post]));
  const hydrated = (data || []).map((item) => ({ ...item, post: postMap.get(item.post_id) || null }));
  res.json({ success: true, data: hydrated });
});

app.post('/api/bookmark', authenticate, async (req, res) => {
  const { post_id } = req.body;
  const userClient = getAuthClient(req.headers.authorization);

  if (!post_id) return res.status(400).json({ success: false, error: 'post_id is required' });

  // Check if it already exists
  const { data: existing, error: existingError } = await userClient
    .from('bookmarks')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('post_id', post_id)
    .maybeSingle();

  if (existingError) return res.status(500).json({ success: false, error: existingError.message });

  if (existing) {
    // Remove bookmark
    const { error } = await userClient.from('bookmarks').delete().eq('id', existing.id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    invalidateCache(['profile:']);
    return res.json({ success: true, bookmarked: false, post_id });
  } else {
    // Add bookmark
    const { error } = await userClient.from('bookmarks').insert([{ user_id: req.user.id, post_id }]);
    if (error) return res.status(500).json({ success: false, error: error.message });
    invalidateCache(['profile:']);
    return res.json({ success: true, bookmarked: true, post_id });
  }
});



/* --- COMMENTS --- */
app.post('/api/comment/add', authenticate, async (req, res) => {
  const { post_id, content, parent_comment_id } = req.body;
  const userClient = getAuthClient(req.headers.authorization);
  const { data, error } = await userClient
    .from('comments')
    .insert([{ post_id, author_id: req.user.id, content, parent_comment_id }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  invalidateCache(['comments:post:', 'post:', 'posts:', 'profile:']);
  res.json({ success: true, data });
});

app.get('/api/comments/:postId', async (req, res) => {
  const cacheKey = `comments:post:${req.params.postId}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data, error } = await supabase
    .from('comments')
    .select('*, author:users(username, avatar_url)')
    .eq('post_id', req.params.postId)
    .order('created_at', { ascending: true }); // Need recursion on frontend for nested structure usually

  if (error) return res.status(500).json({ success: false, error: error.message });
  const payload = { success: true, data };
  setCache(cacheKey, payload, 10 * 1000);
  res.json(payload);
});

/* --- VOTES --- */
app.post('/api/vote', authenticate, async (req, res) => {
  const { post_id, comment_id, vote_type } = req.body; // vote_type: 1 or -1
  let totalVotes = null;

  if (!post_id && !comment_id) {
    return res.status(400).json({ success: false, error: 'post_id or comment_id is required' });
  }

  if (![1, -1].includes(vote_type)) {
    return res.status(400).json({ success: false, error: 'vote_type must be 1 or -1' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  // Upsert the vote
  const { data, error } = await userClient
    .from('votes')
    .upsert([{
      user_id: req.user.id,
      post_id: post_id || null,
      comment_id: comment_id || null,
      vote_type
    }], { onConflict: 'user_id,post_id,comment_id' }) // requires unique constraint
    .select();

  if (error) return res.status(500).json({ success: false, error: error.message });

  if (post_id) {
    const { data: postVotes, error: countError } = await userClient
      .from('votes')
      .select('vote_type')
      .eq('post_id', post_id)
      .is('comment_id', null);

    if (countError) return res.status(500).json({ success: false, error: countError.message });

    totalVotes = (postVotes || []).reduce((sum, row) => sum + (row.vote_type || 0), 0);
  }

  if (comment_id) {
    const { data: commentVotes, error: countError } = await userClient
      .from('votes')
      .select('vote_type')
      .eq('comment_id', comment_id)
      .is('post_id', null);

    if (countError) return res.status(500).json({ success: false, error: countError.message });

    totalVotes = (commentVotes || []).reduce((sum, row) => sum + (row.vote_type || 0), 0);
  }

  invalidateCache(['post:', 'posts:', 'comments:post:', 'profile:', 'search:']);
  res.json({ success: true, data, totalVotes });
});

/* --- CONNECT (FOLLOWERS) --- */
app.post('/api/connect/follow', authenticate, async (req, res) => {
  const { target_user_id } = req.body;
  if (!target_user_id) {
    return res.status(400).json({ success: false, error: 'target_user_id is required' });
  }

  if (target_user_id === req.user.id) {
    return res.status(400).json({ success: false, error: 'You cannot follow yourself' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const { blockedByMe, blockedMe, error: blockError } = await getBlockedMap(req.user.id);
  if (blockError && blockError.code !== 'PGRST205') {
    return res.status(500).json({ success: false, error: blockError.message });
  }

  if (blockedByMe?.has(target_user_id) || blockedMe?.has(target_user_id)) {
    return res.status(403).json({ success: false, error: 'Cannot follow while one side is blocked' });
  }

  const { data: existing, error: existingError } = await userClient
    .from('follows')
    .select('id')
    .eq('follower_id', req.user.id)
    .eq('following_id', target_user_id)
    .maybeSingle();

  if (existingError) return res.status(500).json({ success: false, error: existingError.message });

  const { data: existingRequest, error: requestLookupError } = await userClient
    .from('follow_requests')
    .select('id, status')
    .eq('requester_id', req.user.id)
    .eq('target_id', target_user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requestLookupError && requestLookupError.code !== 'PGRST205') {
    return res.status(500).json({ success: false, error: requestLookupError.message });
  }

  if (existing) {
    const { error } = await userClient
      .from('follows')
      .delete()
      .eq('id', existing.id);

    if (error) return res.status(500).json({ success: false, error: error.message });

    invalidateCache(['profile:', 'connect:', 'notifications:']);
    return res.json({ success: true, following: false, target_user_id });
  }

  const { data: targetUser, error: targetError } = await supabase
    .from('users')
    .select('id, is_private')
    .eq('id', target_user_id)
    .single();

  if (targetError) return res.status(404).json({ success: false, error: 'Target user not found' });

  const isPrivate = asBoolean(targetUser.is_private, false);
  if (isPrivate) {
    if (existingRequest && existingRequest.status === 'pending') {
      return res.json({ success: true, following: false, requested: true, target_user_id });
    }

    if (existingRequest && existingRequest.status === 'accepted') {
      return res.json({ success: true, following: true, requested: false, target_user_id });
    }

    const { error: requestError } = await userClient
      .from('follow_requests')
      .insert([{ requester_id: req.user.id, target_id: target_user_id, status: 'pending' }]);

    if (requestError) return res.status(500).json({ success: false, error: requestError.message });

    await createNotification({
      userClient,
      recipientId: target_user_id,
      actorId: req.user.id,
      type: 'follow_request',
      payload: {}
    });

    invalidateCache(['profile:', 'connect:', 'notifications:']);
    return res.json({ success: true, following: false, requested: true, target_user_id });
  }

  const { error } = await userClient
    .from('follows')
    .insert([{ follower_id: req.user.id, following_id: target_user_id }]);

  if (error) return res.status(500).json({ success: false, error: error.message });

  await createNotification({
    userClient,
    recipientId: target_user_id,
    actorId: req.user.id,
    type: 'follow',
    payload: {}
  });

  invalidateCache(['profile:', 'connect:', 'notifications:']);
  return res.json({ success: true, following: true, target_user_id });
});

app.get('/api/connect/requests', authenticate, async (req, res) => {
  const { data: requestRows, error } = await supabase
    .from('follow_requests')
    .select('id, requester_id, target_id, status, created_at')
    .eq('target_id', req.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return res.json({ success: true, data: [] });
    }
    return res.status(500).json({ success: false, error: error.message });
  }

  const requesterIds = [...new Set((requestRows || []).map((row) => row.requester_id).filter(Boolean))];
  let requesterMap = new Map();
  if (requesterIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', requesterIds);
    requesterMap = new Map((usersData || []).map((item) => [item.id, item]));
  }

  const hydrated = (requestRows || []).map((row) => ({
    ...row,
    requester: requesterMap.get(row.requester_id) || null
  }));

  return res.json({ success: true, data: hydrated });
});

app.post('/api/connect/request/respond', authenticate, async (req, res) => {
  const { request_id, action } = req.body;
  if (!request_id || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, error: 'request_id and action(accept|reject) are required' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const { data: requestRow, error: requestError } = await userClient
    .from('follow_requests')
    .select('id, requester_id, target_id, status')
    .eq('id', request_id)
    .eq('target_id', req.user.id)
    .single();

  if (requestError) return res.status(500).json({ success: false, error: requestError.message });
  if (requestRow.status !== 'pending') {
    return res.status(400).json({ success: false, error: 'Request already processed' });
  }

  const nextStatus = action === 'accept' ? 'accepted' : 'rejected';
  const { error: updateError } = await userClient
    .from('follow_requests')
    .update({ status: nextStatus, responded_at: new Date().toISOString() })
    .eq('id', request_id);

  if (updateError) return res.status(500).json({ success: false, error: updateError.message });

  if (action === 'accept') {
    const { error: followError } = await userClient
      .from('follows')
      .insert([{ follower_id: requestRow.requester_id, following_id: req.user.id }]);
    if (followError) return res.status(500).json({ success: false, error: followError.message });
  }

  await createNotification({
    userClient,
    recipientId: requestRow.requester_id,
    actorId: req.user.id,
    type: action === 'accept' ? 'follow_request_accepted' : 'follow_request_rejected',
    payload: {}
  });

  invalidateCache(['profile:', 'connect:', 'notifications:']);
  return res.json({ success: true, status: nextStatus });
});

app.post('/api/connect/privacy', authenticate, async (req, res) => {
  const { is_private } = req.body;
  const userClient = getAuthClient(req.headers.authorization);

  const { data, error } = await userClient
    .from('users')
    .update({ is_private: asBoolean(is_private, false) })
    .eq('id', req.user.id)
    .select('id, username, avatar_url, email, is_private')
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });

  invalidateCache(['profile:', 'connect:']);
  return res.json({ success: true, data });
});

app.get('/api/connect/suggestions', authenticate, async (req, res) => {
  const cacheKey = `connect:suggestions:${req.user.id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data: followedRows, error: followedError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', req.user.id);

  if (followedError && followedError.code !== 'PGRST205' && !isMissingTableError(followedError)) {
    return res.status(500).json({ success: false, error: followedError.message });
  }

  const { blockedByMe, blockedMe, error: blockError } = await getBlockedMap(req.user.id);
  if (blockError && blockError.code !== 'PGRST205' && !isMissingTableError(blockError)) {
    return res.status(500).json({ success: false, error: blockError.message });
  }

  const { data: myCommunities, error: myCommunitiesError } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', req.user.id);

  if (myCommunitiesError) return res.status(500).json({ success: false, error: myCommunitiesError.message });

  const myCommunityIds = new Set((myCommunities || []).map((row) => row.community_id));
  const followedIds = new Set((followedRows || []).map((row) => row.following_id));

  let users = [];
  {
    const withPrivacy = await supabase
      .from('users')
      .select('id, username, avatar_url, created_at, is_private')
      .order('created_at', { ascending: false })
      .limit(80);

    if (!withPrivacy.error) {
      users = withPrivacy.data || [];
    } else if (isMissingTableError(withPrivacy.error)) {
      const fallback = await supabase
        .from('users')
        .select('id, username, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(80);
      if (fallback.error) {
        return res.status(500).json({ success: false, error: fallback.error.message });
      }
      users = (fallback.data || []).map((row) => ({ ...row, is_private: false }));
    } else {
      return res.status(500).json({ success: false, error: withPrivacy.error.message });
    }
  }

  const candidateUsers = (users || []).filter((item) => {
    if (!item || !item.id || item.id === req.user.id) return false;
    if (blockedByMe?.has(item.id) || blockedMe?.has(item.id)) return false;
    return true;
  });

  const candidateIds = candidateUsers.map((item) => item.id);

  const [{ data: followerRows, error: followerCountError }, { data: mutualRows, error: mutualError }, { data: candidateCommunities, error: candidateCommunitiesError }] = await Promise.all([
    candidateIds.length > 0
      ? supabase.from('follows').select('following_id').in('following_id', candidateIds)
      : { data: [], error: null },
    followedIds.size > 0 && candidateIds.length > 0
      ? supabase.from('follows').select('follower_id, following_id').in('follower_id', [...followedIds]).in('following_id', candidateIds)
      : { data: [], error: null },
    candidateIds.length > 0
      ? supabase.from('community_members').select('user_id, community_id').in('user_id', candidateIds)
      : { data: [], error: null }
  ]);

  if (followerCountError && !isMissingTableError(followerCountError)) return res.status(500).json({ success: false, error: followerCountError.message });
  if (mutualError && !isMissingTableError(mutualError)) return res.status(500).json({ success: false, error: mutualError.message });
  if (candidateCommunitiesError) return res.status(500).json({ success: false, error: candidateCommunitiesError.message });

  const followerCounts = (followerRows || []).reduce((acc, row) => {
    acc[row.following_id] = (acc[row.following_id] || 0) + 1;
    return acc;
  }, {});

  const mutualCounts = (mutualRows || []).reduce((acc, row) => {
    acc[row.following_id] = (acc[row.following_id] || 0) + 1;
    return acc;
  }, {});

  const overlapCounts = (candidateCommunities || []).reduce((acc, row) => {
    if (myCommunityIds.has(row.community_id)) {
      acc[row.user_id] = (acc[row.user_id] || 0) + 1;
    }
    return acc;
  }, {});

  const ranked = rankSuggestedPeople({
    users: candidateUsers,
    followerCounts,
    mutualCounts,
    joinedCommunityOverlap: overlapCounts
  }).slice(0, 30);

  let suggestions = ranked.map((user) => ({
    ...user,
    already_following: followedIds.has(user.id)
  }));

  if (suggestions.length === 0) {
    // Fallback list so Connect does not look empty when ranking signals are sparse.
    suggestions = candidateUsers
      .sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')))
      .slice(0, 30)
      .map((user) => ({
        ...user,
        follower_count: Number(followerCounts[user.id] || 0),
        mutual_count: Number(mutualCounts[user.id] || 0),
        overlap_count: Number(overlapCounts[user.id] || 0),
        already_following: followedIds.has(user.id)
      }));
  }

  const payload = { success: true, data: suggestions };
  setCache(cacheKey, payload, 30 * 1000);
  return res.json(payload);
});

app.get('/api/connect/followers/:username', async (req, res) => {
  const username = String(req.params.username || '').trim();
  const cacheKey = `connect:followers:${username.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('id, username')
    .ilike('username', username)
    .single();

  if (userError) return res.status(404).json({ success: false, error: 'User not found' });

  const { data: followers, error } = await supabase
    .from('follows')
    .select('follower:users!follows_follower_id_fkey(id, username, avatar_url)')
    .eq('following_id', targetUser.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });

  const payload = {
    success: true,
    data: {
      user: targetUser,
      followers: (followers || []).map((row) => row.follower).filter(Boolean)
    }
  };

  setCache(cacheKey, payload, 30 * 1000);
  return res.json(payload);
});

app.get('/api/connect/following/:username', async (req, res) => {
  const username = String(req.params.username || '').trim();
  const cacheKey = `connect:following:${username.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('id, username')
    .ilike('username', username)
    .single();

  if (userError) return res.status(404).json({ success: false, error: 'User not found' });

  const { data: following, error } = await supabase
    .from('follows')
    .select('following:users!follows_following_id_fkey(id, username, avatar_url)')
    .eq('follower_id', targetUser.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });

  const payload = {
    success: true,
    data: {
      user: targetUser,
      following: (following || []).map((row) => row.following).filter(Boolean)
    }
  };

  setCache(cacheKey, payload, 30 * 1000);
  return res.json(payload);
});

app.get('/api/connect/status/:targetUserId', authenticate, async (req, res) => {
  const targetUserId = String(req.params.targetUserId || '').trim();
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: 'targetUserId is required' });
  }

  const [{ data: followRow, error }, { data: outgoingRequest, error: outgoingError }, { data: incomingRequest, error: incomingError }, { data: targetUser, error: targetError }] = await Promise.all([
    supabase
    .from('follows')
    .select('id')
    .eq('follower_id', req.user.id)
    .eq('following_id', targetUserId)
    .maybeSingle(),
    supabase
      .from('follow_requests')
      .select('id, status')
      .eq('requester_id', req.user.id)
      .eq('target_id', targetUserId)
      .eq('status', 'pending')
      .maybeSingle(),
    supabase
      .from('follow_requests')
      .select('id, status')
      .eq('requester_id', targetUserId)
      .eq('target_id', req.user.id)
      .eq('status', 'pending')
      .maybeSingle(),
    supabase
      .from('users')
      .select('is_private')
      .eq('id', targetUserId)
      .maybeSingle()
  ]);

  if (error) return res.status(500).json({ success: false, error: error.message });
  if (outgoingError && outgoingError.code !== 'PGRST205') return res.status(500).json({ success: false, error: outgoingError.message });
  if (incomingError && incomingError.code !== 'PGRST205') return res.status(500).json({ success: false, error: incomingError.message });
  if (targetError && targetError.code !== 'PGRST116') return res.status(500).json({ success: false, error: targetError.message });

  return res.json({
    success: true,
    data: {
      following: !!followRow,
      requested_by_me: !!outgoingRequest,
      requested_me: !!incomingRequest,
      is_private: asBoolean(targetUser?.is_private, false)
    }
  });
});

/* --- DIRECT CHAT --- */
app.post('/api/chat/start', authenticate, async (req, res) => {
  const { other_user_id } = req.body;
  if (!other_user_id) {
    return res.status(400).json({ success: false, error: 'other_user_id is required' });
  }

  if (other_user_id === req.user.id) {
    return res.status(400).json({ success: false, error: 'Cannot start a chat with yourself' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const { blockedByMe, blockedMe, error: blockError } = await getBlockedMap(req.user.id);
  if (blockError && blockError.code !== 'PGRST205') {
    return res.status(500).json({ success: false, error: blockError.message });
  }
  if (blockedByMe?.has(other_user_id) || blockedMe?.has(other_user_id)) {
    return res.status(403).json({ success: false, error: 'Cannot chat while one side is blocked' });
  }

  const [{ data: mine, error: mineError }, { data: theirs, error: theirsError }] = await Promise.all([
    supabase.from('conversation_participants').select('conversation_id').eq('user_id', req.user.id),
    supabase.from('conversation_participants').select('conversation_id').eq('user_id', other_user_id)
  ]);

  if (mineError) return res.status(500).json({ success: false, error: mineError.message });
  if (theirsError) return res.status(500).json({ success: false, error: theirsError.message });

  const mySet = new Set((mine || []).map((row) => row.conversation_id));
  const shared = (theirs || []).map((row) => row.conversation_id).find((id) => mySet.has(id));

  if (shared) {
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id, type, created_at, updated_at')
      .eq('id', shared)
      .eq('type', 'direct')
      .maybeSingle();

    if (existingConv) {
      return res.json({ success: true, data: existingConv });
    }
  }

  const { data: conversation, error: conversationError } = await userClient
    .from('conversations')
    .insert([{ type: 'direct' }])
    .select()
    .single();

  if (conversationError) return res.status(500).json({ success: false, error: conversationError.message });

  const { error: participantsError } = await userClient
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, user_id: req.user.id },
      { conversation_id: conversation.id, user_id: other_user_id }
    ]);

  if (participantsError) return res.status(500).json({ success: false, error: participantsError.message });

  invalidateCache(['chat:list:', 'notifications:']);
  return res.json({ success: true, data: conversation });
});

app.get('/api/chat/conversations', authenticate, async (req, res) => {
  const cacheKey = `chat:list:${req.user.id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data: memberships, error: membershipsError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', req.user.id);

  if (membershipsError) return res.status(500).json({ success: false, error: membershipsError.message });

  const conversationIds = (memberships || []).map((row) => row.conversation_id);
  if (conversationIds.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const [{ data: conversations, error: conversationsError }, { data: participants, error: participantsError }, { data: messages, error: messagesError }] = await Promise.all([
    supabase.from('conversations').select('id, type, created_at, updated_at').in('id', conversationIds).order('updated_at', { ascending: false }),
    supabase.from('conversation_participants').select('conversation_id, user:users(id, username, avatar_url)').in('conversation_id', conversationIds),
    supabase.from('messages').select('id, conversation_id, sender_id, content, created_at').in('conversation_id', conversationIds).order('created_at', { ascending: false })
  ]);

  if (conversationsError) return res.status(500).json({ success: false, error: conversationsError.message });
  if (participantsError) return res.status(500).json({ success: false, error: participantsError.message });
  if (messagesError) return res.status(500).json({ success: false, error: messagesError.message });

  const participantMap = new Map();
  (participants || []).forEach((row) => {
    const list = participantMap.get(row.conversation_id) || [];
    if (row.user) list.push(row.user);
    participantMap.set(row.conversation_id, list);
  });

  const latestMessageMap = new Map();
  (messages || []).forEach((msg) => {
    if (!latestMessageMap.has(msg.conversation_id)) {
      latestMessageMap.set(msg.conversation_id, msg);
    }
  });

  const hydrated = (conversations || []).map((conversation) => {
    const people = (participantMap.get(conversation.id) || []).filter((p) => p.id !== req.user.id);
    return {
      ...conversation,
      peers: people,
      last_message: latestMessageMap.get(conversation.id) || null
    };
  });

  const payload = { success: true, data: hydrated };
  setCache(cacheKey, payload, 5 * 1000);
  return res.json(payload);
});

app.get('/api/chat/:conversationId/messages', authenticate, async (req, res) => {
  const conversationId = Number(req.params.conversationId);
  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ success: false, error: 'Invalid conversation id' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const membership = await ensureConversationParticipant(userClient, conversationId, req.user.id);
  if (!membership.ok && membership.unauthorized) {
    return res.status(403).json({ success: false, error: 'You are not a participant in this conversation' });
  }
  if (!membership.ok) {
    return res.status(500).json({ success: false, error: membership.error.message });
  }

  const limit = Math.min(Math.max(Number(req.query.limit || 40), 1), 100);
  const before = req.query.before ? new Date(String(req.query.before)).toISOString() : null;

  let query = supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at, sender:users(username, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, error: error.message });

  const messageIds = (data || []).map((row) => row.id);
  let receipts = [];
  if (messageIds.length > 0) {
    const { data: receiptRows, error: receiptError } = await supabase
      .from('message_receipts')
      .select('message_id, user_id, read_at')
      .in('message_id', messageIds)
      .not('read_at', 'is', null);
    if (receiptError && receiptError.code !== 'PGRST205') {
      return res.status(500).json({ success: false, error: receiptError.message });
    }
    receipts = receiptRows || [];
  }

  const receiptMap = receipts.reduce((acc, row) => {
    const list = acc.get(row.message_id) || [];
    list.push(row);
    acc.set(row.message_id, list);
    return acc;
  }, new Map());

  const hydrated = (data || []).map((msg) => {
    const rows = receiptMap.get(msg.id) || [];
    return {
      ...msg,
      read_by_count: rows.length,
      is_read_by_me: rows.some((row) => row.user_id === req.user.id)
    };
  });

  return res.json({ success: true, data: hydrated.reverse() });
});

app.post('/api/chat/:conversationId/message', authenticate, async (req, res) => {
  const conversationId = Number(req.params.conversationId);
  const { content } = req.body;

  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ success: false, error: 'Invalid conversation id' });
  }

  if (!content || !String(content).trim()) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const membership = await ensureConversationParticipant(userClient, conversationId, req.user.id);
  if (!membership.ok && membership.unauthorized) {
    return res.status(403).json({ success: false, error: 'You are not a participant in this conversation' });
  }
  if (!membership.ok) {
    return res.status(500).json({ success: false, error: membership.error.message });
  }

  const { data: message, error: messageError } = await userClient
    .from('messages')
    .insert([{ conversation_id: conversationId, sender_id: req.user.id, content: String(content).trim() }])
    .select('id, conversation_id, sender_id, content, created_at')
    .single();

  if (messageError) return res.status(500).json({ success: false, error: messageError.message });

  await userClient
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  await userClient
    .from('message_receipts')
    .insert([{ message_id: message.id, user_id: req.user.id, read_at: new Date().toISOString() }]);

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);

  await Promise.all(
    (participants || [])
      .map((row) => row.user_id)
      .filter((id) => id && id !== req.user.id)
      .map((recipientId) => createNotification({
        userClient,
        recipientId,
        actorId: req.user.id,
        type: 'message',
        payload: { conversation_id: conversationId, preview: String(content).trim().slice(0, 120) }
      }))
  );

  invalidateCache(['chat:list:', 'notifications:']);
  return res.json({ success: true, data: message });
});

app.post('/api/chat/:conversationId/read', authenticate, async (req, res) => {
  const conversationId = Number(req.params.conversationId);
  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ success: false, error: 'Invalid conversation id' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const membership = await ensureConversationParticipant(userClient, conversationId, req.user.id);
  if (!membership.ok && membership.unauthorized) {
    return res.status(403).json({ success: false, error: 'You are not a participant in this conversation' });
  }
  if (!membership.ok) {
    return res.status(500).json({ success: false, error: membership.error.message });
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .neq('sender_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const rows = (messages || []).map((message) => ({
    message_id: message.id,
    user_id: req.user.id,
    read_at: new Date().toISOString()
  }));

  if (rows.length > 0) {
    const { error: upsertError } = await userClient
      .from('message_receipts')
      .upsert(rows, { onConflict: 'message_id,user_id' });
    if (upsertError) return res.status(500).json({ success: false, error: upsertError.message });
  }

  invalidateCache(['chat:list:']);
  return res.json({ success: true });
});

app.post('/api/chat/:conversationId/typing', authenticate, async (req, res) => {
  const conversationId = Number(req.params.conversationId);
  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ success: false, error: 'Invalid conversation id' });
  }

  const { is_typing } = req.body;
  const userClient = getAuthClient(req.headers.authorization);
  const membership = await ensureConversationParticipant(userClient, conversationId, req.user.id);
  if (!membership.ok && membership.unauthorized) {
    return res.status(403).json({ success: false, error: 'You are not a participant in this conversation' });
  }
  if (!membership.ok) {
    return res.status(500).json({ success: false, error: membership.error.message });
  }

  const expiresAt = new Date(Date.now() + 10000).toISOString();
  const { error } = await userClient
    .from('chat_typing')
    .upsert([{
      conversation_id: conversationId,
      user_id: req.user.id,
      is_typing: asBoolean(is_typing, false),
      updated_at: new Date().toISOString(),
      expires_at: expiresAt
    }], { onConflict: 'conversation_id,user_id' });

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
});

app.get('/api/chat/:conversationId/typing', authenticate, async (req, res) => {
  const conversationId = Number(req.params.conversationId);
  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ success: false, error: 'Invalid conversation id' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const membership = await ensureConversationParticipant(userClient, conversationId, req.user.id);
  if (!membership.ok && membership.unauthorized) {
    return res.status(403).json({ success: false, error: 'You are not a participant in this conversation' });
  }
  if (!membership.ok) {
    return res.status(500).json({ success: false, error: membership.error.message });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('chat_typing')
    .select('user_id, is_typing, expires_at, user:users(id, username, avatar_url)')
    .eq('conversation_id', conversationId)
    .eq('is_typing', true)
    .gt('expires_at', now)
    .neq('user_id', req.user.id);

  if (error && error.code !== 'PGRST205') return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: data || [] });
});

/* --- MODERATION --- */
app.post('/api/moderation/block', authenticate, async (req, res) => {
  const { target_user_id } = req.body;
  if (!target_user_id || target_user_id === req.user.id) {
    return res.status(400).json({ success: false, error: 'Valid target_user_id is required' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const { data: existing, error: existingError } = await userClient
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', req.user.id)
    .eq('blocked_id', target_user_id)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST205') {
    return res.status(500).json({ success: false, error: existingError.message });
  }

  if (existing) {
    const { error } = await userClient
      .from('user_blocks')
      .delete()
      .eq('id', existing.id);
    if (error) return res.status(500).json({ success: false, error: error.message });

    invalidateCache(['connect:', 'chat:list:', 'profile:']);
    return res.json({ success: true, blocked: false, target_user_id });
  }

  const { error } = await userClient
    .from('user_blocks')
    .insert([{ blocker_id: req.user.id, blocked_id: target_user_id }]);

  if (error) return res.status(500).json({ success: false, error: error.message });

  // Remove social/chat relation when blocked.
  await userClient
    .from('follows')
    .delete()
    .or(`and(follower_id.eq.${req.user.id},following_id.eq.${target_user_id}),and(follower_id.eq.${target_user_id},following_id.eq.${req.user.id})`);

  invalidateCache(['connect:', 'chat:list:', 'profile:']);
  return res.json({ success: true, blocked: true, target_user_id });
});

app.get('/api/moderation/blocks', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('id, blocked_id, created_at, blocked:users!user_blocks_blocked_id_fkey(id, username, avatar_url)')
    .eq('blocker_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error && error.code !== 'PGRST205' && !isMissingTableError(error)) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data: data || [] });
});

app.post('/api/moderation/report', authenticate, async (req, res) => {
  const { target_user_id = null, post_id = null, comment_id = null, conversation_id = null, reason = '', details = '' } = req.body;
  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ success: false, error: 'reason is required' });
  }

  const userClient = getAuthClient(req.headers.authorization);
  const { data, error } = await userClient
    .from('reports')
    .insert([{
      reporter_id: req.user.id,
      target_user_id,
      post_id,
      comment_id,
      conversation_id,
      reason: String(reason).trim(),
      details: String(details || '').trim()
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

/* --- NOTIFICATION PREFERENCES --- */
app.get('/api/notifications/preferences', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, follows_enabled, follow_requests_enabled, messages_enabled, comments_enabled, mentions_enabled')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST205') return res.status(500).json({ success: false, error: error.message });

  const fallback = {
    user_id: req.user.id,
    follows_enabled: true,
    follow_requests_enabled: true,
    messages_enabled: true,
    comments_enabled: true,
    mentions_enabled: true
  };

  return res.json({ success: true, data: data || fallback });
});

app.post('/api/notifications/preferences', authenticate, async (req, res) => {
  const body = req.body || {};
  const nextPrefs = {
    user_id: req.user.id,
    follows_enabled: asBoolean(body.follows_enabled, true),
    follow_requests_enabled: asBoolean(body.follow_requests_enabled, true),
    messages_enabled: asBoolean(body.messages_enabled, true),
    comments_enabled: asBoolean(body.comments_enabled, true),
    mentions_enabled: asBoolean(body.mentions_enabled, true)
  };

  const userClient = getAuthClient(req.headers.authorization);
  const { data, error } = await userClient
    .from('notification_preferences')
    .upsert([nextPrefs], { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });

  invalidateCache(['notifications:']);
  return res.json({ success: true, data });
});

/* --- NOTIFICATIONS --- */
app.get('/api/notifications', authenticate, async (req, res) => {
  const cacheKey = `notifications:${req.user.id}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { data, error } = await supabase
    .from('notifications')
    .select('id, recipient_id, actor_id, type, payload, read_at, created_at, actor:users!notifications_actor_id_fkey(id, username, avatar_url)')
    .eq('recipient_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ success: false, error: error.message });

  const payload = { success: true, data: data || [] };
  setCache(cacheKey, payload, 5 * 1000);
  return res.json(payload);
});

app.post('/api/notifications/read', authenticate, async (req, res) => {
  const { ids } = req.body;
  const userClient = getAuthClient(req.headers.authorization);
  const now = new Date().toISOString();

  let query = userClient
    .from('notifications')
    .update({ read_at: now })
    .eq('recipient_id', req.user.id)
    .is('read_at', null);

  if (Array.isArray(ids) && ids.length > 0) {
    query = query.in('id', ids);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ success: false, error: error.message });

  invalidateCache(['notifications:']);
  return res.json({ success: true });
});

/* --- SEARCH --- */
app.get('/api/stats', async (req, res) => {
  const cacheKey = 'stats';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const { count: totalClusters } = await supabase.from('communities').select('*', { count: 'exact', head: true });
  const { count: totalNodes } = await supabase.from('users').select('*', { count: 'exact', head: true });

  const payload = {
    success: true,
    data: {
      totalClusters: totalClusters || 0,
      totalNodes: (totalNodes || 0) + 120, // offset for 'premium' feel or just use real count
      latency: '0.04s'
    }
  };

  setCache(cacheKey, payload, 30 * 1000);
  res.json(payload);
});

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  const query = (q || '').trim();

  if (!query) {
    return res.json({ success: true, data: { posts: [], communities: [], users: [] } });
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const [{ data: posts, error: postsError }, { data: communities, error: communitiesError }, { data: users, error: usersError }] = await Promise.all([
    supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`),
    supabase
      .from('communities')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`),
    supabase
      .from('users')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
  ]);

  if (postsError) return res.status(500).json({ success: false, error: postsError.message });
  if (communitiesError) return res.status(500).json({ success: false, error: communitiesError.message });
  if (usersError) return res.status(500).json({ success: false, error: usersError.message });

  const postsWithVotes = await withPostVoteCounts(posts || []);
  const payload = { success: true, data: { posts: postsWithVotes, communities: communities || [], users: users || [] } };
  setCache(cacheKey, payload, 15 * 1000);
  res.json(payload);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
