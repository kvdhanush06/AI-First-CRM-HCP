import React from 'react';
import { 
  Sparkles, 
  Smile, 
  Meh, 
  Frown, 
  CheckSquare, 
  Square,
  FileText,
  BookmarkCheck
} from 'lucide-react';
import './AIInsightPanel.css';

const AIInsightPanel = ({ interaction }) => {
  if (!interaction) {
    return (
      <div className="ai-insight-panel empty glass-panel">
        <Sparkles className="empty-icon" size={24} />
        <p>Select a CRM log from the dashboard or history to view AI summaries, extraction notes, and follow-ups.</p>
      </div>
    );
  }

  const { ai_summary, sentiment, follow_up_actions, hcp, notes } = interaction;

  const getSentimentInfo = (sent) => {
    switch (sent) {
      case 'positive':
        return {
          label: 'Positive Interest',
          icon: <Smile size={16} />,
          class: 'sent-positive'
        };
      case 'negative':
        return {
          label: 'Negative / Resisted',
          icon: <Frown size={16} />,
          class: 'sent-negative'
        };
      case 'neutral':
      default:
        return {
          label: 'Neutral / Informational',
          icon: <Meh size={16} />,
          class: 'sent-neutral'
        };
    }
  };

  const sentInfo = getSentimentInfo(sentiment);

  return (
    <div className="ai-insight-panel glass-panel">
      <div className="panel-header">
        <Sparkles size={18} className="spark-icon" />
        <h3>AI-Extracted Insights</h3>
        {hcp && (
          <span className="panel-hcp-lbl">Dr. {hcp.first_name} {hcp.last_name}</span>
        )}
      </div>

      <div className="panel-body">
        {/* Sentiment Row */}
        <div className="insight-section">
          <span className="section-label">Doctor Sentiment</span>
          <div className={`sentiment-badge ${sentInfo.class}`}>
            {sentInfo.icon}
            <span>{sentInfo.label}</span>
          </div>
        </div>

        {/* AI Summary */}
        <div className="insight-section">
          <span className="section-label">Executive Summary</span>
          <div className="summary-box">
            <FileText size={14} className="summary-icon" />
            <p>{ai_summary || "No summary generated. Submit notes to trigger AI extraction."}</p>
          </div>
        </div>

        {/* Follow-up Checklist */}
        <div className="insight-section">
          <span className="section-label">Follow-up Action Checklist</span>
          {follow_up_actions && follow_up_actions.length > 0 ? (
            <div className="follow-up-checklist">
              {follow_up_actions.map((action, idx) => (
                <div key={idx} className="checklist-item">
                  <BookmarkCheck size={16} className="chk-icon" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-actions-msg">No follow-up tasks detected from notes.</p>
          )}
        </div>
        
        {/* Original Notes (collapsed/smaller) */}
        {notes && (
          <div className="insight-section original-notes-section">
            <span className="section-label">Original Notes Logged</span>
            <div className="notes-box">
              <p>{notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightPanel;
