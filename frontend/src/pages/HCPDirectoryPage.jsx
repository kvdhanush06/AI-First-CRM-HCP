import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHCPs, fetchHCPDetails } from '../store/slices/hcpSlice';
import TopBar from '../components/layout/TopBar';
import { 
  Search, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Award, 
  ShieldAlert, 
  Calendar,
  Layers,
  Activity,
  History,
  CornerDownRight,
  Smile
} from 'lucide-react';
import './HCPDirectoryPage.css';

const HCPDirectoryPage = () => {
  const dispatch = useDispatch();
  const { hcps, selectedHCP, loading, detailsLoading } = useSelector((state) => state.hcp);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchHCPs());
  }, [dispatch]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    dispatch(fetchHCPs(e.target.value));
  };

  const handleSelectHCP = (id) => {
    dispatch(fetchHCPDetails(id));
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

  return (
    <div className="main-content">
      <TopBar title="HCP Professional Directory" />
      
      <div className="page-container hcp-directory-page">
        <div className="directory-split-layout grid-2">
          {/* Left Column: Doctor Search & List */}
          <div className="hcp-list-panel glass-panel">
            <div className="list-search-box">
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, specialty, affiliation..."
                className="directory-search-input"
              />
            </div>

            <div className="hcp-cards-scroll-container">
              {loading && hcps.length === 0 ? (
                <div className="loading-placeholder">Loading directory...</div>
              ) : hcps.length === 0 ? (
                <div className="empty-placeholder">No HCPs found matching your search.</div>
              ) : (
                hcps.map((hcp) => (
                  <div 
                    key={hcp.id}
                    className={`hcp-directory-card ${selectedHCP?.id === hcp.id ? 'active' : ''}`}
                    onClick={() => handleSelectHCP(hcp.id)}
                  >
                    <div className="hcp-card-avatar">
                      <User size={18} />
                    </div>
                    <div className="hcp-card-info">
                      <h4>Dr. {hcp.first_name} {hcp.last_name}</h4>
                      <span className="hcp-specialty-badge">{hcp.specialty || 'General Practitioner'}</span>
                      <p className="hcp-card-affil">{hcp.affiliation}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Doctor Details & History */}
          <div className="hcp-details-panel">
            {detailsLoading ? (
              <div className="details-state glass-panel flex-center">
                <div className="loading-spinner-placeholder">Loading profile details...</div>
              </div>
            ) : selectedHCP ? (
              <div className="details-container">
                {/* Doctor Bio Card */}
                <div className="profile-bio-card glass-panel">
                  <div className="bio-header">
                    <div className="bio-avatar">
                      <User size={32} />
                    </div>
                    <div className="bio-title">
                      <h2>Dr. {selectedHCP.first_name} {selectedHCP.last_name}</h2>
                      <span className="bio-spec">{selectedHCP.specialty}</span>
                    </div>
                  </div>

                  <div className="bio-metadata-grid">
                    <div className="bio-meta-item">
                      <Award size={16} className="meta-icon" />
                      <div>
                        <span className="meta-lbl">NPI Number</span>
                        <span className="meta-val">{selectedHCP.npi_number || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="bio-meta-item">
                      <MapPin size={16} className="meta-icon" />
                      <div>
                        <span className="meta-lbl">Location</span>
                        <span className="meta-val">
                          {selectedHCP.city && selectedHCP.state 
                            ? `${selectedHCP.city}, ${selectedHCP.state}` 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="bio-meta-item">
                      <Mail size={16} className="meta-icon" />
                      <div>
                        <span className="meta-lbl">Email Address</span>
                        <span className="meta-val">{selectedHCP.email || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="bio-meta-item">
                      <Phone size={16} className="meta-icon" />
                      <div>
                        <span className="meta-lbl">Phone Contact</span>
                        <span className="meta-val">{selectedHCP.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bio-affiliation-banner">
                    <span className="meta-lbl">Affiliation</span>
                    <span className="meta-val-large">{selectedHCP.affiliation || 'Independent Clinic'}</span>
                  </div>
                </div>

                {/* Interaction Timeline for Selected Doctor */}
                <div className="profile-history-card glass-panel">
                  <div className="history-header flex-between">
                    <div className="history-header-title">
                      <History size={16} className="history-icon" />
                      <h3>Interaction Log History</h3>
                    </div>
                    <span className="history-count-badge">{selectedHCP.interactions?.length || 0} Logs</span>
                  </div>

                  <div className="history-timeline-scroll">
                    {!selectedHCP.interactions || selectedHCP.interactions.length === 0 ? (
                      <div className="empty-history">No interactions logged yet for this doctor.</div>
                    ) : (
                      selectedHCP.interactions.map((log) => (
                        <div key={log.id} className="history-log-row">
                          <div className="history-log-meta">
                            <span className="log-type-tag">{log.interaction_type.replace('_', ' ')}</span>
                            <span className="log-date">{formatDate(log.date)}</span>
                          </div>
                          
                          <div className="history-log-notes">
                            <CornerDownRight size={14} className="notes-arrow" />
                            <div className="notes-text-wrap">
                              <p className="orig-notes">{log.notes || 'No custom notes logged.'}</p>
                              {log.ai_summary && (
                                <div className="ai-summary-block">
                                  <span className="ai-sum-lbl">AI Summary</span>
                                  <p>{log.ai_summary}</p>
                                </div>
                              )}
                              
                              <div className="history-log-footer-tags">
                                {log.sentiment && (
                                  <span className={`log-badge-sent sent-${log.sentiment}`}>
                                    {log.sentiment}
                                  </span>
                                )}
                                {log.products_discussed && log.products_discussed.map((prod, idx) => (
                                  <span key={idx} className="log-badge-prod">{prod}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="details-state glass-panel flex-center">
                <div className="select-prompt">
                  <User size={36} className="prompt-avatar-icon" />
                  <h4>No Doctor Profile Selected</h4>
                  <p>Choose a healthcare professional from the left list to view their credentials, NPI, and complete call histories.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HCPDirectoryPage;
