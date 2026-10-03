import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api';
import { 
  CreditCard, 
  BarChart2, 
  CheckCircle2, 
  Search, 
  Plus, 
  DollarSign, 
  Trash2, 
  X, 
  AlertCircle
} from 'lucide-react';
import './Payments.css';
import '../components/Modal.css';

const Payments = () => {
  const { user } = useContext(AuthContext);
  const { lang } = useContext(LanguageContext);

  const [invoices, setInvoices] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    patientId: '',
    appointmentId: '',
    invoiceNumber: '',
    totalAmount: '',
    notes: ''
  });

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    reference: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchData = async () => {
    if (!user?.clinicId) return;
    try {
      setLoading(true);
      const [invRes, payRes, patRes, appRes] = await Promise.all([
        api.get(`/clinics/${user.clinicId}/invoices`),
        api.get(`/clinics/${user.clinicId}/payments`),
        api.get(`/clinics/${user.clinicId}/patients`),
        api.get(`/clinics/${user.clinicId}/appointments`)
      ]);
      setInvoices(invRes.data);
      setPaymentsList(payRes.data);
      setPatients(patRes.data);
      setAppointments(appRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load billing data', err);
      setError('Impossible de charger les données financières.');
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

  // Patients map for quick lookup
  const patientsMap = useMemo(() => {
    const map = {};
    patients.forEach(p => {
      map[p.id] = `${p.firstName} ${p.lastName}`;
    });
    return map;
  }, [patients]);

  // Financial Stats
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    invoices.forEach(inv => {
      totalInvoiced += Number(inv.totalAmount || 0);
      totalCollected += Number(inv.paidAmount || 0);
    });
    const outstanding = Math.max(0, totalInvoiced - totalCollected);
    return {
      totalInvoiced,
      totalCollected,
      outstanding,
      count: invoices.length
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return invoices;
    return invoices.filter(inv => {
      const patientName = (patientsMap[inv.patientId] || '').toLowerCase();
      const num = (inv.invoiceNumber || '').toLowerCase();
      return patientName.includes(q) || num.includes(q);
    });
  }, [invoices, searchQuery, patientsMap]);

  // Set of appointment IDs that already have an invoice
  const invoicedAppointmentIds = useMemo(() => {
    return new Set(invoices.map(inv => inv.appointmentId).filter(Boolean));
  }, [invoices]);

  // Appointments filtered for currently selected patient (if any)
  const patientAppointments = useMemo(() => {
    if (!invoiceForm.patientId) return appointments;
    return appointments.filter(a => String(a.patientId) === String(invoiceForm.patientId));
  }, [appointments, invoiceForm.patientId]);

  // Open Invoice Modal
  const handleOpenInvoiceModal = () => {
    const randomNum = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setInvoiceForm({
      patientId: '',
      appointmentId: '',
      invoiceNumber: randomNum,
      totalAmount: '',
      notes: ''
    });
    setModalError(null);
    setIsInvoiceModalOpen(true);
  };

  const handlePatientSelectInInvoice = (patientId) => {
    setInvoiceForm(prev => {
      const currentApp = appointments.find(a => String(a.id) === String(prev.appointmentId));
      const keepApp = currentApp && String(currentApp.patientId) === String(patientId);
      return {
        ...prev,
        patientId,
        appointmentId: keepApp ? prev.appointmentId : ''
      };
    });
  };

  const handleAppointmentSelectInInvoice = (appointmentId) => {
    const selectedApp = appointments.find(a => String(a.id) === String(appointmentId));
    setInvoiceForm(prev => ({
      ...prev,
      appointmentId,
      patientId: selectedApp ? selectedApp.patientId : prev.patientId
    }));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!invoiceForm.appointmentId) {
      setModalError(lang === 'ar' ? 'يرجى اختيار الموعد المرتبط بالفاتورة' : 'Veuillez sélectionner le rendez-vous associé à la facture.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post(`/clinics/${user.clinicId}/invoices`, {
        patientId: parseInt(invoiceForm.patientId, 10),
        appointmentId: parseInt(invoiceForm.appointmentId, 10),
        invoiceNumber: invoiceForm.invoiceNumber,
        totalAmount: parseFloat(invoiceForm.totalAmount),
        notes: invoiceForm.notes
      });
      setIsInvoiceModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      setModalError(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la création de la facture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Payment Modal for invoice
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const remaining = Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount || 0));
    setPaymentForm({
      amount: remaining > 0 ? remaining.toString() : '',
      paymentMethod: 'CASH',
      reference: '',
      notes: ''
    });
    setModalError(null);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsSubmitting(true);
    setModalError(null);

    try {
      await api.post(`/clinics/${user.clinicId}/payments`, {
        invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes
      });
      setIsPaymentModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      setModalError(err.response?.data?.message || 'Erreur lors de l’encaissement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Voulez-vous supprimer cette facture ?')) return;
    try {
      await api.delete(`/clinics/${user.clinicId}/invoices/${id}`);
      fetchData();
      window.dispatchEvent(new CustomEvent('careflow-realtime-update'));
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div className="payments-overview-container">
      {/* Top Header - Matching Screenshot 3 */}
      <div className="payments-header-row">
        <div className="payments-header-title">
          <h1>{lang === 'ar' ? 'نظرة عامة على المالية والفوترة' : 'Aperçu financier & Facturation'}</h1>
          <p>{lang === 'ar' ? 'إدارة فواتير العيادة، المعاملات والتحصيلات المالية' : 'Gestion des factures cliniques, transactions et encaissements'}</p>
        </div>

        <button className="btn-generate-invoice" onClick={handleOpenInvoiceModal}>
          <Plus size={18} />
          <span>{lang === 'ar' ? 'إنشاء فاتورة جديدة' : ' Générer une facture'}</span>
        </button>
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

      {/* 3 KPI Cards - Exact Match to Screenshot 3 */}
      <div className="payments-three-kpi-grid">
        {/* Card 1: REVENU TOTAL */}
        <div className="payment-kpi-card">
          <div className="payment-kpi-top">
            <div className="payment-icon-wrapper blue">
              <CreditCard size={22} />
            </div>
            <span className="payment-kpi-badge blue">+12%</span>
          </div>
          <p className="payment-kpi-label">{lang === 'ar' ? 'إجمالي المداخيل (السنوية)' : 'REVENU TOTAL (ANNÉE)'}</p>
          <h2 className="payment-kpi-value">
            {stats.totalInvoiced.toFixed(2)} MAD
          </h2>
        </div>

        {/* Card 2: MONTANT IMPAYÉ */}
        <div className="payment-kpi-card">
          <div className="payment-kpi-top">
            <div className="payment-icon-wrapper red">
              <BarChart2 size={22} />
            </div>
            <span className="payment-kpi-badge red">{stats.count} Invoices</span>
          </div>
          <p className="payment-kpi-label">{lang === 'ar' ? 'المبلغ غير المسدد' : 'MONTANT IMPAYÉ'}</p>
          <h2 className="payment-kpi-value" style={{ color: stats.outstanding > 0 ? '#dc2626' : '#0f172a' }}>
            {stats.outstanding.toFixed(2)} MAD
          </h2>
        </div>

        {/* Card 3: RECOUVREMENT */}
        <div className="payment-kpi-card">
          <div className="payment-kpi-top">
            <div className="payment-icon-wrapper green">
              <CheckCircle2 size={22} />
            </div>
            <span className="payment-kpi-badge green">{lang === 'ar' ? 'اليوم' : 'Aujourd’hui'}</span>
          </div>
          <p className="payment-kpi-label">{lang === 'ar' ? 'المبالغ المحصلة' : 'RECOUVREMENT'}</p>
          <h2 className="payment-kpi-value" style={{ color: '#16a34a' }}>
            {stats.totalCollected.toFixed(2)} MAD
          </h2>
        </div>
      </div>

      {/* Bottom Two Columns: Factures cliniques & Historique des transactions */}
      <div className="payments-two-col-grid">
        {/* Left Column: Factures cliniques */}
        <div className="invoices-panel-card">
          <div className="invoices-panel-header">
            <h3>{lang === 'ar' ? 'فواتير العيادة' : 'Factures cliniques'}</h3>
            <span className="link-appliquer">{lang === 'ar' ? 'تطبيق' : 'Appliquer'}</span>
          </div>

          <div className="invoices-search-bar">
            <Search size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder={lang === 'ar' ? 'بحث برقم الفاتورة أو اسم المريض...' : 'Rechercher facture ou patient...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chargement...</div>
          ) : filteredInvoices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <p>{lang === 'ar' ? 'لا توجد فواتير' : 'Aucune facture trouvée.'}</p>
            </div>
          ) : (
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'رقم الفاتورة' : 'N° FACTURE'}</th>
                  <th>{lang === 'ar' ? 'المريض' : 'PATIENT'}</th>
                  <th>{lang === 'ar' ? 'التاريخ' : 'DATE'}</th>
                  <th>{lang === 'ar' ? 'المجموع' : 'TOTAL'}</th>
                  <th>{lang === 'ar' ? 'الحالة' : 'STATUT'}</th>
                  <th style={{ textAlign: 'right' }}>{lang === 'ar' ? 'الإجراءات' : 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const patName = patientsMap[inv.patientId] || `Patient #${inv.patientId}`;
                  const isPaid = inv.invoiceStatus === 'PAID';
                  const dateStr = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—';

                  return (
                    <tr key={inv.id}>
                      <td>
                        <strong style={{ color: '#0c3888' }}>{inv.invoiceNumber}</strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{patName}</span>
                      </td>
                      <td>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>{dateStr}</span>
                      </td>
                      <td>
                        <strong>{Number(inv.totalAmount || 0).toFixed(2)} MAD</strong>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isPaid ? '#dcfce7' : '#fee2e2',
                          color: isPaid ? '#15803d' : '#b91c1c'
                        }}>
                          {isPaid ? (lang === 'ar' ? 'مسددة' : 'Payée') : (lang === 'ar' ? 'غير مسددة' : 'Impayée')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {!isPaid && (
                            <button 
                              className="btn-table-action" 
                              onClick={() => handleOpenPaymentModal(inv)}
                              title="Encaisser"
                              style={{ color: '#16a34a' }}
                            >
                              <DollarSign size={15} />
                            </button>
                          )}
                          <button 
                            className="btn-table-action delete" 
                            onClick={() => handleDeleteInvoice(inv.id)}
                            title="Supprimer"
                          >
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

        {/* Right Column: Historique des transactions */}
        <div className="transactions-panel-card">
          <h3>{lang === 'ar' ? 'سجل المعاملات' : 'Historique des transactions'}</h3>

          <div className="transactions-list">
            {paymentsList.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', margin: '30px 0' }}>
                {lang === 'ar' ? 'لا توجد معاملات مسجلة بعد.' : 'Aucune transaction enregistrée.'}
              </p>
            ) : (
              paymentsList.slice(0, 8).map((p) => (
                <div key={p.id} className="transaction-item">
                  <div className="transaction-info">
                    <h5>{p.invoiceNumber || `Facture #${p.invoiceId}`}</h5>
                    <p>
                      {p.patientName || 'Patient'} • {p.paymentMethod || 'CASH'}
                    </p>
                  </div>
                  <span className="transaction-amount">
                    +{Number(p.amount || 0).toFixed(2)} MAD
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Unified Professional Modal: Générer une facture */}
      {isInvoiceModalOpen && (
        <div className="careflow-modal-overlay" onClick={() => setIsInvoiceModalOpen(false)}>
          <div className="careflow-modal-window" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            {/* Royal Blue Top Header */}
            <div className="careflow-modal-header">
              <div className="careflow-modal-title">
                <h2>{lang === 'ar' ? 'إنشاء فاتورة جديدة' : 'Générer une facture'}</h2>
                <p>{lang === 'ar' ? 'أدخل تفاصيل الفاتورة، المريض والمبلغ الإجمالي' : 'Renseigner les détails de la facture clinique et le montant dû'}</p>
              </div>
              <button className="careflow-modal-close" onClick={() => setIsInvoiceModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
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
                      value={invoiceForm.patientId} 
                      onChange={(e) => handlePatientSelectInInvoice(e.target.value)}
                      required
                    >
                      <option value="">-- {lang === 'ar' ? 'اختر المريض' : 'Sélectionner un patient'} --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} {p.cin ? `(${p.cin})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'الموعد المرتبط *' : 'Rendez-vous associé *'}</label>
                    <select 
                      value={invoiceForm.appointmentId} 
                      onChange={(e) => handleAppointmentSelectInInvoice(e.target.value)}
                      required
                    >
                      <option value="">-- {lang === 'ar' ? 'اختر الموعد' : 'Sélectionner un rendez-vous'} --</option>
                      {patientAppointments.map(a => {
                        const pat = patients.find(p => p.id === a.patientId);
                        const isAlreadyInvoiced = invoicedAppointmentIds.has(a.id);
                        const dateStr = a.appointmentAt ? new Date(a.appointmentAt).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : `RDV #${a.id}`;
                        return (
                          <option 
                            key={a.id} 
                            value={a.id}
                            disabled={isAlreadyInvoiced}
                          >
                            RDV #{a.id} - {pat ? `${pat.firstName} ${pat.lastName}` : `Patient #${a.patientId}`} ({dateStr}){isAlreadyInvoiced ? ` [${lang === 'ar' ? 'مفوتر مسبقاً' : 'Déjà facturé'}]` : ''}
                          </option>
                        );
                      })}
                    </select>
                    {patientAppointments.length === 0 && invoiceForm.patientId && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#e11d48' }}>
                        {lang === 'ar' 
                          ? 'لا توجد مواعيد مسجلة لهذا المريض. يرجى حجز موعد أولاً.' 
                          : 'Aucun rendez-vous trouvé pour ce patient. Veuillez d\'abord planifier un rendez-vous.'}
                      </p>
                    )}
                  </div>
                  


                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'رقم الفاتورة *' : 'Numéro de Facture *'}</label>
                    <input 
                      type="text" 
                      value={invoiceForm.invoiceNumber}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'المبلغ الإجمالي (MAD) *' : 'Montant Total (MAD) *'}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      value={invoiceForm.totalAmount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: e.target.value })}
                      placeholder="300.00"
                      required
                    />
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'ملاحظات' : 'Notes / Remarques'}</label>
                    <textarea 
                      rows="2"
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      placeholder="Ex: Consultation cardiologie, examens..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="careflow-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsInvoiceModalOpen(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Création...' : (lang === 'ar' ? 'تأكيد الفاتورة' : 'Créer la facture')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Professional Modal: Encaisser un paiement */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="careflow-modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="careflow-modal-window" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            {/* Royal Blue Top Header */}
            <div className="careflow-modal-header">
              <div className="careflow-modal-title">
                <h2>{lang === 'ar' ? 'تحصيل دفعة مالية' : 'Encaisser un paiement'}</h2>
                <p>{selectedInvoice.invoiceNumber} • {patientsMap[selectedInvoice.patientId]}</p>
              </div>
              <button className="careflow-modal-close" onClick={() => setIsPaymentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="careflow-modal-body">
                {/* Soft Blue Group Box for Invoice Balance */}
                <div className="careflow-details-box" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#0369a1', fontWeight: 600 }}>Total Facture :</span>
                    <strong style={{ color: '#0f172a' }}>{Number(selectedInvoice.totalAmount || 0).toFixed(2)} MAD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                    <span style={{ color: '#0369a1', fontWeight: 600 }}>Reste à payer :</span>
                    <strong style={{ color: '#dc2626' }}>
                      {(Math.max(0, Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount || 0))).toFixed(2)} MAD
                    </strong>
                  </div>
                </div>

                {modalError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '13px' }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="careflow-form">
                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'المبلغ المحصل (MAD) *' : 'Montant Versé (MAD) *'}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'طريقة الدفع *' : 'Mode de Paiement *'}</label>
                    <select 
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="CASH">{lang === 'ar' ? 'نقداً (Espèces)' : 'Espèces (Cash)'}</option>
                      <option value="CARD">{lang === 'ar' ? 'بطاقة بنكية (Carte Bancaire)' : 'Carte Bancaire (TPE)'}</option>
                      <option value="BANK_TRANSFER">{lang === 'ar' ? 'تحويل بنكي (Virement)' : 'Virement Bancaire'}</option>
                    </select>
                  </div>

                  <div className="careflow-form-group">
                    <label>{lang === 'ar' ? 'رقم الإيصال / المرجع' : 'Référence de transaction'}</label>
                    <input 
                      type="text" 
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                      placeholder="Ex: CHEQ-98124, VIR-451..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="careflow-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsPaymentModalOpen(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Validation...' : (lang === 'ar' ? 'تأكيد التحصيل' : 'Valider l’encaissement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
