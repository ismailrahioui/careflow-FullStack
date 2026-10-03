package com.careflow.clinic;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ClinicUpdateRequest {

    @NotBlank
    private String name;

    @NotNull
    private ClinicType clinicType;

    @NotBlank
    private String address;
    
    @NotBlank
    @Size(max = 14)
    private String phone;
    @Email
    private String email;

    private String logoUrl;
    @NotBlank
    private String registrationNumber;

    
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public ClinicType getClinicType() {
        return clinicType;
    }
    public void setClinicType(ClinicType clinicType) {
        this.clinicType = clinicType;
    }
    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }
    public String getPhone() {
        return phone;
    }
    public void setPhone(String phone) {
        this.phone = phone;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getLogoUrl() {
        return logoUrl;
    }
    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }
    public String getRegistrationNumber() {
        return registrationNumber;
    }
    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    

}
