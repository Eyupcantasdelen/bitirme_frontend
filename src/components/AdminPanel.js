import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function AdminPanel({ setIsAuthenticated }) {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [teamsWithLeaders, setTeamsWithLeaders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  const [newTeam, setNewTeam] = useState({ teamId: '', teamName: '' });
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // Takım lideri yönetimi için state'ler
  const [selectedTeamForLeader, setSelectedTeamForLeader] = useState('');
  const [selectedLeaderUser, setSelectedLeaderUser] = useState('');
  const [teamUsersForLeader, setTeamUsersForLeader] = useState([]);

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

  // Takım lideri bilgileri ile takımları getir
  const fetchTeamsWithLeaders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8000/api/admin/teams-with-leaders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTeamsWithLeaders(response.data.teams || []);
    } catch (err) {
      console.error('Error fetching teams with leaders:', err);
      setError('Takım lideri bilgileri yüklenirken bir hata oluştu.');

      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/login');
      }
    }
  }, [navigate, setIsAuthenticated]);

  // Kullanıcıları getirme fonksiyonu
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Kullanıcılar yüklenirken bir hata oluştu.');

      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/login');
      }
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

  // Kullanıcının takımını güncelleme fonksiyonu
  const updateUserTeam = async () => {
    if (!selectedUser || !selectedTeamId) {
      setError('Kullanıcı ve takım seçilmelidir');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/admin/users/${selectedUser._id}/team`,
        { teamId: selectedTeamId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`${selectedUser.username} kullanıcısının takımı başarıyla güncellendi`);
      fetchUsers();
      fetchTeamsWithLeaders();
      setSelectedUser(null);
      setSelectedTeamId('');
    } catch (err) {
      console.error('Error updating user team:', err);
      setError(err.response?.data?.error || 'Kullanıcı takımı güncellenirken bir hata oluştu');
    }
  };

  // Takım seçildiğinde o takımın kullanıcılarını getir
  const handleTeamSelectionForLeader = (teamId) => {
    setSelectedTeamForLeader(teamId);
    setSelectedLeaderUser('');
    
    if (teamId) {
      const teamUsers = users.filter(user => user.teamId === teamId && !user.isAdmin);
      setTeamUsersForLeader(teamUsers);
    } else {
      setTeamUsersForLeader([]);
    }
  };

  // Takım lideri atama
  const assignTeamLeader = async () => {
    if (!selectedTeamForLeader || !selectedLeaderUser) {
      setError('Takım ve kullanıcı seçilmelidir');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/admin/teams/${selectedTeamForLeader}/assign-leader`,
        { userId: selectedLeaderUser },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Takım lideri başarıyla atandı');
      fetchUsers();
      fetchTeamsWithLeaders();
      setSelectedTeamForLeader('');
      setSelectedLeaderUser('');
      setTeamUsersForLeader([]);
    } catch (err) {
      console.error('Error assigning team leader:', err);
      setError(err.response?.data?.error || 'Takım lideri atanırken bir hata oluştu');
    }
  };

  // Takım lideri kaldırma
  const removeTeamLeader = async (teamId) => {
    if (!window.confirm('Bu takımın liderini kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/admin/teams/${teamId}/remove-leader`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Takım lideri başarıyla kaldırıldı');
      fetchUsers();
      fetchTeamsWithLeaders();
    } catch (err) {
      console.error('Error removing team leader:', err);
      setError(err.response?.data?.error || 'Takım lideri kaldırılırken bir hata oluştu');
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (!parsedUser.isAdmin) {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }

    fetchTeams();
    fetchCategories();
    fetchUsers();
    fetchTeamsWithLeaders();
  }, [navigate, fetchTeams, fetchCategories, fetchUsers, fetchTeamsWithLeaders]);

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

    if (!newTeam.teamId.trim() || !newTeam.teamName.trim()) {
      setError('Takım ID ve Takım Adı alanları zorunludur');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/teams', newTeam, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Takım başarıyla eklendi');
      setNewTeam({ teamId: '', teamName: '' });
      fetchTeams();
      fetchTeamsWithLeaders();
    } catch (err) {
      console.error('Error adding team:', err);
      setError(err.response?.data?.error || 'Takım eklenirken bir hata oluştu');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newCategory.trim()) {
      setError('Kategori adı zorunludur');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/categories', { name: newCategory }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Kategori başarıyla eklendi');
      setNewCategory('');
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.error || 'Kategori eklenirken bir hata oluştu');
    }
  };

  // Mesajları otomatik temizle
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

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
            className={`tab-button ${activeTab === 'team-leaders' ? 'active' : ''}`}
            onClick={() => setActiveTab('team-leaders')}
          >
            Takım Liderleri
          </button>
          <button
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Kategoriler
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Kullanıcılar
          </button>
        </div>

        <div className="tab-content">
          {loading ? (
            <div className="loading-indicator centered">
              <div className="spinner"></div>
              <p>Yükleniyor...</p>
            </div>
          ) : null}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

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
                    placeholder="Benzersiz takım kodu (örn: sales, marketing)"
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
                <button type="submit" className="submit-button" disabled={loading}>
                  Takım Ekle
                </button>
              </form>

              <h2>Mevcut Takımlar ({teams.length})</h2>
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
                        <th>Üye Sayısı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map(team => {
                        const memberCount = users.filter(user => user.teamId === team.teamId).length;
                        return (
                          <tr key={team._id}>
                            <td>{team.teamId}</td>
                            <td>{team.teamName}</td>
                            <td>{new Date(team.createdAt).toLocaleDateString('tr-TR')}</td>
                            <td>{memberCount} kişi</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'team-leaders' && (
            <div className="team-leaders-tab">
              <h2>Takım Lideri Ata</h2>
              <div className="team-leader-form">
                <div className="form-group">
                  <label>Takım Seçin</label>
                  <select
                    value={selectedTeamForLeader}
                    onChange={(e) => handleTeamSelectionForLeader(e.target.value)}
                    required
                  >
                    <option value="">Takım Seçin</option>
                    {teams.filter(team => team.teamId !== 'admin').map(team => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.teamName} ({team.teamId})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTeamForLeader && teamUsersForLeader.length > 0 && (
                  <div className="form-group">
                    <label>Takım Lideri Seçin</label>
                    <select
                      value={selectedLeaderUser}
                      onChange={(e) => setSelectedLeaderUser(e.target.value)}
                      required
                    >
                      <option value="">Kullanıcı Seçin</option>
                      {teamUsersForLeader.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.username} ({user.email})
                          {user.isTeamLeader ? ' - Mevcut Lider' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedTeamForLeader && teamUsersForLeader.length === 0 && (
                  <div className="no-users-message">
                    Bu takımda henüz kullanıcı bulunmuyor. Önce kullanıcıları bu takıma atayın.
                  </div>
                )}

                <button
                  type="button"
                  className="submit-button"
                  onClick={assignTeamLeader}
                  disabled={!selectedTeamForLeader || !selectedLeaderUser || loading}
                >
                  Takım Lideri Ata
                </button>
              </div>

              <h2>Mevcut Takım Liderleri</h2>
              {teamsWithLeaders.length === 0 ? (
                <div className="loading-indicator">
                  <p>Takım bilgileri yükleniyor...</p>
                </div>
              ) : (
                <div className="admin-list">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Takım</th>
                        <th>Takım Lideri</th>
                        <th>E-posta</th>
                        <th>Atanma Tarihi</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamsWithLeaders.filter(team => team.teamId !== 'admin').map(team => (
                        <tr key={team._id}>
                          <td>
                            <strong>{team.teamName}</strong>
                            <br />
                            <small style={{color: '#666'}}>({team.teamId})</small>
                          </td>
                          <td>
                            {team.teamLeaderId ? (
                              <span style={{color: '#28a745', fontWeight: 'bold'}}>
                                {team.teamLeaderId.username}
                              </span>
                            ) : (
                              <span style={{color: '#dc3545'}}>Lider Atanmamış</span>
                            )}
                          </td>
                          <td>
                            {team.teamLeaderId ? team.teamLeaderId.email : '-'}
                          </td>
                          <td>
                            {team.teamLeaderId ? 
                              new Date(team.updatedAt || team.createdAt).toLocaleDateString('tr-TR') 
                              : '-'
                            }
                          </td>
                          <td>
                            {team.teamLeaderId && (
                              <button
                                className="remove-leader-button"
                                onClick={() => removeTeamLeader(team.teamId)}
                                disabled={loading}
                              >
                                Lideri Kaldır
                              </button>
                            )}
                          </td>
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
                    placeholder="Kategori adı girin (örn: Teknoloji, Pazarlama)"
                    required
                  />
                </div>
                <button type="submit" className="submit-button" disabled={loading}>
                  Kategori Ekle
                </button>
              </form>

              <h2>Mevcut Kategoriler ({categories.length})</h2>
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
                          <td style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>
                            {category._id}
                          </td>
                          <td>
                            <strong>{category.name}</strong>
                          </td>
                          <td>{new Date(category.createdAt).toLocaleDateString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-tab">
              <h2>Kullanıcı Takım Ataması</h2>
              <div className="user-team-form">
                <div className="form-group">
                  <label>Kullanıcı</label>
                  <select
                    value={selectedUser ? selectedUser._id : ''}
                    onChange={(e) => {
                      const user = users.find(u => u._id === e.target.value);
                      setSelectedUser(user || null);
                    }}
                    required
                  >
                    <option value="">Kullanıcı Seçin</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.username} ({user.email}) - {user.teamName || user.teamId}
                        {user.isAdmin && ' [Admin]'}
                        {user.isTeamLeader && ' [Takım Lideri]'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Yeni Takım</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                  >
                    <option value="">Takım Seçin</option>
                    {teams.map(team => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.teamName} ({team.teamId})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="submit-button"
                  onClick={updateUserTeam}
                  disabled={!selectedUser || !selectedTeamId || loading}
                >
                  Takım Güncelle
                </button>
                {selectedUser && (
                  <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
                    <small>
                      <strong>Not:</strong> Kullanıcı takım değiştirildiğinde mevcut takım lideri yetkisi kaldırılacaktır.
                    </small>
                  </div>
                )}
              </div>

              <h2>Kullanıcı Listesi ({users.length})</h2>
              {users.length === 0 ? (
                <p>Henüz kullanıcı bulunmuyor.</p>
              ) : (
                <div className="admin-list">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Kullanıcı Adı</th>
                        <th>E-posta</th>
                        <th>Takım</th>
                        <th>Roller</th>
                        <th>Kayıt Tarihi</th>
                        <th>Son Aktivite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id}>
                          <td>
                            <strong>{user.username}</strong>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span style={{fontWeight: 'bold'}}>
                              {user.teamName || user.teamId}
                            </span>
                            <br />
                            <small style={{color: '#666'}}>({user.teamId})</small>
                          </td>
                          <td>
                            <div className="user-roles">
                              {user.isAdmin && <span className="role-badge admin">Admin</span>}
                              {user.isTeamLeader && <span className="role-badge team-leader">Takım Lideri</span>}
                              {!user.isAdmin && !user.isTeamLeader && <span className="role-badge user">Kullanıcı</span>}
                            </div>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</td>
                          <td>
                            <small style={{color: '#666'}}>
                              {user.lastLoginAt ? 
                                new Date(user.lastLoginAt).toLocaleDateString('tr-TR') : 
                                'Henüz giriş yapmamış'
                              }
                            </small>
                          </td>
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