package com.careflow.prescription;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem,Long> {

    List<PrescriptionItem> findByPrescriptionId(Long prescriptionId);

    List<PrescriptionItem> findByPrescriptionIdAndPrescriptionClinicId(Long prescriptionId, Long clinicId);

}
