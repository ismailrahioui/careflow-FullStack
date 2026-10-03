import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

export const translations = {
  fr: {
    // Header
    greeting: "Bonjour",
    subtitle: "Voici un aperçu de l'activité de votre cabinet aujourd'hui,",
    activityAlerts: "Journal d'activité & Alertes",
    clinicStatus: "STATUT DE LA CLINIQUE",
    onlineOptimal: "En ligne et optimal",
    newPatient: "Nouveau Patient",
    
    // KPI Cards
    totalPatients: "TOTAL PATIENTS",
    appointmentsToday: "RENDEZ-VOUS DU JOUR",
    waitingVisits: "VISITES EN ATTENTE",
    revenueToday: "REVENU DU JOUR",
    todayBadge: "Aujourd'hui",
    activeBadge: "Actif",
    paymentsBadge: "Paiements",
    mad: "MAD",

    // Planning / Calendar
    todayPlanning: "Planning d'aujourd'hui",
    forDatePlanning: "Planning du",
    noAppointments: "Aucun rendez-vous planifié pour cette date.",
    bookSlot: "Planifier un RDV",
    time: "Heure",
    patient: "Patient",
    status: "Statut",
    reason: "Motif",
    actions: "Actions",

    // Right Column
    urgentResults: "Résultats d'analyses urgents",
    urgentDesc: "Dossier patient en attente de validation médicale urgente.",
    viewNow: "Consulter maintenant",
    recentPatients: "PATIENTS RÉCENTS",
    viewAll: "Consulter",
    noRecentPatients: "Aucun patient récent.",

    // Sidebar
    dashboard: "Tableau de bord",
    patientsNav: "Patients",
    appointmentsNav: "Rendez-vous",
    consultationsNav: "Consultation",
    paymentsNav: "Paiements",
    reportsNav: "Rapports",
    settingsNav: "Paramètres",
    logout: "Déconnexion",

    // Patients Directory (Matching Screenshot)
    patientDirectoryTitle: "Répertoire des patients",
    patientDirectorySubtitle: "Gérer et consulter tous les dossiers des patients enregistrés.",
    allPatients: "Tous les patients",
    activeStatus: "Actif",
    inactiveStatus: "Inactif",
    urgentStatus: "Urgence",
    colId: "ID PATIENT",
    colNameDetails: "NOM DU PATIENT & DÉTAILS",
    colStatus: "STATUT",
    colLastVisit: "DERNIÈRE VISITE",
    colNextAppointment: "PROCHAIN RENDEZ-VOUS",
    colActions: "ACTIONS",
    showingRecords: "Affichage de",
    registeredRecords: "dossiers patients enregistrés",
    searchPatientPlaceholder: "Rechercher un patient (nom, CIN, téléphone)...",
    noPatientFound: "Aucun dossier patient trouvé",
    noneText: "Aucun",

    // Modal Nouveau Patient
    newPatientModalTitle: "Nouveau Dossier Patient",
    firstName: "Prénom",
    lastName: "Nom",
    cin: "CIN (Carte d'identité)",
    dateOfBirth: "Date de Naissance",
    gender: "Genre",
    male: "Homme",
    female: "Femme",
    other: "Autre",
    phone: "Téléphone",
    email: "Email",
    address: "Adresse",
    cancel: "Annuler",
    save: "Enregistrer les détails",
    saving: "Enregistrement...",
    patientCreatedSuccess: "Patient créé avec succès !",

    // Notifications
    notifications: "Notifications & Alertes",
    noNotifications: "Aucune notification pour le moment.",
    markAllRead: "Tout marquer comme lu",
    justNow: "À l'instant",
    newNotification: "Nouvelle notification"
  },
  ar: {
    // Header
    greeting: "مرحباً",
    subtitle: "إليك نظرة عامة على نشاط عيادتك اليوم،",
    activityAlerts: "سجل الأنشطة والتنبيهات",
    clinicStatus: "حالة العيادة",
    onlineOptimal: "متصل ونشط",
    newPatient: "مريض جديد",

    // KPI Cards
    totalPatients: "إجمالي المرضى",
    appointmentsToday: "مواعيد اليوم",
    waitingVisits: "زيارات في الانتظار",
    revenueToday: "مداخيل اليوم",
    todayBadge: "اليوم",
    activeBadge: "نشط",
    paymentsBadge: "المدفوعات",
    mad: "درهم",

    // Planning / Calendar
    todayPlanning: "جدول مواعيد اليوم",
    forDatePlanning: "جدول مواعيد",
    noAppointments: "لا توجد مواعيد مبرمجة لهذا اليوم.",
    bookSlot: "حجز موعد",
    time: "الوقت",
    patient: "المريض",
    status: "الحالة",
    reason: "السبب",
    actions: "الإجراءات",

    // Right Column
    urgentResults: "نتائج تحاليل عاجلة",
    urgentDesc: "ملف مريض بانتظار التأكيد الطبي المستعجل.",
    viewNow: "معاينة الآن",
    recentPatients: "المرضى الجدد",
    viewAll: "عرض الكل",
    noRecentPatients: "لا يوجد مرضى مؤخراً.",

    // Sidebar
    dashboard: "لوحة التحكم",
    patientsNav: "المرضى",
    appointmentsNav: "المواعيد",
    consultationsNav: "الاستشارات",
    paymentsNav: "المدفوعات",
    reportsNav: "التقارير",
    settingsNav: "الإعدادات",
    logout: "تسجيل الخروج",

    // Patients Directory (Matching Screenshot)
    patientDirectoryTitle: "سجل المرضى",
    patientDirectorySubtitle: "إدارة واستعراض جميع ملفات المرضى المسجلين بالعيادة.",
    allPatients: "جميع المرضى",
    activeStatus: "نشط",
    inactiveStatus: "غير نشط",
    urgentStatus: "حالات طارئة",
    colId: "معرّف المريض",
    colNameDetails: "اسم المريض والتفاصيل",
    colStatus: "الحالة",
    colLastVisit: "آخر زيارة",
    colNextAppointment: "الموعد القادم",
    colActions: "الإجراءات",
    showingRecords: "عرض",
    registeredRecords: "ملف مريض مسجل",
    searchPatientPlaceholder: "بحث عن مريض (بالاسم، CIN، الهاتف)...",
    noPatientFound: "لم يتم العثور على أي مريض",
    noneText: "لا يوجد",

    // Modal Nouveau Patient
    newPatientModalTitle: "ملف مريض جديد",
    firstName: "الاسم الشخصي",
    lastName: "الاسم العائلي",
    cin: "رقم البطاقة الوطنية (CIN)",
    dateOfBirth: "تاريخ الازدياد",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    other: "آخر",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    cancel: "إلغاء",
    save: "تسجيل التفاصيل",
    saving: "جاري الحفظ...",
    patientCreatedSuccess: "تم إنشاء ملف المريض بنجاح !",

    // Notifications
    notifications: "التنبيهات والإشعارات",
    noNotifications: "لا توجد تنبيهات جديدة حالياً.",
    markAllRead: "تحديد الكل كمقروء",
    justNow: "الآن",
    newNotification: "إشعار جديد"
  },
  en: {
    // Header
    greeting: "Welcome",
    subtitle: "Here is an overview of your clinic's activity today,",
    activityAlerts: "Activity Log & Alerts",
    clinicStatus: "CLINIC STATUS",
    onlineOptimal: "Online & optimal",
    newPatient: "New Patient",

    // KPI Cards
    totalPatients: "TOTAL PATIENTS",
    appointmentsToday: "TODAY'S APPOINTMENTS",
    waitingVisits: "WAITING VISITS",
    revenueToday: "TODAY'S REVENUE",
    todayBadge: "Today",
    activeBadge: "Active",
    paymentsBadge: "Payments",
    mad: "MAD",

    // Planning / Calendar
    todayPlanning: "Today's Schedule",
    forDatePlanning: "Schedule for",
    noAppointments: "No appointments scheduled for this date.",
    bookSlot: "Book Appointment",
    time: "Time",
    patient: "Patient",
    status: "Status",
    reason: "Reason",
    actions: "Actions",

    // Right Column
    urgentResults: "Urgent Lab Results",
    urgentDesc: "Patient record pending urgent medical review.",
    viewNow: "Review now",
    recentPatients: "RECENT PATIENTS",
    viewAll: "View all",
    noRecentPatients: "No recent patients.",

    // Sidebar
    dashboard: "Dashboard",
    patientsNav: "Patients",
    appointmentsNav: "Appointments",
    consultationsNav: "Consultations",
    paymentsNav: "Payments",
    reportsNav: "Reports",
    settingsNav: "Settings",
    logout: "Logout",

    // Patients Directory (Matching Screenshot)
    patientDirectoryTitle: "Patient Directory",
    patientDirectorySubtitle: "Manage and consult all registered patient records.",
    allPatients: "All Patients",
    activeStatus: "Active",
    inactiveStatus: "Inactive",
    urgentStatus: "Urgent",
    colId: "PATIENT ID",
    colNameDetails: "PATIENT NAME & DETAILS",
    colStatus: "STATUS",
    colLastVisit: "LAST VISIT",
    colNextAppointment: "NEXT APPOINTMENT",
    colActions: "ACTIONS",
    showingRecords: "Showing",
    registeredRecords: "registered patient records",
    searchPatientPlaceholder: "Search patient (name, CIN, phone)...",
    noPatientFound: "No patient records found",
    noneText: "None",

    // Modal Nouveau Patient
    newPatientModalTitle: "New Patient File",
    firstName: "First Name",
    lastName: "Last Name",
    cin: "National ID (CIN)",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    phone: "Phone Number",
    email: "Email",
    address: "Address",
    cancel: "Cancel",
    save: "Save Details",
    saving: "Saving...",
    patientCreatedSuccess: "Patient created successfully!",

    // Notifications
    notifications: "Notifications & Alerts",
    noNotifications: "No notifications at the moment.",
    markAllRead: "Mark all as read",
    justNow: "Just now",
    newNotification: "New notification"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('careflow_lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('careflow_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations['fr']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
