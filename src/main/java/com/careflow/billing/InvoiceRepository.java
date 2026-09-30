package com.careflow.billing;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByIdAndClinicId(Long id, Long clinicId);

    List<Invoice> findAllByClinicId(Long clinicId);

    List<Invoice> findByPatientIdAndClinicId(Long patientId, Long clinicId);

    Optional<Invoice> findByInvoiceNumberAndClinicId(String invoiceNumber, Long clinicId);


    boolean existsByAppointmentIdAndClinicId(Long appointmentId, Long clinicId);


    boolean existsByInvoiceNumber(String invoiceNumber);

}