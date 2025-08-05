import React, { useEffect, useState } from 'react';
import { getPatients, deletePatient } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Pastikan ini diimpor untuk memperluas jsPDF

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

// SweetAlert2 (tersedia secara global karena diimpor di index.html)
const Swal = window.Swal;

function Patients() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage, setPatientsPerPage] = useState(10); // Jumlah pasien per halaman, bisa diubah

  // State untuk filter dan sorting
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' untuk A-Z, 'desc' untuk Z-A
  const [genderFilter, setGenderFilter] = useState('Semua'); // 'Semua', 'Laki-laki', 'Perempuan'

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

  // Fungsi helper untuk memformat kontak dari +62... menjadi 08... untuk tampilan
  const formatContactForDisplay = (contact) => {
    if (contact && contact.startsWith('+62')) {
      // Mengganti '+62' dengan '0'
      return '0' + contact.substring(3);
    }
    return contact; // Kembalikan apa adanya jika tidak dalam format +62
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await getPatients();
      // Tidak perlu mengurutkan di sini, karena pengurutan akan dilakukan di `filteredAndSortedPatients`
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
    doc.text("Data Pasien Mediva Hospital", 14, 20); // Mengubah judul PDF di sini

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

    // Gunakan patients yang sudah difilter dan diurutkan untuk ekspor PDF
    filteredAndSortedPatients.forEach((p, index) => {
      const patientData = [
        index + 1,
        p.name,
        formatDateToDDMMYYYY(p.birth_date),
        p.gender,
        p.address,
        formatContactForDisplay(p.contact), // Gunakan format untuk display di PDF
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

  // Logika filter dan sorting
  const filteredAndSortedPatients = patients
    .filter(patient => {
      // Filter berdasarkan search term
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = Object.values({
        ...patient,
        contact: formatContactForDisplay(patient.contact)
      }).some(value =>
        String(value).toLowerCase().includes(lowerCaseSearchTerm)
      );

      // Filter berdasarkan jenis kelamin
      const matchesGender = genderFilter === 'Semua' || patient.gender === genderFilter;

      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      // Urutkan berdasarkan nama
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else if (sortOrder === 'desc') {
        return nameB.localeCompare(nameA);
      }
      return 0; // Tidak ada pengurutan jika sortOrder bukan 'asc' atau 'desc'
    });

  // Logika pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredAndSortedPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const totalPages = Math.ceil(filteredAndSortedPatients.length / patientsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handler untuk mengubah jumlah pasien per halaman
  const handlePatientsPerPageChange = (e) => {
    setPatientsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset halaman ke 1 saat jumlah pasien per halaman berubah
  };

  // Handler untuk mengubah urutan sorting
  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1); // Reset halaman ke 1 saat urutan sorting berubah
  };

  // Handler untuk mengubah filter jenis kelamin
  const handleGenderFilterChange = (e) => {
    setGenderFilter(e.target.value);
    setCurrentPage(1); // Reset halaman ke 1 saat filter jenis kelamin berubah
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
        <div className="flex-grow-1 overflow-auto bg-light">
          <div className="p-4 w-100 bg-light">
            <h2 className="mb-4" style={{ fontSize: '2rem', color: '#000000' }}>
                Data Pasien
            </h2>
            <div className="card rounded-3 p-3">
              {/* Filter dan Tombol Aksi */}
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                {/* Pengaturan jumlah data per halaman */}
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

                {/* Filter Urutkan Nama dan Jenis Kelamin */}
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

                {/* Tombol Export dan Tambah Pasien */}
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset halaman ke 1 saat mencari
                  }}
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
              {/* Menggunakan d-flex justify-content-between untuk memisahkan pagination dan keterangan */}
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                {/* Placeholder untuk mengisi ruang di kiri agar pagination bisa di tengah */}
                <div className="flex-grow-1 d-none d-md-block"></div> 

                {/* Pagination (dipusatkan secara horizontal) */}
                {filteredAndSortedPatients.length > patientsPerPage && (
                  <nav className="mb-2 mb-md-0 mx-auto"> {/* mx-auto akan memusatkan nav ini */}
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button onClick={() => paginate(currentPage - 1)} className="page-link">
                          &lt; {/* Menggunakan &lt; untuk tanda < */}
                        </button>
                      </li>
                      {renderPageNumbers()}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button onClick={() => paginate(currentPage + 1)} className="page-link">
                          &gt; {/* Menggunakan &gt; untuk tanda > */}
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
                
                {/* Keterangan filter dan halaman (tetap di kanan) */}
                <div className="text-dark flex-grow-1 text-end"> {/* text-end untuk rata kanan */}
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
