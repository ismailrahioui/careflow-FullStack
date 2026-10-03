package com.careflow.notification;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import com.careflow.appointment.Appointment;
import com.careflow.clinic.Clinic;
import com.careflow.patient.Patient;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Component
public class EmailReminderSender implements ReminderSender {

    private static final Logger log = LoggerFactory.getLogger(EmailReminderSender.class);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter
            .ofPattern("EEEE, dd MMMM yyyy 'at' HH:mm")
            .withZone(ZoneId.systemDefault());

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailReminderSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public ReminderChannel getChannel() {
        return ReminderChannel.EMAIL;
    }

    @Override
    public void send(Reminder reminder) {
        Appointment appointment = reminder.getAppointment();
        if (appointment == null) {
            throw new IllegalStateException("Reminder is not linked to any appointment.");
        }

        Patient patient = appointment.getPatient();
        if (patient == null || patient.getEmail() == null || patient.getEmail().isBlank()) {
            throw new IllegalArgumentException("Patient email is missing for reminder ID: " + reminder.getId());
        }

        Clinic clinic = appointment.getClinic();
        String clinicName = (clinic != null && clinic.getName() != null) ? clinic.getName() : "CareFlow Clinic";
        String patientName = patient.getFirstName() + " " + patient.getLastName();
        String formattedDate = DATE_TIME_FORMATTER.format(appointment.getAppointmentAt());

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setTo(patient.getEmail());
            helper.setFrom(fromAddress);
            helper.setSubject("Appointment Reminder - " + clinicName);
            helper.setText(buildHtmlContent(patientName, clinicName, formattedDate, clinic != null ? clinic.getAddress() : null), true);

            mailSender.send(mimeMessage);
            log.info("Reminder email sent successfully to {} for appointment ID: {}", patient.getEmail(), appointment.getId());
        } catch (MessagingException e) {
            log.error("Failed to construct or send email for reminder ID: {}", reminder.getId(), e);
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }

    private String buildHtmlContent(String patientName, String clinicName, String appointmentTime, String clinicAddress) {
        String addressSection = (clinicAddress != null && !clinicAddress.isBlank())
                ? "<p style=\"margin: 6px 0; color: #475569;\"><strong>📍 Location:</strong> " + clinicAddress + "</p>"
                : "";

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Appointment Reminder</title>
                </head>
                <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        
                        <!-- Header -->
                        <div style="background-color: #0284c7; padding: 24px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">CareFlow Health</h1>
                            <p style="color: #e0f2fe; margin: 6px 0 0 0; font-size: 14px;">Appointment Reminder</p>
                        </div>

                        <!-- Body Content -->
                        <div style="padding: 30px;">
                            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>%s</strong>,</p>
                            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                                This is a friendly reminder for your upcoming medical appointment at <strong>%s</strong>.
                            </p>

                            <!-- Appointment Card -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; border-radius: 8px; padding: 18px; margin: 20px 0;">
                                <p style="margin: 6px 0; color: #475569; font-size: 15px;">
                                    <strong>🗓 Date & Time:</strong> <span style="color: #0f172a; font-weight: 600;">%s</span>
                                </p>
                                %s
                            </div>

                            <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 20px 0 0 0;">
                                If you need to reschedule or cancel your appointment, please contact the clinic in advance.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #f8fafc; padding: 16px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                                © CareFlow Medical Platform. All rights reserved.
                            </p>
                        </div>

                    </div>
                </body>
                </html>
                """.formatted(patientName, clinicName, appointmentTime, addressSection);
    }
}
