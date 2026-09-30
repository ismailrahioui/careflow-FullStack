package com.careflow.billing;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clinics/{clinicId}/payments")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId)")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")

    public ResponseEntity<PaymentResponse> createPayment(
            @PathVariable Long clinicId,
            @Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(clinicId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','RECEPTIONIST')")

    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable Long clinicId,
            @PathVariable Long paymentId) {
        PaymentResponse response = paymentService.getPaymentById(clinicId, paymentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','RECEPTIONIST')")
    public ResponseEntity<List<PaymentResponse>> getAllPayments(
            @PathVariable Long clinicId) {
        List<PaymentResponse> responses = paymentService.getAllPayments(clinicId);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")

    public ResponseEntity<Void> deletePayment(
            @PathVariable Long clinicId,
            @PathVariable Long paymentId) {
        paymentService.deletePayment(clinicId, paymentId);
        return ResponseEntity.noContent().build();
    }
}
