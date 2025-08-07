import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Swal = window.Swal;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

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
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post('http://localhost:8000/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login gagal:', err);
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal!',
        text: 'Email atau password salah. Silakan coba lagi.',
        confirmButtonText: 'OK',
      });
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      {/* Blok style lokal untuk menimpa gaya Bootstrap */}
      <style>{`
        /* Aturan ini hanya berlaku untuk halaman login */
        .password-input.is-invalid {
          background-image: none !important;
          padding-right: 1.5rem !important;
        }
      `}</style>
      <div className="card shadow p-4 rounded-3" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-3">
          <img src="/image/rumah sakit.png" alt="Mediva Hospital Logo" style={{ width: '100px' }} />
        </div>
        <h3 className="text-center mb-4 text-dark">Mediva Hospital</h3>
        <form onSubmit={handleLogin} noValidate>
          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label text-dark">Email</label>
            <input
              id="email"
              type="email"
              className={`form-control rounded-pill ${errors.email ? 'is-invalid' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: '' });
              }}
              placeholder="Masukkan email Anda"
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label text-dark">Password</label>
            <div className="position-relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control rounded-pill pe-5 password-input ${errors.password ? 'is-invalid' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: '' });
                }}
                placeholder="Masukkan password Anda"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="input-icon-right"
              >
                <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
              {errors.password && <div className="invalid-feedback password-error-absolute">{errors.password}</div>}
            </div>
          </div>

          {/* Button */}
          <button className="btn btn-primary w-100 rounded-pill mt-3" type="submit">Login</button>
        </form>

        <div className="mt-3 text-center">
          <a href="/forgot-password" className="text-decoration-none">Lupa Password?</a>
        </div>
      </div>
    </div>
  );
}
