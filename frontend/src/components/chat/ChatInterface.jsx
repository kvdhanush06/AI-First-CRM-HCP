import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { sendMessage, clearChat, addLocalMessage } from '../../store/slices/chatSlice';
import { fetchInteractions } from '../../store/slices/interactionSlice';
import { fetchHCPs } from '../../store/slices/hcpSlice';
import ChatMessage from './ChatMessage';
import { Send, Trash2, Sparkles, Loader } from 'lucide-react';
import './ChatInterface.css';

const ChatInterface = () => {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.chat);
  const repName = useSelector((state) => state.ui.repName);
  
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessageText = inputText.trim();
    setInputText('');

    // 1. Add user message locally
    dispatch(addLocalMessage({ role: 'user', content: userMessageText }));

    // 2. Dispatch to backend API
    const result = await dispatch(sendMessage({ message: userMessageText, rep_name: repName }));

    // 3. If the agent executes tools successfully (like log_interaction or edit_interaction),
    // we want to proactively refresh the CRM logs and HCP list so the UI reflects updates instantly!
    if (result.payload?.tool_calls && result.payload.tool_calls.length > 0) {
      const toolNames = result.payload.tool_calls.map(tc => tc.name);
      if (toolNames.includes('log_interaction') || toolNames.includes('edit_interaction')) {
        dispatch(fetchInteractions({ page: 1, size: 10 }));
        dispatch(fetchHCPs());
      }
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to reset the chat session? This will start a new session.')) {
      dispatch(clearChat());
    }
  };

  return (
    <div className="chat-interface-panel glass-panel">
      <div className="chat-header flex-between">
        <div className="chat-header-title">
          <Sparkles className="sparkles-icon" size={16} />
          <h3>AI Assistant</h3>
        </div>
        <button onClick={handleClear} className="chat-clear-btn" title="Reset Session">
          <Trash2 size={16} />
          <span>Reset</span>
        </button>
      </div>

      <div className="chat-messages-container">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {loading && (
          <div className="chat-message-row assistant">
            <div className="chat-avatar">
              <div className="avatar-bot">
                <Loader className="spinning" size={16} />
              </div>
            </div>
            <div className="chat-message-bubble-wrapper">
              <span className="chat-message-sender">AI CRM Assistant</span>
              <div className="chat-message-bubble loading-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-bar">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI, e.g. 'log email with Dr. Doe about Lipitor interest'"
          disabled={loading}
          className="chat-input-field"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim() || loading} 
          className="chat-send-btn btn-primary"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
