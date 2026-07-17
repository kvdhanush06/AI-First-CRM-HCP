import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchInteractions, 
  deleteInteraction 
} from '../store/slices/interactionSlice';
import { fetchHCPs } from '../store/slices/hcpSlice';
import TopBar from '../components/layout/TopBar';
import InteractionForm from '../components/interactions/InteractionForm';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  CornerRightDown,
  X
} from 'lucide-react';
import { showNotification } from '../store/slices/uiSlice';
import './InteractionHistoryPage.css';

const InteractionHistoryPage = () => {
  const dispatch = useDispatch();
  const { items: interactions, total, page, size, loading } = useSelector((state) => state.interaction);
  const { hcps } = useSelector((state) => state.hcp);

  // Filters state
  const [filterHcp, setFilterHcp] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Modal state
  const [editingInteraction, setEditingInteraction] = useState(null);

  useEffect(() => {
    dispatch(fetchHCPs());
    loadInteractions(1);
  }, [dispatch]);

  const loadInteractions = (pageNum) => {
    dispatch(fetchInteractions({
      hcp_id: filterHcp,
      interaction_type: filterType,
      page: pageNum,
      size: size
    }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    loadInteractions(1);
  };

  const handleResetFilters = () => {
    setFilterHcp('');
    setFilterType('');
    dispatch(fetchInteractions({ page: 1, size }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this interaction log? This action is permanent.')) {
      try {
        await dispatch(deleteInteraction(id)).unwrap();
        dispatch(showNotification({ message: 'Log entry deleted successfully.', type: 'success' }));
        // Reload current page
        loadInteractions(page);
      } catch (err) {
        dispatch(showNotification({ message: err || 'Deletion failed.', type: 'error' }));
      }
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentIcon = (sent) => {
    switch (sent) {
      case 'positive': return <Smile className="sent-icon pos" size={16} title="Positive Sentiment" />;
      case 'negative': return <Frown className="sent-icon neg" size={16} title="Negative Sentiment" />;
      case 'neutral':
      default: return <Meh className="sent-icon neu" size={16} title="Neutral Sentiment" />;
    }
  };

  const totalPages = Math.ceil(total / size) || 1;

  return (
    <div className="main-content">
      <TopBar title="Interaction Audit Logs" />
      
      <div className="page-container interaction-history-page">
        {/* Filters Header Panel */}
        <form onSubmit={handleApplyFilters} className="filters-panel glass-panel">
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="filter-hcp"><Filter size={12} /> Filter by Doctor</label>
              <select 
                id="filter-hcp"
                value={filterHcp}
                onChange={(e) => setFilterHcp(e.target.value)}
              >
                <option value="">-- All HCPs --</option>
                {hcps.map((hcp) => (
                  <option key={hcp.id} value={hcp.id}>
                    Dr. {hcp.first_name} {hcp.last_name} ({hcp.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-type"><Filter size={12} /> Filter by Type</label>
              <select 
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">-- All Types --</option>
                <option value="detail_call">Detail Call (Pitch)</option>
                <option value="phone_call">Phone Call</option>
                <option value="email">Email</option>
                <option value="virtual_meeting">Virtual Meeting</option>
                <option value="sample_drop">Sample Drop</option>
                <option value="conference">Conference Interaction</option>
                <option value="follow_up">Follow Up</option>
              </select>
            </div>

            <div className="filter-actions-group">
              <button type="submit" className="btn btn-primary filter-btn">Apply Filters</button>
              <button type="button" onClick={handleResetFilters} className="btn btn-secondary reset-btn">Reset</button>
            </div>
          </div>
        </form>

        {/* Audit Log Table/List Panel */}
        <div className="audit-logs-list-panel glass-panel">
          {loading ? (
            <div className="list-status-placeholder">Querying database...</div>
          ) : interactions.length === 0 ? (
            <div className="list-status-placeholder">No audit logs match current filters.</div>
          ) : (
            <div className="audit-cards-grid">
              {interactions.map((log) => (
                <div key={log.id} className="audit-card">
                  {/* Card Header */}
                  <div className="audit-card-header flex-between">
                    <div className="audit-card-hcp-title">
                      <h4>Dr. {log.hcp?.first_name} {log.hcp?.last_name}</h4>
                      <span className="audit-card-spec">{log.hcp?.specialty} • {log.hcp?.affiliation}</span>
                    </div>

                    <div className="audit-card-badge-group">
                      <span className="audit-card-type-lbl">{log.interaction_type.replace('_', ' ')}</span>
                      {getSentimentIcon(log.sentiment)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="audit-card-body">
                    <div className="body-date-row">
                      <Calendar size={13} className="meta-icon" />
                      <span>{formatDate(log.date)}</span>
                      <span className="rep-sign-lbl">logged by: {log.rep_name}</span>
                    </div>

                    {log.notes && (
                      <p className="audit-card-orig-notes">"{log.notes}"</p>
                    )}

                    {log.ai_summary && (
                      <div className="audit-card-summary-block">
                        <div className="sum-header flex-between">
                          <span className="sum-lbl">
                            <Sparkles size={12} className="sum-icon" />
                            <span>AI-Generated Summary</span>
                          </span>
                        </div>
                        <p>{log.ai_summary}</p>
                      </div>
                    )}

                    {/* Products and Followups */}
                    <div className="audit-card-tags-grid">
                      {log.products_discussed && log.products_discussed.length > 0 && (
                        <div className="tag-group">
                          <span className="tag-group-lbl">Products</span>
                          <div className="tag-flex">
                            {log.products_discussed.map((prod, idx) => (
                              <span key={idx} className="audit-prod-tag">{prod}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {log.follow_up_actions && log.follow_up_actions.length > 0 && (
                        <div className="tag-group">
                          <span className="tag-group-lbl">Follow-ups</span>
                          <div className="tag-flex">
                            {log.follow_up_actions.map((act, idx) => (
                              <span key={idx} className="audit-followup-tag">{act}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="audit-card-footer flex-between">
                    <span className="audit-id-tag">Log Ref ID: #{log.id}</span>
                    <div className="audit-action-btns">
                      <button 
                        onClick={() => setEditingInteraction(log)} 
                        className="audit-btn edit-btn"
                        title="Edit entry"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(log.id)} 
                        className="audit-btn delete-btn"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="pagination-controls-row flex-between">
            <span className="paging-total-lbl">Total Records: {total}</span>
            <div className="paging-buttons">
              <button 
                onClick={() => loadInteractions(page - 1)} 
                disabled={page <= 1 || loading}
                className="paging-arrow-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="paging-number-lbl">Page {page} of {totalPages}</span>
              <button 
                onClick={() => loadInteractions(page + 1)} 
                disabled={page >= totalPages || loading}
                className="paging-arrow-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Edit Interaction Modal Overlay */}
        {editingInteraction && (
          <div className="modal-overlay">
            <div className="modal-content-panel">
              <button onClick={() => setEditingInteraction(null)} className="modal-close-btn">
                <X size={18} />
              </button>
              <InteractionForm 
                initialData={editingInteraction}
                onCancel={() => setEditingInteraction(null)}
                onSuccess={() => {
                  setEditingInteraction(null);
                  loadInteractions(page);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractionHistoryPage;
