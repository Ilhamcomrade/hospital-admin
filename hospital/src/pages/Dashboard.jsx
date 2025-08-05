// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getPatients } from '../services/api'; // Import getPatients
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; // Import PieChart, Pie, Cell

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        const res = await getPatients();
        setPatients(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch patients data:", err);
        setError("Gagal memuat data pasien.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsData();
  }, []);

  // Data untuk card dan grafik
  const totalPatients = patients.length;
  const malePatients = patients.filter(p => p.gender === 'Laki-laki').length;
  const femalePatients = patients.filter(p => p.gender === 'Perempuan').length;

  // Data untuk grafik distribusi jenis kelamin (Pie Chart)
  const genderDistributionData = [
    { name: 'Laki-laki', value: malePatients },
    { name: 'Perempuan', value: femalePatients },
  ].filter(data => data.value > 0); // Filter out categories with 0 value

  // Warna untuk Pie Chart
  const PIE_COLORS = ['#0088FE', '#00C49F']; // Biru untuk Laki-laki, Hijau untuk Perempuan

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column flex-grow-1">
        <Navbar />
        <div className="flex-grow-1 overflow-auto bg-light p-4">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1">
        <Navbar />
        <div className="flex-grow-1 overflow-auto bg-light p-4">
          {/* Judul Dashboard di tengah */}
          <h2 className="mb-4 fw-bolder text-center" style={{ color: '#000000' }}>Rekapitulasi Data Pasien</h2>
          
          <div className="row g-4 mb-4">
            {/* Card Total Pasien */}
            <div className="col-md-4">
              <div className="card shadow-sm rounded-3 text-white p-3" style={{ backgroundColor: '#00bcd4' }}> {/* Warna biru tosca */}
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Total Pasien</h5>
                    <p className="fs-1 fw-bold mb-0">{totalPatients}</p>
                  </div>
                  <i className="fas fa-users fa-4x opacity-50"></i>
                </div>
              </div>
            </div>

            {/* Card Pasien Laki-laki */}
            <div className="col-md-4">
              <div className="card shadow-sm rounded-3 text-white p-3" style={{ backgroundColor: '#4caf50' }}> {/* Warna hijau */}
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Pasien Laki-laki</h5>
                    <p className="fs-1 fw-bold mb-0">{malePatients}</p>
                  </div>
                  <i className="fas fa-male fa-4x opacity-50"></i>
                </div>
              </div>
            </div>

            {/* Card Pasien Perempuan */}
            <div className="col-md-4">
              <div className="card shadow-sm rounded-3 text-white p-3" style={{ backgroundColor: '#ff9800' }}> {/* Warna oranye */}
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Pasien Perempuan</h5>
                    <p className="fs-1 fw-bold mb-0">{femalePatients}</p>
                  </div>
                  <i className="fas fa-female fa-4x opacity-50"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Grafik Distribusi Pasien Berdasarkan Jenis Kelamin (Pie Chart) */}
          <div className="card shadow-sm rounded-3 p-3" style={{ backgroundColor: '#ffffff' }}>
            <h5 className="card-title text-dark mb-3">Distribusi Pasien Berdasarkan Jenis Kelamin</h5>
            {genderDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    // Mengubah label agar hanya menampilkan nama dan nilai
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {
                      genderDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))
                    }
                  </Pie>
                  {/* Mengubah formatter Tooltip agar hanya menampilkan nama dan nilai */}
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted py-4">Tidak ada data untuk menampilkan grafik jenis kelamin.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
