import React, { useEffect, useState, useRef } from 'react';
import { getDoctors, deleteDoctor } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage, setDoctorsPerPage] = useState(10);

  // State untuk sorting
  const [sortOrder, setSortOrder] = useState('newest'); // <-- Ubah default menjadi 'newest'
  const [sortField, setSortField] = useState('createdAt'); // <-- Tambahkan state untuk field sorting

  // useRef untuk elemen scrollable
  const contentRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000';

  const formatContactForDisplay = (contact) => {
    if (contact && contact.startsWith('+62')) {
      return '0' + contact.substring(3);
    }
    return contact;
  };

  const fetchDoctors = async () => {
    try {
      const response = await getDoctors();
      setDoctors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Swal.fire(
        'Gagal!',
        'Gagal mengambil data dokter: ' + (error.response?.data?.message || error.message),
        'error'
      );
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data yang terhapus akan hilang secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoctor(id);
          await Swal.fire(
            'Dihapus!',
            'Data dokter berhasil dihapus.',
            'success'
          );
          fetchDoctors();
        } catch (error) {
          console.error('Error deleting doctor:', error);
          Swal.fire(
            'Gagal!',
            'Gagal menghapus dokter: ' + (error.response?.data?.message || error.message),
            'error'
          );
        }
      }
    });
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Data Dokter Mediva Hospital", 14, 20);

    const tableColumn = [
      "No.",
      "Nama",
      "Spesialisasi",
      "Kontak",
      "Foto",
    ];
    const tableRows = [];

    filteredAndSortedDoctors.forEach((d, index) => {
      const doctorData = [
        index + 1,
        d.name,
        d.specialization,
        formatContactForDisplay(d.contact),
        d.photo ? "Tersedia" : "Tidak Ada",
      ];
      tableRows.push(doctorData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle',
        halign: 'left'
      },
      headStyles: {
        fillColor: [248, 249, 250],
        textColor: [52, 58, 64],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [242, 242, 242]
      }
    });

    doc.save("data_dokter.pdf");
  };

  const filteredAndSortedDoctors = doctors
    .filter(doctor => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = Object.values(doctor).some(value =>
        String(value).toLowerCase().includes(lowerCaseSearchTerm)
      );
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (sortOrder === 'asc') {
          return nameA.localeCompare(nameB);
        } else if (sortOrder === 'desc') {
          return nameB.localeCompare(nameA);
        }
      }
      
      // Logika sorting untuk 'newest' dan 'oldest'
      if (sortField === 'createdAt') {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        if (sortOrder === 'newest') {
          return dateB - dateA; // descending
        } else if (sortOrder === 'oldest') {
          return dateA - dateB; // ascending
        }
      }
      return 0;
    });

  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredAndSortedDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(filteredAndSortedDoctors.length / doctorsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleDoctorsPerPageChange = (e) => {
    setDoctorsPerPage(Number(e.target.value));
    setCurrentPage(1);
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleSortOrderChange = (e) => {
    const value = e.target.value;
    if (value === 'asc' || value === 'desc') {
      setSortField('name');
      setSortOrder(value);
    } else {
      setSortField('createdAt');
      setSortOrder(value);
    }
    setCurrentPage(1);
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, currentPage + Math.floor(maxPageButtons / 2));
    if (endPage - startPage + 1 < maxPageButtons) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxPageButtons + 1);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button onClick={() => paginate(i)} className="page-link">
            {i}
          </button>
        </li>
      );
    }
    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1">
        <Navbar />
        <div className="flex-grow-1 overflow-auto bg-light" ref={contentRef}>
          <div className="p-4 w-100 bg-light">
            <h2 className="mb-4" style={{ fontSize: '2rem', color: '#000000' }}>
              Daftar Dokter
            </h2>
            <div className="card rounded-3 p-3">
              {/* Filter dan Tombol Aksi */}
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <div className="d-flex align-items-center me-3 mb-2 mb-md-0">
                  <label htmlFor="doctorsPerPage" className="form-label me-2 mb-0 text-dark">Tampilkan:</label>
                  <select
                    id="doctorsPerPage"
                    className="form-select w-auto"
                    value={doctorsPerPage}
                    onChange={handleDoctorsPerPageChange}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                  <span className="ms-2 text-dark">data per halaman</span>
                </div>
                <div className="d-flex align-items-center flex-wrap">
                  <label htmlFor="sortOrder" className="form-label me-2 mb-0 text-dark">Urutkan:</label>
                  <select
                    id="sortOrder"
                    className="form-select w-auto me-3 mb-2 mb-md-0"
                    value={sortField === 'name' ? sortOrder : sortOrder}
                    onChange={handleSortOrderChange}
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="asc">Nama (A-Z)</option>
                    <option value="desc">Nama (Z-A)</option>
                  </select>
                </div>
                <div className="d-flex mt-2 mt-md-0">
                  <button className="btn btn-danger px-3 py-2 me-2" onClick={handleExportPdf}>
                    Export PDF
                  </button>
                  <button className="btn btn-success px-3 py-2" onClick={() => navigate('/doctors/add')}>
                    Tambah Dokter
                  </button>
                </div>
              </div>

              {/* Kolom Pencarian */}
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari dokter berdasarkan nama, spesialisasi, atau kontak..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
              </div>

              {/* Tabel */}
              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                  <thead style={{ backgroundColor: '#f8f9fa', color: '#343a40' }}>
                    <tr>
                      <th className="text-center">No.</th>
                      <th className="text-center">Nama</th>
                      <th className="text-center">Spesialisasi</th>
                      <th className="text-center">Kontak</th>
                      <th className="text-center">Foto</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDoctors.length > 0 ? (
                      currentDoctors.map((doctor, index) => (
                        <tr key={doctor.id}>
                          <td className="text-center">{(currentPage - 1) * doctorsPerPage + index + 1}</td>
                          <td>{doctor.name}</td>
                          <td className="text-center">{doctor.specialization}</td>
                          <td className="text-center">{formatContactForDisplay(doctor.contact)}</td>
                          <td className="text-center">
                            {doctor.photo && (
                              <img
                                src={`${API_BASE_URL}/${doctor.photo}`}
                                alt={doctor.name}
                                className="img-fluid rounded"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://placehold.co/100x100/cccccc/333333?text=No+Image";
                                }}
                              />
                            )}
                          </td>
                          <td>
                            <div className="d-flex justify-content-center">
                              <button
                                className="btn btn-warning btn-sm me-2"
                                onClick={() => navigate(`/doctors/edit/${doctor.id}`)}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(doctor.id)}
                                className="btn btn-danger btn-sm"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          Tidak ada data dokter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination dan Keterangan */}
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                <div className="flex-grow-1 d-none d-md-block"></div>
                
                {filteredAndSortedDoctors.length > doctorsPerPage && (
                  <nav className="mb-2 mb-md-0 mx-auto">
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button onClick={() => paginate(currentPage - 1)} className="page-link">
                          &lt;
                        </button>
                      </li>
                      {renderPageNumbers()}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button onClick={() => paginate(currentPage + 1)} className="page-link">
                          &gt;
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
                
                <div className="text-dark flex-grow-1 text-end">
                  {`Menampilkan ${Math.min(indexOfFirstDoctor + 1, filteredAndSortedDoctors.length)} - ${Math.min(indexOfLastDoctor, filteredAndSortedDoctors.length)} dari ${filteredAndSortedDoctors.length} data`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}