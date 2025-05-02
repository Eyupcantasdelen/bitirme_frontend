// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import Layout from './Layout';

// function Dashboard({ setIsAuthenticated }) {
//   const [ongoruler, setOngoruler] = useState('');
//   const [senaryo, setSenaryo] = useState('');
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Kullanıcı bilgilerini localStorage'dan al
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) {
//       setUser(JSON.parse(storedUser));
//     }
//   }, []);

//   const handleSubmit = async () => {
//     // Yükleme durumunu başlat
//     setLoading(true);
    
//     try {
//       const response = await axios.post('http://localhost:5000/create_scenario', {
//         ongoruler: ongoruler
//       });
//       setSenaryo(response.data.scenario);
      
//       // Başarılı sonuç alındığında senaryoyu kaydet
//       const token = localStorage.getItem('token');
//       if (token) {
//         await axios.post('http://localhost:8000/api/save_scenario', {
//           ongoruler: ongoruler,
//           scenario: response.data.scenario
//         }, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//       }
//     } catch (error) {
//       console.error('There was an error!', error);
//       if (error.response && error.response.status === 401) {
//         // Token geçersizse veya süresi dolmuşsa çıkış yap
//         handleLogout();
//       }
//     } finally {
//       // İşlem bittiğinde yükleme durumunu kapat
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setIsAuthenticated(false);
//     navigate('/login');
//   };

//   return (
//     <Layout user={user} setIsAuthenticated={setIsAuthenticated}>
//       <div className="dashboard-content">
//         <h1 className="page-title">Gelecek Senaryosu Oluşturma</h1>
        
//         <div className="scenario-form">
//           <textarea
//             placeholder="Öngörüleri buraya girin."
//             value={ongoruler}
//             onChange={(e) => setOngoruler(e.target.value)}
//             rows="10"
//             className="scenario-textarea"
//           />
          
//           <button 
//             onClick={handleSubmit} 
//             className="submit-button"
//             disabled={loading} 
//           >
//             {loading ? 'İşleniyor...' : 'Senaryo Oluştur'}
//           </button>
          
//           <div className="scenario-result">
//             <h3>Oluşturulan Senaryo:</h3>
//             {loading ? (
//               <div className="loading-indicator">
//                 <div className="spinner"></div>
//                 <p>Senaryo oluşturuluyor...</p>
//               </div>
//             ) : (
//               <p>{senaryo}</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }

// export default Dashboard;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function Dashboard({ setIsAuthenticated }) {
  const [ongoruler, setOngoruler] = useState('');
  const [senaryo, setSenaryo] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan al
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSubmit = async () => {
    // Yükleme durumunu başlat
    setLoading(true);
    setSaveSuccess(false);
    
    try {
      // AI modelinden senaryo oluştur
      const response = await axios.post('http://localhost:5000/create_scenario', {
        ongoruler: ongoruler
      });
      
      setSenaryo(response.data.scenario);
      
      // Başarılı sonuç alındığında senaryoyu kaydet
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('http://localhost:8000/api/save_scenario', {
          ongoruler: ongoruler,
          scenario: response.data.scenario
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Başarılı kaydetme bildirimi
        setSaveSuccess(true);
      }
    } catch (error) {
      console.error('There was an error!', error);
      if (error.response && error.response.status === 401) {
        // Token geçersizse veya süresi dolmuşsa çıkış yap
        handleLogout();
      }
    } finally {
      // İşlem bittiğinde yükleme durumunu kapat
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <Layout user={user} setIsAuthenticated={setIsAuthenticated}>
      <div className="dashboard-content">
        <h1 className="page-title">Gelecek Senaryosu Oluşturma</h1>
        
        {user && (
          <div className="user-team-info">
            <p>Ekip: <strong>{user.teamName || user.teamId}</strong></p>
            {user.isAdmin && <p className="admin-badge">Admin Yetkisi</p>}
          </div>
        )}
        
        <div className="scenario-form">
          <textarea
            placeholder="Öngörüleri buraya girin."
            value={ongoruler}
            onChange={(e) => setOngoruler(e.target.value)}
            rows="10"
            className="scenario-textarea"
          />
          
          <button 
            onClick={handleSubmit} 
            className="submit-button"
            disabled={loading || !ongoruler.trim()} 
          >
            {loading ? 'İşleniyor...' : 'Senaryo Oluştur'}
          </button>
          
          {saveSuccess && (
            <div className="success-message">
              Senaryo başarıyla kaydedildi! <a href="/scenarios">Tüm Senaryoları Görüntüle</a>
            </div>
          )}
          
          <div className="scenario-result">
            <h3>Oluşturulan Senaryo:</h3>
            {loading ? (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Senaryo oluşturuluyor...</p>
              </div>
            ) : (
              <p>{senaryo}</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;