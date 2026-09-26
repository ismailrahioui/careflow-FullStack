package com.careflow.consultation;

import java.time.Instant;

public class ConsultationResponse {

    private Long id;
    private Long clinicId;
    private Long patientId;
    private Long appointmentId;
    private Long doctorId;
    private String doctorName;
    private String symptoms;
    private String diagnosis;
    private String treatment;
    private String notes;
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClinic() {
        return clinicId;
    }

    public void setClinic(Long clinicId) {
        this.clinicId = clinicId;
    }

    public Long getPatient() {
        return patientId;
    }

    public void setPatient(Long patientId) {
        this.patientId = patientId;
    }

    public Long getAppointment() {
        return appointmentId;
    }

    public void setAppointment(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

}
