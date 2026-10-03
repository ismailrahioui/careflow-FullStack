import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api';
import PatientModal from '../components/PatientModal';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertCircle,
  Download
} from 'lucide-react';
import { exportToCsv } from '../utils/exportImport';
import './Patients.css';

const Patients = () => {
  const { user } = useContext(AuthContext);
  const { t, lang } = useContext(LanguageContext);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'URGENT'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  // Fetch Patients & Appointments to calculate visits
  const fetchData = async () => {
    if (!user?.clinicId) return;
    try {
      setLoading(true);
      const [patRes, appRes] = await Promise.all([
        api.get(`/clinics/${user.clinicId}/patients`),
        api.get(`/clinics/${user.clinicId}/appointments`)
      ]);
      setPatients(patRes.data);
      setAppointments(appRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load patients data', err);
      setError('Impossible de charger les dossiers patients.');
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

  // Map appointments by patient for last visit & next appointment
  const patientAppointmentsMap = useMemo(() => {
    const map = {};
    const now = new Date();

    appointments.forEach((app) => {
      if (!app.patientId || !app.appointmentAt) return;
      if (!map[app.patientId]) {
        map[app.patientId] = { past: [], upcoming: [] };
      }
      const appDate = new Date(app.appointmentAt);
      if (appDate < now) {
        map[app.patientId].past.push(appDate);
      } else {
        map[app.patientId].upcoming.push(appDate);
      }
    });

    // Sort past desc (most recent first), upcoming asc (closest first)
    Object.keys(map).forEach((pid) => {
      map[pid].past.sort((a, b) => b - a);
      map[pid].upcoming.sort((a, b) => a - b);
    });

    return map;
  }, [appointments]);

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.cin && p.cin.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q));

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = true; // All registered patients active by default
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = false;
      } else if (statusFilter === 'URGENT') {
        matchesStatus = false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  // Calculate age helper
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  // Format date helper
  const formatDate = (dateObj) => {
    if (!dateObj) return '—';
    const locale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return dateObj.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateObj) => {
    if (!dateObj) return t('noneText');
    const locale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return `${dateObj.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} à ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Open Add Patient Modal
  const handleOpenAddModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  // Open Edit Patient Modal
  const handleOpenEditModal = (patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  // Handle Delete Patient
  const handleDelete = async (patient) => {
    const confirmMsg = lang === 'ar'
      ? `هل أنت متأكد من حذف ملف المريض ${patient.firstName} ${patient.lastName}؟`
      : `Voulez-vous vraiment supprimer le dossier de ${patient.firstName} ${patient.lastName} ?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/clinics/${user.clinicId}/patients/${patient.id}`);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression du patient.');
    }
  };

  // Export Patients CSV
  const handleExportCsv = () => {
    const cols = [
      { key: 'id', label: 'ID' },
      { key: 'firstName', label: 'Prénom' },
      { key: 'lastName', label: 'Nom' },
      { key: 'cin', label: 'CIN' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'dateOfBirth', label: 'Date Naissance' },
      { key: 'gender', label: 'Genre' },
      { key: 'address', label: 'Adresse' },
      { key: 'email', label: 'Email' }
    ];
    exportToCsv(`careflow_patients_${new Date().toISOString().slice(0, 10)}.csv`, cols, patients);
  };

  return (
    <div className="patients-container">
      {/* Top Header - Matching Screenshot */}
      <div className="patients-header">
        <div className="patients-header-text">
          <h1>{t('patientDirectoryTitle')}</h1>
          <p>{t('patientDirectorySubtitle')}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            className="btn-export-patients-sm"
            onClick={handleExportCsv}
            title="Exporter la liste des patients au format CSV"
          >
            <Download size={16} />
            <span>{lang === 'ar' ? 'تصدير (CSV)' : 'Exporter (CSV)'}</span>
          </button>

          <button 
            className="btn-patient-primary"
            onClick={handleOpenAddModal}
          >
            <Plus size={18} />
            <span>{t('newPatient')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-panel">
          <div className="alert-header">
            <AlertCircle size={18} color="#b91c1c" />
            <h4>Erreur</h4>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* Search Input and Segment Filter Pills - Matching Screenshot */}
      <div className="patients-filters-row">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-gray" />
          <input 
            type="text" 
            className="search-input-field"
            placeholder={t('searchPatientPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-filter-pills">
          <button 
            className={`status-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            {t('allPatients')}
          </button>
          <button 
            className={`status-pill-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            {t('activeStatus')}
          </button>
          <button 
            className={`status-pill-btn ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('INACTIVE')}
          >
            {t('inactiveStatus')}
          </button>
          <button 
            className={`status-pill-btn urgent ${statusFilter === 'URGENT' ? 'active' : ''}`}
            onClick={() => setStatusFilter('URGENT')}
          >
            {t('urgentStatus')}
          </button>
        </div>
      </div>

      {/* Main Directory Table - Matching Screenshot */}
      <div className="patients-directory-card">
        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Chargement des dossiers patients...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-directory-state">
            <Users size={52} />
            <h4>{t('noPatientFound')}</h4>
            <p>{searchQuery ? 'Aucun résultat correspondant.' : 'Commencez par ajouter un premier patient.'}</p>
          </div>
        ) : (
          <div className="patients-table-responsive">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>{t('colId')}</th>
                  <th>{t('colNameDetails')}</th>
                  <th>{t('colStatus')}</th>
                  <th>{t('colLastVisit')}</th>
                  <th>{t('colNextAppointment')}</th>
                  <th style={{ textAlign: 'right' }}>{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => {
                  const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();
                  const age = calculateAge(p.dateOfBirth);
                  const patientApps = patientAppointmentsMap[p.id];
                  const lastVisit = patientApps?.past?.[0] ? formatDate(patientApps.past[0]) : '—';
                  const nextApp = patientApps?.upcoming?.[0] ? formatDateTime(patientApps.upcoming[0]) : t('noneText');

                  return (
                    <tr key={p.id}>
                      {/* ID PATIENT */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#475569', fontFamily: 'monospace', fontSize: '13px' }}>
                          #{p.id}
                        </span>
                      </td>

                      {/* NOM DU PATIENT & DÉTAILS */}
                      <td>
                        <div className="patient-cell-identity">
                          <div className="patient-cell-avatar">
                            {initials}
                          </div>
                          <div>
                            <h4 className="patient-cell-name">
                              {p.firstName} {p.lastName}
                            </h4>
                            <p className="patient-cell-subtext">
                              {p.cin && <span>CIN: {p.cin}</span>}
                              {age !== null && <span>• {age} ans</span>}
                              {p.phone && <span>• {p.phone}</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* STATUT */}
                      <td>
                        <span className="badge-status-pill active">
                          {t('activeStatus')}
                        </span>
                      </td>

                      {/* DERNIÈRE VISITE */}
                      <td>
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                          {lastVisit}
                        </span>
                      </td>

                      {/* PROCHAIN RENDEZ-VOUS */}
                      <td>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: nextApp !== t('noneText') ? 600 : 400,
                          color: nextApp !== t('noneText') ? '#4f46e5' : '#94a3b8' 
                        }}>
                          {nextApp}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="actions-buttons-group" style={{ justifyContent: 'flex-end' }}>
                          {/* EDIT ACTION BUTTON */}
                          <button 
                            className="btn-table-action edit"
                            title={lang === 'ar' ? 'تعديل بيانات المريض' : 'Modifier le dossier'}
                            onClick={() => handleOpenEditModal(p)}
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* DELETE ACTION BUTTON */}
                          <button 
                            className="btn-table-action delete"
                            title={lang === 'ar' ? 'حذف ملف المريض' : 'Supprimer le patient'}
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer showing count */}
        {!loading && filteredPatients.length > 0 && (
          <div className="directory-table-footer">
            <span>
              {t('showingRecords')} {filteredPatients.length} {t('registeredRecords')}
            </span>
          </div>
        )}
      </div>

      {/* Professional Patient Modal (Handles both Add and Edit) */}
      <PatientModal
        isOpen={isModalOpen}
        patient={editingPatient}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPatient(null);
        }}
        onSuccess={() => {
          fetchData();
          setEditingPatient(null);
        }}
      />
    </div>
  );
};

export default Patients;
