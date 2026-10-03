package com.careflow.prescription;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

public class PrescriptionCreateRequest {

    @NotNull
    private Long patientId;
    @NotNull
    private Long consultationId;
    @NotNull
    private LocalDateTime prescriptionDate;

    private String notes;

  

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getConsultationId() {
        return consultationId;
    }

    public void setConsultationId(Long consultationId) {
        this.consultationId = consultationId;
    }

    public LocalDateTime getPrescriptionDate() {
        return prescriptionDate;
    }

    public void setPrescriptionDate(LocalDateTime prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}
