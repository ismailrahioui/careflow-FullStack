package com.careflow.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicRepository;
import com.careflow.clinic.ClinicType;
import com.careflow.user.Roles;
import com.careflow.user.User;
import com.careflow.user.UserRepository;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class TenantSecurityIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ClinicRepository clinicRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private Clinic clinicA;
    private Clinic clinicB;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        clinicA = new Clinic();
        clinicA.setName("Clinic Alpha");
        clinicA.setClinicType(ClinicType.GENERAL_PRACTICE);
        clinicA.setAddress("123 Alpha Street");
        clinicA.setPhone("0600000001");
        clinicA.setRegistrationNumber("REG-ALPHA-" + System.currentTimeMillis());
        clinicA = clinicRepository.save(clinicA);

        clinicB = new Clinic();
        clinicB.setName("Clinic Beta");
        clinicB.setClinicType(ClinicType.DENTAL);
        clinicB.setAddress("456 Beta Street");
        clinicB.setPhone("0600000002");
        clinicB.setRegistrationNumber("REG-BETA-" + System.currentTimeMillis());
        clinicB = clinicRepository.save(clinicB);

        User doctorA = new User();
        doctorA.setUsername("dr_alpha");
        doctorA.setFullName("Dr. Alpha");
        doctorA.setPasswordHash(passwordEncoder.encode("password123"));
        doctorA.setRole(Roles.DOCTOR);
        doctorA.setActive(true);
        doctorA.setClinic(clinicA);
        userRepository.save(doctorA);
    }

    @Test
    @DisplayName("Unauthenticated request should return 401 Unauthorized")
    void unauthenticatedRequestShouldFail() throws Exception {
        mockMvc.perform(get("/api/clinics/" + clinicA.getId() + "/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "dr_alpha", roles = {"DOCTOR"})
    @DisplayName("User accessing their own clinic dashboard should succeed with 200 OK")
    void accessingOwnClinicShouldSucceed() throws Exception {
        mockMvc.perform(get("/api/clinics/" + clinicA.getId() + "/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPatients").exists())
                .andExpect(jsonPath("$.totalRevenue").exists());
    }

    @Test
    @WithMockUser(username = "dr_alpha", roles = {"DOCTOR"})
    @DisplayName("User attempting cross-tenant access to another clinic should be blocked with 403 Forbidden")
    void crossTenantAccessShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/clinics/" + clinicB.getId() + "/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Access denied: You do not have permission to perform this action."));
    }

    @Test
    @WithMockUser(username = "dr_alpha", roles = {"DOCTOR"})
    @DisplayName("Accessing own audit logs should succeed with 200 OK")
    void accessingOwnAuditLogsShouldSucceed() throws Exception {
        mockMvc.perform(get("/api/clinics/" + clinicA.getId() + "/audit-logs")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "dr_alpha", roles = {"DOCTOR"})
    @DisplayName("Cross-tenant access to another clinic audit logs should be blocked with 403 Forbidden")
    void crossTenantAuditLogsShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/clinics/" + clinicB.getId() + "/audit-logs")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
