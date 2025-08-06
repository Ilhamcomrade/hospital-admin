import React, { useEffect, useState, useRef } from 'react';
import { getPatients, deletePatient } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

// SweetAlert2
const Swal = window.Swal;

function Patients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage, setPatientsPerPage] = useState(10); 

  // State untuk filter dan sorting
  const [sortOrder, setSortOrder] = useState('asc');
  const [genderFilter, setGenderFilter] = useState('Semua');

  // **Tambahkan useRef untuk elemen scrollable**
  const contentRef = useRef(null);

  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return '';
    }
  };

  const formatContactForDisplay = (contact) => {
    if (contact && contact.startsWith('+62')) {
      return '0' + contact.substring(3);
    }
    return contact;
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await getPatients();
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Gagal mengambil data pasien:', error);
      setPatients([]);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data yang terhapus akan hilang secara permanen !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deletePatient(id);
          await Swal.fire(
            'Dihapus!',
            'Data pasien berhasil dihapus.',
            'success'
          );
          loadPatients();
        } catch (error) {
          console.error('Gagal menghapus pasien:', error);
          Swal.fire(
            'Gagal!',
            'Gagal menghapus pasien: ' + (error.response?.data?.message || error.message),
            'error'
          );
        }
      }
    });
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Data Pasien Mediva Hospital", 14, 20);

    const tableColumn = [
      "No.",
      "Nama",
      "Tanggal Lahir",
      "Jenis Kelamin",
      "Alamat",
      "Kontak",
      "Tanggal Kunjungan",
      "Keluhan",
    ];
    const tableRows = [];

    filteredAndSortedPatients.forEach((p, index) => {
      const patientData = [
        index + 1,
        p.name,
        formatDateToDDMMYYYY(p.birth_date),
        p.gender,
        p.address,
        formatContactForDisplay(p.contact),
        formatDateToDDMMYYYY(p.visit_date),
        p.complaint,
      ];
      tableRows.push(patientData);
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

    doc.save("data_pasien.pdf");
  };

  const filteredAndSortedPatients = patients
    .filter(patient => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = Object.values({
        ...patient,
        contact: formatContactForDisplay(patient.contact)
      }).some(value =>
        String(value).toLowerCase().includes(lowerCaseSearchTerm)
      );
      const matchesGender = genderFilter === 'Semua' || patient.gender === genderFilter;
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else if (sortOrder === 'desc') {
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredAndSortedPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredAndSortedPatients.length / patientsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // **Ganti window.scrollTo dengan scroll ke elemen yang direferensikan**
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handlePatientsPerPageChange = (e) => {
    setPatientsPerPage(Number(e.target.value));
    setCurrentPage(1);
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleGenderFilterChange = (e) => {
    setGenderFilter(e.target.value);
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

  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1">
        <Navbar />
        {/* **Tambahkan ref={contentRef} di sini** */}
        <div className="flex-grow-1 overflow-auto bg-light" ref={contentRef}>
          <div className="p-4 w-100 bg-light">
            <h2 className="mb-4" style={{ fontSize: '2rem', color: '#000000' }}>
                Data Pasien
            </h2>
            <div className="card rounded-3 p-3">
              {/* Filter dan Tombol Aksi */}
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                <div className="d-flex align-items-center me-3 mb-2 mb-md-0">
                  <label htmlFor="patientsPerPage" className="form-label me-2 mb-0 text-dark">Tampilkan:</label>
                  <select
                    id="patientsPerPage"
                    className="form-select w-auto"
                    value={patientsPerPage}
                    onChange={handlePatientsPerPageChange}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                  <span className="ms-2 text-dark">data per halaman</span>
                </div>
                <div className="d-flex align-items-center flex-wrap">
                  <label htmlFor="sortOrder" className="form-label me-2 mb-0 text-dark">Urutkan Nama:</label>
                  <select
                    id="sortOrder"
                    className="form-select w-auto me-3 mb-2 mb-md-0"
                    value={sortOrder}
                    onChange={handleSortOrderChange}
                  >
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                  <label htmlFor="genderFilter" className="form-label me-2 mb-0 text-dark">Jenis Kelamin:</label>
                  <select
                    id="genderFilter"
                    className="form-select w-auto me-3 mb-2 mb-md-0"
                    value={genderFilter}
                    onChange={handleGenderFilterChange}
                  >
                    <option value="Semua">Semua</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="d-flex mt-2 mt-md-0">
                  <button className="btn btn-danger px-3 py-2 me-2" onClick={handleExportPdf}>
                    Export PDF
                  </button>
                  <button className="btn btn-success px-3 py-2" onClick={() => navigate('/patients/add')}>
                    Tambah Pasien
                  </button>
                </div>
              </div>

              {/* Kolom Pencarian */}
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari pasien berdasarkan nama, alamat, kontak, tanggal, atau keluhan..."
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
                      <th className="text-center">Tanggal Lahir</th>
                      <th className="text-center">Jenis Kelamin</th>
                      <th className="text-center">Alamat</th>
                      <th className="text-center">Kontak</th>
                      <th className="text-center">Tanggal Kunjungan</th>
                      <th className="text-center">Keluhan</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPatients.length > 0 ? (
                      currentPatients.map((p, index) => (
                        <tr key={p.id}>
                          <td className="text-center">{(currentPage - 1) * patientsPerPage + index + 1}</td>
                          <td>{p.name}</td>
                          <td className="text-center">{formatDateToDDMMYYYY(p.birth_date)}</td>
                          <td className="text-center">{p.gender}</td>
                          <td>{p.address}</td>
                          <td className="text-center">{formatContactForDisplay(p.contact)}</td>
                          <td className="text-center">{formatDateToDDMMYYYY(p.visit_date)}</td>
                          <td>{p.complaint}</td>
                          <td>
                            <div className="d-flex">
                              <button
                                className="btn btn-warning btn-sm me-2"
                                onClick={() => navigate(`/patients/edit/${p.id}`)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(p.id)}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          Tidak ada data pasien.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination dan Keterangan */}
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                <div className="flex-grow-1 d-none d-md-block"></div> 

                {filteredAndSortedPatients.length > patientsPerPage && (
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
                  {`Menampilkan ${Math.min(indexOfFirstPatient + 1, filteredAndSortedPatients.length)} - ${Math.min(indexOfLastPatient, filteredAndSortedPatients.length)} dari ${filteredAndSortedPatients.length} data`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Patients;