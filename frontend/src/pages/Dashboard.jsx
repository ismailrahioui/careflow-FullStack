import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { NotificationContext } from '../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  Bell, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertCircle,
  CalendarCheck,
  UserPlus
} from 'lucide-react';
import './Dashboard.css';
import '../components/Modal.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { lang, t } = useContext(LanguageContext);
  const { 
    notifications, 
    unreadCount, 
    activeToast, 
    markAllAsRead, 
    dismissToast 
  } = useContext(NotificationContext);

  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date Navigation State for the Calendar
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Dropdown & Modals state
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // Appointment Form
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    timeSlot: '09:00',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const notifRef = useRef(null);

  // Fetch Dashboard Stats & Data
  const fetchData = async () => {
    if (!user?.clinicId) return;
    try {
      setLoading(true);
      const [statsRes, appRes, patRes] = await Promise.all([
        api.get(`/clinics/${user.clinicId}/dashboard`),
        api.get(`/clinics/${user.clinicId}/appointments`),
        api.get(`/clinics/${user.clinicId}/patients`)
      ]);
      setStats(statsRes.data);
      setAppointments(appRes.data);
      setPatients(patRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.clinicId]);

  // Listen to real-time events to auto-refresh data
  useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchData();
    };
    window.addEventListener('careflow-realtime-update', handleRealtimeUpdate);
    return () => window.removeEventListener('careflow-realtime-update', handleRealtimeUpdate);
  }, [user?.clinicId]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calendar Date Navigation
  const handlePrevDay = () => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  // Patients Map for quick ID lookup
  const patientsMap = useMemo(() => {
    const map = {};
    patients.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [patients]);

  // Filter appointments for the selected date
  const selectedDateAppointments = useMemo(() => {
    const selYear = selectedDate.getFullYear();
    const selMonth = selectedDate.getMonth();
    const selDay = selectedDate.getDate();

    return appointments.filter(app => {
      if (!app.appointmentAt) return false;
      const d = new Date(app.appointmentAt);
      return d.getFullYear() === selYear && d.getMonth() === selMonth && d.getDate() === selDay;
    });
  }, [appointments, selectedDate]);

  // Working Hours Slots
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  // Map slots to scheduled appointments
  const scheduleBySlot = useMemo(() => {
    const map = {};
    selectedDateAppointments.forEach(app => {
      const d = new Date(app.appointmentAt);
      const hours = d.getHours().toString().padStart(2, '0');
      const slotKey = `${hours}:00`;
      map[slotKey] = app;
    });
    return map;
  }, [selectedDateAppointments]);

  // Calculate waiting visits count (appointments today not yet completed)
  const waitingVisitsCount = useMemo(() => {
    const today = new Date();
    return appointments.filter(app => {
      if (!app.appointmentAt) return false;
      const d = new Date(app.appointmentAt);
      const isToday = d.toDateString() === today.toDateString();
      return isToday && app.status !== 'COMPLETED' && app.status !== 'CANCELLED';
    }).length;
  }, [appointments]);

  // Formatted date string for header
  const formattedTodayString = useMemo(() => {
    const locale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }, [lang]);

  // Formatted selected date for calendar badge (e.g. "Oct 02")
  const formattedSelectedDateBadge = useMemo(() => {
    const locale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return selectedDate.toLocaleDateString(locale, {
      month: 'short',
      day: '2-digit'
    });
  }, [selectedDate, lang]);

  // Open booking modal for a specific time slot
  const handleOpenBookingForSlot = (slot) => {
    setAppointmentForm({
      patientId: patients.length > 0 ? patients[0].id : '',
      timeSlot: slot,
      reason: ''
    });
    setModalError(null);
    setIsAppointmentModalOpen(true);
  };

  // Handle Book Appointment
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const [h, m] = appointmentForm.timeSlot.split(':');
      const targetDate = new Date(selectedDate);
      targetDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      await api.post(`/clinics/${user.clinicId}/appointments`, {
        patientId: parseInt(appointmentForm.patientId, 10),
        appointmentAt: targetDate.toISOString(),
        reason: appointmentForm.reason || 'Consultation standard'
      });
      setIsAppointmentModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      setModalError(err.response?.data?.message || 'Erreur lors de la prise de rendez-vous.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-soft-container">
      {/* Top Welcome Header - Matching Image 1 */}
      <div className="dashboard-soft-header">
        <div className="header-welcome">
          <h1>{t('greeting')}, {user?.fullName || user?.username || 'aa'}</h1>
          <p>{t('subtitle')} {formattedTodayString}.</p>
        </div>

        <div className="header-soft-actions">
          {/* Journal d'activité & Alertes Button with Dropdown */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button 
              className="btn-alerts-pill"
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            >
              <Bell size={16} className="bell-icon-blue" />
              <span>{t('activityAlerts')}</span>
              {unreadCount > 0 && (
                <span className="unread-badge-dot">{unreadCount}</span>
              )}
            </button>

            {/* Notification Dropdown (Facebook-style) */}
            {isNotifDropdownOpen && (
              <div className="notification-dropdown">
                <div className="notif-dropdown-header">
                  <h4>{t('notifications')}</h4>
                  {unreadCount > 0 && (
                    <button className="btn-text-sm" onClick={markAllAsRead}>
                      {t('markAllRead')}
                    </button>
                  )}
                </div>
                <div className="notif-dropdown-list">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      {t('noNotifications')}
                    </div>
                  ) : (
                    notifications.map((item, idx) => (
                      <div 
                        key={item.id || idx} 
                        className={`notif-item ${!item.read ? 'unread' : ''}`}
                        onClick={() => {
                          if (item.type === 'APPOINTMENT') navigate('/appointments');
                          else if (item.type === 'PATIENT') navigate('/patients');
                          else if (item.type === 'PAYMENT') navigate('/payments');
                          setIsNotifDropdownOpen(false);
                        }}
                      >
                        <div className="notif-icon-circle">
                          {item.type === 'APPOINTMENT' ? <CalendarCheck size={16} /> :
                           item.type === 'PATIENT' ? <UserPlus size={16} /> :
                           item.type === 'PAYMENT' ? <DollarSign size={16} /> : <Bell size={16} />}
                        </div>
                        <div className="notif-text">
                          <h5>{item.title}</h5>
                          <p>{item.message}</p>
                          <span className="notif-time">
                            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('justNow')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clinic Status Box */}
          <div className="clinic-status-box">
            <span className="status-label">{t('clinicStatus')}</span>
            <div className="status-live">
              <span className="green-dot-pulse"></span>
              <span>{t('onlineOptimal')}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-panel">
          <div className="alert-header">
            <AlertCircle size={18} color="#b91c1c" />
            <h4>{error}</h4>
          </div>
        </div>
      )}

      {/* 4 Soft KPI Cards - Exact Match to Screenshot */}
      <div className="soft-kpi-grid">
        {/* Card 1: TOTAL PATIENTS */}
        <div className="soft-kpi-card">
          <div className="kpi-top-row">
            <div className="kpi-icon-circle purple">
              <Users size={20} />
            </div>
            <span className="kpi-pill-badge green-pill">
              +{patients.length}
            </span>
          </div>
          <p className="kpi-card-label">{t('totalPatients')}</p>
          <h3 className="kpi-card-value">
            {loading ? '...' : (stats?.totalPatients ?? patients.length)}
          </h3>
        </div>

        {/* Card 2: RENDEZ-VOUS DU JOUR */}
        <div className="soft-kpi-card">
          <div className="kpi-top-row">
            <div className="kpi-icon-circle green">
              <Calendar size={20} />
            </div>
            <span className="kpi-pill-badge gray-pill">
              {t('todayBadge')}
            </span>
          </div>
          <p className="kpi-card-label">{t('appointmentsToday')}</p>
          <h3 className="kpi-card-value">
            {loading ? '...' : (stats?.appointmentsToday ?? 0)}
          </h3>
        </div>

        {/* Card 3: VISITES EN ATTENTE */}
        <div className="soft-kpi-card">
          <div className="kpi-top-row">
            <div className="kpi-icon-circle rose">
              <Clock size={20} />
            </div>
            <span className="kpi-pill-badge red-pill">
              {t('activeBadge')}
            </span>
          </div>
          <p className="kpi-card-label">{t('waitingVisits')}</p>
          <h3 className="kpi-card-value">
            {loading ? '...' : waitingVisitsCount}
          </h3>
        </div>

        {/* Card 4: REVENU DU JOUR */}
        <div className="soft-kpi-card">
          <div className="kpi-top-row">
            <div className="kpi-icon-circle amber">
              <DollarSign size={20} />
            </div>
            <span className="kpi-pill-badge green-pill">
              {t('paymentsBadge')}
            </span>
          </div>
          <p className="kpi-card-label">{t('revenueToday')}</p>
          <h3 className="kpi-card-value">
            {loading ? '...' : Number(stats?.totalRevenue ?? 0).toLocaleString()} 
            <span className="kpi-currency-unit">{t('mad')}</span>
          </h3>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-soft-content">
        {/* Left Side: Planning d'aujourd'hui with working Interactive Calendar */}
        <div className="soft-planning-card">
          <div className="planning-header">
            <h2>{selectedDate.toDateString() === new Date().toDateString() ? t('todayPlanning') : `${t('forDatePlanning')} ${formattedSelectedDateBadge}`}</h2>
            
            <div className="date-navigator">
              <button className="date-nav-btn" onClick={handlePrevDay} title="Jour précédent">
                <ChevronLeft size={18} />
              </button>
              <span className="date-display-badge">
                {formattedSelectedDateBadge}
              </span>
              <button className="date-nav-btn" onClick={handleNextDay} title="Jour suivant">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Time Slots Daily Schedule */}
          <div className="schedule-grid">
            {timeSlots.map((slot) => {
              const appointment = scheduleBySlot[slot];
              const patient = appointment ? patientsMap[appointment.patientId] : null;

              return (
                <div key={slot} className="schedule-row">
                  <div className="schedule-time">
                    <Clock size={14} color="#94a3b8" />
                    <span>{slot}</span>
                  </div>

                  <div className="schedule-slot-content">
                    {appointment ? (
                      <div className="slot-appointment-box">
                        <div className="slot-patient-avatar">
                          {patient ? `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}` : 'P'}
                        </div>
                        <div className="slot-info">
                          <h4>{patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${appointment.patientId}`}</h4>
                          <p>{appointment.reason || 'Consultation standard'}</p>
                        </div>
                        <span className="slot-badge">
                          {appointment.status || 'SCHEDULED'}
                        </span>
                      </div>
                    ) : (
                      <div className="slot-empty">
                        <span className="slot-empty-text">Créneau disponible</span>
                        <button 
                          className="btn-book-slot"
                          onClick={() => handleOpenBookingForSlot(slot)}
                        >
                          <Plus size={13} style={{ display: 'inline', verticalAlign: '-1px' }} /> {t('bookSlot')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Widgets Column */}
        <div className="soft-widgets-col">
          {/* Urgent Alert Banner (Matching Screenshot) */}
          <div className="urgent-alert-card">
            <div className="urgent-icon-wrapper">
              <Bell size={22} />
            </div>
            <div className="urgent-content">
              <h4>{t('urgentResults')}</h4>
              <p>{t('urgentDesc')}</p>
              <Link to="/consultations" className="urgent-link">
                {t('viewNow')}
              </Link>
            </div>
          </div>

          {/* Recent Patients Card */}
          <div className="recent-patients-card">
            <div className="recent-patients-header">
              <h3>{t('recentPatients')}</h3>
              <Link to="/patients" className="btn-link-consulter">
                {t('viewAll')}
              </Link>
            </div>

            <div className="recent-patients-list">
              {patients.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '16px 0', textAlign: 'center' }}>
                  {t('noRecentPatients')}
                </p>
              ) : (
                patients.slice(0, 4).map((p) => (
                  <div key={p.id} className="recent-patient-item">
                    <div className="recent-patient-info">
                      <div className="patient-avatar-mini">
                        {`${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase()}
                      </div>
                      <div>
                        <h5>{p.firstName} {p.lastName}</h5>
                        <span>{p.cin || p.phone || 'Dossier vérifié'}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {p.gender === 'MALE' ? 'H' : p.gender === 'FEMALE' ? 'F' : 'A'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Facebook-style Real-time Floating Toast Notification in Corner */}
      {activeToast && (
        <div className="floating-toast-container">
          <div className="floating-toast">
            <div className="toast-icon">
              {activeToast.type === 'APPOINTMENT' ? <CalendarCheck size={20} /> :
               activeToast.type === 'PATIENT' ? <UserPlus size={20} /> :
               activeToast.type === 'PAYMENT' ? <DollarSign size={20} /> : <Bell size={20} />}
            </div>
            <div className="toast-content">
              <h5>{activeToast.title}</h5>
              <p>{activeToast.message}</p>
            </div>
            <button className="toast-close-btn" onClick={dismissToast}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Unified Professional Modal: Planifier un RDV */}
      {isAppointmentModalOpen && (
        <div className="careflow-modal-overlay" onClick={() => setIsAppointmentModalOpen(false)}>
          <div className="careflow-modal-window" onClick={(e) => e.stopPropagation()}>
            {/* Royal Blue Top Header */}
            <div className="careflow-modal-header">
              <div className="careflow-modal-title">
                <h2>{lang === 'ar' ? 'حجز موعد' : 'Planifier un rendez-vous'}</h2>
                <p>{formattedSelectedDateBadge} à {appointmentForm.timeSlot}</p>
              </div>
              <button className="careflow-modal-close" onClick={() => setIsAppointmentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment}>
              <div className="careflow-modal-body">
                {modalError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '13px' }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="careflow-form">
                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'المريض *' : 'Sélectionner le Patient *'}</label>
                    <select 
                      value={appointmentForm.patientId} 
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
                      required
                    >
                      <option value="">-- {lang === 'ar' ? 'اختر المريض' : 'Choisir un patient'} --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} {p.cin ? `(${p.cin})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'الخانة الزمنية *' : 'Créneau Horaire *'}</label>
                    <select 
                      value={appointmentForm.timeSlot}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, timeSlot: e.target.value })}
                      required
                    >
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'سبب الزيارة' : 'Motif de la visite'}</label>
                    <textarea 
                      rows="2"
                      value={appointmentForm.reason}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                      placeholder="Ex: Consultation de suivi, Contrôle..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="careflow-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsAppointmentModalOpen(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Validation...' : (lang === 'ar' ? 'تأكيد الموعد' : 'Confirmer le Rendez-vous')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
