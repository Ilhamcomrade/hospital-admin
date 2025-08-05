import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div
      className="bg-dark text-white p-3 shadow-lg"
      style={{ width: '250px', height: '100%', flexShrink: 0 }}
    >
      {/* Logo Rumah Sakit */}
      <img
        src="/image/rumah sakit.png"
        alt="Logo Rumah Sakit Sentosa"
        className="d-block mx-auto mb-3"
        style={{ maxWidth: '100px', height: 'auto' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/100x100/cccccc/333333?text=Logo";
        }}
      />

      <h5 className="mb-4 fw-bold text-center">Mediva Hospital</h5>

      {/* Menu navigasi */}
      <ul className="nav flex-column mt-4">
        <li className="nav-item">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center py-2 fs-5 rounded ${
                isActive ? 'bg-primary text-white fw-bold' : 'text-white'
              }`
            }
            style={{ paddingLeft: '0' }}
          >
            <i className="fa-solid fa-house fa-lg me-2" style={{ marginLeft: '0' }}></i>
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/patients"
            className={({ isActive }) =>
              `nav-link d-flex align-items-center py-2 fs-5 rounded ${
                isActive ? 'bg-primary text-white fw-bold' : 'text-white'
              }`
            }
            style={{ paddingLeft: '0' }}
          >
            <i className="fas fa-user-friends fa-lg me-2" style={{ marginLeft: '0' }}></i>
            <span>Pasien</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
