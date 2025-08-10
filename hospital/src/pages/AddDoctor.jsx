import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDoctor } from '../services/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';

// SweetAlert2 (tersedia secara global karena diimpor di index.html)
const Swal = window.Swal;

export default function AddDoctor() {
  // Mengubah nilai default `name` menjadi 'Dr. '
  const [formData, setFormData] = useState({
    name: 'Dr. ',
    specialization: '',
    contact: '+62',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); // State untuk validasi error
  const navigate = useNavigate();

  const validateContact = (value) => {
    // Validasi: harus diawali '+62' dan total 14 digit
    if (value && !/^\+62\d{11}$/.test(value)) {
      return 'Nomor kontak harus diawali +62 dan terdiri dari 14 digit';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    // Validasi untuk nama: harus lebih dari "Dr. "
    if (formData.name.trim() === 'Dr.') {
        newErrors.name = 'Nama dokter wajib diisi';
    } else if (formData.name.trim().length <= 4) { // 'Dr. ' = 4 karakter
        newErrors.name = 'Nama dokter tidak boleh kosong';
    }
    if (!formData.specialization.trim()) newErrors.specialization = 'Spesialisasi wajib diisi';
    
    // Validasi untuk foto: wajib diisi
    if (!photoFile) {
        newErrors.photo = 'Foto wajib diunggah';
    }

    const contactError = validateContact(formData.contact);
    if (contactError) newErrors.contact = contactError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contact') {
      let newValue = value;
      // Tambahkan kembali logic formatting +62 seperti pada AddPatient.jsx
      if (!newValue.startsWith('+62')) {
        let cleanedValue = newValue.replace(/\D/g, '');
        if (cleanedValue.startsWith('62')) {
          newValue = '+' + cleanedValue;
        } else if (cleanedValue.startsWith('08')) {
          newValue = '+62' + cleanedValue.substring(1);
        } else {
          newValue = '+62' + cleanedValue;
        }
      } else {
        const prefix = '+62';
        // Hanya izinkan digit setelah +62
        const digitsOnly = newValue.substring(prefix.length).replace(/\D/g, '');
        newValue = prefix + digitsOnly;
      }
      if (newValue.length > 14) {
        newValue = newValue.slice(0, 14);
      }
      setFormData({ ...formData, contact: newValue });
      setErrors({ ...errors, contact: validateContact(newValue) });
    } else if (name === 'name') {
        // Logika untuk memastikan "Dr. " tidak terhapus
        let newValue = value;
        if (!newValue.startsWith('Dr. ')) {
            newValue = 'Dr. ' + newValue.replace('Dr. ', '');
        }
        setFormData({ ...formData, [name]: newValue });
        setErrors({ ...errors, [name]: '' });
    } else {
      setFormData({ ...formData, [name]: value });
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFileChange = (e) => {
    setPhotoFile(e.target.files[0]);
    // Hapus error foto jika file sudah diunggah
    if (e.target.files[0]) {
        setErrors(prevErrors => ({ ...prevErrors, photo: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('specialization', formData.specialization);
      data.append('contact', formData.contact);
      if (photoFile) {
        data.append('photo', photoFile);
      }

      await createDoctor(data);
      Swal.fire(
        'Berhasil!',
        'Data dokter berhasil ditambahkan!',
        'success'
      );
      navigate('/doctors');
    } catch (error) {
      console.error('Gagal menambahkan data dokter:', error);
      Swal.fire(
        'Gagal!',
        'Gagal menambahkan data dokter: ' + (error.response?.data?.message || error.message),
        'error'
      );
    } finally {
      setIsSubmitting(false);
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
              Tambah Data Dokter
            </h2>
            <div className="card rounded-3 p-4">
              <form onSubmit={handleSubmit} noValidate>
                {/* Nama */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Nama</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-control rounded-pill ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Spesialisasi */}
                <div className="mb-3">
                  <label htmlFor="specialization" className="form-label">Spesialisasi</label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    className={`form-control rounded-pill ${errors.specialization ? 'is-invalid' : ''}`}
                    value={formData.specialization}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.specialization && <div className="invalid-feedback">{errors.specialization}</div>}
                </div>

                {/* Kontak */}
                <div className="mb-3">
                  <label htmlFor="contact" className="form-label">Kontak</label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    className={`form-control rounded-pill ${errors.contact ? 'is-invalid' : ''}`}
                    value={formData.contact}
                    onChange={handleChange}
                    maxLength={14}
                    inputMode="numeric"
                    disabled={isSubmitting}
                  />
                  {errors.contact && <div className="invalid-feedback">{errors.contact}</div>}
                </div>
                
                {/* Unggah Foto */}
                <div className="mb-3">
                  <label htmlFor="photo" className="form-label">Unggah Foto</label>
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    className={`form-control rounded ${errors.photo ? 'is-invalid' : ''}`}
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                  {errors.photo && <div className="invalid-feedback">{errors.photo}</div>}
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button type="submit" className="btn btn-success me-2 rounded-pill px-4 py-2 shadow-sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button type="button" className="btn btn-secondary rounded-pill px-4 py-2 shadow-sm" onClick={() => navigate('/doctors')} disabled={isSubmitting}>
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