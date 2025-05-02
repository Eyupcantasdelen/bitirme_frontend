import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { username, password } = formData;

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await axios.post('http://localhost:8000/api/login', {
        username,
        password
      });
      
      // Token'ı localStorage'a kaydet
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Kimlik doğrulama durumunu güncelle
      setIsAuthenticated(true);
      
      // Kullanıcıyı ana sayfaya yönlendir
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş işlemi sırasında bir hata oluştu');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Giriş Yap</h2>
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
            <label>Şifre</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-button">Giriş Yap</button>
        </form>
        <div className="auth-link">
          Hesabınız yok mu? <Link to="/register">Kayıt Ol</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;