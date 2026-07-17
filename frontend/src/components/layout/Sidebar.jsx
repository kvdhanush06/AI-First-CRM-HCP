import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  History, 
  Activity,
  HeartPulse
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar-container">
      <div className="sidebar-brand">
        <HeartPulse className="brand-icon" size={28} />
        <h2>PharmaCRM<span>AI</span></h2>
      </div>
      
      <nav className="sidebar-menu">
        <NavLink 
          to="/" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/log" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <PlusCircle size={20} />
          <span>Log Interaction</span>
        </NavLink>
        
        <NavLink 
          to="/hcps" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>HCP Directory</span>
        </NavLink>
        
        <NavLink 
          to="/history" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <History size={20} />
          <span>Interaction Logs</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="rep-badge">
          <Activity size={16} className="rep-icon" />
          <span>Agent Enabled</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
