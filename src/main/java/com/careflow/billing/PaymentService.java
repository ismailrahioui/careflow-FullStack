package com.careflow.billing;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careflow.audit.AuditService;
import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import com.careflow.user.User;
import com.careflow.user.UserNotFoundException;
import com.careflow.user.UserRepository;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public PaymentService(ClinicRepository clinicRepository,
            PaymentRepository paymentRepository, InvoiceRepository invoiceRepository,
            UserRepository userRepository, AuditService auditService) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.clinicRepository = clinicRepository;
        this.auditService = auditService;
    }

    public PaymentResponse toResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();

        response.setId(payment.getId());
        response.setInvoiceId(payment.getInvoice().getId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setPaymentDate(payment.getPaymentDate());
        response.setReference(payment.getReference());
        if (payment.getCreatedBy() != null) {
            response.setCreatedBy(payment.getCreatedBy().getId());
            response.setCreatedByName(payment.getCreatedBy().getUsername());
        }
        response.setNotes(payment.getNotes());
        response.setCreatedAt(payment.getCreatedAt());
        response.setInvoiceNumber(payment.getInvoice().getInvoiceNumber());
        response.setPatientName(payment.getInvoice().getPatient().getFirstName());

        return response;
    }

    @Transactional
    public PaymentResponse createPayment(Long clinicId, PaymentRequest request) {
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic Not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!currentUser.getClinic().getId().equals(clinic.getId())) {
            throw new AccessDeniedException("You are not Allowed");
        }

        Invoice invoice = invoiceRepository.findByIdAndClinicId(request.getInvoiceId(), clinic.getId())
                .orElseThrow(() -> new InvoiceNotFoundException("Invoice Not Found"));

        if (invoice.getInvoiceStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot add payment to a cancelled invoice");
        }

        // 1. validate amount
        BigDecimal remainingAmount = invoice.getTotalAmount().subtract(invoice.getPaidAmount());
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
        if (request.getAmount().compareTo(remainingAmount) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds remaining balance");
        }

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setReference(request.getReference());
        payment.setNotes(request.getNotes());
        payment.setCreatedBy(currentUser);

        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal totalPaid = invoice.getPaidAmount().add(savedPayment.getAmount());
        invoice.setPaidAmount(totalPaid);

        if (invoice.getPaidAmount().compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setInvoiceStatus(InvoiceStatus.PAID);
        } else if (invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            invoice.setInvoiceStatus(InvoiceStatus.PARTIALLY_PAID);
        } else {
            invoice.setInvoiceStatus(InvoiceStatus.UNPAID);
        }

        invoiceRepository.save(invoice);

        auditService.log(clinicId, "CREATE", "PAYMENT", savedPayment.getId(),
                "Payment of " + savedPayment.getAmount() + " recorded for invoice " + invoice.getInvoiceNumber());

        return toResponse(savedPayment);
    }

    public PaymentResponse getPaymentById(Long clinicId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndInvoiceClinicId(paymentId, clinicId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment Not Found"));
        return toResponse(payment);
    }

    public List<PaymentResponse> getAllPayments(Long clinicId) {
        return paymentRepository.findAllByInvoiceClinicId(clinicId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deletePayment(Long clinicId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndInvoiceClinicId(paymentId, clinicId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment Not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!currentUser.getId().equals(payment.getCreatedBy().getId())) {
            throw new AccessDeniedException("You are not Allowed to delete this payment");
        }

        Invoice invoice = payment.getInvoice();

        paymentRepository.delete(payment);

        BigDecimal totalPaid = paymentRepository.sumAmountByInvoiceId(invoice.getId());
        invoice.setPaidAmount(totalPaid);

        if (totalPaid.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setInvoiceStatus(InvoiceStatus.UNPAID);
        } else if (totalPaid.compareTo(invoice.getTotalAmount()) < 0) {
            invoice.setInvoiceStatus(InvoiceStatus.PARTIALLY_PAID);
        } else {
            invoice.setInvoiceStatus(InvoiceStatus.PAID);
        }

        invoiceRepository.save(invoice);

        auditService.log(clinicId, "DELETE", "PAYMENT", paymentId,
                "Payment #" + paymentId + " deleted for invoice " + invoice.getInvoiceNumber());
    }
}
