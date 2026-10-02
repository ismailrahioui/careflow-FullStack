package com.careflow.billing;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByIdAndInvoiceClinicId(Long id, Long clinicId);

    List<Payment> findAllByInvoiceClinicId(Long clinicId);

    List<Payment> findByInvoicePatientIdAndInvoiceClinicId(Long patientId, Long clinicId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    BigDecimal sumAmountByInvoiceId(@Param("invoiceId") Long invoiceId);

    long countByInvoiceClinicId(Long clinicId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.clinic.id = :clinicId")
    BigDecimal sumAmountByClinicId(@Param("clinicId") Long clinicId);
}
