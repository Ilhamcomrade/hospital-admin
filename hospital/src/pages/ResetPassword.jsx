import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { resetPassword } from '../services/api';

// Skema validasi menggunakan yup
const schema = yup.object().shape({
  newPassword: yup.string()
    .min(6, 'Password harus minimal 6 karakter')
    .max(40, 'Password tidak boleh lebih dari 40 karakter')
    .required('Wajib diisi!'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword'), null], 'Konfirmasi password tidak cocok')
    .required('Taruh ulang password nya disini !')
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
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
        title: 'Berhasil!',
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
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4">Reset Password</h3>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">Password Baru</label>
            <input
              type="password"
              className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <div className="invalid-feedback">{errors.newPassword.message}</div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Konfirmasi Password</label>
            <input
              type="password"
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <div className="invalid-feedback">{errors.confirmPassword.message}</div>
            )}
          </div>
          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading && (
              <span className="spinner-border spinner-border-sm me-2"></span>
            )}
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}