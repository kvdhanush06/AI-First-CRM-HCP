import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearNotification } from './store/slices/uiSlice';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import LogInteractionPage from './pages/LogInteractionPage';
import HCPDirectoryPage from './pages/HCPDirectoryPage';
import InteractionHistoryPage from './pages/InteractionHistoryPage';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import './App.css';

const App = () => {
  const dispatch = useDispatch();
  const notification = useSelector((state) => state.ui.notification);

  // Auto-dismiss toast notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        dispatch(clearNotification());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, dispatch]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="toast-icon success-icon" />;
      case 'error':
        return <AlertTriangle size={16} className="toast-icon error-icon" />;
      case 'info':
      default:
        return <Info size={16} className="toast-icon info-icon" />;
    }
  };

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar Nav */}
        <Sidebar />
        
        {/* Main page router workspace */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/log" element={<LogInteractionPage />} />
            <Route path="/hcps" element={<HCPDirectoryPage />} />
            <Route path="/history" element={<InteractionHistoryPage />} />
          </Routes>
        </main>

        {/* Global Floating Toast Alert */}
        {notification && (
          <div className={`global-toast-alert glass-panel toast-${notification.type}`}>
            {getToastIcon(notification.type)}
            <span className="toast-message">{notification.message}</span>
            <button 
              onClick={() => dispatch(clearNotification())} 
              className="toast-close-btn"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
