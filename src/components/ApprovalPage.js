import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function ApprovalPage({ setIsAuthenticated }) {
  const [user, setUser] = useState(null);
  const [pendingScenarios, setPendingScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  // Onay bekleyen senaryoları getir
  const fetchPendingScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8000/api/scenarios/pending-approval', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPendingScenarios(response.data.scenarios || []);
    } catch (err) {
      console.error('Error fetching pending scenarios:', err);
      setError('Onay bekleyen senaryolar yüklenirken bir hata oluştu.');

      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/login');
      } else if (err.response && err.response.status === 403) {
        setError('Bu sayfaya erişim yetkiniz yok.');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan al
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Takım lideri olmayan kullanıcıları bu sayfaya erişimden engelle
      if (!parsedUser.isTeamLeader && !parsedUser.isAdmin) {
        navigate('/dashboard');
        return;
      }
    } else {
      navigate('/login');
      return;
    }

    // Onay bekleyen senaryoları yükle
    fetchPendingScenarios();
  }, [navigate, fetchPendingScenarios]);

  // Senaryo detayını göster
  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
    setRejectionReason('');
  };

  // Modal'ı kapat
  const closeModal = () => {
    setSelectedScenario(null);
    setRejectionReason('');
  };

  // Senaryoyu onayla
  const approveScenario = async (scenarioId) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/scenarios/${scenarioId}/approve`, 
        { action: 'approve' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Senaryo başarıyla onaylandı!');
      closeModal();
      fetchPendingScenarios(); // Listeyi yenile
    } catch (err) {
      console.error('Error approving scenario:', err);
      setError(err.response?.data?.error || 'Senaryo onaylanırken bir hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  // Senaryoyu reddet
  const rejectScenario = async (scenarioId) => {
    if (!rejectionReason.trim()) {
      setError('Red nedeni belirtmelisiniz');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/scenarios/${scenarioId}/approve`, 
        { 
          action: 'reject',
          rejectionReason: rejectionReason 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Senaryo reddedildi.');
      closeModal();
      fetchPendingScenarios(); // Listeyi yenile
    } catch (err) {
      console.error('Error rejecting scenario:', err);
      setError(err.response?.data?.error || 'Senaryo reddedilirken bir hata oluştu');
    } finally {
      setActionLoading(false);
    }
  };

  // Yenile butonu
  const handleRefresh = () => {
    fetchPendingScenarios();
  };

  return (
    <Layout user={user} setIsAuthenticated={setIsAuthenticated}>
      <div className="approval-page">
        <div className="page-header">
          <h1 className="page-title">Onay Bekleyen Senaryolar</h1>
          <button 
            className="refresh-button" 
            onClick={handleRefresh} 
            disabled={loading}
          >
            {loading ? 'Yenileniyor...' : 'Yenile'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <div className="loading-indicator centered">
            <div className="spinner"></div>
            <p>Onay bekleyen senaryolar yükleniyor...</p>
          </div>
        ) : pendingScenarios.length === 0 ? (
          <div className="no-scenarios">
            <div className="empty-state">
              <h3>🎉 Tebrikler!</h3>
              <p>Onay bekleyen senaryo bulunmuyor.</p>
              <p>Tüm senaryolar güncel durumda.</p>
            </div>
          </div>
        ) : (
          <div className="scenarios-grid">
            {pendingScenarios.map((scenario) => (
              <div 
                key={scenario._id} 
                className="scenario-card pending"
                onClick={() => handleScenarioClick(scenario)}
              >
                <div className="scenario-card-header">
                  <span className="scenario-user">{scenario.username}</span>
                  <div className="scenario-meta-info">
                    <span className="scenario-date">
                      {scenario.lastEditedAt 
                        ? `Düzenlendi: ${new Date(scenario.lastEditedAt).toLocaleDateString('tr-TR')}`
                        : new Date(scenario.createdAt).toLocaleDateString('tr-TR')
                      }
                    </span>
                    <span className="status-badge pending">Onay Bekliyor</span>
                  </div>
                </div>
                
                <div className="scenario-info">
                  <div className="scenario-team">
                    <span className="info-label">Ekip:</span> {scenario.teamName}
                  </div>
                  <div className="scenario-category">
                    <span className="info-label">Kategori:</span> {scenario.category}
                  </div>
                </div>

                <div className="edit-info">
                  <span className="edit-badge">Düzenlenmiş</span>
                  {scenario.editHistory && scenario.editHistory.length > 0 && (
                    <span className="edit-count">
                      {scenario.editHistory.length} düzenleme
                    </span>
                  )}
                </div>

                <div className="scenario-preview">
                  <h4>Öngörüler:</h4>
                  <p>{scenario.ongoruler.length > 100 
                    ? scenario.ongoruler.substring(0, 100) + '...' 
                    : scenario.ongoruler}
                  </p>
                </div>

                <div className="quick-actions" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="quick-approve-button"
                    onClick={() => approveScenario(scenario._id)}
                    disabled={actionLoading}
                  >
                    ✓ Hızlı Onayla
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Senaryo Detay Modal */}
        {selectedScenario && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="approval-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Senaryo Onay - Detay İnceleme</h3>
                <button className="close-button" onClick={closeModal}>×</button>
              </div>

              <div className="modal-content">
                <div className="modal-user-info">
                  <span className="user-name">{selectedScenario.username}</span>
                  <div className="scenario-dates">
                    <span className="creation-date">
                      Oluşturulma: {new Date(selectedScenario.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    {selectedScenario.lastEditedAt && (
                      <span className="edit-date">
                        Son Düzenleme: {new Date(selectedScenario.lastEditedAt).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="scenario-meta">
                  <div className="scenario-team-info">
                    <span className="info-label">Ekip:</span> {selectedScenario.teamName}
                  </div>
                  <div className="scenario-category-info">
                    <span className="info-label">Kategori:</span> {selectedScenario.category}
                  </div>
                </div>

                {/* Düzenleme Geçmişi */}
                {selectedScenario.editHistory && selectedScenario.editHistory.length > 0 && (
                  <div className="edit-history-section">
                    <h4>Düzenleme Geçmişi:</h4>
                    <div className="edit-history-list">
                      {selectedScenario.editHistory.map((edit, index) => (
                        <div key={index} className="edit-history-item">
                          <div className="edit-header">
                            <span className="edit-date">
                              {new Date(edit.editedAt).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <div className="edit-reason">
                            <strong>Düzenleme Nedeni:</strong> {edit.editReason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="scenario-content">
                  <div className="scenario-section">
                    <h4>Öngörüler:</h4>
                    <div className="scenario-text ongoruler-text">
                      {selectedScenario.ongoruler}
                    </div>
                  </div>

                  <div className="scenario-section">
                    <h4>Oluşturulan Senaryo:</h4>
                    <div className="scenario-text">
                      {selectedScenario.scenario}
                    </div>
                  </div>
                </div>

                {/* Onay/Red İşlemleri */}
                <div className="approval-actions">
                  <div className="approval-buttons">
                    <button 
                      className="approve-button"
                      onClick={() => approveScenario(selectedScenario._id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'İşleniyor...' : '✓ Onayla'}
                    </button>

                    <div className="reject-section">
                      <textarea
                        placeholder="Red nedeni belirtin..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="rejection-reason-input"
                        rows="3"
                      />
                      <button 
                        className="reject-button"
                        onClick={() => rejectScenario(selectedScenario._id)}
                        disabled={actionLoading || !rejectionReason.trim()}
                      >
                        {actionLoading ? 'İşleniyor...' : '✗ Reddet'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ApprovalPage;