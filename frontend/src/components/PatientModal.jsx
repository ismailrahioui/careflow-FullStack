import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api';
import { X, AlertCircle } from 'lucide-react';
import './PatientModal.css';

const initialFormData = {
  firstName: '',
  lastName: '',
  cin: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  gender: 'MALE',
  email: '',
  notes: ''
};

const PatientModal = ({ isOpen, onClose, onSuccess, patient = null }) => {
  const { user } = useContext(AuthContext);
  const { lang } = useContext(LanguageContext);

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync formData with incoming patient when editing
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        cin: patient.cin || '',
        phone: patient.phone || '',
        dateOfBirth: patient.dateOfBirth || '',
        address: patient.address || '',
        gender: patient.gender || 'MALE',
        email: patient.email || '',
        notes: patient.notes || ''
      });
    } else {
      setFormData(initialFormData);
    }
    setError(null);
  }, [patient, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isEditMode = Boolean(patient && patient.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      cin: formData.cin,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      address: formData.address,
      gender: formData.gender,
      email: formData.email
    };

    try {
      if (isEditMode) {
        await api.put(`/clinics/${user.clinicId}/patients/${patient.id}`, payload);
      } else {
        await api.post(`/clinics/${user.clinicId}/patients`, payload);
      }

      setFormData(initialFormData);
      if (onSuccess) onSuccess();
      // Notify components to refresh data
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
      onClose();
    } catch (err) {
      console.error('Failed to save patient', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de l’enregistrement du patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="patient-modal-overlay" onClick={onClose}>
      <div className="patient-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Royal Blue Top Banner (Matching Screenshot) */}
        <div className="patient-modal-header">
          <div className="patient-modal-title">
            <h2>
              {isEditMode 
                ? (lang === 'ar' ? 'تعديل ملف المريض' : lang === 'en' ? 'Edit Patient File' : 'Modifier le dossier patient')
                : (lang === 'ar' ? 'تسجيل مريض جديد' : lang === 'en' ? 'Register New Patient' : 'Enregistrer un nouveau patient')}
            </h2>
            <p>
              {isEditMode
                ? (lang === 'ar' ? 'تحديث معلومات الهوية، بيانات الاتصال والملف الطبي' : lang === 'en' ? 'Update identity, contact details, and medical file' : "Mettre à jour l'identité et les coordonnées du patient")
                : (lang === 'ar' ? 'أدخل معلومات الهوية، بيانات الاتصال والملف الطبي' : lang === 'en' ? 'Enter identity, contact details, and medical file' : "Renseigner l'identité, les coordonnées et le dossier médical")}
            </p>
          </div>
          <button className="patient-modal-close" onClick={onClose} title="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="patient-modal-body">
            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '13px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="patient-form-container">
              {/* Prénom & Nom */}
              <div className="form-row-grid">
                <div className="form-field-group">
                  <label>{lang === 'ar' ? 'الاسم الشخصي *' : lang === 'en' ? 'First Name *' : 'Prénom *'}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Ahmed"
                  />
                </div>
                <div className="form-field-group">
                  <label>{lang === 'ar' ? 'الاسم العائلي *' : lang === 'en' ? 'Last Name *' : 'Nom complet / Nom *'}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Bennani"
                  />
                </div>
              </div>

              {/* CIN & Téléphone */}
              <div className="form-row-grid">
                <div className="form-field-group">
                  <label>{lang === 'ar' ? 'رقم الهوية (CIN) *' : lang === 'en' ? 'National ID (CIN) *' : "Numéro d'identité (CIN) *"}</label>
                  <input
                    type="text"
                    name="cin"
                    value={formData.cin}
                    onChange={handleChange}
                    required
                    placeholder="Ex: AB123456"
                  />
                </div>
                <div className="form-field-group">
                  <label>{lang === 'ar' ? 'رقم الهاتف' : lang === 'en' ? 'Phone Number' : 'Numéro de téléphone'}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0612345678"
                  />
                </div>
              </div>

              {/* Date de naissance & Genre */}
              <div className="form-row-grid">
                <div className="form-field-group">
                  <label>{lang === 'ar' ? 'تاريخ الازدياد *' : lang === 'en' ? 'Date of Birth *' : 'Date de naissance *'}</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field-group">
                  <label>{lang === 'ar' ? 'الجنس *' : lang === 'en' ? 'Gender *' : 'Genre *'}</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="MALE">{lang === 'ar' ? 'ذكر' : lang === 'en' ? 'Male' : 'Homme'}</option>
                    <option value="FEMALE">{lang === 'ar' ? 'أنثى' : lang === 'en' ? 'Female' : 'Femme'}</option>
                    <option value="OTHER">{lang === 'ar' ? 'آخر' : lang === 'en' ? 'Other' : 'Autre'}</option>
                  </select>
                </div>
              </div>

              {/* Adresse */}
              <div className="form-field-group full-width">
                <label>{lang === 'ar' ? 'العنوان *' : lang === 'en' ? 'Address *' : 'Adresse *'}</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Adresse de résidence..."
                />
              </div>

              {/* Email */}
              <div className="form-field-group full-width">
                <label>{lang === 'ar' ? 'البريد الإلكتروني' : lang === 'en' ? 'Email' : 'Email'}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="patient@exemple.com"
                />
              </div>

              {/* Champs spécifiques au cabinet (Matching Screenshot Box) */}
              <div className="clinic-specific-box">
                <h4>{lang === 'ar' ? 'حقول خاصة بالعيادة' : lang === 'en' ? 'Clinic Specific Fields' : 'Champs spécifiques au cabinet'}</h4>
                <div className="form-field-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder={lang === 'ar' ? 'ملاحظات طبية خاصة، سوابق أو حساسية...' : "Remarques médicales, antécédents ou allergies..."}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer with Action Buttons */}
          <div className="patient-modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              {lang === 'ar' ? 'إلغاء' : lang === 'en' ? 'Cancel' : 'Annuler'}
            </button>
            <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (lang === 'ar' ? 'جاري الحفظ...' : 'Enregistrement...') 
                : isEditMode
                  ? (lang === 'ar' ? 'تحديث التفاصيل' : lang === 'en' ? 'Update Details' : 'Mettre à jour les détails')
                  : (lang === 'ar' ? 'تسجيل التفاصيل' : lang === 'en' ? 'Save Details' : 'Enregistrer les détails')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;
