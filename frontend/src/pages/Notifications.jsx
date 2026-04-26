import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNotificationPreferences, fetchNotifications, markNotificationsRead, updateNotificationPreferences } from '../api';

const Notifications = ({ user }) => {
  const [items, setItems] = useState([]);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  useEffect(() => {
    let timer;

    const run = async () => {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      const res = await fetchNotifications();
      const prefsRes = await fetchNotificationPreferences();
      if (res?.success) {
        setItems(res.data || []);
      }
      if (prefsRes?.success) {
        setPrefs(prefsRes.data || null);
      }
      setLoading(false);

      timer = setTimeout(run, 5000);
    };

    run();
    return () => clearTimeout(timer);
  }, [user]);

  const handleMarkRead = async () => {
    setMarking(true);
    const unreadIds = items.filter((item) => !item.read_at).map((item) => item.id);
    const res = await markNotificationsRead(unreadIds);
    if (res?.success) {
      setItems((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    }
    setMarking(false);
  };

  const handlePrefToggle = async (key) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingPrefs(true);
    const res = await updateNotificationPreferences(next);
    if (!res?.success) {
      setPrefs((prev) => ({ ...prev, [key]: !next[key] }));
      alert(res?.error || 'Unable to save preferences');
    }
    setSavingPrefs(false);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="glass-card rounded-2xl p-8 border border-white/10 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Notifications</h2>
          <p className="text-slate-400">Sign in to view notifications.</p>
        </div>
      </div>
    );
  }

  const describe = (item) => {
    if (item.type === 'follow') {
      return `${item.actor?.username || 'Someone'} started following you.`;
    }
    if (item.type === 'message') {
      return `${item.actor?.username || 'Someone'} sent you a message.`;
    }
    return `${item.actor?.username || 'Someone'} triggered ${item.type}.`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Notifications</h1>
          <p className="text-sm text-slate-400">Unread: {unreadCount}</p>
        </div>
        <button
          type="button"
          onClick={handleMarkRead}
          disabled={marking || unreadCount === 0}
          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-widest disabled:opacity-60"
        >
          {marking ? 'Updating...' : 'Mark all as read'}
        </button>
      </div>

      {prefs && (
        <div className="glass-card rounded-xl border border-white/10 p-4 space-y-3">
          <h2 className="text-white font-semibold">Notification Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ['follows_enabled', 'Follows'],
              ['follow_requests_enabled', 'Follow requests'],
              ['messages_enabled', 'Messages'],
              ['comments_enabled', 'Comments'],
              ['mentions_enabled', 'Mentions']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                disabled={savingPrefs}
                onClick={() => handlePrefToggle(key)}
                className={`text-left px-3 py-2 rounded-lg border text-sm ${prefs[key] ? 'border-primary/50 bg-primary/10 text-white' : 'border-white/20 text-slate-300'} disabled:opacity-60`}
              >
                {label}: {prefs[key] ? 'On' : 'Off'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-xl border border-white/10 p-8 text-slate-400">No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={`glass-card rounded-xl border p-4 ${item.read_at ? 'border-white/10' : 'border-primary/40 bg-primary/5'}`}>
              <div className="flex items-start gap-3">
                <img
                  src={item.actor?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.actor?.username || 'actor'}`}
                  alt={item.actor?.username || 'actor'}
                  className="h-10 w-10 rounded-full border border-white/10 object-cover"
                />
                <div className="flex-1">
                  <p className="text-slate-100 text-sm">{describe(item)}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                  {item.type === 'message' && item.payload?.conversation_id ? (
                    <Link to={`/messages?conversation=${item.payload.conversation_id}`} className="text-xs text-primary hover:underline mt-2 inline-block">
                      Open conversation
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
