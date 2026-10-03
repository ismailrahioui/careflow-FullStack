package com.careflow.billing;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/clinics/{clinicId}/invoices")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId)")
public class InvoiceController {
    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long clinicId,
            @PathVariable Long id) {

        InvoiceResponse invoice = invoiceService.getInvoiceById(id, clinicId);
        return ResponseEntity.ok(invoice);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices(@PathVariable Long clinicId) {
        List<InvoiceResponse> consultations = invoiceService.getAllInvoices(clinicId);
        return ResponseEntity.ok(consultations);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<InvoiceResponse> createInvoice(
            @PathVariable Long clinicId,
            @Valid @RequestBody InvoiceCreateRequest request) {

        InvoiceResponse savedInvoice = invoiceService.createInvoice(clinicId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedInvoice);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<InvoiceResponse> updateInvoice(@PathVariable Long id,
            @PathVariable Long clinicId,
            @Valid @RequestBody InvoiceUpdateRequest request) {
        InvoiceResponse updateInvoice = invoiceService.updateInvoice(id, clinicId, request);
        return ResponseEntity.ok(updateInvoice);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long clinicId, @PathVariable Long id) {
        invoiceService.deleteInvoice(id, clinicId);
        return ResponseEntity.noContent().build();
    }

}
