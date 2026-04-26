import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchBlockedUsers, fetchFollowRequests, fetchFollowSuggestions, respondFollowRequest, startChat, toggleFollow, updatePrivacy } from '../api';

const Connect = ({ user, onUserUpdated }) => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionByUserId, setActionByUserId] = useState({});
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(!!user?.is_private);

  const sortedSuggestions = useMemo(() => {
    return [...suggestions].sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')));
  }, [suggestions]);

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const [res, requestRes, blockRes] = await Promise.all([
        fetchFollowSuggestions(),
        fetchFollowRequests(),
        fetchBlockedUsers()
      ]);

      if (res?.success) setSuggestions(res.data || []);
      if (requestRes?.success) setRequests(requestRes.data || []);
      if (blockRes?.success) setBlocks(blockRes.data || []);
      setLoading(false);
    };

    run();
  }, [user]);

  useEffect(() => {
    setPrivateAccount(!!user?.is_private);
  }, [user]);

  const handleFollow = async (targetUserId) => {
    setActionByUserId((prev) => ({ ...prev, [targetUserId]: 'follow' }));
    const res = await toggleFollow(targetUserId);
    if (res?.success) {
      setSuggestions((prev) => prev.map((person) => {
        if (person.id !== targetUserId) return person;
        return {
          ...person,
          already_following: !!res.following,
          requested: !!res.requested
        };
      }));
    } else {
      alert(res?.error || 'Unable to follow right now');
    }
    setActionByUserId((prev) => ({ ...prev, [targetUserId]: null }));
  };

  const handleRequestAction = async (requestId, action) => {
    const res = await respondFollowRequest(requestId, action);
    if (res?.success) {
      setRequests((prev) => prev.filter((item) => item.id !== requestId));
    } else {
      alert(res?.error || 'Unable to process request');
    }
  };

  const handlePrivacyToggle = async () => {
    setPrivacyBusy(true);
    const next = !privateAccount;
    setPrivateAccount(next);
    const res = await updatePrivacy(next);
    if (!res?.success) {
      setPrivateAccount(!next);
      alert(res?.error || 'Unable to update privacy');
    } else {
      onUserUpdated?.(res.data || { is_private: next });
    }
    setPrivacyBusy(false);
  };

  const handleMessage = async (targetUserId) => {
    setActionByUserId((prev) => ({ ...prev, [targetUserId]: 'message' }));
    const res = await startChat(targetUserId);
    if (res?.success) {
      navigate(`/messages?conversation=${res.data.id}`);
    } else {
      alert(res?.error || 'Unable to start chat right now');
    }
    setActionByUserId((prev) => ({ ...prev, [targetUserId]: null }));
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="glass-card rounded-2xl p-8 border border-white/10 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Connect</h2>
          <p className="text-slate-400">Sign in to discover people and start direct chats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Connect</h1>
          <p className="text-slate-400 text-sm">Discover people you might want to follow and message.</p>
        </div>
        <Link to={`/u/${user.username}`} className="text-xs uppercase tracking-widest text-slate-300 hover:text-white">My Profile</Link>
      </div>

      <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-white font-semibold">Private Account</p>
          <p className="text-xs text-slate-400">Approve followers before they can follow you.</p>
        </div>
        <button
          type="button"
          disabled={privacyBusy}
          onClick={handlePrivacyToggle}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest ${privateAccount ? 'bg-primary text-white' : 'border border-white/20 text-slate-200'} disabled:opacity-60`}
        >
          {privacyBusy ? 'Updating...' : (privateAccount ? 'Private: ON' : 'Private: OFF')}
        </button>
      </div>

      {requests.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-white/10 space-y-3">
          <h2 className="text-white font-bold">Follow Requests</h2>
          {requests.map((request) => (
            <div key={request.id} className="flex items-center gap-3 border border-white/10 rounded-lg p-3">
              <img
                src={request.requester?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${request.requester?.username || 'user'}`}
                alt={request.requester?.username || 'user'}
                className="h-10 w-10 rounded-full border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{request.requester?.username}</p>
                <p className="text-[11px] text-slate-500">Requested to follow you</p>
              </div>
              <button type="button" onClick={() => handleRequestAction(request.id, 'accept')} className="px-3 py-2 text-xs rounded-lg bg-primary text-white font-bold">Accept</button>
              <button type="button" onClick={() => handleRequestAction(request.id, 'reject')} className="px-3 py-2 text-xs rounded-lg border border-white/20 text-slate-200">Reject</button>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : sortedSuggestions.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 border border-white/10">
          <p className="text-slate-300">No ranked suggestions yet. Users may be blocked or unavailable.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedSuggestions.map((person) => (
            <div key={person.id} className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-4">
              <img
                src={person.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${person.username}`}
                alt={person.username}
                className="h-12 w-12 rounded-full object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/u/${person.username}`} className="text-white font-semibold truncate block hover:text-primary">{person.username}</Link>
                <p className="text-[11px] uppercase tracking-widest text-slate-500">
                  {person.mutual_count ? `${person.mutual_count} mutual` : 'Suggested Connection'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFollow(person.id)}
                  disabled={!!actionByUserId[person.id]}
                  className="px-3 py-2 text-xs rounded-lg bg-primary text-white font-bold disabled:opacity-60"
                >
                  {actionByUserId[person.id] === 'follow' ? '...' : (person.requested ? 'Requested' : (person.already_following ? 'Following' : 'Follow'))}
                </button>
                <button
                  type="button"
                  onClick={() => handleMessage(person.id)}
                  disabled={!!actionByUserId[person.id]}
                  className="px-3 py-2 text-xs rounded-lg border border-white/20 text-slate-200 hover:text-white disabled:opacity-60"
                >
                  {actionByUserId[person.id] === 'message' ? '...' : 'Message'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {blocks.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-white/10 space-y-2">
          <h3 className="text-sm font-bold text-white">Blocked Users</h3>
          <div className="flex flex-wrap gap-2">
            {blocks.map((item) => (
              <span key={item.id} className="px-3 py-1 rounded-full bg-white/5 text-xs text-slate-300 border border-white/10">
                {item.blocked?.username || 'Unknown'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Connect;
