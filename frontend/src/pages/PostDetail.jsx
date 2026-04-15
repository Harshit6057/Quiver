import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { addComment, fetchCommentsByPostId, fetchPostById, fetchPostsByCommunityName, vote } from '../api';

// import { fetchPostById } from '../api';

const PostDetail = ({ bookmarkedPostIds = [], onToggleBookmark, voteCounts = {}, onVoteCountChange }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const handleVote = async (voteType = 1) => {
    if (!post?.id) return;
    const previousVotes = voteCounts[post.id] ?? post.votes_count ?? 0;
    const nextVotes = Math.max(0, previousVotes + voteType);
    setPost(prev => ({ ...prev, votes_count: nextVotes }));
    onVoteCountChange?.(post.id, nextVotes);

    const res = await vote(voteType, post.id);
    if (!res?.success) {
      setPost(prev => ({ ...prev, votes_count: previousVotes }));
      onVoteCountChange?.(post.id, previousVotes);
      alert(res?.error || 'Unable to register vote right now');
      return;
    }

    if (typeof res.totalVotes === 'number') {
      setPost(prev => ({ ...prev, votes_count: res.totalVotes }));
      onVoteCountChange?.(post.id, res.totalVotes);
    }
  };

  // Handle Bookmarking
  const handleBookmark = async () => {
    if (!post?.id || !onToggleBookmark) return;
    const res = await onToggleBookmark(post.id);
    if (!res?.success) {
      alert(res?.error || 'Unable to update bookmark right now');
    }
  };

  const handleAddComment = async () => {
    const content = commentText.trim();
    if (!content) return;

    setPostingComment(true);
    const res = await addComment(post.id, content);

    if (res?.success && res?.data) {
      const inserted = {
        ...res.data,
        author: post.author
      };
      setComments(prev => [...prev, inserted]);
      setCommentText('');
    } else {
      alert(res?.error || 'Unable to post insight right now');
    }

    setPostingComment(false);
  };


  const fallbackPost = {
    title: "The Architecture of Neural Dreams",
    author: { username: "Julian Vane", avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMhjhD22V-OFeBLUEyCnGLfzQHPxsJyMeN9pVtFYpA4uY6NQOMM9eLvXLa7gI1N3rq-6OxUiWnSGg0MGBYJgNZ3q9WgCt7H3AiqfdTjQpW3ZTFadfsbIlQRy7j3VH_-edKNHNw2KVb4_DFEroBfFuIu6VpzsgaK-ueyFtOCbvcJvEy-rx2nsSNiixOd9iNH6_zHIKjbxw3cQIoVHoTC8zW0hw-M6zkpu0xCE4mXuzylDycuHJEpx5n4By7gkwiyRhCB5kkHhCNJNUa" },
    community: { name: "Digital Synthesis" },
    content: "In the burgeoning field of computational aesthetics, we've begun to witness a shift from rigid algorithms to fluid, generative environments. The \"Terminal\" update isn't just about faster data—it's about creating a space where information breathes.\n\nWe explored the intersection of tactile feedback and visual depth. By layering frosted glass surfaces and utilizing tonal transitions instead of hard dividers, we've simulated a physical vacuum. This allows the primary content to float, reducing cognitive load and enhancing immersion. The real-time indicators you see are powered by a decentralized heartbeat, ensuring every interaction feels alive.\n\nAs we move into Beta, our focus shifts to community governance. The \"Vault\" will allow users to stake insights against developments they believe in, effectively crowd-sourcing the future of the Terminal's visual evolution. Stay tuned for the next phase of synthesis.",
    votes_count: 1200,
    created_at: "2 hours ago"
  };

  useEffect(() => {
    const loadPost = async () => {
      const res = await fetchPostById(id);
      const postData = res && res.success ? res.data : fallbackPost;
      setPost({
        ...postData,
        votes_count: postData?.id && Object.prototype.hasOwnProperty.call(voteCounts, postData.id)
          ? voteCounts[postData.id]
          : postData.votes_count
      });

      if (postData?.id) {
        const commentsRes = await fetchCommentsByPostId(postData.id);
        if (commentsRes?.success) {
          setComments(commentsRes.data || []);
        }
      }

      if (postData?.community?.name) {
        const commPostsRes = await fetchPostsByCommunityName(postData.community.name);
        if (commPostsRes?.success) {
          const allCommunityPosts = commPostsRes.data || [];
          setCommunityPosts(allCommunityPosts);
          setRelatedPosts(allCommunityPosts.filter(p => p.id !== postData.id).slice(0, 2));
        }
      }
    };

    loadPost();
  }, [id]);

  const impactScore = communityPosts.reduce((total, item) => total + (item.votes_count || 0), 0);
  const resonance = communityPosts.length
    ? Math.round((communityPosts.filter(item => (item.votes_count || 0) > 0).length / communityPosts.length) * 100)
    : 0;
  const isBookmarked = post?.id ? bookmarkedPostIds.includes(post.id) : false;

  if (!post) return <div className="p-12 text-center text-white">Synthesizing...</div>;

  return (
    <div className="max-w-6xl mx-auto flex gap-12 relative flex-col lg:flex-row">
      <div className="flex-1">
        {/* Post Hero */}
        <article className="bg-surface-container-high/60 glass-panel rounded-xl overflow-hidden mb-12 neon-glow-primary">
          <div className="relative h-96 w-full group">
            <img alt="Hero Art" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQCNS7r5rupbWBRALpwFUApwvQrBvCviUFSSXPVRQ6dVT5xfmV-PsvG1XZu0K-yYJlKoYy9H5wgwI5YL_oH7itZ41A-vr75jDyGMWHVMSNqFJ0kuZBw5_CNnoTNIGv93j7TK0ptH9gxHLQBEZXYOova8QY1Ht4aXrOIpPvG2uZrLsY8uCtE2Beqh8sH9OP_6D0l89YINXCweOFqu0K7XOnWQcXK_FzvIUivN6uffF-ihRdiY5GOBFNTWdhhMcseUs6hdPS-YF3N7tF" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high via-transparent to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-[10px] font-space-grotesk uppercase tracking-widest">{post.community?.name || 'Void'}</span>
                <span className="text-slate-400 text-[10px] font-space-grotesk uppercase tracking-widest">• {post.created_at && String(post.created_at).includes('T') ? new Date(post.created_at).toLocaleDateString() : post.created_at}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white font-space-grotesk tracking-tight leading-none mb-4">{post.title}</h1>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                  <img alt="Author" className="w-full h-full object-cover" src={post.author?.avatar_url || "https://api.dicebear.com/7.x/identicon/svg?seed=fallback"} />
                </div>
                <div>
                  <p className="text-white font-bold font-space-grotesk">{post.author?.username}</p>
                  <p className="text-secondary text-xs uppercase tracking-widest font-space-grotesk">Core Architect</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleVote(1)} className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-primary/20 transition-all rounded-full border border-white/5 cursor-pointer active:scale-95">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  <span className="text-sm font-bold text-on-surface">{post.votes_count || 0}</span>
                </button>
                <button onClick={() => handleVote(-1)} className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-error/20 transition-all rounded-full border border-white/5 cursor-pointer active:scale-95">
                  <span className="material-symbols-outlined text-error">thumb_down</span>
                </button>
                <button onClick={handleBookmark} className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-secondary/20 transition-all rounded-full border border-white/5 cursor-pointer active:scale-95">
                  <span className={`material-symbols-outlined ${isBookmarked ? 'text-secondary' : 'text-slate-400'}`}>{isBookmarked ? 'bookmark' : 'bookmark_add'}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-secondary/20 transition-all rounded-full border border-white/5 cursor-pointer active:scale-95">
                  <span className="material-symbols-outlined text-secondary">share</span>
                </button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              {post.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className={`${idx === 0 ? 'text-xl font-light mb-6 text-slate-300' : 'text-slate-400 mb-6'} leading-relaxed`}>
                  {paragraph}
                </p>
              ))}
              <div className="bg-surface-container-lowest rounded-xl p-6 border-l-4 border-primary mb-6">
                <p className="italic text-primary-fixed font-space-grotesk text-lg">
                  "The goal isn't to mimic reality, but to invent a more elegant version of it."
                </p>
              </div>
            </div>
            <div className="mt-12 flex flex-wrap gap-2">
              <span className="bg-white/5 px-4 py-1.5 rounded-full text-xs text-slate-400 border border-white/10">#architecture</span>
              <span className="bg-white/5 px-4 py-1.5 rounded-full text-xs text-slate-400 border border-white/10">#generative</span>
            </div>
          </div>
        </article>

        {/* Discussions Section */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-3xl font-black text-white font-space-grotesk tracking-tight flex items-center gap-3">
              Discussions <span className="text-secondary text-lg px-3 py-0.5 bg-secondary/10 rounded-full">{comments.length}</span>
            </h3>
          </div>

          <div className="mb-16 bg-surface-container-low p-6 rounded-xl border border-white/5 neon-glow-secondary">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-surface-container-lowest">
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-secondary transition-all outline-none resize-none"
                  placeholder="Add your perspective..."
                  rows="3"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                ></textarea>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <button className="material-symbols-outlined text-slate-500 hover:text-secondary transition-all">image</button>
                    <button className="material-symbols-outlined text-slate-500 hover:text-secondary transition-all">code</button>
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={postingComment || !commentText.trim()}
                    className="bg-secondary text-on-secondary-container px-6 py-2 rounded-full font-bold text-sm active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {postingComment ? 'Posting...' : 'Post Insight'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {comments.length === 0 ? (
              <div className="bg-surface-container-high/40 glass-panel p-6 rounded-xl text-slate-400 text-sm">
                No insights yet. Be the first to add one.
              </div>
            ) : (
              comments.map((comment) => (
                <div className="group" key={comment.id}>
                  <div className="bg-surface-container-high/40 glass-panel p-6 rounded-xl transition-all hover:bg-surface-container-high/60">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          alt="User"
                          className="w-10 h-10 rounded-full object-cover border border-secondary/30"
                          src={comment.author?.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=fallback'}
                        />
                        <div>
                          <span className="text-white font-bold text-sm">{comment.author?.username || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-500 block font-space-grotesk uppercase tracking-widest">
                            {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Right Sidebar: Contextual Info */}
      <aside className="w-80 hidden lg:block shrink-0">
        <div className="space-y-6 sticky top-28">
          <div className="bg-surface-container-low/40 glass-panel p-6 rounded-xl border border-white/5">
            <h4 className="text-white font-bold font-space-grotesk uppercase tracking-widest text-xs mb-4">Community Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-lowest rounded-lg">
                <p className="text-slate-500 text-[10px] font-space-grotesk uppercase mb-1">Impact</p>
                <p className="text-2xl font-black text-primary font-space-grotesk">{impactScore >= 1000 ? `${(impactScore / 1000).toFixed(1)}k` : impactScore}</p>
              </div>
              <div className="p-4 bg-surface-container-lowest rounded-lg">
                <p className="text-slate-500 text-[10px] font-space-grotesk uppercase mb-1">Resonance</p>
                <p className="text-2xl font-black text-secondary font-space-grotesk">{resonance}%</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low/40 glass-panel p-6 rounded-xl border border-white/5">
            <h4 className="text-white font-bold font-space-grotesk uppercase tracking-widest text-xs mb-4">Related Currents</h4>
            <div className="space-y-4">
              {relatedPosts.length === 0 ? (
                <p className="text-slate-400 text-sm">No related currents found yet.</p>
              ) : (
                relatedPosts.map((item, index) => (
                  <Link to={`/post/${item.id}`} className="group block" key={item.id}>
                    <p className="text-slate-400 text-xs font-space-grotesk uppercase mb-1">{String(index + 1).padStart(2, '0')} / {item.community?.name || 'Pulse'}</p>
                    <h5 className="text-sm text-white group-hover:text-primary transition-colors">{item.title}</h5>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
};

export default PostDetail;
