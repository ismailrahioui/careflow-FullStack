package com.careflow.notification;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clinics/{clinicId}/reminders")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId) and hasAnyRole('DOCTOR', 'RECEPTIONIST')")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @PostMapping
    public ResponseEntity<ReminderResponse> createReminder(
            @PathVariable Long clinicId,
            @Valid @RequestBody ReminderCreateRequest request) {
        ReminderResponse response = reminderService.createReminder(clinicId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReminderResponse> getReminderById(
            @PathVariable Long clinicId,
            @PathVariable Long id) {
        ReminderResponse response = reminderService.getReminderById(id, clinicId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ReminderResponse>> getReminders(
            @PathVariable Long clinicId,
            @RequestParam(required = false) Long appointmentId) {
        List<ReminderResponse> responses;
        if (appointmentId != null) {
            responses = reminderService.getRemindersByAppointment(appointmentId, clinicId);
        } else {
            responses = reminderService.getAllReminders(clinicId);
        }
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReminderResponse> updateReminder(
            @PathVariable Long clinicId,
            @PathVariable Long id,
            @Valid @RequestBody ReminderUpdateRequest request) {
        ReminderResponse response = reminderService.updateReminder(id, clinicId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReminder(
            @PathVariable Long clinicId,
            @PathVariable Long id) {
        reminderService.deleteReminder(id, clinicId);
        return ResponseEntity.noContent().build();
    }
}
