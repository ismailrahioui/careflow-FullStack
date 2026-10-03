package com.careflow.auth;

import com.careflow.user.Roles;

public class LoginResponse {

    private Long id;
    private String username;
    private String fullName;
    private Roles role;
    private Long clinicId;
    private String token ;


    
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getFullName() {
        return fullName;
    }
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    public Roles getRole() {
        return role;
    }
    public void setRole(Roles role) {
        this.role = role;
    }
    public Long getClinicId() {
        return clinicId;
    }
    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }
    public String getToken() {
        return token;
    }
    public void setToken(String token) {
        this.token = token;
    }
    

}
