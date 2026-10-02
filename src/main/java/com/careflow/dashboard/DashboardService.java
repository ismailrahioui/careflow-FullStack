package com.careflow.dashboard;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;

import com.careflow.appointment.Appointment;
import com.careflow.appointment.AppointmentRepository;
import com.careflow.billing.InvoiceRepository;
import com.careflow.billing.PaymentRepository;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import com.careflow.consultation.ConsultationRepository;
import com.careflow.patient.PatientRepository;

@Service
public class DashboardService {

    private final ClinicRepository clinicRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public DashboardService(ClinicRepository clinicRepository,
                            PatientRepository patientRepository,
                            AppointmentRepository appointmentRepository,
                            ConsultationRepository consultationRepository,
                            InvoiceRepository invoiceRepository,
                            PaymentRepository paymentRepository) {
        this.clinicRepository = clinicRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.consultationRepository = consultationRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    public DashboardStatsResponse getDashboardStats(Long clinicId) {
        if (!clinicRepository.existsById(clinicId)) {
            throw new ClinicNotFoundException("Clinic not found with id: " + clinicId);
        }

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        Instant startOfDay = today.atStartOfDay(zone).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(zone).toInstant();

        long totalPatients = patientRepository.countByClinicId(clinicId);
        long appointmentsToday = appointmentRepository.countByClinicIdAndAppointmentAtBetween(clinicId, startOfDay, endOfDay);
        long totalAppointments = appointmentRepository.countByClinicId(clinicId);
        long totalConsultations = consultationRepository.countByClinicId(clinicId);
        long totalInvoices = invoiceRepository.countByClinicId(clinicId);
        long totalPayments = paymentRepository.countByInvoiceClinicId(clinicId);
        BigDecimal totalRevenue = paymentRepository.sumAmountByClinicId(clinicId);
        BigDecimal outstandingBalance = invoiceRepository.sumOutstandingBalanceByClinicId(clinicId);

        List<Appointment> upcoming = appointmentRepository
                .findTop5ByClinicIdAndAppointmentAtAfterOrderByAppointmentAtAsc(clinicId, Instant.now());

        List<UpcomingAppointmentDTO> upcomingDTOs = upcoming.stream().map(app -> {
            UpcomingAppointmentDTO dto = new UpcomingAppointmentDTO();
            dto.setId(app.getId());
            dto.setPatientId(app.getPatient().getId());
            dto.setPatientName(app.getPatient().getFirstName() + " " + app.getPatient().getLastName());
            dto.setPatientPhone(app.getPatient().getPhone());
            dto.setAppointmentAt(app.getAppointmentAt());
            dto.setStatus(app.getStatus());
            dto.setReason(app.getReason());
            return dto;
        }).toList();

        DashboardStatsResponse response = new DashboardStatsResponse();
        response.setTotalPatients(totalPatients);
        response.setAppointmentsToday(appointmentsToday);
        response.setTotalAppointments(totalAppointments);
        response.setTotalConsultations(totalConsultations);
        response.setTotalInvoices(totalInvoices);
        response.setTotalPayments(totalPayments);
        response.setTotalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        response.setOutstandingBalance(outstandingBalance != null ? outstandingBalance : BigDecimal.ZERO);
        response.setUpcomingAppointments(upcomingDTOs);

        return response;
    }
}
