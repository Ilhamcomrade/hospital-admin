// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// SweetAlert2 (tersedia secara global karena diimpor di index.html)
const Swal = window.Swal;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({}); // State untuk menyimpan pesan error
  const navigate = useNavigate();

  // Fungsi untuk memvalidasi form lupa password
  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Mengembalikan true jika tidak ada error
  };

  // Handler untuk pengiriman email reset password
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return; // Hentikan proses jika validasi gagal
    }

    try {
      await axios.post('http://localhost:8000/forgot-password', { email });
      // Tampilkan pop-up sukses menggunakan SweetAlert2
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Cek email Anda untuk instruksi reset password.',
        showConfirmButton: false,
        timer: 2500 // Pop-up akan hilang setelah 2.5 detik
      }).then(() => {
        navigate('/login'); // Arahkan pengguna kembali ke halaman login setelah berhasil
      });
    } catch (err) {
      console.error('Gagal mengirim reset password:', err);
      // Tampilkan pop-up error menggunakan SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengirim email reset password. Pastikan email sudah benar dan terdaftar.',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    // Kontainer utama: Flexbox untuk memusatkan card di tengah layar
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4 rounded-3" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4 text-dark">Lupa Password</h3>
        <form onSubmit={handleSubmit} noValidate> {/* noValidate untuk menonaktifkan validasi HTML5 bawaan */}
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
              placeholder="Masukkan email Anda" // Placeholder ditambahkan
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>
          <button className="btn btn-warning w-100 rounded-pill mt-3" type="submit">Kirim</button>
        </form>
        <div className="mt-3 text-center">
          <a href="/login" className="text-decoration-none">Kembali ke Login</a>
        </div>
      </div>
    </div>
  );
}
