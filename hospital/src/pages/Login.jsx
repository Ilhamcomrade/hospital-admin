// src/pages/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// SweetAlert2 (tersedia secara global karena diimpor di index.html)
const Swal = window.Swal;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Fungsi untuk memvalidasi form login
  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid.';
    }
    if (!password.trim()) {
      newErrors.password = 'Password wajib diisi.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Mengembalikan true jika tidak ada error
  };

  // Handler untuk proses login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return; // Hentikan proses jika validasi gagal
    }

    try {
      const res = await axios.post('http://localhost:8000/login', { email, password });
      localStorage.setItem('token', res.data.token);
      // Langsung arahkan ke halaman dashboard tanpa pop-up sukses
      navigate('/dashboard'); 
    } catch (err) {
      console.error('Login gagal:', err);
      // Tampilkan pop-up error menggunakan SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal!',
        text: 'Email atau password salah. Silakan coba lagi.',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    // Kontainer utama: Flexbox untuk memusatkan card login di tengah layar
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4 rounded-3" style={{ width: '100%', maxWidth: '400px' }}>
        {/* Tambahkan logo rumah sakit di sini */}
        <div className="text-center mb-3">
          <img src="/image/rumah sakit.png" alt="Mediva Hospital Logo" style={{ width: '100px' }} />
        </div>
        <h3 className="text-center mb-4 text-dark">Mediva Hospital</h3>
        <form onSubmit={handleLogin} noValidate> {/* noValidate untuk menonaktifkan validasi HTML5 bawaan */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label text-dark">Email</label>
            <input
              id="email"
              type="email"
              className={`form-control rounded-pill ${errors.email ? 'is-invalid' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: '' }); // Hapus error saat input berubah
              }}
              placeholder="Masukkan email Anda"
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label text-dark">Password</label>
            <input
              id="password"
              type="password"
              className={`form-control rounded-pill ${errors.password ? 'is-invalid' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: '' }); // Hapus error saat input berubah
              }}
              placeholder="Masukkan password Anda"
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>
          <button className="btn btn-primary w-100 rounded-pill mt-3" type="submit">Login</button>
        </form>
        <div className="mt-3 text-center">
          <a href="/forgot-password" className="text-decoration-none">Lupa Password?</a>
        </div>
      </div>
    </div>
  );
}