package com.careflow.appointment;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;

public class AppointmentUpdateRequest {


    @NotNull 
    private Instant appointmentAt;

    @NotNull
    private AppointmentStatus status;  

    private String reason;


    public Instant getAppointmentAt() {
        return appointmentAt;
    }

    public void setAppointmentAt(Instant appointmentAt) {
        this.appointmentAt = appointmentAt;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
