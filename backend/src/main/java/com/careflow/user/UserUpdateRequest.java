package com.careflow.user;

import jakarta.validation.constraints.NotBlank;

public class UserUpdateRequest {

    @NotBlank
    private String fullname;

    @NotBlank
    private String username;

    @NotBlank
    private String password;

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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

}
