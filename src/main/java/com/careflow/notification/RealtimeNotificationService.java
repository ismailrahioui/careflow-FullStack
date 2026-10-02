package com.careflow.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class RealtimeNotificationService {

    private static final Logger log = LoggerFactory.getLogger(RealtimeNotificationService.class);
    private static final Long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    // clinicId -> list of active emitters
    private final Map<Long, List<SseEmitter>> clinicEmitters = new ConcurrentHashMap<>();

    // clinicId -> recent notifications (in-memory ring buffer)
    private final Map<Long, List<RealtimeNotification>> clinicRecentNotifications = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long clinicId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        clinicEmitters.computeIfAbsent(clinicId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(clinicId, emitter));
        emitter.onTimeout(() -> removeEmitter(clinicId, emitter));
        emitter.onError((e) -> removeEmitter(clinicId, emitter));

        // Send initial connection handshake event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("status", "connected", "clinicId", clinicId)));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE connection message", e);
            removeEmitter(clinicId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(Long clinicId, SseEmitter emitter) {
        List<SseEmitter> emitters = clinicEmitters.get(clinicId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                clinicEmitters.remove(clinicId);
            }
        }
    }

    public void broadcast(Long clinicId, RealtimeNotification notification) {
        // Save to recent notifications list
        List<RealtimeNotification> recent = clinicRecentNotifications.computeIfAbsent(clinicId, k -> new CopyOnWriteArrayList<>());
        recent.add(0, notification);
        if (recent.size() > 50) {
            recent.remove(recent.size() - 1);
        }

        List<SseEmitter> emitters = clinicEmitters.get(clinicId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> failedEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(notification));
            } catch (Exception e) {
                log.warn("Error sending SSE notification to client in clinic {}: {}", clinicId, e.getMessage());
                failedEmitters.add(emitter);
            }
        }

        for (SseEmitter failed : failedEmitters) {
            removeEmitter(clinicId, failed);
        }
    }

    public List<RealtimeNotification> getRecentNotifications(Long clinicId) {
        return clinicRecentNotifications.getOrDefault(clinicId, Collections.emptyList());
    }
}
