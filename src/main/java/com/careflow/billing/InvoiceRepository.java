package com.careflow.billing;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByIdAndClinicId(Long id, Long clinicId);

    List<Invoice> findAllByClinicId(Long clinicId);

    List<Invoice> findByPatientIdAndClinicId(Long patientId, Long clinicId);

    Optional<Invoice> findByInvoiceNumberAndClinicId(String invoiceNumber, Long clinicId);

    boolean existsByAppointmentIdAndClinicId(Long appointmentId, Long clinicId);

    boolean existsByInvoiceNumber(String invoiceNumber);

    long countByClinicId(Long clinicId);

    @Query("SELECT COALESCE(SUM(i.totalAmount - i.paidAmount), 0) FROM Invoice i WHERE i.clinic.id = :clinicId AND i.invoiceStatus != com.careflow.billing.InvoiceStatus.CANCELLED")
    BigDecimal sumOutstandingBalanceByClinicId(@Param("clinicId") Long clinicId);

}