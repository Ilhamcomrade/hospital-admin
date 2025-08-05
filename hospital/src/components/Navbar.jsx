// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Hapus token auth
    navigate('/login'); // Arahkan ke halaman login
  };

  return (
    // Navbar akan mengisi lebar yang tersisa setelah sidebar
    // Tinggi navbar diatur secara eksplisit menjadi 60px
    <nav className="navbar navbar-expand-lg navbar-light bg-white px-4 shadow-sm" style={{ height: '60px' }}> 
      <div className="ms-auto">
        <button 
          onClick={handleLogout} 
          className="btn rounded-pill px-3" 
          style={{ 
            color: '#8A9298', 
            borderColor: '#8A9298',
            backgroundColor: 'transparent' 
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
