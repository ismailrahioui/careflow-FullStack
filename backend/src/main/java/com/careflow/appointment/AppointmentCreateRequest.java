package com.careflow.appointment;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;

public class AppointmentCreateRequest {

    @NotNull
    private Long patientId;

    @NotNull
    private Instant appointmentAt;

    private String reason;

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Instant getAppointmentAt() {
        return appointmentAt;
    }

    public void setAppointmentAt(Instant appointmentAt) {
        this.appointmentAt = appointmentAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
