import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  DollarSign, 
  Stethoscope, 
  Pill, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { exportToCsv } from '../utils/exportImport';
import './Reports.css';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const { lang } = useContext(LanguageContext);

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'audit'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Raw Data State
  const [logs, setLogs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // Audit Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  const fetchAllData = async () => {
    if (!user?.clinicId) return;
    try {
      setLoading(true);
      const [logsRes, patRes, appRes, consRes, invRes, prescRes] = await Promise.all([
        api.get(`/clinics/${user.clinicId}/audit-logs`),
        api.get(`/clinics/${user.clinicId}/patients`),
        api.get(`/clinics/${user.clinicId}/appointments`),
        api.get(`/clinics/${user.clinicId}/consultations`),
        api.get(`/clinics/${user.clinicId}/invoices`),
        api.get(`/clinics/${user.clinicId}/prescriptions`)
      ]);

      setLogs(logsRes.data || []);
      setPatients(patRes.data || []);
      setAppointments(appRes.data || []);
      setConsultations(consRes.data || []);
      setInvoices(invRes.data || []);
      setPrescriptions(prescRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load reports data', err);
      setError('Impossible de charger les données statistiques et d’audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?.clinicId]);

  // Compute Financial Metrics
  const financialStats = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    invoices.forEach(inv => {
      const total = Number(inv.totalAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      totalInvoiced += total;
      totalCollected += paid;
      if (inv.invoiceStatus === 'PAID') {
        paidCount++;
      } else {
        unpaidCount++;
      }
    });

    const outstanding = Math.max(0, totalInvoiced - totalCollected);
    const recoveryRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : 0;

    return {
      totalInvoiced,
      totalCollected,
      outstanding,
      recoveryRate,
      paidCount,
      unpaidCount,
      totalInvoices: invoices.length
    };
  }, [invoices]);

  // Compute Top Diagnoses Frequency
  const topDiagnoses = useMemo(() => {
    const counts = {};
    consultations.forEach(c => {
      const diag = (c.diagnosis || '').trim();
      if (diag) {
        counts[diag] = (counts[diag] || 0) + 1;
      }
    });

    const totalWithDiag = consultations.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: ((count / totalWithDiag) * 100).toFixed(0)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [consultations]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesEntity = selectedEntity === 'ALL' || log.entityType === selectedEntity;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesEntity;

      const actor = (log.userFullName || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      const entity = (log.entityType || '').toLowerCase();

      return matchesEntity && (actor.includes(q) || action.includes(q) || details.includes(q) || entity.includes(q));
    });
  }, [logs, selectedEntity, searchQuery]);

  // Export Audit Logs to CSV
  const handleExportAuditLogs = () => {
    const cols = [
      { key: 'createdAt', label: 'Date et Heure' },
      { key: 'userFullName', label: 'Utilisateur' },
      { key: 'action', label: 'Action' },
      { key: 'entityType', label: 'Entité' },
      { key: 'entityId', label: 'ID Cible' },
      { key: 'details', label: 'Détails' }
    ];
    exportToCsv(`careflow_journal_audit_${new Date().toISOString().slice(0, 10)}.csv`, cols, filteredLogs);
  };

  // Export Executive Summary to CSV
  const handleExportExecutiveSummary = () => {
    const summaryData = [
      { Indication: 'Patients Enregistrés', Valeur: patients.length },
      { Indication: 'Rendez-vous Programmés', Valeur: appointments.length },
      { Indication: 'Consultations Réalisées', Valeur: consultations.length },
      { Indication: 'Ordonnances Délivrées', Valeur: prescriptions.length },
      { Indication: 'Total Facturé (MAD)', Valeur: financialStats.totalInvoiced.toFixed(2) },
      { Indication: 'Total Encaissé (MAD)', Valeur: financialStats.totalCollected.toFixed(2) },
      { Indication: 'Montant Impayé (MAD)', Valeur: financialStats.outstanding.toFixed(2) },
      { Indication: 'Taux de Recouvrement (%)', Valeur: `${financialStats.recoveryRate}%` }
    ];
    const cols = [
      { key: 'Indication', label: 'Indicateur de Performance' },
      { key: 'Valeur', label: 'Valeur' }
    ];
    exportToCsv(`careflow_rapport_synthese_${new Date().toISOString().slice(0, 10)}.csv`, cols, summaryData);
  };

  return (
    <div className="reports-page">
      {/* Top Header Row with Actions */}
      <div className="reports-header-row">
        <div className="reports-header-title">
          <h1>{lang === 'ar' ? 'التقارير وتحليلات الأداء' : 'Rapports & Statistiques Cliniques'}</h1>
          <p>{lang === 'ar' ? 'متابعة شاملة للمؤشرات الطبية، المالية، ومراجعة سجل العمليات' : 'Vue d\'ensemble des performances médicales, du recouvrement et traçabilité des opérations'}</p>
        </div>

        <div className="reports-header-actions">
          <button type="button" className="btn-report-action" onClick={handleExportExecutiveSummary}>
            <FileSpreadsheet size={15} color="#15803d" />
            <span>{lang === 'ar' ? 'تصدير التقرير (CSV)' : 'Exporter Synthèse (CSV)'}</span>
          </button>

          <button type="button" className="btn-report-action primary" onClick={() => window.print()}>
            <Printer size={15} />
            <span>{lang === 'ar' ? 'طباعة / PDF' : 'Imprimer Rapport (PDF)'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-panel" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="reports-tabs-bar">
        <button 
          type="button" 
          className={`reports-tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>{lang === 'ar' ? 'لوحة التحليلات والإحصائيات' : 'Tableau de Bord & Indicateurs'}</span>
        </button>

        <button 
          type="button" 
          className={`reports-tab-item ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Activity size={16} />
          <span>{lang === 'ar' ? 'سجل العمليات والأمان' : 'Journal d’Audit & Sécurité'} ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE ANALYTICS */}
      {activeTab === 'analytics' && (
        <>
          {/* KPI Summary Cards */}
          <div className="reports-kpi-grid">
            <div className="report-kpi-card">
              <div className="report-kpi-top">
                <p className="report-kpi-label">{lang === 'ar' ? 'إجمالي المرضى' : 'Patients Suivis'}</p>
                <div className="report-kpi-icon blue">
                  <Users size={18} />
                </div>
              </div>
              <h3 className="report-kpi-value">{patients.length}</h3>
              <p className="report-kpi-sub">{lang === 'ar' ? 'ملفات طبية نشطة' : 'Dossiers patients enregistrés'}</p>
            </div>

            <div className="report-kpi-card">
              <div className="report-kpi-top">
                <p className="report-kpi-label">{lang === 'ar' ? 'الاستشارات المنجزة' : 'Consultations'}</p>
                <div className="report-kpi-icon purple">
                  <Stethoscope size={18} />
                </div>
              </div>
              <h3 className="report-kpi-value">{consultations.length}</h3>
              <p className="report-kpi-sub">{appointments.length} rendez-vous programmés</p>
            </div>

            <div className="report-kpi-card">
              <div className="report-kpi-top">
                <p className="report-kpi-label">{lang === 'ar' ? 'إجمالي المداخيل' : 'Total Facturé'}</p>
                <div className="report-kpi-icon amber">
                  <DollarSign size={18} />
                </div>
              </div>
              <h3 className="report-kpi-value">{financialStats.totalInvoiced.toFixed(2)} MAD</h3>
              <p className="report-kpi-sub">{financialStats.totalInvoices} factures générées</p>
            </div>

            <div className="report-kpi-card">
              <div className="report-kpi-top">
                <p className="report-kpi-label">{lang === 'ar' ? 'نسبة التحصيل' : 'Recouvrement'}</p>
                <div className="report-kpi-icon green">
                  <TrendingUp size={18} />
                </div>
              </div>
              <h3 className="report-kpi-value" style={{ color: '#16a34a' }}>{financialStats.recoveryRate}%</h3>
              <p className="report-kpi-sub">{financialStats.totalCollected.toFixed(2)} MAD encaissés</p>
            </div>

            <div className="report-kpi-card">
              <div className="report-kpi-top">
                <p className="report-kpi-label">{lang === 'ar' ? 'الوصفات الطبية' : 'Ordonnances'}</p>
                <div className="report-kpi-icon blue">
                  <Pill size={18} />
                </div>
              </div>
              <h3 className="report-kpi-value">{prescriptions.length}</h3>
              <p className="report-kpi-sub">{lang === 'ar' ? 'وصفات رقمية معتمدة' : 'Prescriptions validées'}</p>
            </div>
          </div>

          {/* Detailed Two-Column Analysis */}
          <div className="reports-charts-grid">
            {/* Financial Health Panel */}
            <div className="reports-panel-card">
              <div className="reports-panel-header">
                <h3>{lang === 'ar' ? 'الأداء والتحصيل المالي' : 'Santé Financière & Recouvrement'}</h3>
                <span>{financialStats.totalInvoices} Factures</span>
              </div>

              <div className="progress-list">
                <div className="progress-item">
                  <div className="progress-labels">
                    <span>{lang === 'ar' ? 'المبالغ المحصلة (Payé)' : 'Montant Encaissé'}</span>
                    <strong style={{ color: '#16a34a' }}>{financialStats.totalCollected.toFixed(2)} MAD ({financialStats.recoveryRate}%)</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill green" style={{ width: `${financialStats.recoveryRate}%` }}></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-labels">
                    <span>{lang === 'ar' ? 'المبالغ المتبقية (Reste à payer)' : 'Reste à Recouvrer (Impayé)'}</span>
                    <strong style={{ color: '#dc2626' }}>{financialStats.outstanding.toFixed(2)} MAD</strong>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill red" 
                      style={{ width: `${financialStats.totalInvoiced > 0 ? ((financialStats.outstanding / financialStats.totalInvoiced) * 100).toFixed(0) : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-labels">
                    <span>{lang === 'ar' ? 'الفواتير المسددة بالكامل' : 'Factures Soldées'}</span>
                    <span>{financialStats.paidCount} / {financialStats.totalInvoices}</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill blue" 
                      style={{ width: `${financialStats.totalInvoices > 0 ? ((financialStats.paidCount / financialStats.totalInvoices) * 100).toFixed(0) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Diagnostics Breakdown */}
            <div className="reports-panel-card">
              <div className="reports-panel-header">
                <h3>{lang === 'ar' ? 'أبرز التشخيصات الطبية الملاحظة' : 'Diagnostics Médicaux Fréquents'}</h3>
                <span>{consultations.length} Consultations</span>
              </div>

              {topDiagnoses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Aucun diagnostic enregistré pour le moment.
                </div>
              ) : (
                <div className="progress-list">
                  {topDiagnoses.map((item, idx) => (
                    <div key={idx} className="progress-item">
                      <div className="progress-labels">
                        <span>{item.name}</span>
                        <span>{item.count} cas ({item.percent}%)</span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className={`progress-fill ${idx === 0 ? 'blue' : idx === 1 ? 'purple' : idx === 2 ? 'amber' : 'green'}`}
                          style={{ width: `${item.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: AUDIT & SECURITY LOGS */}
      {activeTab === 'audit' && (
        <div>
          {/* Toolbar / Filters */}
          <div className="patients-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div className="patients-search" style={{ minWidth: '280px', maxWidth: '420px', display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px' }}>
              <Search size={18} color="#94a3b8" style={{ marginRight: '8px' }} />
              <input 
                type="text" 
                placeholder={lang === 'ar' ? 'بحث بالمستخدم، العملية...' : 'Rechercher par utilisateur, action, détail...'} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Filter size={16} color="#64748b" />
              <select 
                value={selectedEntity} 
                onChange={(e) => setSelectedEntity(e.target.value)}
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '13px',
                  outline: 'none',
                  background: '#fff',
                  color: '#334155'
                }}
              >
                <option value="ALL">Toutes les entités</option>
                <option value="APPOINTMENT">Rendez-vous</option>
                <option value="CONSULTATION">Consultations</option>
                <option value="INVOICE">Factures</option>
                <option value="PAYMENT">Paiements</option>
                <option value="PATIENT">Patients</option>
              </select>

              <button 
                type="button" 
                className="btn-report-action"
                onClick={handleExportAuditLogs}
              >
                <Download size={14} /> {lang === 'ar' ? 'تصدير السجل' : 'Exporter (.csv)'}
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="patients-table-card" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chargement du journal d’audit...</div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <Activity size={48} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <h4 style={{ margin: '0 0 6px 0', color: '#475569' }}>Aucun enregistrement d'audit trouvé</h4>
                <p style={{ margin: 0, fontSize: '14px' }}>Toutes les actions futures apparaîtront ici automatiquement.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="patients-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Date & Heure</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Utilisateur</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Action</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Entité</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>ID Cible</th>
                      <th style={{ padding: '12px 16px', color: '#475569' }}>Détails de l'opération</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const actionType = (log.action || '').toUpperCase();
                      const badgeClass = 
                        actionType.includes('CREATE') ? 'create' :
                        actionType.includes('UPDATE') ? 'update' :
                        actionType.includes('DELETE') ? 'delete' : 'create';

                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {log.createdAt ? new Date(log.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                              }) : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              {log.userFullName || `Utilisateur #${log.userId}`}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className={`audit-action-badge ${badgeClass}`}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="audit-entity-badge">
                              {log.entityType}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>
                              #{log.entityId}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ color: '#334155' }}>
                              {log.details || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
