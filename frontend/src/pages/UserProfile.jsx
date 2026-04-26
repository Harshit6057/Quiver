import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createReport, fetchFollowStatus, fetchFollowers, fetchFollowing, fetchProfile, startChat, toggleBlockUser, toggleFollow, updateUserAvatar, uploadPostMedia } from '../api';
import PostMediaRenderer from '../components/PostMediaRenderer';

const UserProfile = ({ user, onUserUpdated }) => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const [messageActionLoading, setMessageActionLoading] = useState(false);
  const [blockActionLoading, setBlockActionLoading] = useState(false);
  const [reportActionLoading, setReportActionLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const connectedClustersRef = useRef(null);

  const loadProfile = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetchProfile(username);
      if (res.success) {
        setProfile(res.data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const run = async () => {
      if (!username) return;

      const [followersRes, followingRes] = await Promise.all([
        fetchFollowers(username),
        fetchFollowing(username)
      ]);

      if (followersRes?.success) {
        setFollowersCount((followersRes.data?.followers || []).length);
      }
      if (followingRes?.success) {
        setFollowingCount((followingRes.data?.following || []).length);
      }
    };

    run();
  }, [username]);

  useEffect(() => {
    const run = async () => {
      if (!user || !profile || user.id === profile.id) {
        setIsFollowing(false);
        return;
      }

      const res = await fetchFollowStatus(profile.id);
      if (res?.success) {
        setIsFollowing(!!res.data?.following);
        setIsRequested(!!res.data?.requested_by_me);
      }
    };

    run();
  }, [user, profile]);

  const handleSynchronize = async () => {
    setSyncing(true);
    await loadProfile(false);
    setSyncing(false);
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/u/${profile?.username || username}`;
    const payload = {
      title: `${profile?.username || username} on Ethereal`,
      text: 'Explore this Ethereal profile.',
      url: profileUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert('Profile link copied to clipboard');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || user?.id !== profile?.id) return;

    setUploadingPhoto(true);
    try {
      const uploadRes = await uploadPostMedia(file);
      if (!uploadRes?.success) {
        alert(uploadRes?.error || 'Failed to upload profile photo');
        return;
      }

      const updateRes = await updateUserAvatar(uploadRes.data.url);
      if (!updateRes?.success) {
        alert(updateRes?.error || 'Failed to save profile photo');
        return;
      }

      setProfile(updateRes.data);
      onUserUpdated?.(updateRes.data);
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    if (user?.id !== profile?.id) return;
    setRemovingPhoto(true);
    try {
      const updateRes = await updateUserAvatar(null);
      if (!updateRes?.success) {
        alert(updateRes?.error || 'Failed to remove profile photo');
        return;
      }

      setProfile((prev) => ({ ...prev, ...updateRes.data, avatar_url: null }));
      onUserUpdated?.(updateRes.data);
    } finally {
      setRemovingPhoto(false);
    }
  };

  const handleOpenClusters = () => {
    connectedClustersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFollowToggle = async () => {
    if (!user || !profile || user.id === profile.id) return;

    setFollowActionLoading(true);
    const previous = isFollowing;
    const previousRequested = isRequested;
    setIsFollowing(!previous);
    setIsRequested(false);
    setFollowersCount((prev) => prev + (previous ? -1 : 1));

    const res = await toggleFollow(profile.id);
    if (!res?.success) {
      setIsFollowing(previous);
      setIsRequested(previousRequested);
      setFollowersCount((prev) => prev + (previous ? 1 : -1));
      alert(res?.error || 'Unable to update follow status right now');
    } else {
      setIsFollowing(!!res.following);
      setIsRequested(!!res.requested);
      if (res.requested) {
        setFollowersCount((prev) => Math.max(prev - 1, 0));
      }
    }
    setFollowActionLoading(false);
  };

  const handleMessageUser = async () => {
    if (!user || !profile || user.id === profile.id) return;

    setMessageActionLoading(true);
    const res = await startChat(profile.id);
    if (res?.success) {
      navigate(`/messages?conversation=${res.data.id}`);
    } else {
      alert(res?.error || 'Unable to open chat right now');
    }
    setMessageActionLoading(false);
  };

  const handleBlockToggle = async () => {
    if (!user || !profile || user.id === profile.id) return;
    setBlockActionLoading(true);
    const res = await toggleBlockUser(profile.id);
    if (!res?.success) {
      alert(res?.error || 'Unable to change block status right now');
    } else {
      alert(res.blocked ? 'User blocked' : 'User unblocked');
    }
    setBlockActionLoading(false);
  };

  const handleReport = async () => {
    if (!user || !profile || user.id === profile.id) return;
    setReportActionLoading(true);
    const res = await createReport({ target_user_id: profile.id, reason: 'user_report', details: 'Reported from profile page' });
    if (!res?.success) {
      alert(res?.error || 'Unable to submit report');
    } else {
      alert('Report submitted');
    }
    setReportActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Signal Lost</h1>
        <p className="text-slate-400">This entity does not exist in the Ethereal archive.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 overflow-x-hidden">
      {/* Profile Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-end mb-12 md:mb-16">
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-5 md:gap-7 items-center md:items-end">
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-125 group-hover:bg-primary/40 transition-all duration-700"></div>
            <img 
              className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-xl glass-card p-2 border-2 border-primary/40 object-cover" 
              alt="User avatar" 
              src={profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`} 
            />
            {user?.id === profile.id && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1 rounded-full bg-background/90 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white"
                >
                  {uploadingPhoto ? 'Uploading...' : 'Change'}
                </button>
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={removingPhoto}
                  className="px-3 py-1 rounded-full bg-background/90 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-200 hover:text-white disabled:opacity-60"
                >
                  {removingPhoto ? 'Removing...' : 'Remove'}
                </button>
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex flex-col gap-2 text-center md:text-left max-w-full">
            <span className="text-secondary font-headline tracking-[0.2em] text-[10px] uppercase font-bold">Authorized Entity</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black font-headline tracking-tight leading-[0.95] text-white break-words max-w-full">{profile.username}</h1>
            <p className="text-on-surface-variant max-w-md mt-3 md:mt-4 text-sm sm:text-base lg:text-lg leading-relaxed font-light">Synthesizing digital realities and exploring the silent spaces of the vault cluster.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-7 sm:gap-10 mt-5 md:mt-6">
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl lg:text-[2rem] font-bold font-headline text-primary">{profile.postCount}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Transmissions</span>
              </div>
              <button type="button" onClick={handleOpenClusters} className="flex flex-col text-left hover:opacity-90 transition-opacity">
                <span className="text-2xl sm:text-3xl lg:text-[2rem] font-bold font-headline text-secondary">{profile.clusterCount}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Connected Clusters</span>
              </button>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl lg:text-[2rem] font-bold font-headline text-white">{followersCount}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl lg:text-[2rem] font-bold font-headline text-white">{followingCount}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Following</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col justify-center lg:justify-end gap-3 z-10 relative pb-0 sm:pb-2">
          {user?.id !== profile.id && (
            <>
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={followActionLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-secondary to-primary text-on-primary rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-[0_0_20px_rgba(221,183,255,0.3)] hover:shadow-[0_0_40px_rgba(221,183,255,0.5)] transition-all active:scale-95 disabled:opacity-60"
              >
                {followActionLoading ? 'Updating...' : (isRequested ? 'Requested' : (isFollowing ? 'Following' : 'Follow'))}
              </button>
              <button
                type="button"
                onClick={handleMessageUser}
                disabled={messageActionLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 glass-panel rounded-xl text-white hover:bg-white/10 transition-all border border-white/10"
              >
                {messageActionLoading ? 'Opening...' : 'Message'}
              </button>
              <button
                type="button"
                onClick={handleBlockToggle}
                disabled={blockActionLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 glass-panel rounded-xl text-white hover:bg-white/10 transition-all border border-white/10"
              >
                {blockActionLoading ? 'Updating...' : 'Block'}
              </button>
              <button
                type="button"
                onClick={handleReport}
                disabled={reportActionLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 glass-panel rounded-xl text-white hover:bg-white/10 transition-all border border-white/10"
              >
                {reportActionLoading ? 'Sending...' : 'Report'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleSynchronize}
            disabled={syncing}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-[0_0_20px_rgba(221,183,255,0.3)] hover:shadow-[0_0_40px_rgba(221,183,255,0.5)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {syncing ? 'Synchronizing...' : 'Synchronize'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="w-full sm:w-auto px-4 py-3 sm:p-5 glass-panel rounded-xl text-white hover:bg-white/10 transition-all border border-white/10 self-start sm:self-auto flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">share</span>
            <span className="sm:hidden text-[10px] font-bold uppercase tracking-widest">Share</span>
          </button>
        </div>
      </section>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Recent Posts Feed */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div ref={connectedClustersRef} className="glass-panel rounded-2xl p-5 sm:p-8 border border-white/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline text-lg sm:text-xl font-black tracking-tight text-white uppercase">Connected Clusters</h3>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{profile.joinedCommunities?.length || 0} total</span>
            </div>

            {!profile.joinedCommunities || profile.joinedCommunities.length === 0 ? (
              <p className="text-slate-500 text-sm">No connected clusters yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.joinedCommunities.map((community) => (
                  <Link key={community.id} to={`/c/${community.name}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 hover:border-primary/40 transition-all">
                    <img
                      src={community.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${community.name}`}
                      alt={community.name}
                      className="h-10 w-10 rounded-lg object-cover border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">c/{community.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 truncate">Connected</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center px-2">
            <h3 className="font-headline text-2xl font-black tracking-tight text-white uppercase italic">Latest Fragments</h3>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Temporal Stream</span>
          </div>
          
          <div className="flex flex-col gap-8">
            {profile.recentPosts.length === 0 ? (
              <div className="p-10 sm:p-16 border-2 border-dashed border-white/5 rounded-3xl text-center">
                <p className="text-slate-500 font-headline italic">No transmissions recorded in this sector.</p>
              </div>
            ) : (
              profile.recentPosts.map(post => (
                <div key={post.id} className="glass-panel rounded-2xl p-5 sm:p-8 hover:border-primary/40 transition-all duration-500 border border-white/5 group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20">{post.community?.name || 'Vortex'}</span>
                    <span className="text-slate-500 text-[10px] font-bold font-headline uppercase">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/post/${post.id}`}>
                    <h4 className="text-2xl sm:text-3xl font-headline font-black mb-4 leading-tight group-hover:text-primary transition-colors text-white break-words">{post.title}</h4>
                  </Link>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed font-light break-words">{post.content?.substring(0, 180)}...</p>
                  <PostMediaRenderer media={post.media} />
                  <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      <span className="text-xs font-bold">{post.votes_count}</span>
                    </div>
                    <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-slate-400 hover:text-secondary transition-colors">
                      <span className="material-symbols-outlined text-lg">chat_bubble</span>
                      <span className="text-xs font-bold">Details</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <div className="glass-panel rounded-2xl p-5 sm:p-8 bg-gradient-to-br from-surface-container-highest/50 to-transparent border border-white/5">
            <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">Activity Matrix</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 sm:p-6 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-secondary font-black block mb-2 tracking-widest uppercase">Reputation</span>
                <span className="text-2xl sm:text-3xl font-headline font-black text-white">1.0</span>
              </div>
              <div className="p-4 sm:p-6 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-primary font-black block mb-2 tracking-widest uppercase">Tier</span>
                <span className="text-2xl sm:text-3xl font-headline font-black text-white">ALPHA</span>
              </div>
            </div>
            <div className="mt-10">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                <span>Signal Strength</span>
                <span>99%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary via-secondary to-primary w-[99%] animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
