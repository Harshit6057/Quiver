import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, fetchAllCommunities, uploadPostMedia } from '../api';

const CreatePost = ({ user }) => {
  const navigate = useNavigate();
  const { community } = useParams(); // Pre-selected community name from URL if any
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [urlAttachments, setUrlAttachments] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState('document');
  const [showUrlComposer, setShowUrlComposer] = useState(false);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

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
      const uploadedMedia = [];
      for (const file of selectedFiles) {
        const uploadRes = await uploadPostMedia(file);
        if (!uploadRes?.success) {
          alert(uploadRes?.error || `Failed to upload ${file.name}`);
          setLoading(false);
          return;
        }
        uploadedMedia.push(uploadRes.data);
      }

      const allMedia = [...uploadedMedia, ...urlAttachments];

      const res = await createPost(selectedCommunityId, title, content, allMedia);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const addUrlAttachment = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    setUrlAttachments((prev) => [
      ...prev,
      {
        url: trimmed,
        type: urlType,
        name: trimmed,
        mime: '',
        size: 0
      }
    ]);
    setUrlInput('');
  };

  const removeUrlAttachment = (indexToRemove) => {
    setUrlAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

          <div className="sticky top-24 z-20 rounded-xl border border-white/10 bg-surface-container-high/90 backdrop-blur-xl p-3 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Add to Post</label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-100 hover:bg-white/15 transition-colors"
              >
                <span className="material-symbols-outlined text-base">perm_media</span>
                <span className="text-sm font-semibold">Media</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUrlComposer(true);
                  setTimeout(() => document.getElementById('post-url-input')?.focus(), 0);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-100 hover:bg-white/15 transition-colors"
              >
                <span className="material-symbols-outlined text-base">link</span>
                <span className="text-sm font-semibold">URL</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />

            <p className="text-xs text-slate-400">
              Files attached: <span className="text-slate-200 font-semibold">{selectedFiles.length}</span> | URLs attached: <span className="text-slate-200 font-semibold">{urlAttachments.length}</span>
            </p>

            {showUrlComposer && (
              <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    id="post-url-input"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste image/video/document URL"
                    className="flex-1 bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select
                    value={urlType}
                    onChange={(e) => setUrlType(e.target.value)}
                    className="bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="image" className="bg-slate-900">Image</option>
                    <option value="video" className="bg-slate-900">Video</option>
                    <option value="document" className="bg-slate-900">Document</option>
                  </select>
                  <button
                    type="button"
                    onClick={addUrlAttachment}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            )}
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

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Attachments (photo, video, document, URL)</label>

            {urlAttachments.length > 0 && (
              <div className="space-y-2">
                {urlAttachments.map((item, idx) => (
                  <div key={`${item.url}-${idx}`} className="flex items-center justify-between gap-3 bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-300 truncate">
                      [{item.type}] {item.url}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeUrlAttachment(idx)}
                      className="text-xs text-error hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                {selectedFiles.map((file, idx) => {
                  const isImage = file.type.startsWith('image/');
                  const isVideo = file.type.startsWith('video/');
                  const previewUrl = previews[idx];

                  return (
                    <div key={`${file.name}-${idx}`} className="rounded-xl border border-white/10 p-3 bg-white/5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm text-slate-200 truncate">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-xs text-error hover:text-white transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      {isImage && <img src={previewUrl} alt={file.name} className="w-full max-h-56 object-cover rounded-lg" />}
                      {isVideo && <video src={previewUrl} className="w-full max-h-56 rounded-lg" muted controls />}
                      {!isImage && !isVideo && (
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <span className="material-symbols-outlined">description</span>
                          <span>Document preview unavailable</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
              {loading ? 'Uploading & Transmitting...' : 'Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
