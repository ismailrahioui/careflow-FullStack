package com.careflow.notification;

import java.time.Instant;

public class ReminderResponse {

    private Long id;
    private Long appointmentId;
    private Instant sendTime;
    private ReminderChannel channel;
    private ReminderStatus status;
    private Instant createdAt;
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getAppointmentId() {
        return appointmentId;
    }
    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }
    public Instant getSendTime() {
        return sendTime;
    }
    public void setSendTime(Instant sendTime) {
        this.sendTime = sendTime;
    }
    public ReminderChannel getChannel() {
        return channel;
    }
    public void setChannel(ReminderChannel channel) {
        this.channel = channel;
    }
    public ReminderStatus getStatus() {
        return status;
    }
    public void setStatus(ReminderStatus status) {
        this.status = status;
    }
    public Instant getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    

}
