import React from 'react';
import { Bot, User } from 'lucide-react';
import ToolCallBadge from './ToolCallBadge';
import './ChatMessage.css';

// Simple markdown formatter to handle bold, bullet points, and code blocks
const formatMessageContent = (text) => {
  if (!text) return '';
  
  // Format code blocks
  let formatted = text.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
  
  // Format bold text
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Format bullet points
  const lines = formatted.split('\n');
  let inList = false;
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      if (!inList) {
        inList = true;
        return `<ul class="chat-list"><li>${content}</li>`;
      }
      return `<li>${content}</li>`;
    } else {
      if (inList) {
        inList = false;
        return `</ul><p>${line}</p>`;
      }
      return line ? `<p>${line}</p>` : '';
    }
  });
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  return processedLines.join('');
};

const ChatMessage = ({ message }) => {
  const { role, content, tool_calls } = message;
  const isAssistant = role === 'assistant';

  return (
    <div className={`chat-message-row ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="chat-avatar">
        {isAssistant ? (
          <div className="avatar-bot">
            <Bot size={18} />
          </div>
        ) : (
          <div className="avatar-user">
            <User size={18} />
          </div>
        )}
      </div>

      <div className="chat-message-bubble-wrapper">
        <span className="chat-message-sender">
          {isAssistant ? 'AI CRM Assistant' : 'You'}
        </span>
        
        <div className="chat-message-bubble">
          {/* Render Tool Calls if present */}
          {isAssistant && tool_calls && tool_calls.length > 0 && (
            <div className="chat-tool-calls-list">
              {tool_calls.map((tool, index) => (
                <ToolCallBadge 
                  key={`tool-${index}`} 
                  toolName={tool.name} 
                  args={tool.args} 
                />
              ))}
            </div>
          )}
          
          {/* Message Content */}
          <div 
            className="chat-message-text" 
            dangerouslySetInnerHTML={{ __html: formatMessageContent(content) }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
