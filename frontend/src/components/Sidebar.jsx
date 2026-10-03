import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  CreditCard, 
  BarChart2, 
  Settings, 
  LogOut, 
  PlusSquare 
} from 'lucide-react';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <PlusSquare size={22} color="white" />
        </div>
        <div>
          <h2>CareFlow</h2>
          <p>Suite Clinique</p>
        </div>
      </div>

      <nav className="nav-links">
        <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={19} />
          <span>{t('dashboard')}</span>
        </NavLink>
        <NavLink to="/patients" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={19} />
          <span>{t('patientsNav')}</span>
        </NavLink>
        <NavLink to="/appointments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Calendar size={19} />
          <span>{t('appointmentsNav')}</span>
        </NavLink>
        <NavLink to="/consultations" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Stethoscope size={19} />
          <span>{t('consultationsNav')}</span>
        </NavLink>
        <NavLink to="/payments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <CreditCard size={19} />
          <span>{t('paymentsNav')}</span>
        </NavLink>
        <NavLink to="/reports" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <BarChart2 size={19} />
          <span>{t('reportsNav')}</span>
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Settings size={19} />
          <span>{t('settingsNav')}</span>
        </NavLink>
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={19} />
        <span>{t('logout')}</span>
      </button>
    </aside>
  );
};

export default Sidebar;
