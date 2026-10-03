import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  X, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import './Appointments.css';
import '../components/Modal.css';

const Appointments = () => {
  const { user } = useContext(AuthContext);
  const { lang } = useContext(LanguageContext);

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar State: Current Week Start (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [viewMode, setViewMode] = useState('week');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentAt: '',
    reason: ''
  });

  const fetchData = async () => {
    if (!user?.clinicId) return;
    try {
      setLoading(true);
      const [appRes, patRes] = await Promise.all([
        api.get(`/clinics/${user.clinicId}/appointments`),
        api.get(`/clinics/${user.clinicId}/patients`)
      ]);
      setAppointments(appRes.data);
      setPatients(patRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load appointments', err);
      setError('Impossible de charger les rendez-vous.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.clinicId]);

  // Listen to realtime updates
  useEffect(() => {
    const handleUpdate = () => fetchData();
    window.addEventListener('careflow-realtime-update', handleUpdate);
    return () => window.removeEventListener('careflow-realtime-update', handleUpdate);
  }, [user?.clinicId]);

  // Patient map for quick lookup
  const patientsMap = useMemo(() => {
    const map = {};
    patients.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [patients]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const days = [];
    const curr = new Date(currentWeekStart);
    for (let i = 0; i < 5; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  // Week header range label
  const weekLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0];
    const last = weekDays[weekDays.length - 1];
    const locale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';
    const firstStr = first.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    const lastStr = last.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    return lang === 'ar' ? `أسبوع ${firstStr} - ${lastStr}` : `Week of ${firstStr} - ${lastStr}`;
  }, [weekDays, lang]);

  // Hours: 08:00 AM to 05:00 PM
  const timeHours = [
    { label: '08:00 AM', hour: 8 },
    { label: '09:00 AM', hour: 9 },
    { label: '10:00 AM', hour: 10 },
    { label: '11:00 AM', hour: 11 },
    { label: '12:00 PM', hour: 12 },
    { label: '01:00 PM', hour: 13 },
    { label: '02:00 PM', hour: 14 },
    { label: '03:00 PM', hour: 15 },
    { label: '04:00 PM', hour: 16 },
    { label: '05:00 PM', hour: 17 }
  ];

  // Map appointments to cells
  const appointmentsByCell = useMemo(() => {
    const map = {};
    appointments.forEach(app => {
      if (!app.appointmentAt) return;
      const d = new Date(app.appointmentAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      map[key] = app;
    });
    return map;
  }, [appointments]);

  // Today's Appointments
  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter(app => {
      if (!app.appointmentAt) return false;
      const d = new Date(app.appointmentAt);
      return d.toDateString() === today.toDateString();
    });
  }, [appointments]);

  // Quick Book Slot
  const handleOpenBooking = (dayObj = null, hour = 9) => {
    const baseDate = dayObj ? new Date(dayObj) : new Date();
    baseDate.setHours(hour, 0, 0, 0);

    const tzOffset = baseDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(baseDate.getTime() - tzOffset)).toISOString().slice(0, 16);

    setFormData({
      patientId: patients.length > 0 ? patients[0].id : '',
      appointmentAt: localISOTime,
      reason: ''
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      await api.post(`/clinics/${user.clinicId}/appointments`, {
        patientId: parseInt(formData.patientId, 10),
        appointmentAt: new Date(formData.appointmentAt).toISOString(),
        reason: formData.reason || 'Consultation standard'
      });
      setIsModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      setModalError(err.response?.data?.message || 'Erreur lors de la prise de rendez-vous.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous annuler ce rendez-vous ?')) return;
    try {
      await api.delete(`/clinics/${user.clinicId}/appointments/${id}`);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const isToday = (date) => date.toDateString() === (new Date()).toDateString();

  return (
    <div className="appointments-page-container">
      {/* Main Left Calendar Card */}
      <div className="appointments-calendar-card">
        {/* Calendar Navigation and View Toggle */}
        <div className="calendar-top-bar">
          <div className="calendar-nav-title">
            <div className="calendar-arrows">
              <button className="btn-arrow-circle" onClick={handlePrevWeek} title="Semaine précédente">
                <ChevronLeft size={18} />
              </button>
              <button className="btn-arrow-circle" onClick={handleNextWeek} title="Semaine suivante">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="calendar-title-info">
              <h2>{lang === 'ar' ? 'جدول المواعيد' : 'Planning des rendez-vous'}</h2>
              <span>{weekLabel}</span>
            </div>
          </div>

          <div className="view-mode-toggle">
            <button 
              className={`view-mode-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              {lang === 'ar' ? 'أسبوع' : 'Semaine'}
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              {lang === 'ar' ? 'شهر' : 'Mois'}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-panel" style={{ marginBottom: '16px' }}>
            <div className="alert-header">
              <AlertCircle size={16} color="#b91c1c" />
              <h4>Erreur</h4>
            </div>
            <p>{error}</p>
          </div>
        )}

        {/* Weekly Grid */}
        <div className="weekly-grid-container">
          <table className="weekly-grid">
            <thead>
              <tr>
                <th className="time-col"></th>
                {weekDays.map((day, idx) => {
                  const dayName = day.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { weekday: 'short' });
                  const dayNum = day.getDate();
                  const todayCheck = isToday(day);

                  return (
                    <th key={idx} className={todayCheck ? 'active-day' : ''}>
                      {dayName} {dayNum} {todayCheck ? `(${lang === 'ar' ? 'اليوم' : 'Today'})` : ''}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeHours.map((hourObj) => (
                <tr key={hourObj.hour}>
                  <td className="time-col">{hourObj.label}</td>
                  {weekDays.map((day, idx) => {
                    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hourObj.hour}`;
                    const app = appointmentsByCell[key];
                    const patient = app ? patientsMap[app.patientId] : null;

                    return (
                      <td key={idx}>
                        <div className="cell-slot">
                          {app ? (
                            <div className="scheduled-app-pill" onClick={() => handleDelete(app.id)} title="Cliquer pour annuler">
                              <span className="app-pill-patient">
                                {patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${app.patientId}`}
                              </span>
                              <span className="app-pill-time">{hourObj.label}</span>
                            </div>
                          ) : (
                            <button 
                              className="btn-slot-quick-add" 
                              onClick={() => handleOpenBooking(day, hourObj.hour)}
                              title="Planifier ici"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Sidebar Panel */}
      <div className="appointments-side-panel">
        <button className="btn-prendre-rdv" onClick={() => handleOpenBooking()}>
          <CalendarIcon size={18} />
          <span>{lang === 'ar' ? 'حجز موعد جديد' : 'Prendre un rendez-vous'}</span>
        </button>

        {/* À venir aujourd'hui Card */}
        <div className="upcoming-today-card">
          <div className="upcoming-today-header">
            <h3>{lang === 'ar' ? 'القادمة اليوم' : 'À venir aujourd’hui'}</h3>
            <p>
              {new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>

          <div className="upcoming-list">
            {todayAppointments.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>
                {lang === 'ar' ? 'لا توجد مواعيد اليوم.' : 'Aucun rendez-vous aujourd’hui.'}
              </p>
            ) : (
              todayAppointments.map((app) => {
                const patient = patientsMap[app.patientId];
                const initials = patient ? `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase() : 'P';
                const timeStr = app.appointmentAt ? new Date(app.appointmentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div key={app.id} className="upcoming-item">
                    <div className="upcoming-item-left">
                      <div className="upcoming-avatar">{initials}</div>
                      <div className="upcoming-item-info">
                        <h5>{patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${app.patientId}`}</h5>
                        <p>{timeStr} • {app.reason || 'Consultation'}</p>
                      </div>
                    </div>
                    <button 
                      className="btn-cancel-sm"
                      title="Annuler"
                      onClick={() => handleDelete(app.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Unified Professional Booking Modal */}
      {isModalOpen && (
        <div className="careflow-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="careflow-modal-window" onClick={(e) => e.stopPropagation()}>
            {/* Royal Blue Top Header */}
            <div className="careflow-modal-header">
              <div className="careflow-modal-title">
                <h2>{lang === 'ar' ? 'حجز موعد جديد' : 'Planifier un rendez-vous'}</h2>
                <p>{lang === 'ar' ? 'حدد المريض، التاريخ والتوقيت المطلوب' : 'Sélectionnez le patient, la date et l’horaire de consultation'}</p>
              </div>
              <button className="careflow-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="careflow-modal-body">
                {modalError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '13px' }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="careflow-form">
                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'المريض *' : 'Patient *'}</label>
                    <select 
                      value={formData.patientId} 
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
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
                    <label>{lang === 'ar' ? 'التاريخ والوقت *' : 'Date et Heure *'}</label>
                    <input 
                      type="datetime-local" 
                      value={formData.appointmentAt} 
                      onChange={(e) => setFormData({ ...formData, appointmentAt: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'سبب الزيارة' : 'Motif de la visite'}</label>
                    <textarea 
                      rows="2" 
                      value={formData.reason} 
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Ex: Consultation de suivi, Contrôle médical..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="careflow-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>
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

export default Appointments;
