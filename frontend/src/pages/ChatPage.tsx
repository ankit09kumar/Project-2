import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, UserPlus, Search, UserCheck } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();

  // Conversations and active partner state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');

  // User search (for starting a new conversation)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

        // If a redirect trigger is passed (e.g. "startChatWith" ID)
        const state = location.state as { startChatWith?: number };
        if (state?.startChatWith) {
          const existing = data.find((c: any) => c.user.id === state.startChatWith);
          if (existing) {
            setSelectedUser(existing.user);
          } else {
            // Fetch user info manually to initiate
            const userRes = await fetch(`http://localhost:5000/api/chat/search?query=`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userRes.ok) {
              const users = await userRes.json();
              const found = users.find((u: any) => u.id === state.startChatWith);
              if (found) {
                setSelectedUser(found);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (partnerId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/chat/history/${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Search users to start new chat
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery.trim() || !token) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/chat/search?query=${searchQuery}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token]);

  useEffect(() => {
    fetchConversations();
  }, [token]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg: any) => {
      // If message is from the currently active chat partner
      if (selectedUser && (msg.senderId === selectedUser.id || msg.receiverId === selectedUser.id)) {
        setMessages(prev => [...prev, msg]);
      }
      // Reload conversations listing
      fetchConversations();
    };

    socket.on('receive_message', handleIncomingMessage);
    socket.on('message_sent', handleIncomingMessage);

    return () => {
      socket.off('receive_message', handleIncomingMessage);
      socket.off('message_sent', handleIncomingMessage);
    };
  }, [socket, selectedUser]);

  // Smooth scroll message container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser || !socket) return;

    socket.emit('send_message', {
      receiverId: selectedUser.id,
      content: messageText
    });

    setMessageText('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#0b0f19] h-[calc(100vh-64px)] flex flex-col">
      <div className="glass-panel rounded-3xl overflow-hidden flex flex-1 h-full min-h-0">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-slate-900 flex flex-col h-full bg-[#0b0f19]/60">
          <div className="p-4 border-b border-slate-900 relative">
            <h2 className="text-base font-extrabold text-white font-outfit mb-3">Chats</h2>

            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Find user to chat..."
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input py-2 pl-9 pr-3 rounded-xl text-xs text-white focus:outline-none"
              />

              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#0e1424] border border-slate-800 p-1.5 shadow-2xl z-50">
                  {searchResults.map((searchUser) => (
                    <div
                      key={searchUser.id}
                      onClick={() => {
                        setSelectedUser(searchUser);
                        setSearchQuery('');
                        setShowSearchDropdown(false);
                      }}
                      className="flex items-center gap-2.5 p-2 hover:bg-white/5 rounded-lg cursor-pointer text-xs transition-colors"
                    >
                      <img src={searchUser.avatarUrl} alt="avatar" className="h-6 w-6 rounded-full bg-slate-800" />
                      <div>
                        <span className="font-bold text-white block">{searchUser.name}</span>
                        <span className="text-[10px] text-slate-500">{searchUser.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900/50 p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-12">No recent chats. Search above to start!</div>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.user.id}
                  onClick={() => setSelectedUser(convo.user)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedUser?.id === convo.user.id
                      ? 'bg-indigo-500/10 border border-indigo-500/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={convo.user.avatarUrl}
                      alt={convo.user.name}
                      className="h-8 w-8 rounded-full bg-slate-800 object-cover"
                    />
                    <div className="min-w-0">
                      <span className="block font-bold text-xs text-white truncate">{convo.user.name}</span>
                      <span className="block text-[10px] text-slate-400 truncate mt-0.5">{convo.lastMessage}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[8px] text-slate-500">
                      {new Date(convo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {convo.unread && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Pane */}
        <div className="flex-1 flex flex-col h-full bg-[#0b0f19]/25">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-[#0e1424]/40">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    className="h-9 w-9 rounded-full bg-slate-800 object-cover"
                  />
                  <div>
                    <span className="font-bold text-sm text-white block">{selectedUser.name}</span>
                    <span className="text-[10px] text-indigo-400 font-semibold">{selectedUser.role}</span>
                  </div>
                </div>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isOwn
                            ? 'bg-indigo-500 text-white rounded-tr-none'
                            : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <span className={`text-[8px] block text-right mt-1.5 ${isOwn ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input section */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 glass-input py-3 px-4 rounded-xl text-sm text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-xl transition-all"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <UserPlus className="text-slate-600 mb-2" size={32} />
              <p>Select a user from the sidebar to begin messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatPage;
