import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInteractions } from '../store/slices/interactionSlice';
import { fetchHCPs } from '../store/slices/hcpSlice';
import TopBar from '../components/layout/TopBar';
import AIInsightPanel from '../components/common/AIInsightPanel';
import { 
  Activity, 
  Users, 
  MessageSquareCode, 
  TrendingUp, 
  Layers,
  Sparkles,
  ArrowRight,
  Smile
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { items: interactions, total, loading } = useSelector((state) => state.interaction);
  const { hcps, loading: hcpsLoading } = useSelector((state) => state.hcp);

  const [selectedInteraction, setSelectedInteraction] = useState(null);

  useEffect(() => {
    dispatch(fetchInteractions({ page: 1, size: 5 }));
    dispatch(fetchHCPs());
  }, [dispatch]);

  // Set the first interaction as selected by default when they finish loading
  useEffect(() => {
    if (interactions.length > 0 && !selectedInteraction) {
      setSelectedInteraction(interactions[0]);
    }
  }, [interactions, selectedInteraction]);

  // Compute Stats
  const totalLogs = total || 0;
  const totalDoctors = hcps.length || 0;
  
  // Calculate positive sentiment logs
  const positiveSentimentLogs = interactions.filter(i => i.sentiment === 'positive').length;
  
  // List unique products discussed
  const discussedProductsSet = new Set();
  interactions.forEach(i => {
    if (i.products_discussed) {
      i.products_discussed.forEach(p => discussedProductsSet.add(p));
    }
  });
  const uniqueProductsCount = discussedProductsSet.size;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInteractionIconName = (type) => {
    switch (type) {
      case 'detail_call': return '';
      case 'phone_call': return '';
      case 'email': return '';
      case 'virtual_meeting': return '';
      case 'sample_drop': return '';
      case 'conference': return '';
      default: return '';
    }
  };

  return (
    <div className="main-content">
      <TopBar title="CRM Executive Dashboard" />
      
      <div className="page-container dashboard-page">
        {/* KPI Panel Grid */}
        <div className="stats-kpi-grid">
          <div className="kpi-card glass-panel">
            <div className="kpi-icon-wrapper kpi-violet">
              <Activity size={22} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Total Logs</span>
              <span className="kpi-value">{loading ? '...' : totalLogs}</span>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon-wrapper kpi-teal">
              <Users size={22} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">HCP Directory</span>
              <span className="kpi-value">{hcpsLoading ? '...' : totalDoctors}</span>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon-wrapper kpi-emerald">
              <Smile size={22} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Positive Logs</span>
              <span className="kpi-value">{loading ? '...' : positiveSentimentLogs}</span>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon-wrapper kpi-amber">
              <Layers size={22} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Products Discussed</span>
              <span className="kpi-value">{loading ? '...' : uniqueProductsCount}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Split Panel Layout */}
        <div className="dashboard-split-layout grid-2">
          {/* Recent Interaction Logs */}
          <div className="recent-activity-panel glass-panel">
            <div className="panel-heading flex-between">
              <h3>Recent HCP Interactions</h3>
              <Link to="/history" className="panel-view-all">
                <span>View All Logs</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="timeline-container">
              {loading && interactions.length === 0 ? (
                <div className="timeline-loading">Loading recent interactions...</div>
              ) : interactions.length === 0 ? (
                <div className="timeline-empty">
                  <p>No logged interactions found.</p>
                  <Link to="/log" className="btn btn-primary btn-sm">Log Interaction</Link>
                </div>
              ) : (
                interactions.map((interaction) => (
                  <div 
                    key={interaction.id} 
                    className={`timeline-card ${selectedInteraction?.id === interaction.id ? 'active' : ''}`}
                    onClick={() => setSelectedInteraction(interaction)}
                  >
                    <div className="timeline-icon">
                      {getInteractionIconName(interaction.interaction_type)}
                    </div>
                    <div className="timeline-details">
                      <div className="timeline-meta">
                        <span className="timeline-hcp-name">
                          Dr. {interaction.hcp?.first_name} {interaction.hcp?.last_name}
                        </span>
                        <span className="timeline-date">{formatDate(interaction.date)}</span>
                      </div>
                      
                      <p className="timeline-notes-summary">
                        {interaction.notes ? (interaction.notes.substring(0, 80) + (interaction.notes.length > 80 ? '...' : '')) : 'No notes recorded.'}
                      </p>

                      <div className="timeline-tags">
                        {interaction.sentiment && (
                          <span className={`timeline-badge-sent sent-${interaction.sentiment}`}>
                            {interaction.sentiment}
                          </span>
                        )}
                        {interaction.products_discussed && interaction.products_discussed.map((prod, idx) => (
                          <span key={idx} className="timeline-badge-prod">
                            {prod}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Insights Sidebar */}
          <div className="dashboard-insight-panel">
            <AIInsightPanel interaction={selectedInteraction} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
