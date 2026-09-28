package com.careflow.prescription;

import java.time.Instant;
import java.time.LocalDateTime;
    public class PrescriptionResponse {

        private Long id;
        private Long clinicId;
        private Long patientId;
        private Long consultationId;
        private Long doctorId;
        private String createdBy;
        private LocalDateTime prescriptionDate;
        private String notes;
        private Instant createdAt;
        public Long getId() {
            return id;
        }
        public void setId(Long id) {
            this.id = id;
        }
        public Long getClinicId() {
            return clinicId;
        }
        public void setClinicId(Long clinicId) {
            this.clinicId = clinicId;
        }
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
        public Long getDoctorId() {
            return doctorId;
        }
        public void setDoctorId(Long doctorId) {
            this.doctorId = doctorId;
        }
        public String getCreatedBy() {
            return createdBy;
        }
        public void setCreatedBy(String createdBy) {
            this.createdBy = createdBy;
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
        public Instant getCreatedAt() {
            return createdAt;
        }
        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }


        

    }
