import React from 'react';
import TopBar from '../components/layout/TopBar';
import ChatInterface from '../components/chat/ChatInterface';
import InteractionForm from '../components/interactions/InteractionForm';
import { Sparkles, HelpCircle } from 'lucide-react';
import './LogInteractionPage.css';

const LogInteractionPage = () => {
  return (
    <div className="main-content">
      <TopBar title="Log HCP Interaction" />
      
      <div className="page-container log-interaction-page">
        {/* Helper guide banner */}
        <div className="helper-banner glass-panel">
          <div className="helper-banner-title">
            <Sparkles className="banner-icon" size={16} />
            <h4>AI-Powered Dual Logging Interface</h4>
          </div>
          <p>
            You can log or manage doctor interactions using either interface below. 
            Type naturally in the <strong>AI Assistant chat (left)</strong> to let the agent auto-extract doctor, products, and notes (e.g. <em>"Log a virtual meeting with Dr. John Doe yesterday about Lipitor, he was very positive"</em>), 
            or fill out the <strong>Structured CRM Form (right)</strong> directly.
          </p>
        </div>

        {/* Dual Panel Layout Grid */}
        <div className="dual-panel-layout grid-2">
          {/* Conversational Chat Panel */}
          <div className="panel-col chat-panel-col">
            <ChatInterface />
          </div>

          {/* Structured Form Panel */}
          <div className="panel-col form-panel-col">
            <InteractionForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogInteractionPage;
