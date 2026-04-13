import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, fetchAllCommunities } from '../api';

const CreatePost = ({ user }) => {
  const navigate = useNavigate();
  const { community } = useParams(); // Pre-selected community name from URL if any
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const res = await fetchAllCommunities();
      if (res.success) {
        setCommunities(res.data);
        // If community name is in URL, auto-select it
        if (community) {
          const found = res.data.find(c => c.name.toLowerCase() === community.toLowerCase());
          if (found) {
            setSelectedCommunityId(found.id);
          }
        } else if (res.data.length > 0) {
           setSelectedCommunityId(res.data[0].id);
        }
      }
    };
    loadData();
  }, [community]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to create a post.");
      return;
    }
    if (!title || !content || !selectedCommunityId) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await createPost(selectedCommunityId, title, content);
      if (res.success) {
        // Redirect to the post detail
        navigate(`/post/${res.data.id}`);
      } else {
        alert(res.error || "Failed to create post. Ensure you have joined the community.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12">
      <div className="bg-surface-container-high/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_-20px_rgba(168,85,247,0.3)]">
        <h1 className="text-4xl font-headline font-bold text-white mb-2">Create Transmission</h1>
        <p className="text-slate-400 mb-8 font-light">Broadcast your signal to the Ethereal network.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Select Nexus (Community)</label>
            <select
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-headline"
            >
              <option value="" disabled>-- Select a Community --</option>
              {communities.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  c/{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Title</label>
            <input
              type="text"
              placeholder="Give your transmission a clear title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xl font-headline font-bold placeholder:text-slate-600 placeholder:font-normal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Content Payload</label>
            <textarea
              placeholder="What are your findings? Share your knowledge..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light placeholder:text-slate-600 resize-y"
            ></textarea>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-4 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-xl font-headline font-bold text-lg hover:shadow-[0_0_30px_rgba(221,183,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Transmitting...' : 'Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
