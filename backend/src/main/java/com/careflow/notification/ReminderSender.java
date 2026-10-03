package com.careflow.notification;

public interface ReminderSender {

    ReminderChannel getChannel();

    void send(Reminder reminder);

}
