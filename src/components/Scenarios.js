import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function Scenarios({ setIsAuthenticated }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:8000/api/scenarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setScenarios(response.data.scenarios || []);
    } catch (err) {
      console.error('Error fetching scenarios:', err);
      setError('Senaryolar yüklenirken bir hata oluştu.');
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan al
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Senaryoları yükle
    fetchScenarios();
  }, [fetchScenarios]);

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
  };

  const closeModal = () => {
    setSelectedScenario(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScenarios();
  };

  return (
    <Layout user={user} setIsAuthenticated={setIsAuthenticated}>
      <div className="scenarios-content">
        <div className="page-header">
          <h1 className="page-title">Oluşturulan Senaryolar</h1>
          <button 
            className="refresh-button" 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
          >
            {refreshing ? 'Yenileniyor...' : 'Yenile'}
          </button>
        </div>
        
        {loading ? (
          <div className="loading-indicator centered">
            <div className="spinner"></div>
            <p>Senaryolar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : scenarios.length === 0 ? (
          <div className="no-scenarios">
            <p>Henüz oluşturulmuş senaryo bulunmuyor.</p>
          </div>
        ) : (
          <div className="scenarios-grid">
            {scenarios.map((scenario) => (
              <div 
                key={scenario._id} 
                className="scenario-card"
                onClick={() => handleScenarioClick(scenario)}
              >
                <div className="scenario-card-header">
                  <span className="scenario-user">{scenario.username || 'Kullanıcı'}</span>
                  <span className="scenario-date">
                    {new Date(scenario.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="scenario-preview">
                  <h4>Öngörüler:</h4>
                  <p>{scenario.ongoruler.length > 100 
                    ? scenario.ongoruler.substring(0, 100) + '...' 
                    : scenario.ongoruler}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedScenario && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="scenario-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Senaryo Detayı</h3>
                <button className="close-button" onClick={closeModal}>×</button>
              </div>
              <div className="modal-content">
                <div className="modal-user-info">
                  <span className="user-name">{selectedScenario.username || 'Kullanıcı'}</span>
                  <span className="scenario-date">
                    {new Date(selectedScenario.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                
                <div className="scenario-section">
                  <h4>Öngörüler:</h4>
                  <p className="scenario-text ongoruler-text">{selectedScenario.ongoruler}</p>
                </div>
                
                <div className="scenario-section">
                  <h4>Oluşturulan Senaryo:</h4>
                  <p className="scenario-text">{selectedScenario.scenario}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Scenarios;