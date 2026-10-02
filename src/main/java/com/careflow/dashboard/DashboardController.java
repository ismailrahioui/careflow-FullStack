package com.careflow.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clinics/{clinicId}/dashboard")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId) and hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(@PathVariable Long clinicId) {
        DashboardStatsResponse stats = dashboardService.getDashboardStats(clinicId);
        return ResponseEntity.ok(stats);
    }
}
