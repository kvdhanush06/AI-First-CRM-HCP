import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setRepName, showNotification } from '../../store/slices/uiSlice';
import { UserCheck, RefreshCw, Radio } from 'lucide-react';
import axios from 'axios';
import './TopBar.css';

const TopBar = ({ title }) => {
  const dispatch = useDispatch();
  const repName = useSelector((state) => state.ui.repName);
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(repName);
  const [isConnected, setIsConnected] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkBackendHealth = async () => {
    setCheckingHealth(true);
    try {
      await axios.get('/health');
      setIsConnected(true);
    } catch (e) {
      setIsConnected(false);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSaveName = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      dispatch(setRepName(tempName.trim()));
      setIsEditing(false);
      dispatch(showNotification({ message: `Representative name updated to: ${tempName}`, type: 'success' }));
    }
  };

  return (
    <header className="topbar-container">
      <div className="topbar-title-section">
        <h1>{title}</h1>
      </div>

      <div className="topbar-actions">
        {/* Connection Status */}
        <div className={`connection-status ${isConnected ? 'online' : 'offline'}`} onClick={checkBackendHealth} title="Click to refresh status">
          <Radio size={14} className={checkingHealth ? 'spinning' : ''} />
          <span>{isConnected ? 'API Connected' : 'API Offline'}</span>
        </div>

        {/* Rep Profile Settings */}
        <div className="rep-profile-settings">
          {isEditing ? (
            <form onSubmit={handleSaveName} className="rep-name-form">
              <input 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)} 
                className="rep-name-input"
                autoFocus
                placeholder="Enter Representative Name"
              />
              <button type="submit" className="rep-save-btn">Save</button>
              <button type="button" onClick={() => { setIsEditing(false); setTempName(repName); }} className="rep-cancel-btn">Cancel</button>
            </form>
          ) : (
            <div className="rep-name-display" onClick={() => setIsEditing(true)}>
              <UserCheck size={18} className="rep-avatar-icon" />
              <div className="rep-info-text">
                <span className="rep-role-lbl">Active Rep</span>
                <span className="rep-name-val">{repName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
