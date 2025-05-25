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
      
      // Kategori filtresine göre senaryoları getir
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
    // Kullanıcı bilgilerini localStorage'dan al
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Kategorileri yükle
    fetchCategories();
    
    // Senaryoları yükle
    fetchScenarios();
  }, [fetchCategories, fetchScenarios]);

  // Kategori değiştiğinde senaryoları yeniden yükle
  useEffect(() => {
    fetchScenarios();
  }, [selectedCategory, fetchScenarios]);

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
  };

  const closeModal = () => {
    setSelectedScenario(null);
    setEditingCategory(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScenarios();
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Senaryo kategorisini güncelle (sadece admin kullanıcılar için)
  const updateScenarioCategory = async (scenarioId, category) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/scenarios/${scenarioId}/category`, 
        { category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Senaryoyu güncelle ve modalı kapat
      setSelectedScenario(prev => ({ ...prev, category }));
      setEditingCategory(false);
      
      // Senaryoları yenile
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
      
      // Kategorileri yenile
      fetchCategories();
      setNewCategory('');
    } catch (err) {
      console.error('Kategori eklenirken hata oluştu:', err);
      alert('Kategori eklenirken bir hata oluştu');
    }
  };

  return (
    <Layout user={user} setIsAuthenticated={setIsAuthenticated}>
      <div className="scenarios-content">
        <div className="page-header">
          <h1 className="page-title">Oluşturulan Senaryolar</h1>
          <div className="header-actions">
            {/* Kategori filtresi */}
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
            
            {/* Admin için yeni kategori ekleme */}
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
            
            {/* Yenile butonu */}
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
                  <span className="scenario-date">
                    {new Date(scenario.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="scenario-info">
                  <div className="scenario-team">
                    <span className="info-label">Ekip:</span> {scenario.teamName}
                  </div>
                  <div className="scenario-category">
                    <span className="info-label">Kategori:</span> {scenario.category}
                  </div>
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
                  <span className="user-name">{selectedScenario.username}</span>
                  <span className="scenario-date">
                    {new Date(selectedScenario.createdAt).toLocaleDateString('tr-TR')}
                  </span>
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