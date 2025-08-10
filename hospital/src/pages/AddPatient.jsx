// src/pages/AddPatient.jsx
import React, { useState } from 'react';
import { createPatient } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// SweetAlert2 (tersedia secara global karena diimpor di index.html)
const Swal = window.Swal;

function AddPatient() {
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    gender: '',
    address: '',
    contact: '+62', // Default value for contact
    visit_date: '',
    complaint: '',
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Dapatkan tanggal hari ini dalam format YYYY-MM-DD
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const maxBirthDate = `${year > 2025 ? '2025' : year}-${month}-${day}`; // Batas tahun lahir hingga 2025
  const minVisitDate = '2025-01-01'; // Tanggal kunjungan dimulai dari 2025

  const validateContact = (value) => {
    // Validasi: harus diawali '+62' dan total 14 digit (termasuk +62 dan 11 digit setelahnya)
    if (!/^\+62\d{11}$/.test(value)) {
      return 'Nomor kontak harus diawali +62 dan terdiri dari 14 digit'; // Pesan error disederhanakan
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!formData.birth_date) newErrors.birth_date = 'Tanggal lahir wajib diisi';
    if (!formData.gender) newErrors.gender = 'Jenis kelamin wajib dipilih';
    if (!formData.address.trim()) newErrors.address = 'Alamat wajib diisi';
    if (!formData.visit_date) newErrors.visit_date = 'Tanggal kunjungan wajib diisi';
    if (!formData.complaint.trim()) newErrors.complaint = 'Keluhan wajib diisi';

    const contactError = validateContact(formData.contact);
    if (contactError) newErrors.contact = contactError;

    // Validasi tambahan untuk tanggal lahir
    if (formData.birth_date && formData.birth_date > maxBirthDate) {
      newErrors.birth_date = 'Tanggal lahir tidak boleh lebih dari tahun 2025.';
    }

    // Validasi tambahan untuk tanggal kunjungan
    if (formData.visit_date && formData.visit_date < minVisitDate) {
      newErrors.visit_date = 'Tanggal kunjungan harus dimulai dari tahun 2025.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contact') {
      let newValue = value;

      // Jika input tidak dimulai dengan '+62', coba format
      if (!newValue.startsWith('+62')) {
        let cleanedValue = newValue.replace(/\D/g, ''); // Hapus non-digit

        if (cleanedValue.startsWith('62')) {
          newValue = '+' + cleanedValue;
        } else if (cleanedValue.startsWith('08')) {
          newValue = '+62' + cleanedValue.substring(1); // Ganti '0' dengan '+62'
        } else {
          newValue = '+62' + cleanedValue; // Jika hanya digit, tambahkan '+62'
        }
      } else {
        // Jika sudah dimulai dengan '+62', hanya izinkan digit setelahnya
        const prefix = '+62';
        const digitsOnly = newValue.substring(prefix.length).replace(/\D/g, '');
        newValue = prefix + digitsOnly;
      }

      // Batasi panjang total menjadi 14 karakter (+62 dan 11 digit)
      if (newValue.length > 14) {
        newValue = newValue.slice(0, 14);
      }

      setFormData({ ...formData, contact: newValue });
      setErrors({ ...errors, contact: validateContact(newValue) });
    } else {
      setFormData({ ...formData, [name]: value });
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createPatient(formData);
      Swal.fire( // Menggunakan Swal.fire
        'Berhasil!',
        'Data pasien berhasil ditambahkan!',
        'success'
      );
      navigate('/patients');
    } catch (error) {
      console.error('Gagal menambahkan data pasien:', error);
      Swal.fire( // Menggunakan Swal.fire
        'Gagal!',
        'Gagal menambahkan data pasien: ' + (error.response?.data?.message || error.message),
        'error'
      );
    }
  };

  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1">
        <Navbar />
        <div className="flex-grow-1 overflow-auto bg-light">
          <div className="p-4 w-100 bg-light">
            <h2 className="mb-4" style={{ color: '#000000', fontWeight: 'normal' }}>
              Tambah Data Pasien
            </h2>
            <div className="card rounded-3 p-4">
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label">Nama</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`form-control rounded-pill ${errors.name ? 'is-invalid' : ''}`}
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="birth_date" className="form-label">Tanggal Lahir</label>
                    <input
                      type="date"
                      id="birth_date"
                      name="birth_date"
                      className={`form-control rounded-pill ${errors.birth_date ? 'is-invalid' : ''}`}
                      value={formData.birth_date}
                      onChange={handleChange}
                      max={maxBirthDate} // Batasan tahun lahir
                    />
                    {errors.birth_date && <div className="invalid-feedback">{errors.birth_date}</div>}
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="gender" className="form-label">Jenis Kelamin</label>
                    <select
                      id="gender"
                      name="gender"
                      className={`form-select rounded-pill ${errors.gender ? 'is-invalid' : ''}`}
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Pilih</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                    {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="contact" className="form-label">Kontak</label>
                    <input
                      type="text"
                      id="contact"
                      name="contact"
                      className={`form-control rounded-pill ${errors.contact ? 'is-invalid' : ''}`}
                      value={formData.contact}
                      onChange={handleChange}
                      maxLength={14} // Batasi panjang total termasuk '+62'
                      inputMode="numeric"
                    />
                    {errors.contact && <div className="invalid-feedback">{errors.contact}</div>}
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="address" className="form-label">Alamat</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      className={`form-control rounded-pill ${errors.address ? 'is-invalid' : ''}`}
                      value={formData.address}
                      onChange={handleChange}
                    />
                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="visit_date" className="form-label">Tanggal Kunjungan</label>
                    <input
                      type="date"
                      id="visit_date"
                      name="visit_date"
                      className={`form-control rounded-pill ${errors.visit_date ? 'is-invalid' : ''}`}
                      value={formData.visit_date}
                      onChange={handleChange}
                      min={minVisitDate} // Batasan tahun kunjungan
                    />
                    {errors.visit_date && <div className="invalid-feedback">{errors.visit_date}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="complaint" className="form-label">Keluhan</label>
                  <textarea
                    id="complaint"
                    name="complaint"
                    className={`form-control rounded ${errors.complaint ? 'is-invalid' : ''}`}
                    rows="4"
                    value={formData.complaint}
                    onChange={handleChange}
                  />
                  {errors.complaint && <div className="invalid-feedback">{errors.complaint}</div>}
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-success me-2 rounded-pill px-4 py-2 shadow-sm">
                    Simpan
                  </button>
                  <button type="button" className="btn btn-secondary rounded-pill px-4 py-2 shadow-sm" onClick={() => navigate('/patients')}>
                    Kembali
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPatient;
