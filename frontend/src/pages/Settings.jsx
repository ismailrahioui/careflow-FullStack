import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api';
import { 
  User, 
  Building2, 
  Globe, 
  Save, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Database,
  Lock,
  Layers,
  FileCheck
} from 'lucide-react';
import { 
  exportToCsv, 
  exportToJson, 
  parseCsvText, 
  downloadPatientSampleCsv 
} from '../utils/exportImport';
import './Settings.css';

const CLINIC_TYPES = [
  { value: 'GENERAL_PRACTICE', label: 'Médecine Générale' },
  { value: 'DENTAL', label: 'Cabinet Dentaire' },
  { value: 'PEDIATRICS', label: 'Pédiatrie' },
  { value: 'CARDIOLOGY', label: 'Cardiologie' },
  { value: 'DERMATOLOGY', label: 'Dermatologie' },
  { value: 'GYNECOLOGY', label: 'Gynécologie' },
  { value: 'OPHTHALMOLOGY', label: 'Ophtalmologie' },
  { value: 'ORTHOPEDICS', label: 'Orthopédie' },
  { value: 'NEUROLOGY', label: 'Neurologie' },
  { value: 'ENT', label: 'ORL' },
  { value: 'PSYCHIATRY', label: 'Psychiatrie' },
  { value: 'PHYSIOTHERAPY', label: 'Kinésithérapie' },
  { value: 'OTHER', label: 'Autre spécialité' }
];

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { lang, changeLanguage } = useContext(LanguageContext);

  const [activeTab, setActiveTab] = useState('clinic');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullname: user?.fullName || '',
    username: user?.username || '',
    password: '',
    confirmPassword: ''
  });

  // Clinic Form State
  const [clinicForm, setClinicForm] = useState({
    name: '',
    clinicType: 'GENERAL_PRACTICE',
    phone: '',
    email: '',
    address: '',
    registrationNumber: '',
    logoUrl: ''
  });

  // Import State
  const fileInputRef = useRef(null);
  const [importedRows, setImportedRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);

  // Fetch Clinic Info
  const fetchClinicData = async () => {
    if (!user?.clinicId) return;
    try {
      const res = await api.get(`/clinics/${user.clinicId}`);
      if (res.data) {
        setClinicForm({
          name: res.data.name || '',
          clinicType: res.data.clinicType || 'GENERAL_PRACTICE',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
          registrationNumber: res.data.registrationNumber || '',
          logoUrl: res.data.logoUrl || ''
        });
      }
    } catch (err) {
      console.error('Failed to load clinic settings', err);
    }
  };

  useEffect(() => {
    fetchClinicData();
    if (user?.fullName) {
      setProfileForm(prev => ({ ...prev, fullname: user.fullName, username: user.username }));
    }
  }, [user?.clinicId]);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // 1. Update Profile & Password
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    clearMessages();

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setErrorMessage(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (!profileForm.password) {
      setErrorMessage(lang === 'ar' ? 'يرجى إدخال كلمة المرور لتأكيد التحديث' : 'Veuillez saisir votre mot de passe pour enregistrer les modifications.');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/clinics/${user.clinicId}/users/${user.id}`, {
        fullname: profileForm.fullname,
        username: profileForm.username,
        password: profileForm.password
      });

      // Update local stored user
      const updatedUser = { ...user, fullName: profileForm.fullname, username: profileForm.username };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccessMessage(lang === 'ar' ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profil mis à jour avec succès !');
      setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Update Clinic Parameters
  const handleUpdateClinic = async (e) => {
    e.preventDefault();
    clearMessages();

    try {
      setLoading(true);
      await api.put(`/clinics/${user.clinicId}`, clinicForm);
      setSuccessMessage(lang === 'ar' ? 'تم حفظ إعدادات العيادة بنجاح!' : 'Informations de la clinique enregistrées avec succès !');
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Erreur lors de l’enregistrement de la clinique.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Export Data Handlers
  const handleExportPatients = async () => {
    clearMessages();
    try {
      setLoading(true);
      const res = await api.get(`/clinics/${user.clinicId}/patients`);
      const cols = [
        { key: 'id', label: 'ID' },
        { key: 'firstName', label: 'Prénom' },
        { key: 'lastName', label: 'Nom' },
        { key: 'cin', label: 'CIN' },
        { key: 'phone', label: 'Téléphone' },
        { key: 'dateOfBirth', label: 'Date Naissance' },
        { key: 'gender', label: 'Genre' },
        { key: 'address', label: 'Adresse' },
        { key: 'email', label: 'Email' },
        { key: 'createdAt', label: 'Date Création' }
      ];
      exportToCsv(`careflow_patients_${new Date().toISOString().slice(0, 10)}.csv`, cols, res.data);
      setSuccessMessage(`${res.data.length} patients exportés avec succès.`);
    } catch (err) {
      setErrorMessage('Erreur lors de l’exportation des patients.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportInvoices = async () => {
    clearMessages();
    try {
      setLoading(true);
      const res = await api.get(`/clinics/${user.clinicId}/invoices`);
      const cols = [
        { key: 'id', label: 'ID' },
        { key: 'invoiceNumber', label: 'N° Facture' },
        { key: 'patientId', label: 'ID Patient' },
        { key: 'totalAmount', label: 'Montant Total (MAD)' },
        { key: 'paidAmount', label: 'Montant Payé (MAD)' },
        { key: 'invoiceStatus', label: 'Statut' },
        { key: 'createdAt', label: 'Date' }
      ];
      exportToCsv(`careflow_factures_${new Date().toISOString().slice(0, 10)}.csv`, cols, res.data);
      setSuccessMessage(`${res.data.length} factures exportées avec succès.`);
    } catch (err) {
      setErrorMessage('Erreur lors de l’exportation des factures.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportConsultations = async () => {
    clearMessages();
    try {
      setLoading(true);
      const res = await api.get(`/clinics/${user.clinicId}/consultations`);
      const cols = [
        { key: 'id', label: 'ID' },
        { key: 'appointmentId', label: 'ID RDV' },
        { key: 'diagnosis', label: 'Diagnostic' },
        { key: 'symptoms', label: 'Symptômes' },
        { key: 'treatment', label: 'Traitement' },
        { key: 'notes', label: 'Notes' },
        { key: 'createdAt', label: 'Date' }
      ];
      exportToCsv(`careflow_consultations_${new Date().toISOString().slice(0, 10)}.csv`, cols, res.data);
      setSuccessMessage(`${res.data.length} consultations exportées.`);
    } catch (err) {
      setErrorMessage('Erreur lors de l’exportation des consultations.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportFullBackup = async () => {
    clearMessages();
    try {
      setLoading(true);
      const [clinicRes, patRes, appRes, consRes, invRes, prescRes] = await Promise.all([
        api.get(`/clinics/${user.clinicId}`),
        api.get(`/clinics/${user.clinicId}/patients`),
        api.get(`/clinics/${user.clinicId}/appointments`),
        api.get(`/clinics/${user.clinicId}/consultations`),
        api.get(`/clinics/${user.clinicId}/invoices`),
        api.get(`/clinics/${user.clinicId}/prescriptions`)
      ]);

      const backupPackage = {
        exportDate: new Date().toISOString(),
        clinic: clinicRes.data,
        patients: patRes.data,
        appointments: appRes.data,
        consultations: consRes.data,
        invoices: invRes.data,
        prescriptions: prescRes.data
      };

      exportToJson(`sauvegarde_careflow_clinique_${user.clinicId}_${new Date().toISOString().slice(0, 10)}.json`, backupPackage);
      setSuccessMessage('Sauvegarde complète du système générée avec succès.');
    } catch (err) {
      setErrorMessage('Erreur lors de la génération de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Import Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseCsvText(event.target.result);
        setImportedRows(parsed.rows);
        setSuccessMessage(`Fichier analysé : ${parsed.rows.length} lignes prêtes à être importées.`);
      } catch (err) {
        setErrorMessage(err.message || 'Impossible de lire le fichier CSV.');
        setImportedRows([]);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importedRows.length) return;
    setIsImporting(true);
    clearMessages();

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < importedRows.length; i++) {
      const row = importedRows[i];
      setImportProgress(`Importation : ${i + 1} / ${importedRows.length}...`);
      try {
        const payload = {
          firstName: row.firstname || row.prenom || row['prénom'] || 'Patient',
          lastName: row.lastname || row.nom || 'Inconnu',
          cin: row.cin || '',
          phone: row.phone || row.telephone || row['téléphone'] || '',
          dateOfBirth: row.dateofbirth || row.datenaissance || '2000-01-01',
          gender: (row.gender || row.genre || 'MALE').toUpperCase().includes('F') ? 'FEMALE' : 'MALE',
          address: row.address || row.adresse || '',
          email: row.email || ''
        };
        await api.post(`/clinics/${user.clinicId}/patients`, payload);
        successCount++;
      } catch (err) {
        console.error('Import row error', row, err);
        errorCount++;
      }
    }

    setIsImporting(false);
    setImportProgress(null);
    setImportedRows([]);
    setImportFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    setSuccessMessage(`Importation terminée : ${successCount} patients ajoutés avec succès ! ${errorCount > 0 ? `(${errorCount} erreurs ignorées)` : ''}`);
    window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
  };

  return (
    <div className="settings-page">
      {/* Header Banner */}
      <div className="settings-header-banner">
        <div>
          <h1>{lang === 'ar' ? 'إعدادات النظام والعيادة' : 'Paramètres du Système'}</h1>
          <p>{lang === 'ar' ? 'تخصيص بيانات العيادة، الحساب، واستيراد وتصدير البيانات' : 'Configurez les paramètres de la clinique, votre compte et gérez les flux d\'import/export'}</p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="settings-alert-success">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="settings-alert-error">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="settings-layout-grid">
        {/* Navigation Sidebar */}
        <div className="settings-nav-card">
          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === 'clinic' ? 'active' : ''}`}
            onClick={() => { setActiveTab('clinic'); clearMessages(); }}
          >
            <Building2 size={18} />
            <span>{lang === 'ar' ? 'بيانات العيادة' : 'Paramètres Clinique'}</span>
          </button>

          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveTab('profile'); clearMessages(); }}
          >
            <User size={18} />
            <span>{lang === 'ar' ? 'الملف الشخصي' : 'Profil & Sécurité'}</span>
          </button>

          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => { setActiveTab('preferences'); clearMessages(); }}
          >
            <Globe size={18} />
            <span>{lang === 'ar' ? 'اللغة والتفضيلات' : 'Langue & Affichage'}</span>
          </button>

          <button 
            type="button" 
            className={`settings-tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => { setActiveTab('data'); clearMessages(); }}
          >
            <Database size={18} />
            <span>{lang === 'ar' ? 'استيراد وتصدير البيانات' : 'Import & Export'}</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="settings-content-card">
          {/* TAB 1: CLINIC PARAMETERS */}
          {activeTab === 'clinic' && (
            <div>
              <div className="settings-section-title">
                <div>
                  <h2>{lang === 'ar' ? 'معلومات العيادة الطبية' : 'Identité & Coordonnées du Cabinet'}</h2>
                  <p>{lang === 'ar' ? 'هذه المعلومات تظهر تلقائياً في الفواتير والوصفات الطبية' : 'Ces coordonnées figurent sur vos ordonnances et factures officielles'}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateClinic}>
                <div className="settings-form-grid">
                  <div className="settings-field-group full-width">
                    <label>{lang === 'ar' ? 'اسم العيادة / المركز الطبي *' : 'Nom de la Clinique / Cabinet *'}</label>
                    <input 
                      type="text" 
                      value={clinicForm.name} 
                      onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="settings-field-group">
                    <label>{lang === 'ar' ? 'التخصص الطبي *' : 'Spécialité Médicale *'}</label>
                    <select 
                      value={clinicForm.clinicType}
                      onChange={(e) => setClinicForm({ ...clinicForm, clinicType: e.target.value })}
                    >
                      {CLINIC_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-field-group">
                    <label>{lang === 'ar' ? 'رقم الترخيص / السجل التجاري *' : 'Numéro d’agrément / Licence *'}</label>
                    <input 
                      type="text" 
                      value={clinicForm.registrationNumber}
                      onChange={(e) => setClinicForm({ ...clinicForm, registrationNumber: e.target.value })}
                      placeholder="Ex: REG-2026-CASABLANCA"
                      required
                    />
                  </div>

                  <div className="settings-field-group">
                    <label>{lang === 'ar' ? 'رقم الهاتف *' : 'Téléphone Professionnel *'}</label>
                    <input 
                      type="text" 
                      value={clinicForm.phone}
                      onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                      placeholder="+212 522 00 00 00"
                      required
                    />
                  </div>

                  <div className="settings-field-group">
                    <label>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email de contact'}</label>
                    <input 
                      type="email" 
                      value={clinicForm.email}
                      onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                      placeholder="contact@careflow.ma"
                    />
                  </div>

                  <div className="settings-field-group full-width">
                    <label>{lang === 'ar' ? 'عنوان العيادة *' : 'Adresse du Cabinet *'}</label>
                    <textarea 
                      rows="2"
                      value={clinicForm.address}
                      onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                      placeholder="Ex: Boulevard d'Anfa, Casablanca, Maroc"
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="settings-footer-actions">
                  <button type="submit" className="btn-settings-save" disabled={loading}>
                    <Save size={16} />
                    <span>{loading ? 'Enregistrement...' : (lang === 'ar' ? 'حفظ إعدادات العيادة' : 'Enregistrer la clinique')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PROFILE & SECURITY */}
          {activeTab === 'profile' && (
            <div>
              <div className="settings-section-title">
                <div>
                  <h2>{lang === 'ar' ? 'الملف الشخصي وحساب الدخول' : 'Profil Personnel & Sécurité'}</h2>
                  <p>{lang === 'ar' ? 'تعديل الاسم وتحديث كلمة المرور' : 'Mettez à jour vos identifiants d’accès et mot de passe'}</p>
                </div>
                <span className="role-pill-badge">{user?.role || 'Utilisateur'}</span>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="settings-form-grid">
                  <div className="settings-field-group">
                    <label>{lang === 'ar' ? 'الاسم الكامل *' : 'Nom Complet *'}</label>
                    <input 
                      type="text" 
                      value={profileForm.fullname}
                      onChange={(e) => setProfileForm({ ...profileForm, fullname: e.target.value })}
                      required
                    />
                  </div>

                  <div className="settings-field-group">
                    <label>{lang === 'ar' ? 'اسم المستخدم (تسجيل الدخول)' : 'Identifiant (Nom d’utilisateur)'}</label>
                    <input 
                      type="text" 
                      value={profileForm.username}
                      disabled
                    />
                  </div>

                  <div className="settings-field-group">
                    <label>{lang === 'ar' ? 'كلمة المرور الجديدة *' : 'Nouveau Mot de passe *'}</label>
                    <input 
                      type="password" 
                      value={profileForm.password}
                      onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="settings-field-group">
                    <label>{lang === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirmer le Mot de passe *'}</label>
                    <input 
                      type="password" 
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="settings-footer-actions">
                  <button type="submit" className="btn-settings-save" disabled={loading}>
                    <Lock size={16} />
                    <span>{loading ? 'Mise à jour...' : (lang === 'ar' ? 'تحديث كلمة المرور' : 'Mettre à jour le profil')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PREFERENCES & LANGUAGE */}
          {activeTab === 'preferences' && (
            <div>
              <div className="settings-section-title">
                <div>
                  <h2>{lang === 'ar' ? 'اللغة والعرض' : 'Langue & Préférences d\'Affichage'}</h2>
                  <p>{lang === 'ar' ? 'تخصيص الواجهة وتجربة الاستخدام' : 'Sélectionnez la langue principale de votre espace CareFlow'}</p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field-group">
                  <label>{lang === 'ar' ? 'لغة الواجهة' : 'Langue de l’interface'}</label>
                  <select 
                    value={lang} 
                    onChange={(e) => changeLanguage(e.target.value)}
                  >
                    <option value="fr">Français (FR)</option>
                    <option value="ar">العربية (AR - الاتجاه من اليمين)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IMPORT & EXPORT HUB */}
          {activeTab === 'data' && (
            <div>
              <div className="settings-section-title">
                <div>
                  <h2>{lang === 'ar' ? 'مركز استيراد وتصدير البيانات' : 'Centre d\'Exportation & Importation'}</h2>
                  <p>{lang === 'ar' ? 'تصدير الجداول إلى CSV والنسخ الاحتياطي واستيراد المرضى' : 'Sauvegardez vos données en un clic ou importez des fichiers CSV'}</p>
                </div>
              </div>

              {/* EXPORT CARDS */}
              <h3 style={{ fontSize: '15px', color: '#334155', margin: '0 0 14px 0' }}>
                {lang === 'ar' ? 'تصدير البيانات (CSV / JSON)' : '1. Exporter vos données cliniques'}
              </h3>
              <div className="export-cards-grid">
                <div className="export-card-item">
                  <div className="export-card-top">
                    <div className="export-icon-box green">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="export-card-info">
                      <h4>{lang === 'ar' ? 'تصدير المرضى' : 'Dossiers Patients'}</h4>
                      <p>Format CSV (Excel) complet avec identités, CIN et contacts.</p>
                    </div>
                  </div>
                  <button type="button" className="btn-export-trigger" onClick={handleExportPatients} disabled={loading}>
                    <Download size={14} /> Exporter les Patients (.csv)
                  </button>
                </div>

                <div className="export-card-item">
                  <div className="export-card-top">
                    <div className="export-icon-box blue">
                      <FileText size={20} />
                    </div>
                    <div className="export-card-info">
                      <h4>{lang === 'ar' ? 'تصدير الفواتير' : 'Facturation & Paiements'}</h4>
                      <p>Données financières, montants totaux, paiements et statuts.</p>
                    </div>
                  </div>
                  <button type="button" className="btn-export-trigger" onClick={handleExportInvoices} disabled={loading}>
                    <Download size={14} /> Exporter Factures (.csv)
                  </button>
                </div>

                <div className="export-card-item">
                  <div className="export-card-top">
                    <div className="export-icon-box purple">
                      <Layers size={20} />
                    </div>
                    <div className="export-card-info">
                      <h4>{lang === 'ar' ? 'تصدير الاستشارات' : 'Consultations Médicales'}</h4>
                      <p>Historique des diagnostics, symptômes observés et notes.</p>
                    </div>
                  </div>
                  <button type="button" className="btn-export-trigger" onClick={handleExportConsultations} disabled={loading}>
                    <Download size={14} /> Exporter Consultations (.csv)
                  </button>
                </div>

                <div className="export-card-item">
                  <div className="export-card-top">
                    <div className="export-icon-box amber">
                      <Database size={20} />
                    </div>
                    <div className="export-card-info">
                      <h4>{lang === 'ar' ? 'نسخة احتياطية كاملة' : 'Sauvegarde Système (JSON)'}</h4>
                      <p>Sauvegarde intégrale (Clinique, RDV, Consultations, Factures).</p>
                    </div>
                  </div>
                  <button type="button" className="btn-export-trigger" onClick={handleExportFullBackup} disabled={loading}>
                    <Download size={14} /> Télécharger Sauvegarde (.json)
                  </button>
                </div>
              </div>

              {/* IMPORT SECTION */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', color: '#334155', margin: 0 }}>
                    {lang === 'ar' ? 'استيراد المرضى عبر CSV' : '2. Importer des Patients (Fichier CSV)'}
                  </h3>
                  <button 
                    type="button" 
                    onClick={downloadPatientSampleCsv}
                    style={{ background: 'transparent', border: 'none', color: '#0c3888', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FileCheck size={15} /> Télécharger le modèle CSV
                  </button>
                </div>

                <div className="import-section-wrapper">
                  <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />

                  <div className="import-dropzone" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={32} color="#0c3888" />
                    <h4>{importFileName ? importFileName : (lang === 'ar' ? 'اختر ملف CSV لتحميله' : 'Sélectionnez ou glissez un fichier CSV')}</h4>
                    <p>{lang === 'ar' ? 'يجب أن يحتوي الملف على الأعمدة: firstName, lastName, phone, cin...' : 'Colonnes attendues : firstName, lastName, cin, phone, dateOfBirth, gender, email, address'}</p>
                  </div>

                  {/* PREVIEW TABLE */}
                  {importedRows.length > 0 && (
                    <div className="import-preview-box">
                      <div className="import-preview-header">
                        <h5>Aperçu des données ({importedRows.length} lignes trouvées)</h5>
                        <button 
                          type="button" 
                          className="btn-settings-save" 
                          style={{ padding: '6px 16px', fontSize: '13px' }}
                          onClick={handleExecuteImport}
                          disabled={isImporting}
                        >
                          {isImporting ? <RefreshCw className="spin" size={14} /> : <CheckCircle2 size={14} />}
                          <span>{isImporting ? importProgress : 'Lancer l’importation'}</span>
                        </button>
                      </div>

                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        <table className="import-preview-table">
                          <thead>
                            <tr>
                              <th>Prénom</th>
                              <th>Nom</th>
                              <th>CIN</th>
                              <th>Téléphone</th>
                              <th>Genre</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importedRows.slice(0, 10).map((r, i) => (
                              <tr key={i}>
                                <td>{r.firstname || r.prenom || '—'}</td>
                                <td>{r.lastname || r.nom || '—'}</td>
                                <td>{r.cin || '—'}</td>
                                <td>{r.phone || r.telephone || '—'}</td>
                                <td>{r.gender || r.genre || 'MALE'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
