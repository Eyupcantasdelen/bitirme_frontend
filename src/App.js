// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import axios from 'axios';
// import Login from './components/Login';
// import Register from './components/Register';
// import Dashboard from './components/Dashboard';
// import Scenarios from './components/Scenarios';
// import './App.css';

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Sayfa yüklendiğinde token kontrolü
//     const checkAuth = async () => {
//       const token = localStorage.getItem('token');
      
//       if (!token) {
//         setIsAuthenticated(false);
//         setLoading(false);
//         return;
//       }
      
//       try {
//         // Token geçerliliğini kontrol et
//         const res = await axios.get('http://localhost:8000/api/user', {
//           headers: { Authorization: `Bearer ${token}` }
//         });
        
//         if (res.data.user) {
//           setIsAuthenticated(true);
//         } else {
//           setIsAuthenticated(false);
//           localStorage.removeItem('token');
//           localStorage.removeItem('user');
//         }
//       } catch (err) {
//         console.error('Auth check failed:', err);
//         setIsAuthenticated(false);
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//       }
      
//       setLoading(false);
//     };
    
//     checkAuth();
//   }, []);

//   // Korumalı route için wrapper component
//   const ProtectedRoute = ({ children }) => {
//     if (loading) return <div className="loading">Yükleniyor...</div>;
    
//     if (!isAuthenticated) {
//       return <Navigate to="/login" />;
//     }
    
//     return children;
//   };

//   return (
//     <Router>
//       <div className="App">
//         <Routes>
//           <Route 
//             path="/login" 
//             element={
//               isAuthenticated ? 
//                 <Navigate to="/dashboard" /> : 
//                 <Login setIsAuthenticated={setIsAuthenticated} />
//             } 
//           />
//           <Route 
//             path="/register" 
//             element={
//               isAuthenticated ? 
//                 <Navigate to="/dashboard" /> : 
//                 <Register setIsAuthenticated={setIsAuthenticated} />
//             } 
//           />
//           <Route 
//             path="/dashboard" 
//             element={
//               <ProtectedRoute>
//                 <Dashboard setIsAuthenticated={setIsAuthenticated} />
//               </ProtectedRoute>
//             } 
//           />
//           <Route 
//             path="/scenarios" 
//             element={
//               <ProtectedRoute>
//                 <Scenarios setIsAuthenticated={setIsAuthenticated} />
//               </ProtectedRoute>
//             } 
//           />
//           <Route 
//             path="/" 
//             element={
//               isAuthenticated ? 
//                 <Navigate to="/dashboard" /> : 
//                 <Navigate to="/login" />
//             } 
//           />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Scenarios from './components/Scenarios';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde token kontrolü
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      try {
        // Token geçerliliğini kontrol et
        const res = await axios.get('http://localhost:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.user) {
          setIsAuthenticated(true);
          setUser(res.data.user);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Korumalı route için wrapper component
  const ProtectedRoute = ({ children, adminRequired = false }) => {
    if (loading) return <div className="loading">Yükleniyor...</div>;
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    // Admin yetkisi gerekli ise ve kullanıcı admin değilse
    if (adminRequired && user && !user.isAdmin) {
      return <Navigate to="/dashboard" />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Login setIsAuthenticated={setIsAuthenticated} />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Register setIsAuthenticated={setIsAuthenticated} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard setIsAuthenticated={setIsAuthenticated} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scenarios" 
            element={
              <ProtectedRoute>
                <Scenarios setIsAuthenticated={setIsAuthenticated} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminRequired={true}>
                <AdminPanel setIsAuthenticated={setIsAuthenticated} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;