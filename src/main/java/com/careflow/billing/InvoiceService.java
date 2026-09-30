package com.careflow.billing;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

import com.careflow.appointment.Appointment;
import com.careflow.appointment.AppointmentNotFoundException;
import com.careflow.appointment.AppointmentRepository;
import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import com.careflow.user.User;
import com.careflow.user.UserNotFoundException;
import com.careflow.user.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

@Service
public class InvoiceService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ClinicRepository clinicRepository;
    private final InvoiceRepository invoiceRepository;

    public InvoiceService(AppointmentRepository appointmentRepository, UserRepository userRepository,
            ClinicRepository clinicRepository, InvoiceRepository invoiceRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.clinicRepository = clinicRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public InvoiceResponse toResponse(Invoice invoice) {

        InvoiceResponse response = new InvoiceResponse();

        response.setId(invoice.getId());
        response.setClinicId(invoice.getClinic().getId());
        response.setPatientId(invoice.getPatient().getId());
        response.setAppointmentId(invoice.getAppointment().getId());
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setTotalAmount(invoice.getTotalAmount());
        response.setPaidAmount(invoice.getPaidAmount());
        response.setInvoiceStatus(invoice.getInvoiceStatus());
        if (invoice.getCreatedBy() != null) {

            response.setCreatedBy(invoice.getCreatedBy().getId());
            // response.setCreatedBy(invoice.getCreatedBy().getUsername());
        }
        response.setNotes(invoice.getNotes());
        response.setCreatedAt(invoice.getCreatedAt());

        return response;
    }

    @Transactional
    public InvoiceResponse createInvoice(Long clinicId, InvoiceCreateRequest request) {
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic Not Found"));

        Appointment appointment = appointmentRepository.findByIdAndClinicId(request.getAppointmentId(), clinicId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment  not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!currentUser.getClinic().getId().equals(clinic.getId())) {
            throw new AccessDeniedException("You are not Allowed");
        }

        if (invoiceRepository.existsByAppointmentIdAndClinicId(request.getAppointmentId(), clinic.getId())) {
            throw new IllegalStateException("This appointment already has an invoice");
        }

        Invoice invoice = new Invoice();
        invoice.setClinic(clinic);
        invoice.setAppointment(appointment);
        invoice.setPatient(appointment.getPatient());
        invoice.setInvoiceNumber(request.getInvoiceNumber());
        invoice.setInvoiceStatus(InvoiceStatus.UNPAID);
        invoice.setTotalAmount(request.getTotalAmount());
        invoice.setPaidAmount(java.math.BigDecimal.ZERO);
        invoice.setCreatedBy(currentUser);
        invoice.setNotes(request.getNotes());

        Invoice SavedInvoice = invoiceRepository.save(invoice);

        return toResponse(SavedInvoice);

    }

    public InvoiceResponse getInvoiceById(Long id, Long clinicId) {
        Invoice invoice = invoiceRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new InvoiceNotFoundException("Invoice Not Found"));
        return toResponse(invoice);
    }

    public List<InvoiceResponse> getAllInvoices(Long clinicId) {
        List<Invoice> invoices = invoiceRepository.findAllByClinicId(clinicId);

        return invoices.stream().map(this::toResponse).toList();

    }

    public InvoiceResponse updateInvoice(Long id, Long clinicId, InvoiceUpdateRequest request) {
        Invoice invoice = invoiceRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new InvoiceNotFoundException("Invoice not found"));
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!currentUser.getId().equals(invoice.getCreatedBy().getId())) {
            throw new AccessDeniedException("You are not allowed to update this invoice");
        }

        invoice.setNotes(request.getNotes());
        Invoice updaInvoice = invoiceRepository.save(invoice);

        return toResponse(updaInvoice);

    }

    public InvoiceResponse deleteInvoice(Long Id, Long clinicId) {
        Invoice invoice = invoiceRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new InvoiceNotFoundException("Invoice not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!currentUser.getId().equals(invoice.getCreatedBy().getId())) {
            throw new AccessDeniedException("You are not allowed to delete this invoice");
        }
        invoiceRepository.delete(invoice);

        return toResponse(invoice);
    }
}
