import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function AdminPanel({ setIsAuthenticated }) {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  const [newTeam, setNewTeam] = useState({ teamId: '', teamName: '' });
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Takımları getir
  const fetchTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:8000/api/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Takımlar yüklenirken bir hata oluştu.');
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, setIsAuthenticated]);

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
      setError('Kategoriler yüklenirken bir hata oluştu.');
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/login');
      }
    }
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan al
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Admin olmayan kullanıcıları bu sayfaya erişimden engelle
      if (!parsedUser.isAdmin) {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
    
    // Veri yükle
    fetchTeams();
    fetchCategories();
  }, [navigate, fetchTeams, fetchCategories]);

  const handleNewTeamChange = (e) => {
    setNewTeam({ ...newTeam, [e.target.name]: e.target.value });
  };

  const handleNewCategoryChange = (e) => {
    setNewCategory(e.target.value);
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Boş alan kontrolü
    if (!newTeam.teamId.trim() || !newTeam.teamName.trim()) {
      setError('Takım ID ve Takım Adı alanları zorunludur');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/teams', newTeam, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Başarılı ekleme sonrası
      setSuccess('Takım başarıyla eklendi');
      setNewTeam({ teamId: '', teamName: '' });
      fetchTeams();
    } catch (err) {
      console.error('Error adding team:', err);
      setError(err.response?.data?.error || 'Takım eklenirken bir hata oluştu');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Boş alan kontrolü
    if (!newCategory.trim()) {
      setError('Kategori adı zorunludur');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/categories', { name: newCategory }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Başarılı ekleme sonrası
      setSuccess('Kategori başarıyla eklendi');
      setNewCategory('');
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.error || 'Kategori eklenirken bir hata oluştu');
    }
  };

  return (
    <Layout user={user} setIsAuthenticated={setIsAuthenticated}>
      <div className="admin-panel">
        <h1 className="page-title">Admin Paneli</h1>
        
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            Takımlar
          </button>
          <button 
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Kategoriler
          </button>
        </div>
        
        <div className="tab-content">
          {loading ? (
            <div className="loading-indicator centered">
              <div className="spinner"></div>
              <p>Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : success ? (
            <div className="success-message">{success}</div>
          ) : null}
          
          {activeTab === 'teams' && (
            <div className="teams-tab">
              <h2>Takım Ekle</h2>
              <form onSubmit={handleAddTeam} className="admin-form">
                <div className="form-group">
                  <label>Takım ID</label>
                  <input
                    type="text"
                    name="teamId"
                    value={newTeam.teamId}
                    onChange={handleNewTeamChange}
                    placeholder="Benzersiz takım kodu"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Takım Adı</label>
                  <input
                    type="text"
                    name="teamName"
                    value={newTeam.teamName}
                    onChange={handleNewTeamChange}
                    placeholder="Görüntülenecek takım adı"
                    required
                  />
                </div>
                <button type="submit" className="submit-button">Takım Ekle</button>
              </form>
              
              <h2>Mevcut Takımlar</h2>
              {teams.length === 0 ? (
                <p>Henüz takım bulunmuyor.</p>
              ) : (
                <div className="admin-list">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Takım ID</th>
                        <th>Takım Adı</th>
                        <th>Oluşturulma Tarihi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map(team => (
                        <tr key={team._id}>
                          <td>{team.teamId}</td>
                          <td>{team.teamName}</td>
                          <td>{new Date(team.createdAt).toLocaleDateString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'categories' && (
            <div className="categories-tab">
              <h2>Kategori Ekle</h2>
              <form onSubmit={handleAddCategory} className="admin-form">
                <div className="form-group">
                  <label>Kategori Adı</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={handleNewCategoryChange}
                    placeholder="Kategori adı girin"
                    required
                  />
                </div>
                <button type="submit" className="submit-button">Kategori Ekle</button>
              </form>
              
              <h2>Mevcut Kategoriler</h2>
              {categories.length === 0 ? (
                <p>Henüz kategori bulunmuyor.</p>
              ) : (
                <div className="admin-list">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Kategori ID</th>
                        <th>Kategori Adı</th>
                        <th>Oluşturulma Tarihi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(category => (
                        <tr key={category._id}>
                          <td>{category._id}</td>
                          <td>{category.name}</td>
                          <td>{new Date(category.createdAt).toLocaleDateString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AdminPanel;