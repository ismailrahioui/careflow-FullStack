package com.careflow.notification;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clinics/{clinicId}/notifications")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId)")
public class RealtimeNotificationController {

    private final RealtimeNotificationService notificationService;

    public RealtimeNotificationController(RealtimeNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/stream")
    public SseEmitter subscribeToNotifications(@PathVariable Long clinicId) {
        return notificationService.subscribe(clinicId);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<RealtimeNotification>> getRecentNotifications(@PathVariable Long clinicId) {
        return ResponseEntity.ok(notificationService.getRecentNotifications(clinicId));
    }

    @PostMapping("/test")
    public ResponseEntity<Void> sendTestNotification(@PathVariable Long clinicId, @RequestParam(defaultValue = "Alerte de test") String title) {
        RealtimeNotification notification = new RealtimeNotification(
                UUID.randomUUID().toString(),
                clinicId,
                "ALERT",
                title,
                "Ceci est une notification de test en direct pour le cabinet #" + clinicId
        );
        notificationService.broadcast(clinicId, notification);
        return ResponseEntity.ok().build();
    }
}
