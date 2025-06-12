import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Layout({ children, user, setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Senaryo App</h3>
          <div className="user-welcome">
            <div>Hoş geldin, {user?.username}</div>
            {user?.teamName && <div className="user-team">Ekip: {user.teamName}</div>}
            <div className="user-roles">
              {user?.isAdmin && <div className="admin-badge">Admin</div>}
              {user?.isTeamLeader && <div className="team-leader-badge">Takım Lideri</div>}
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <i className="nav-icon">📝</i>
            Senaryo Oluştur
          </NavLink>
          
          <NavLink 
            to="/scenarios" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <i className="nav-icon">📚</i>
            Senaryolar
          </NavLink>
          
          {/* Takım Lideri için Onay Sayfası */}
          {user?.isTeamLeader && (
            <NavLink 
              to="/approval" 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <i className="nav-icon">✅</i>
              Onay Bekleyenler
            </NavLink>
          )}
          
          {user?.isAdmin && (
            <NavLink 
              to="/admin" 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <i className="nav-icon">⚙️</i>
              Admin Paneli
            </NavLink>
          )}
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <i className="logout-icon">🚪</i>
            Çıkış Yap
          </button>
        </div>
      </div>
      
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default Layout;