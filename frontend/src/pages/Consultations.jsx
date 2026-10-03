import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api';
import { 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit2, 
  X, 
  FileText, 
  AlertCircle,
  Stethoscope,
  Pill,
  Printer,
  PlusCircle
} from 'lucide-react';
import './Consultations.css';
import '../components/Modal.css';

const initialFormData = {
  patientId: '',
  appointmentId: '',
  symptoms: '',
  diagnosis: '',
  treatment: '',
  notes: ''
};

const Consultations = () => {
  const { user } = useContext(AuthContext);
  const { lang } = useContext(LanguageContext);

  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Consultation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Prescription Sheet / View Modal State
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [viewingItems, setViewingItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchData = async () => {
    if (!user?.clinicId) return;
    try {
      setLoading(true);
      const [consRes, patRes, appRes, prescRes] = await Promise.all([
        api.get(`/clinics/${user.clinicId}/consultations`),
        api.get(`/clinics/${user.clinicId}/patients`),
        api.get(`/clinics/${user.clinicId}/appointments`),
        api.get(`/clinics/${user.clinicId}/prescriptions`)
      ]);
      setConsultations(consRes.data);
      setPatients(patRes.data);
      setAppointments(appRes.data);
      setPrescriptions(prescRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load consultations', err);
      setError('Impossible de charger les dossiers de consultation.');
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

  // Patients map
  const patientsMap = useMemo(() => {
    const map = {};
    patients.forEach(p => { map[p.id] = p; });
    return map;
  }, [patients]);

  // Appointments map
  const appointmentsMap = useMemo(() => {
    const map = {};
    appointments.forEach(a => { map[a.id] = a; });
    return map;
  }, [appointments]);

  // Prescriptions by Consultation ID map
  const prescriptionsByConsultationId = useMemo(() => {
    const map = {};
    prescriptions.forEach(p => {
      map[p.consultationId] = p;
    });
    return map;
  }, [prescriptions]);

  // Filtered consultations
  const filteredConsultations = useMemo(() => {
    return consultations.filter((c) => {
      // Date filter
      if (filterDate) {
        if (!c.createdAt) return false;
        const cDate = new Date(c.createdAt).toISOString().split('T')[0];
        if (cDate !== filterDate) return false;
      }

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const app = appointmentsMap[c.appointmentId];
      const patient = app ? patientsMap[app.patientId] : null;
      const patientName = patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : '';
      const doctorName = (c.doctorName || '').toLowerCase();
      const diag = (c.diagnosis || '').toLowerCase();
      const symp = (c.symptoms || '').toLowerCase();

      return patientName.includes(q) || doctorName.includes(q) || diag.includes(q) || symp.includes(q);
    });
  }, [consultations, filterDate, searchQuery, appointmentsMap, patientsMap]);

  // Weekly count
  const weeklyCount = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return consultations.filter(c => c.createdAt && new Date(c.createdAt) >= oneWeekAgo).length;
  }, [consultations]);

  const handleOpenAddModal = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setPrescriptionItems([]);
    setPrescriptionNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (c) => {
    setFormData({
      patientId: '',
      appointmentId: c.appointmentId || '',
      symptoms: c.symptoms || '',
      diagnosis: c.diagnosis || '',
      treatment: c.treatment || '',
      notes: c.notes || ''
    });
    setEditingId(c.id);
    setModalError(null);

    const existingPresc = prescriptionsByConsultationId[c.id];
    if (existingPresc) {
      setPrescriptionNotes(existingPresc.notes || '');
      try {
        const itemsRes = await api.get(`/clinics/${user.clinicId}/prescriptions/${existingPresc.id}/items`);
        setPrescriptionItems(itemsRes.data || []);
      } catch (err) {
        console.error('Failed to load prescription items', err);
        setPrescriptionItems([]);
      }
    } else {
      setPrescriptionNotes('');
      setPrescriptionItems([]);
    }

    setIsModalOpen(true);
  };

  const handleAddMedicationRow = () => {
    setPrescriptionItems(prev => [
      ...prev,
      {
        id: 'temp_' + Date.now(),
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  const handleUpdateMedicationItem = (index, field, value) => {
    setPrescriptionItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveMedicationItem = async (index) => {
    const item = prescriptionItems[index];
    if (item.prescriptionId && item.id && !String(item.id).startsWith('temp_')) {
      try {
        await api.delete(`/clinics/${user.clinicId}/prescriptions/${item.prescriptionId}/items/${item.id}`);
      } catch (err) {
        console.error('Failed to delete item from backend', err);
      }
    }
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleViewPrescription = async (presc, c) => {
    const app = appointmentsMap[c.appointmentId];
    const patient = app ? patientsMap[app.patientId] : null;
    setViewingPrescription({ ...presc, consultation: c, patient });
    setLoadingItems(true);
    setIsPrescriptionModalOpen(true);
    try {
      const res = await api.get(`/clinics/${user.clinicId}/prescriptions/${presc.id}/items`);
      setViewingItems(res.data || []);
    } catch (err) {
      console.error('Failed to load prescription items', err);
      setViewingItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      let consultationId = editingId;
      const app = appointments.find(a => a.id === parseInt(formData.appointmentId, 10));
      const targetPatientId = app ? app.patientId : null;

      // Ensure treatment has text if required
      const submitData = {
        ...formData,
        treatment: formData.treatment?.trim() 
          ? formData.treatment 
          : (prescriptionItems.length > 0 
              ? prescriptionItems.map(p => p.medicationName).filter(Boolean).join(', ') 
              : 'Traitement selon prescription médicale')
      };

      if (editingId) {
        await api.put(`/clinics/${user.clinicId}/consultations/${editingId}`, submitData);
      } else {
        const res = await api.post(`/clinics/${user.clinicId}/consultations`, submitData);
        consultationId = res.data.id;
      }

      // Handle prescription and items
      const validItems = prescriptionItems.filter(p => p.medicationName && p.medicationName.trim());
      if (validItems.length > 0 && consultationId && targetPatientId) {
        let currentPresc = prescriptionsByConsultationId[consultationId];
        if (!currentPresc) {
          const prescRes = await api.post(`/clinics/${user.clinicId}/prescriptions`, {
            patientId: targetPatientId,
            consultationId: consultationId,
            prescriptionDate: new Date().toISOString().slice(0, 19),
            notes: prescriptionNotes || formData.diagnosis || 'Ordonnance médicale'
          });
          currentPresc = prescRes.data;
        }

        if (currentPresc && currentPresc.id) {
          for (const item of validItems) {
            // If newly added
            if (!item.prescriptionId || String(item.id).startsWith('temp_')) {
              await api.post(`/clinics/${user.clinicId}/prescriptions/${currentPresc.id}/items`, {
                medicationName: item.medicationName.trim(),
                dosage: (item.dosage || 'Standard').trim(),
                frequency: (item.frequency || '1x / jour').trim(),
                duration: (item.duration || 'Selon besoin').trim(),
                instructions: (item.instructions || 'Suivre avis médical').trim()
              });
            }
          }
        }
      }

      setIsModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      console.error('Error saving consultation or prescription', err);
      setModalError(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de l’enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous supprimer cette consultation ?')) return;
    try {
      await api.delete(`/clinics/${user.clinicId}/consultations/${id}`);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div>
      {/* Header Row - Matching Screenshot 2 */}
      <div className="consultations-header-row">
        <div className="consultations-header-title">
          <h1>{lang === 'ar' ? 'ملفات الاستشارة الطبية' : 'Dossiers de consultation'}</h1>
          <p>{lang === 'ar' ? 'إنشاء ومتابعة الفحوصات الطبية والوصفات الرقمية' : 'Créer, suivre et consulter les examens médicaux et ordonnances numériques'}</p>
        </div>

        <button className="btn-new-consultation" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>{lang === 'ar' ? 'استشارة جديدة' : ' Nouvelle consultation'}</span>
        </button>
      </div>

      {/* Filter Bar: Search on Left + Date Picker & Clear on Right */}
      <div className="consultations-filter-bar">
        <div className="consultations-search-box">
          <Search size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
          <input 
            type="text" 
            placeholder={lang === 'ar' ? 'بحث بالملاحظات، التشخيص، المريض أو الطبيب...' : 'Rechercher par note, diagnostic, patient ou médecin...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="consultations-date-filters">
          <div className="date-input-wrapper">
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
            />
          </div>
          {filterDate && (
            <button className="btn-clear-date" onClick={() => setFilterDate('')}>
              {lang === 'ar' ? 'مسح' : 'Effacer'}
            </button>
          )}
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

      {/* Two Column Layout Grid */}
      <div className="consultations-layout-grid">
        {/* Left Column: Consultations Table */}
        <div className="consultations-table-card">
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
              Chargement des dossiers de consultation...
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <Stethoscope size={52} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <h4 style={{ color: '#334155', margin: '0 0 6px 0' }}>
                {lang === 'ar' ? 'لا توجد استشارات مسجلة' : 'Aucune consultation enregistrée'}
              </h4>
              <p style={{ margin: 0, fontSize: '14px' }}>
                {searchQuery || filterDate ? 'Aucun résultat ne correspond à vos filtres.' : 'Créez une première consultation pour débuter.'}
              </p>
            </div>
          ) : (
            <table className="consultations-table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'المريض والمعلومات' : 'Patient & Infos'}</th>
                  <th>{lang === 'ar' ? 'تاريخ الاستشارة' : 'Date de consultation'}</th>
                  <th>{lang === 'ar' ? 'الطبيب المعالج' : 'Médecin traitant'}</th>
                  <th style={{ textAlign: 'right' }}>{lang === 'ar' ? 'الإجراءات' : 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsultations.map((c) => {
                  const app = appointmentsMap[c.appointmentId];
                  const patient = app ? patientsMap[app.patientId] : null;
                  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : (c.patientName || `Patient #${c.patientId || app?.patientId || '—'}`);
                  const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  }) : '—';
                  const presc = prescriptionsByConsultationId[c.id];

                  return (
                    <tr key={c.id}>
                      <td>
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '14px' }}>{patientName}</strong>
                          <p style={{ margin: '3px 0 6px 0', fontSize: '12px', color: '#64748b' }}>
                            {c.diagnosis || c.symptoms || 'Examen clinique de routine'}
                          </p>
                          {presc ? (
                            <button 
                              type="button" 
                              className="btn-badge-presc"
                              onClick={() => handleViewPrescription(presc, c)}
                              title="Voir l'ordonnance médicale"
                            >
                              <FileText size={13} />
                              <span>{lang === 'ar' ? 'الوصفة الطبية' : 'Ordonnance'}</span>
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              className="btn-badge-add-presc"
                              onClick={() => handleOpenEditModal(c)}
                              title="Ajouter une ordonnance"
                            >
                              <Plus size={11} />
                              <span>{lang === 'ar' ? '+ وصفة طبية' : '+ Ordonnance'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                          {dateStr}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#0c3888', fontWeight: 600 }}>
                          Dr. {c.doctorName || user?.username || 'aa'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn-table-action" onClick={() => handleOpenEditModal(c)} title="Modifier">
                            <Edit2 size={15} />
                          </button>
                          <button className="btn-table-action delete" onClick={() => handleDelete(c.id)} title="Supprimer">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column: 3 Widgets from Screenshot 2 */}
        <div className="consultations-sidebar-col">
          {/* Card 1: WEEKLY SUMMARY */}
          <div className="weekly-summary-card">
            <p className="summary-card-label">{lang === 'ar' ? 'ملخص الأسبوع' : 'WEEKLY SUMMARY'}</p>
            <div className="summary-big-count">
              <h2>{weeklyCount}</h2>
              <span>{lang === 'ar' ? 'استشارات' : 'consultations'}</span>
            </div>
            <div className="summary-progress-bar">
              <div className="summary-progress-fill" style={{ width: `${Math.min(100, weeklyCount * 15)}%` }}></div>
            </div>
            <p className="summary-subtext">
              {weeklyCount === 0 ? (lang === 'ar' ? 'لا يوجد نشاط' : 'No activity') : `${weeklyCount} cette semaine`}
            </p>
          </div>

          {/* Card 2: PENDING SIGN-OFFS */}
          <div className="pending-signoffs-card">
            <p className="summary-card-label">{lang === 'ar' ? 'في انتظار المصادقة' : 'PENDING SIGN-OFFS'}</p>
            <div className="pending-item-row">
              <span>{lang === 'ar' ? 'نتائج التحاليل' : 'Lab Results'}</span>
              <span className="pending-badge pink">3</span>
            </div>
            <div className="pending-item-row">
              <span>{lang === 'ar' ? 'الوصفات الطبية' : 'Prescriptions'}</span>
              <span className="pending-badge blue">{prescriptions.length}</span>
            </div>
          </div>

          {/* Card 3: Need a consultation CTA */}
          <div className="consultation-cta-card">
            <h4>{lang === 'ar' ? 'بحاجة إلى استشارة؟' : 'Need a consultation?'}</h4>
            <p>{lang === 'ar' ? 'أنشئ استشارة جديدة سريعاً وأرفق الوصفات الطبية للمريض.' : 'Quickly create a new consultation and attach prescription notes.'}</p>
            <button className="btn-start-consultation" onClick={handleOpenAddModal}>
              + {lang === 'ar' ? 'بدء استشارة' : 'Start Consultation'}
            </button>
          </div>
        </div>
      </div>

      {/* Unified Professional Consultation Modal */}
      {isModalOpen && (
        <div className="careflow-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="careflow-modal-window" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            {/* Royal Blue Top Header */}
            <div className="careflow-modal-header">
              <div className="careflow-modal-title">
                <h2>{editingId ? (lang === 'ar' ? 'تعديل الاستشارة والوصفة' : 'Modifier la consultation & ordonnance') : (lang === 'ar' ? 'ملف استشارة جديد' : 'Nouvelle consultation')}</h2>
                <p>{lang === 'ar' ? 'أدخل التشخيص، الأعراض والوصفة الطبية' : 'Renseigner le diagnostic, les symptômes et la prescription médicale'}</p>
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
                    <label>{lang === 'ar' ? 'الموعد المرتبط *' : 'Rendez-vous associé *'}</label>
                    <select 
                      value={formData.appointmentId} 
                      onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                      required
                    >
                      <option value="">-- {lang === 'ar' ? 'اختر الموعد' : 'Choisir un rendez-vous'} --</option>
                      {appointments.map(a => {
                        const pat = patientsMap[a.patientId];
                        return (
                          <option key={a.id} value={a.id}>
                            RDV #{a.id} - {pat ? `${pat.firstName} ${pat.lastName}` : `Patient #${a.patientId}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'الأعراض الملاحظة *' : 'Symptômes observés *'}</label>
                    <textarea 
                      rows="2" 
                      value={formData.symptoms} 
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      required
                      placeholder="Ex: Céphalées, fièvre, toux..."
                    ></textarea>
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'التشخيص الطبي *' : 'Diagnostic médical *'}</label>
                    <textarea 
                      rows="2" 
                      value={formData.diagnosis} 
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      required
                      placeholder="Ex: Rhinopharyngite aiguë, contrôle de routine..."
                    ></textarea>
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'ملاحظات العلاج' : 'Remarques & Traitement général'}</label>
                    <textarea 
                      rows="2" 
                      value={formData.treatment} 
                      onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                      placeholder="Ex: Repos au lit, hydratation régulière..."
                    ></textarea>
                  </div>

                  {/* Prescription Section with items */}
                  <div className="prescription-section-box">
                    <div className="prescription-section-header">
                      <div className="prescription-section-title">
                        <Pill size={18} color="#0c3888" />
                        <div>
                          <h4>{lang === 'ar' ? 'الوصفة الطبية والأدوية' : 'Ordonnance & Médicaments'}</h4>
                          <p>{lang === 'ar' ? 'حدد الأدوية، الجرعات والمدة' : 'Ajoutez les médicaments prescrits avec posologie et durée'}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="btn-add-item-sm"
                        onClick={handleAddMedicationRow}
                      >
                        <Plus size={14} />
                        <span>{lang === 'ar' ? 'إضافة دواء' : 'Ajouter un médicament'}</span>
                      </button>
                    </div>

                    {prescriptionItems.length === 0 ? (
                      <div className="prescription-empty-hint" onClick={handleAddMedicationRow}>
                        <PlusCircle size={18} color="#94a3b8" />
                        <span>{lang === 'ar' ? 'انقر هنا لإضافة أدوية إلى الوصفة الطبية' : 'Aucun médicament ajouté. Cliquez pour ajouter un médicament à l’ordonnance.'}</span>
                      </div>
                    ) : (
                      <div className="prescription-items-list">
                        {prescriptionItems.map((item, idx) => (
                          <div key={item.id || idx} className="prescription-item-card">
                            <div className="prescription-item-card-top">
                              <span className="item-number-badge">#{idx + 1}</span>
                              <button 
                                type="button" 
                                className="btn-item-delete"
                                onClick={() => handleRemoveMedicationItem(idx)}
                                title="Supprimer ce médicament"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="prescription-item-grid">
                              <div className="prescription-input-group full">
                                <label>{lang === 'ar' ? 'اسم الدواء *' : 'Nom du Médicament *'}</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Amoxicilline, Doliprane, Augmentin..."
                                  value={item.medicationName || ''}
                                  onChange={(e) => handleUpdateMedicationItem(idx, 'medicationName', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="prescription-input-group">
                                <label>{lang === 'ar' ? 'الجرعة (Dosage) *' : 'Dosage *'}</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: 500mg, 1g, 1 comprimé"
                                  value={item.dosage || ''}
                                  onChange={(e) => handleUpdateMedicationItem(idx, 'dosage', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="prescription-input-group">
                                <label>{lang === 'ar' ? 'التردد (Fréquence) *' : 'Fréquence *'}</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: 3x / jour, Matin et Soir"
                                  value={item.frequency || ''}
                                  onChange={(e) => handleUpdateMedicationItem(idx, 'frequency', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="prescription-input-group">
                                <label>{lang === 'ar' ? 'المدة (Durée) *' : 'Durée *'}</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: 5 jours, 10 jours, 1 mois"
                                  value={item.duration || ''}
                                  onChange={(e) => handleUpdateMedicationItem(idx, 'duration', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="prescription-input-group">
                                <label>{lang === 'ar' ? 'تعليمات الاستخدام *' : 'Instructions *'}</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Après les repas, À jeun, Au coucher"
                                  value={item.instructions || ''}
                                  onChange={(e) => handleUpdateMedicationItem(idx, 'instructions', e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="careflow-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : (lang === 'ar' ? 'حفظ الاستشارة والوصفة' : 'Enregistrer la consultation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Prescription Sheet Modal */}
      {isPrescriptionModalOpen && viewingPrescription && (
        <div className="careflow-modal-overlay" onClick={() => setIsPrescriptionModalOpen(false)}>
          <div className="careflow-modal-window" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="careflow-modal-header">
              <div className="careflow-modal-title">
                <h2>{lang === 'ar' ? 'الوصفة الطبية الرسمية' : 'Ordonnance Médicale'}</h2>
                <p>N° PRESC-{viewingPrescription.id} • {viewingPrescription.patient ? `${viewingPrescription.patient.firstName} ${viewingPrescription.patient.lastName}` : ''}</p>
              </div>
              <button className="careflow-modal-close" onClick={() => setIsPrescriptionModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="careflow-modal-body" style={{ background: '#ffffff', padding: '28px' }}>
              <div className="rx-clinic-banner">
                <div className="rx-clinic-logo">
                  <h2>CareFlow Clinic</h2>
                  <p>Cabinet Médical & Soins Spécialisés</p>
                </div>
                <div className="rx-meta-info">
                  <strong>Dr. {viewingPrescription.createdBy || user?.username || 'Médecin Traitant'}</strong>
                  <div>Date : {viewingPrescription.prescriptionDate ? new Date(viewingPrescription.prescriptionDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div className="rx-patient-info-box">
                <div>
                  <strong>Patient : </strong>
                  <span>{viewingPrescription.patient ? `${viewingPrescription.patient.firstName} ${viewingPrescription.patient.lastName}` : `Patient #${viewingPrescription.patientId}`}</span>
                </div>
                <div>
                  <strong>CIN : </strong>
                  <span>{viewingPrescription.patient?.cin || '—'}</span>
                </div>
              </div>

              <div className="rx-symbol">Rx</div>

              {loadingItems ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Chargement des médicaments...</div>
              ) : viewingItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Aucun médicament détaillé pour cette ordonnance.
                </div>
              ) : (
                <table className="rx-items-table">
                  <thead>
                    <tr>
                      <th>Médicament</th>
                      <th>Posologie</th>
                      <th>Fréquence</th>
                      <th>Durée</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingItems.map(item => (
                      <tr key={item.id}>
                        <td><strong style={{ color: '#0c3888' }}>{item.medicationName}</strong></td>
                        <td>{item.dosage}</td>
                        <td>{item.frequency}</td>
                        <td>{item.duration}</td>
                        <td><span style={{ color: '#64748b', fontStyle: 'italic' }}>{item.instructions}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {viewingPrescription.notes && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#475569', marginTop: '12px' }}>
                  <strong>Notes : </strong> {viewingPrescription.notes}
                </div>
              )}

              <div className="rx-signature-block">
                <div className="rx-signature-box">
                  Signature & Cachet du Médecin
                </div>
              </div>
            </div>

            <div className="careflow-modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setIsPrescriptionModalOpen(false)}>
                {lang === 'ar' ? 'إغلاق' : 'Fermer'}
              </button>
              <button 
                type="button" 
                className="btn-modal-submit"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>{lang === 'ar' ? 'طباعة الوصفة' : 'Imprimer l’ordonnance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultations;
