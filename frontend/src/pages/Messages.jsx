import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchConversations, fetchMessages, fetchTypingStatus, markConversationRead, sendMessage, setTypingStatus } from '../api';

const Messages = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    const conversationFromQuery = Number(searchParams.get('conversation'));
    if (Number.isFinite(conversationFromQuery) && conversationFromQuery > 0) {
      setSelectedConversationId(conversationFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    let timer;

    const loadConversations = async () => {
      if (!user) {
        setConversations([]);
        setLoadingList(false);
        return;
      }

      const res = await fetchConversations();
      if (res?.success) {
        setConversations(res.data || []);
        if (!selectedConversationId && (res.data || []).length > 0) {
          setSelectedConversationId(res.data[0].id);
        }
      }
      setLoadingList(false);

      timer = setTimeout(loadConversations, 5000);
    };

    loadConversations();
    return () => clearTimeout(timer);
  }, [user, selectedConversationId]);

  useEffect(() => {
    let timer;

    const loadMessages = async () => {
      if (!user || !selectedConversationId) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      const res = await fetchMessages(selectedConversationId, 60);
      if (res?.success) {
        setMessages(res.data || []);
        await markConversationRead(selectedConversationId);
      }
      setLoadingMessages(false);

      timer = setTimeout(loadMessages, 3000);
    };

    loadMessages();
    return () => clearTimeout(timer);
  }, [user, selectedConversationId]);

  useEffect(() => {
    let timer;

    const loadTyping = async () => {
      if (!user || !selectedConversationId) {
        setTypingUsers([]);
        return;
      }

      const res = await fetchTypingStatus(selectedConversationId);
      if (res?.success) {
        setTypingUsers((res.data || []).map((item) => item.user?.username).filter(Boolean));
      }

      timer = setTimeout(loadTyping, 1200);
    };

    loadTyping();
    return () => clearTimeout(timer);
  }, [user, selectedConversationId]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedConversationId || !text.trim()) return;

    setSending(true);
    const content = text.trim();
    const res = await sendMessage(selectedConversationId, content);
    if (res?.success) {
      setText('');
      setMessages((prev) => [...prev, { ...res.data, sender_id: user.id }]);
      await setTypingStatus(selectedConversationId, false);
    } else {
      alert(res?.error || 'Message failed');
    }
    setSending(false);
  };

  const handleTyping = async (value) => {
    setText(value);
    if (!selectedConversationId) return;
    await setTypingStatus(selectedConversationId, !!value.trim());
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="glass-card rounded-2xl p-8 border border-white/10 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Messages</h2>
          <p className="text-slate-400">Sign in to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-white mb-6">Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 glass-card rounded-xl border border-white/10 p-3 max-h-[70vh] overflow-y-auto">
          {loadingList ? (
            <p className="text-slate-400 text-sm p-3">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p className="text-slate-400 text-sm p-3">No chats yet. Start from Connect page.</p>
          ) : (
            conversations.map((item) => {
              const peer = item.peers?.[0];
              const active = item.id === selectedConversationId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedConversationId(item.id)}
                  className={`w-full text-left p-3 rounded-lg mb-2 border transition-all ${active ? 'bg-primary/15 border-primary/40' : 'bg-white/5 border-white/10 hover:border-white/25'}`}
                >
                  <p className="text-white font-semibold">{peer?.username || 'Direct chat'}</p>
                  <p className="text-xs text-slate-400 truncate">{item.last_message?.content || 'No messages yet'}</p>
                </button>
              );
            })
          )}
        </div>

        <div className="md:col-span-8 glass-card rounded-xl border border-white/10 p-4 flex flex-col h-[70vh]">
          {!selectedConversation ? (
            <div className="m-auto text-center text-slate-400">Select a conversation to start chatting.</div>
          ) : (
            <>
              <div className="pb-3 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">{selectedConversation.peers?.[0]?.username || 'Direct chat'}</h2>
                {typingUsers.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">{typingUsers.join(', ')} typing...</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {loadingMessages ? (
                  <p className="text-sm text-slate-400">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-400">No messages yet.</p>
                ) : (
                  messages.map((msg) => {
                    const mine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${mine ? 'bg-primary text-white' : 'bg-white/10 text-slate-100'}`}>
                          {msg.content}
                          {mine && (
                            <div className="text-[10px] opacity-80 mt-1 text-right">{msg.read_by_count > 1 ? 'Read' : 'Sent'}</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="pt-3 border-t border-white/10 flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                  placeholder="Write a message"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-60"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
