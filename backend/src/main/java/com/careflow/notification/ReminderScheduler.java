package com.careflow.notification;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final ReminderService reminderService;
    private final Map<ReminderChannel, ReminderSender> senders;

    public ReminderScheduler(ReminderService reminderService, List<ReminderSender> senderList) {
        this.reminderService = reminderService;
        this.senders = senderList.stream()
                .collect(Collectors.toMap(ReminderSender::getChannel, Function.identity()));
    }

    @Scheduled(fixedRate = 60000)
    public void processDueReminders() {
        log.info("Running reminder scheduler check for due reminders...");

        List<Reminder> dueReminders = reminderService.getDueReminders();

        if (dueReminders.isEmpty()) {
            log.info("No due reminders found.");
            return;
        }

        log.info("Found {} due reminder(s) to process.", dueReminders.size());

        for (Reminder reminder : dueReminders) {
            try {
                ReminderSender sender = senders.get(reminder.getChannel());
                if (sender == null) {
                    throw new IllegalStateException("No sender configured for channel: " + reminder.getChannel());
                }

                sender.send(reminder);
                reminderService.updateStatus(reminder.getId(), ReminderStatus.SENT);
                log.info("Reminder ID {} sent successfully via {}", reminder.getId(), reminder.getChannel());
            } catch (Exception e) {
                log.error("Failed to process reminder ID {}: {}", reminder.getId(), e.getMessage(), e);
                try {
                    reminderService.updateStatus(reminder.getId(), ReminderStatus.FAILED);
                } catch (Exception statusEx) {
                    log.error("Failed to mark reminder ID {} as FAILED: {}", reminder.getId(), statusEx.getMessage(), statusEx);
                }
            }
        }
    }
}
