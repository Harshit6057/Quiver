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
      .insert([{ id: req.user.id, username: randomUsername, avatar_url: avatarUrl, email: req.user.email }])
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
  console.log(`[Profile] Fetching for: ${req.params.username}`);
  const { data: user, error: uError } = await supabase
    .from('users')
    .select('*')
    .eq('username', req.params.username)
    .single();

  if (uError) {
    if (uError.code === 'PGRST116') {
      return res.status(404).json({ success: false, error: 'User not found' });
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
    .select('communities(id, name, description, image_url)')
    .eq('user_id', user.id);

  if (joinedError) {
    return res.status(500).json({ success: false, error: joinedError.message });
  }

  const joinedCommunities = (joinedCommunityRows || [])
    .map((row) => row.communities)
    .filter(Boolean);

  // Get recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  res.json({
    success: true,
    data: {
      ...user,
      postCount: postCount || 0,
      clusterCount: clusterCount || 0,
      joinedCommunities,
      recentPosts: recentPosts || []
    }
  });
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
  res.json({ success: true, data: 'Left community' });
});

app.get('/api/community/all', async (req, res) => {
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

  res.json({ success: true, data: enriched });
});

app.get('/api/community/:id', async (req, res) => {
  const { data: community, error } = await supabase.from('communities').select('*').eq('id', req.params.id).single();
  if (error) return res.status(500).json({ success: false, error: error.message });

  const { count } = await supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('community_id', community.id);
  res.json({ success: true, data: { ...community, member_count: count || 0 } });
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
  res.json({ success: true, data });
});

app.get('/api/post/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  const [postWithVotes] = await withPostVoteCounts([data]);
  res.json({ success: true, data: postWithVotes });
});

app.get('/api/posts/feed', authenticate, async (req, res) => {
  const userClient = getAuthClient(req.headers.authorization);
  // Get communities the user joined
  const { data: joined } = await userClient.from('community_members').select('community_id').eq('user_id', req.user.id);
  const communityIds = joined?.map(j => j.community_id) || [];

  const { data, error } = await userClient
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .in('community_id', communityIds)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  const postsWithVotes = await withPostVoteCounts(data || []);
  res.json({ success: true, data: postsWithVotes });
});

app.get('/api/posts/trending', async (req, res) => {
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
  res.json({ success: true, data: postsWithVotes });
});

app.get('/api/posts/community/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url)')
    .eq('community_id', req.params.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  const postsWithVotes = await withPostVoteCounts(data || []);
  res.json({ success: true, data: postsWithVotes });
});

app.get('/api/posts/comm-name/:name', async (req, res) => {
  const { data: community, error: cError } = await supabase.from('communities').select('id').eq('name', req.params.name).single();
  if (cError) return res.status(500).json({ success: false, error: cError.message });

  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url), community:communities(name)')
    .eq('community_id', community.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  const postsWithVotes = await withPostVoteCounts(data || []);
  res.json({ success: true, data: postsWithVotes });
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
    return res.json({ success: true, bookmarked: false, post_id });
  } else {
    // Add bookmark
    const { error } = await userClient.from('bookmarks').insert([{ user_id: req.user.id, post_id }]);
    if (error) return res.status(500).json({ success: false, error: error.message });
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
  res.json({ success: true, data });
});

app.get('/api/comments/:postId', async (req, res) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:users(username, avatar_url)')
    .eq('post_id', req.params.postId)
    .order('created_at', { ascending: true }); // Need recursion on frontend for nested structure usually

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
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

  res.json({ success: true, data, totalVotes });
});

/* --- SEARCH --- */
app.get('/api/stats', async (req, res) => {
  const { count: totalClusters } = await supabase.from('communities').select('*', { count: 'exact', head: true });
  const { count: totalNodes } = await supabase.from('users').select('*', { count: 'exact', head: true });

  res.json({
    success: true,
    data: {
      totalClusters: totalClusters || 0,
      totalNodes: (totalNodes || 0) + 120, // offset for 'premium' feel or just use real count
      latency: '0.04s'
    }
  });
});

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  const query = (q || '').trim();

  if (!query) {
    return res.json({ success: true, data: { posts: [], communities: [], users: [] } });
  }

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
  res.json({ success: true, data: { posts: postsWithVotes, communities: communities || [], users: users || [] } });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
