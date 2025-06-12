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
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingCategory, setEditingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  // Düzenleme için state'ler
  const [isEditing, setIsEditing] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [editForm, setEditForm] = useState({
    ongoruler: '',
    scenario: '',
    editReason: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  
  const navigate = useNavigate();

  // Kategorileri getir
  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:8000/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/login');
      }
    }
  }, [navigate, setIsAuthenticated]);

  // Senaryoları getir
  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const endpoint = selectedCategory === 'all' 
        ? 'http://localhost:8000/api/scenarios'
        : `http://localhost:8000/api/scenarios/filter?category=${selectedCategory}`;
      
      const response = await axios.get(endpoint, {
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
  }, [navigate, setIsAuthenticated, selectedCategory]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchCategories();
    fetchScenarios();
  }, [fetchCategories, fetchScenarios]);

  useEffect(() => {
    fetchScenarios();
  }, [selectedCategory, fetchScenarios]);

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
  };

  const closeModal = () => {
    setSelectedScenario(null);
    setEditingCategory(false);
    setIsEditing(false);
    setEditingScenario(null);
    setEditForm({ ongoruler: '', scenario: '', editReason: '' });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScenarios();
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Senaryo düzenleme başlatma
  const startEditing = (scenario) => {
    setEditingScenario(scenario);
    setEditForm({
      ongoruler: scenario.ongoruler,
      scenario: scenario.scenario,
      editReason: ''
    });
    setIsEditing(true);
  };

  // Düzenleme formu değişiklikleri
  const handleEditFormChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  // AI modelinden yeni senaryo oluşturma
  const generateNewScenario = async () => {
    if (!editForm.ongoruler.trim()) {
      alert('Öngörüler alanı boş olamaz');
      return;
    }

    setEditLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/create_scenario', {
        ongoruler: editForm.ongoruler
      });
      
      setEditForm({
        ...editForm,
        scenario: response.data.scenario
      });
    } catch (error) {
      console.error('AI scenario generation error:', error);
      alert('Senaryo oluşturulurken bir hata oluştu');
    } finally {
      setEditLoading(false);
    }
  };

  // Senaryo düzenlemeyi kaydetme
  const saveEdit = async () => {
    if (!editForm.ongoruler.trim() || !editForm.scenario.trim()) {
      alert('Öngörüler ve senaryo alanları boş olamaz');
      return;
    }

    if (!editForm.editReason.trim()) {
      alert('Düzenleme nedeni belirtmelisiniz');
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/scenarios/${editingScenario._id}/edit`, 
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Senaryo başarıyla düzenlendi ve onay için gönderildi!');
      setIsEditing(false);
      setEditingScenario(null);
      setSelectedScenario(null);
      fetchScenarios();
    } catch (err) {
      console.error('Senaryo düzenlenirken hata oluştu:', err);
      alert('Senaryo düzenlenirken bir hata oluştu');
    } finally {
      setEditLoading(false);
    }
  };

  // Senaryo kategorisini güncelle (sadece admin kullanıcılar için)
  const updateScenarioCategory = async (scenarioId, category) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/scenarios/${scenarioId}/category`, 
        { category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedScenario(prev => ({ ...prev, category }));
      setEditingCategory(false);
      fetchScenarios();
    } catch (err) {
      console.error('Kategori güncellenirken hata oluştu:', err);
      alert('Kategori güncellenirken bir hata oluştu');
    }
  };

  // Yeni kategori ekle (sadece admin kullanıcılar için)
  const addNewCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/categories', 
        { name: newCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchCategories();
      setNewCategory('');
    } catch (err) {
      console.error('Kategori eklenirken hata oluştu:', err);
      alert('Kategori eklenirken bir hata oluştu');
    }
  };

  // Onay durumu badge'i
  const getApprovalStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending">Onay Bekliyor</span>;
      case 'rejected':
        return <span className="status-badge rejected">Reddedildi</span>;
      case 'approved':
        return <span className="status-badge approved">Onaylandı</span>;
      default:
        return <span className="status-badge approved">Onaylandı</span>;
    }
  };

  // Kullanıcının senaryoyu düzenleyip düzenleyemeyeceğini kontrol etme
  const canEditScenario = (scenario) => {
    return user && (user.isAdmin || (scenario.userId === user.id && scenario.approvalStatus !== 'pending'));
  };

  return (
    <Layout user={user} setIsAuthenticated={setIsAuthenticated}>
      <div className="scenarios-content">
        <div className="page-header">
          <h1 className="page-title">Oluşturulan Senaryolar</h1>
          <div className="header-actions">
            <div className="filter-container">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="category-filter"
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.map(category => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {user && user.isAdmin && (
              <div className="admin-actions">
                <button 
                  className="add-category-button"
                  onClick={() => {
                    const categoryName = prompt('Yeni kategori adı girin:');
                    if (categoryName) {
                      setNewCategory(categoryName);
                      addNewCategory();
                    }
                  }}
                >
                  Yeni Kategori Ekle
                </button>
              </div>
            )}
            
            <button 
              className="refresh-button" 
              onClick={handleRefresh} 
              disabled={loading || refreshing}
            >
              {refreshing ? 'Yenileniyor...' : 'Yenile'}
            </button>
          </div>
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
            <p>Seçilen kriterlere uygun senaryo bulunamadı.</p>
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
                  <span className="scenario-user">{scenario.username}</span>
                  <div className="scenario-meta-info">
                    <span className="scenario-date">
                      {new Date(scenario.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    {getApprovalStatusBadge(scenario.approvalStatus)}
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
                {scenario.isEdited && (
                  <div className="edit-indicator">
                    <span className="edit-badge">Düzenlenmiş</span>
                  </div>
                )}
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
        
        {selectedScenario && !isEditing && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="scenario-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Senaryo Detayı</h3>
                <button className="close-button" onClick={closeModal}>×</button>
              </div>
              <div className="modal-content">
                <div className="modal-user-info">
                  <span className="user-name">{selectedScenario.username}</span>
                  <div className="scenario-status-info">
                    <span className="scenario-date">
                      {new Date(selectedScenario.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    {getApprovalStatusBadge(selectedScenario.approvalStatus)}
                  </div>
                </div>
                
                <div className="scenario-meta">
                  <div className="scenario-team-info">
                    <span className="info-label">Ekip:</span> {selectedScenario.teamName}
                  </div>
                  
                  <div className="scenario-category-info">
                    {user && user.isAdmin && !editingCategory ? (
                      <div className="editable-category">
                        <span className="info-label">Kategori:</span> {selectedScenario.category}
                        <button 
                          className="edit-category-button"
                          onClick={() => setEditingCategory(true)}
                        >
                          Düzenle
                        </button>
                      </div>
                    ) : user && user.isAdmin && editingCategory ? (
                      <div className="category-editor">
                        <span className="info-label">Kategori:</span>
                        <select
                          value={selectedScenario.category}
                          onChange={(e) => updateScenarioCategory(selectedScenario._id, e.target.value)}
                          className="category-select"
                        >
                          {categories.map(category => (
                            <option key={category._id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <button 
                          className="cancel-button"
                          onClick={() => setEditingCategory(false)}
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <div>
                        <span className="info-label">Kategori:</span> {selectedScenario.category}
                      </div>
                    )}
                  </div>
                </div>

                {/* Onay durumu bilgisi */}
                {selectedScenario.approvalStatus === 'rejected' && selectedScenario.rejectionReason && (
                  <div className="rejection-info">
                    <h4>Red Nedeni:</h4>
                    <p className="rejection-reason">{selectedScenario.rejectionReason}</p>
                  </div>
                )}

                {/* Düzenleme geçmişi */}
                {selectedScenario.editHistory && selectedScenario.editHistory.length > 0 && (
                  <div className="edit-history">
                    <h4>Düzenleme Geçmişi:</h4>
                    {selectedScenario.editHistory.map((edit, index) => (
                      <div key={index} className="edit-history-item">
                        <span className="edit-date">
                          {new Date(edit.editedAt).toLocaleString('tr-TR')}
                        </span>
                        <span className="edit-reason">Neden: {edit.editReason}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="scenario-section">
                  <h4>Öngörüler:</h4>
                  <p className="scenario-text ongoruler-text">{selectedScenario.ongoruler}</p>
                </div>
                
                <div className="scenario-section">
                  <h4>Oluşturulan Senaryo:</h4>
                  <p className="scenario-text">{selectedScenario.scenario}</p>
                </div>

                {/* Düzenleme butonu */}
                {canEditScenario(selectedScenario) && (
                  <div className="modal-actions">
                    <button 
                      className="edit-scenario-button"
                      onClick={() => startEditing(selectedScenario)}
                    >
                      Senaryoyu Düzenle
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Düzenleme Modalı */}
        {isEditing && editingScenario && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="edit-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Senaryo Düzenle</h3>
                <button className="close-button" onClick={closeModal}>×</button>
              </div>
              <div className="modal-content">
                <div className="edit-form">
                  <div className="form-group">
                    <label>Öngörüler:</label>
                    <textarea
                      name="ongoruler"
                      value={editForm.ongoruler}
                      onChange={handleEditFormChange}
                      rows="6"
                      className="edit-textarea"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Senaryo:</label>
                    <div className="scenario-edit-section">
                      <textarea
                        name="scenario"
                        value={editForm.scenario}
                        onChange={handleEditFormChange}
                        rows="8"
                        className="edit-textarea"
                      />
                      <button 
                        className="regenerate-button"
                        onClick={generateNewScenario}
                        disabled={editLoading}
                      >
                        {editLoading ? 'Oluşturuluyor...' : 'AI ile Yeniden Oluştur'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Düzenleme Nedeni:</label>
                    <textarea
                      name="editReason"
                      value={editForm.editReason}
                      onChange={handleEditFormChange}
                      rows="3"
                      className="edit-textarea"
                      placeholder="Bu düzenlemeyi neden yaptığınızı açıklayın..."
                    />
                  </div>
                  
                  <div className="edit-actions">
                    <button 
                      className="save-edit-button"
                      onClick={saveEdit}
                      disabled={editLoading}
                    >
                      {editLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                    <button 
                      className="cancel-edit-button"
                      onClick={closeModal}
                    >
                      İptal
                    </button>
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

export default Scenarios;