import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { resetPassword } from '../services/api';

const Swal = window.Swal;

// Skema validasi
const schema = yup.object().shape({
  newPassword: yup.string()
    .min(6, 'Password harus minimal 6 karakter')
    .max(40, 'Password tidak boleh lebih dari 40 karakter')
    .required('Password baru wajib diisi'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword'), null], 'Konfirmasi password tidak cocok')
    .required('Konfirmasi password wajib diisi'),
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched'
  });

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Token tidak ditemukan di URL.',
      });
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    setLoading(true);
    const { newPassword } = data;

    try {
      await resetPassword({
        token,
        new_password: newPassword,
      });

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Password berhasil direset. Silakan login kembali.',
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        navigate('/login');
      });
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || 'Gagal reset password.';
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: msg,
      });
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <style>{`
        .password-input.is-invalid {
          background-image: none !important;
          padding-right: 1.5rem !important;
        }

        .password-error-absolute {
          position: absolute;
          bottom: -20px;
          left: 0;
          font-size: 0.875em;
        }

        .input-icon-right {
          position: absolute;
          top: 50%;
          right: 15px;
          transform: translateY(-50%);
          cursor: pointer;
          z-index: 10;
          color: #6c757d;
        }
      `}</style>

      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-3">
          <img src="/image/rumah sakit.png" alt="Mediva Hospital Logo" style={{ width: '100px' }} />
        </div>
        <h3 className="text-center mb-4 text-dark">Reset Password</h3>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Password Baru */}
          <div className="mb-4 position-relative">
            <label htmlFor="newPassword" className="form-label text-dark">Password Baru</label>
            <div className="position-relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                className={`form-control rounded-pill pe-5 password-input ${errors.newPassword ? 'is-invalid' : ''}`}
                {...register("newPassword")}
                placeholder="Masukkan password baru"
              />
              <span
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="input-icon-right"
              >
                <i className={`fa ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
              {errors.newPassword && (
                <div className="invalid-feedback password-error-absolute">
                  {errors.newPassword.message}
                </div>
              )}
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div className="mb-4 position-relative">
            <label htmlFor="confirmPassword" className="form-label text-dark">Konfirmasi Password</label>
            <div className="position-relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-control rounded-pill pe-5 password-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                {...register("confirmPassword")}
                placeholder="Konfirmasi password baru"
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="input-icon-right"
              >
                <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
              {errors.confirmPassword && (
                <div className="invalid-feedback password-error-absolute">
                  {errors.confirmPassword.message}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-success w-100 rounded-pill mt-3" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
