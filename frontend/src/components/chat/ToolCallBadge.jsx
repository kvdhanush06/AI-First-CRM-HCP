import React, { useState } from 'react';
import { 
  Search, 
  PlusCircle, 
  Edit3, 
  History, 
  Compass, 
  ChevronDown, 
  ChevronUp, 
  Terminal 
} from 'lucide-react';
import './ToolCallBadge.css';

const ToolCallBadge = ({ toolName, args }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getToolInfo = (name) => {
    switch (name) {
      case 'lookup_hcp':
        return {
          label: 'Lookup HCP',
          icon: <Search size={14} />,
          color: 'var(--accent-teal)',
          desc: 'Search database for HCP profile'
        };
      case 'log_interaction':
        return {
          label: 'Log Interaction',
          icon: <PlusCircle size={14} />,
          color: 'var(--accent-emerald)',
          desc: 'Save new interaction log'
        };
      case 'edit_interaction':
        return {
          label: 'Edit Interaction',
          icon: <Edit3 size={14} />,
          color: 'var(--accent-primary)',
          desc: 'Update existing log entries'
        };
      case 'get_interaction_history':
        return {
          label: 'Get History',
          icon: <History size={14} />,
          color: 'var(--accent-indigo)',
          desc: 'Retrieve HCP history logs'
        };
      case 'suggest_next_action':
        return {
          label: 'Suggest Next Action',
          icon: <Compass size={14} />,
          color: 'var(--accent-amber)',
          desc: 'Generate follow-up recommendations'
        };
      default:
        return {
          label: name || 'Agent Action',
          icon: <Terminal size={14} />,
          color: 'var(--text-secondary)',
          desc: 'Execute backend task'
        };
    }
  };

  const info = getToolInfo(toolName);

  return (
    <div className="tool-call-container" style={{ '--tool-accent': info.color }}>
      <div className="tool-call-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="tool-call-badge">
          {info.icon}
          <span className="tool-label">{info.label}</span>
        </div>
        <span className="tool-desc">{info.desc}</span>
        <button className="tool-toggle-btn">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {isOpen && args && (
        <div className="tool-call-args">
          <div className="args-title">Parameters:</div>
          <pre className="args-code">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolCallBadge;
