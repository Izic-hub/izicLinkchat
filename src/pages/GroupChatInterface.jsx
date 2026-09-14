import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { sendMessage } from '../lib/messages';

export default function GroupChatInterface() {
  const { groupId } = useParams();
  const navigate = useNavigate(); // Modern SPA routing hook
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check auth on load using secure method
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/login'); // Instantly redirect if unauthorized
      } else {
        setCurrentUser(user);
      }
    });

    // Fetch initial message history
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`id, text, created_at, sender_id, profiles:sender_id ( username )`)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    // 🚀 Real-time stream setup using functional state updates to prevent page clearing
    const channel = supabase
      .channel(`room:${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` }, 
      (payload) => {
        setMessages((prevMessages) => {
          // Prevent duplicate updates if sender already appended it locally
          if (prevMessages.some((msg) => msg.id === payload.new.id)) return prevMessages;
          return [...prevMessages, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, navigate]);

  // Autoscroll to bottom when new messages fly in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const typedText = newMessageText;
    setNewMessageText(''); // Reset input box instantly

    // Optimistically update local view for a lightning fast feel
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      text: typedText,
      created_at: new Date().toISOString(),
      sender_id: currentUser?.id
    };
    setMessages((prev) => [...prev, tempMessage]);

    // Push execution to background database pipeline
    const { data, error } = await sendMessage(typedText, groupId);
    if (error) {
      // Rollback on network failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessageText(typedText); // Give user their text back
    } else if (data) {
      // Swap out the placeholder row with the official Postgres timestamp row
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? data : msg)));
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">⬅ Leave Room</button>
        <h3>Group Conversation</h3>
      </header>
      
      <div className="messages-stream">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.sender_id === currentUser?.id ? 'sent' : 'received'}`}>
            <span className="sender-tag">{msg.profiles?.username || 'User'}:</span>
            <p className="message-text">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-bar">
        <input 
          type="text" 
          value={newMessageText} 
          onChange={(e) => setNewMessageText(e.target.value)} 
          placeholder="Type a message safely..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
