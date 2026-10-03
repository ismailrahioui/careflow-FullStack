package com.careflow.notification;

import java.time.Instant;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

public class ReminderUpdateRequest {

    
    @NotNull (message = "Send time is required")
    @Future(message = "Send time must be in the future")
    private Instant sendTime;
    @NotNull(message = "Channel is required")
    private ReminderChannel channel;
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

    
}
