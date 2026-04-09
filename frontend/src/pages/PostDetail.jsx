import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  const fallbackPost = {
    title: "The Architecture of Neural Dreams",
    author: { username: "Julian Vane", avatar_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMhjhD22V-OFeBLUEyCnGLfzQHPxsJyMeN9pVtFYpA4uY6NQOMM9eLvXLa7gI1N3rq-6OxUiWnSGg0MGBYJgNZ3q9WgCt7H3AiqfdTjQpW3ZTFadfsbIlQRy7j3VH_-edKNHNw2KVb4_DFEroBfFuIu6VpzsgaK-ueyFtOCbvcJvEy-rx2nsSNiixOd9iNH6_zHIKjbxw3cQIoVHoTC8zW0hw-M6zkpu0xCE4mXuzylDycuHJEpx5n4By7gkwiyRhCB5kkHhCNJNUa" },
    community: { name: "Digital Synthesis" },
    content: "In the burgeoning field of computational aesthetics, we've begun to witness a shift from rigid algorithms to fluid, generative environments. The \"Terminal\" update isn't just about faster data—it's about creating a space where information breathes.\n\nWe explored the intersection of tactile feedback and visual depth. By layering frosted glass surfaces and utilizing tonal transitions instead of hard dividers, we've simulated a physical vacuum. This allows the primary content to float, reducing cognitive load and enhancing immersion. The real-time indicators you see are powered by a decentralized heartbeat, ensuring every interaction feels alive.\n\nAs we move into Beta, our focus shifts to community governance. The \"Vault\" will allow users to stake insights against developments they believe in, effectively crowd-sourcing the future of the Terminal's visual evolution. Stay tuned for the next phase of synthesis.",
    votes_count: 1200,
    created_at: "2 hours ago"
  };

  useEffect(() => {
    // In a real app we'd fetch via API using `id`. Using fallback for demo:
    setPost(fallbackPost);
  }, [id]);

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
                <span className="text-slate-400 text-[10px] font-space-grotesk uppercase tracking-widest">• {post.created_at}</span>
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
                <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-primary/20 transition-all rounded-full border border-white/5">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  <span className="text-sm font-bold text-on-surface">{post.votes_count >= 1000 ? (post.votes_count/1000).toFixed(1)+'k' : post.votes_count}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-secondary/20 transition-all rounded-full border border-white/5">
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
              Discussions <span className="text-secondary text-lg px-3 py-0.5 bg-secondary/10 rounded-full">48</span>
            </h3>
          </div>
          
          <div className="mb-16 bg-surface-container-low p-6 rounded-xl border border-white/5 neon-glow-secondary">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-surface-container-lowest">
              </div>
              <div className="flex-1">
                <textarea className="w-full bg-surface-container-lowest border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-secondary transition-all outline-none resize-none" placeholder="Add your perspective..." rows="3"></textarea>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <button className="material-symbols-outlined text-slate-500 hover:text-secondary transition-all">image</button>
                    <button className="material-symbols-outlined text-slate-500 hover:text-secondary transition-all">code</button>
                  </div>
                  <button className="bg-secondary text-on-secondary-container px-6 py-2 rounded-full font-bold text-sm active:scale-95 transition-all">Post Insight</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="group">
              <div className="bg-surface-container-high/40 glass-panel p-6 rounded-xl transition-all hover:bg-surface-container-high/60">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img alt="User" className="w-10 h-10 rounded-full object-cover border border-secondary/30" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCme8Iep0ybL_byeBnqEA4rAVowPsFhpp4RTlhutEe_QCLUQQ4ShVe8dFQOaz21qv6VugXxx1CHhm3vpFYeLlZ1FympuqPn9R0Aqvm1Lkz9FfxlZKDMVEfjF4ZyMK8L7OQYOtgjGzG8JzDNPXScmmrwB81SijHTPZbEWL6XhKoKB-xOzEdW8VObTbpbPcxkrmGOZ8zyWlP0k-BI77mAbR_2_ICOhJgjo9BJuY6xgQCqteas38hN_D7KvFEYq4Jjzus7cB5Qp5qlJPiI"/>
                    <div>
                      <span className="text-white font-bold text-sm">Elena.Void</span>
                      <span className="text-[10px] text-slate-500 block font-space-grotesk uppercase tracking-widest">Senior Synthesist • 45m ago</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    The use of tonal transitions is a game-changer. Most "dark mode" apps feel claustrophobic because of the hard boundaries. This feels like a space I can actually spend hours in without fatigue.
                </p>
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-base">arrow_upward</span> 284
                  </button>
                </div>
              </div>
            </div>
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
                <p className="text-2xl font-black text-primary font-space-grotesk">9.8k</p>
              </div>
              <div className="p-4 bg-surface-container-lowest rounded-lg">
                <p className="text-slate-500 text-[10px] font-space-grotesk uppercase mb-1">Resonance</p>
                <p className="text-2xl font-black text-secondary font-space-grotesk">84%</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low/40 glass-panel p-6 rounded-xl border border-white/5">
            <h4 className="text-white font-bold font-space-grotesk uppercase tracking-widest text-xs mb-4">Related Currents</h4>
            <div className="space-y-4">
              <Link to="/" className="group block">
                <p className="text-slate-400 text-xs font-space-grotesk uppercase mb-1">01 / Pulse</p>
                <h5 className="text-sm text-white group-hover:text-primary transition-colors">Visualizing decentralized heatmaps in real-time</h5>
              </Link>
              <Link to="/" className="group block">
                <p className="text-slate-400 text-xs font-space-grotesk uppercase mb-1">02 / Synthesis</p>
                <h5 className="text-sm text-white group-hover:text-primary transition-colors">From Typography to Topography: A Guide</h5>
              </Link>
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
};

export default PostDetail;
