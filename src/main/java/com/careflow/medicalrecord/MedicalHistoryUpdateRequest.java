package com.careflow.medicalrecord;

import jakarta.validation.constraints.NotBlank;

public class MedicalHistoryUpdateRequest {

    @NotBlank
    private String diagnosis;
    @NotBlank
    private String symptoms;
    @NotBlank
    private String treatment;

    private String notes;

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getTreatment() {
        return treatment;
    }

    public void setTreatment(String treatment) {
        this.treatment = treatment;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}
