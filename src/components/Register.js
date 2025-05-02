// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate, Link } from 'react-router-dom';

// function Register({ setIsAuthenticated }) {
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const { username, email, password, confirmPassword } = formData;

//   const handleChange = e => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setError('');
    
//     // Şifre kontrolü
//     if (password !== confirmPassword) {
//       setError('Şifreler eşleşmiyor');
//       return;
//     }
    
//     try {
//       const res = await axios.post('http://localhost:8000/api/register', {
//         username,
//         email,
//         password
//       });
      
//       // Token'ı localStorage'a kaydet
//       localStorage.setItem('token', res.data.token);
//       localStorage.setItem('user', JSON.stringify(res.data.user));
      
//       // Kimlik doğrulama durumunu güncelle
//       setIsAuthenticated(true);
      
//       // Kullanıcıyı ana sayfaya yönlendir
//       navigate('/dashboard');
//     } catch (err) {
//       setError(err.response?.data?.error || 'Kayıt işlemi sırasında bir hata oluştu');
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-form">
//         <h2>Kayıt Ol</h2>
//         {error && <div className="error-message">{error}</div>}
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Kullanıcı Adı</label>
//             <input
//               type="text"
//               name="username"
//               value={username}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>E-posta</label>
//             <input
//               type="email"
//               name="email"
//               value={email}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>Şifre</label>
//             <input
//               type="password"
//               name="password"
//               value={password}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>Şifre Tekrarı</label>
//             <input
//               type="password"
//               name="confirmPassword"
//               value={confirmPassword}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <button type="submit" className="auth-button">Kayıt Ol</button>
//         </form>
//         <div className="auth-link">
//           Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Register;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    teamId: ''
  });
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { username, email, password, confirmPassword, teamId } = formData;

  // Takımları yükle
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/public/teams');
        setTeams(response.data.teams || []);
      } catch (err) {
        console.error('Takımlar yüklenirken hata oluştu:', err);
      }
    };

    fetchTeams();
  }, []);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Şifre kontrolü
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }
    
    // Takım seçimi kontrolü
    if (!teamId) {
      setError('Lütfen bir takım seçin');
      setLoading(false);
      return;
    }
    
    try {
      const res = await axios.post('http://localhost:8000/api/register', {
        username,
        email,
        password,
        teamId
      });
      
      // Token'ı ve kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Kimlik doğrulama durumunu güncelle
      setIsAuthenticated(true);
      
      // Kullanıcıyı ana sayfaya yönlendir
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt işlemi sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Kayıt Ol</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>E-posta</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Şifre Tekrarı</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Takım</label>
            <select
              name="teamId"
              value={teamId}
              onChange={handleChange}
              required
            >
              <option value="">Takım Seçin</option>
              {teams.map(team => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <div className="auth-link">
          Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;