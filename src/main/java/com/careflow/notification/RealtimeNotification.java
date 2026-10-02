package com.careflow.notification;

import java.time.Instant;

public class RealtimeNotification {
    private String id;
    private Long clinicId;
    private String type; // e.g. "APPOINTMENT", "PATIENT", "PAYMENT", "REMINDER"
    private String title;
    private String message;
    private Instant createdAt;
    private boolean read;

    public RealtimeNotification() {}

    public RealtimeNotification(String id, Long clinicId, String type, String title, String message) {
        this.id = id;
        this.clinicId = clinicId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.createdAt = Instant.now();
        this.read = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}
