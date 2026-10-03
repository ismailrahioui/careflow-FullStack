import React, { useState, useEffect, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PatientModal from './PatientModal';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { NotificationContext } from '../context/NotificationContext';
import { Bell, Plus, HelpCircle } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const { user } = useContext(AuthContext);
  const { lang, setLang, t } = useContext(LanguageContext);
  const { unreadCount } = useContext(NotificationContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => setIsPatientModalOpen(true);
    window.addEventListener('open-patient-modal', handleOpenModal);
    return () => window.removeEventListener('open-patient-modal', handleOpenModal);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path || path === 'dashboard') return t('dashboard');
    if (path === 'patients') return t('patientsNav');
    if (path === 'appointments') return t('appointmentsNav');
    if (path === 'consultations') return t('consultationsNav');
    if (path === 'payments') return t('paymentsNav');
    if (path === 'reports') return t('reportsNav');
    if (path === 'settings') return t('settingsNav');
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const userInitials = (user?.username).substring(0, 2).toUpperCase();

  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-content">
        {/* Topbar matching user screenshots */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>{getPageTitle()}</h1>
            <span>| {user?.clinic}</span>
          </div>

          <div className="topbar-right">
            {/* Nouveau Patient Button in Topbar (Dark Navy matching screenshot) */}
            <button
              className="btn-topbar-primary"
              onClick={() => setIsPatientModalOpen(true)}
            >
              <Plus size={16} />
              <span>{t('newPatient')}</span>
            </button>

            {/* Language Toggle in Topbar */}
            <div className="topbar-lang-toggle">
              <button
                className={`topbar-lang-btn ${lang === 'fr' ? 'active' : ''}`}
                onClick={() => setLang('fr')}
                title="Français"
              >
                FR
              </button>
              <button
                className={`topbar-lang-btn ${lang === 'ar' ? 'active' : ''}`}
                onClick={() => setLang('ar')}
                title="العربية"
              >
                عربي
              </button>
            </div>
            {/* Notification Bell Icon */}
            <button
              className="topbar-bell-btn"
              onClick={() => navigate('/reports')}
              title={t('notifications')}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="topbar-bell-badge"></span>}
            </button>

            {/* User Profile */}
            <div className="user-profile">
              <div className="topbar-avatar">{userInitials}</div>
              <div className="user-info">
                <strong>{user?.username || 'aa'}</strong>
                <span>{user?.role || 'DOCTOR'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* Global Patient Modal matching professional screenshot */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
      />
    </div>
  );
};

export default Layout;
