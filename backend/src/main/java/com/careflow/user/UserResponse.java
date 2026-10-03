package com.careflow.user;

import java.time.Instant;



public class UserResponse {

    private Long id;
    private Long clinicId;
    private String fullname;
    private String username;
    private Roles role;
    private boolean active;
    private Instant createdAt;
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getClinicId() {
        return clinicId;
    }
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    public String getFullname() {
        return fullname;
    }
    public void setFullname(String fullname) {
        this.fullname = fullname;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public Roles getRole() {
        return role;
    }
    public void setRole(Roles role) {
        this.role = role;
    }
    public boolean isActive() {
        return active;
    }
    public void setActive(boolean active) {
        this.active = active;
    }
    public Instant getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    

}
