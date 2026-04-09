import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, getAuthClient } from './supabaseClient.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

  res.json({ success: true, data: dbUser });
});

/* --- COMMUNITY --- */
app.post('/api/community/create', authenticate, async (req, res) => {
  const { name, description } = req.body;
  const userClient = getAuthClient(req.headers.authorization);
  const { data, error } = await userClient
    .from('communities')
    .insert([{ name, description, owner_id: req.user.id }])
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
  const { data, error } = await supabase.from('communities').select('*');
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

app.get('/api/community/:id', async (req, res) => {
  const { data, error } = await supabase.from('communities').select('*').eq('id', req.params.id).single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

/* --- POSTS --- */
app.post('/api/post/create', authenticate, async (req, res) => {
  const { community_id, title, content } = req.body;

  const userClient = getAuthClient(req.headers.authorization);
  // Check if member
  const { data: membership } = await userClient
    .from('community_members')
    .select('*')
    .eq('community_id', community_id)
    .eq('user_id', req.user.id)
    .single();
    
  if (!membership) return res.status(403).json({ success: false, error: 'Must join community to post' });

  const { data, error } = await userClient
    .from('posts')
    .insert([{ community_id, author_id: req.user.id, title, content }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
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
  res.json({ success: true, data });
});

app.get('/api/posts/community/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users(username, avatar_url)')
    .eq('community_id', req.params.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
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
  
  // Actually updating votes_count in posts/comments should be done via a Supabase DB Trigger or RPC to avoid race conditions.
  
  res.json({ success: true, data });
});

/* --- SEARCH --- */
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  const { data, error } = await supabase
    .from('posts')
    .select('*, community:communities(name)')
    .ilike('title', `%${q}%`); // search title

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
