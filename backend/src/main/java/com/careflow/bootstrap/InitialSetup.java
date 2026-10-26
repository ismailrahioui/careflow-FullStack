package com.careflow.bootstrap;

import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicRepository;
import com.careflow.clinic.ClinicType;
import com.careflow.user.Roles;
import com.careflow.user.User;
import com.careflow.user.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("bootstrap")
public class InitialSetup implements ApplicationRunner {

    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${BOOTSTRAP_CLINIC_NAME:}")
    private String clinicName;

    @Value("${BOOTSTRAP_CLINIC_ADDRESS:}")
    private String clinicAddress;

    @Value("${BOOTSTRAP_CLINIC_PHONE:}")
    private String clinicPhone;

    @Value("${BOOTSTRAP_CLINIC_REGISTRATION:}")
    private String clinicRegistration;

    @Value("${BOOTSTRAP_USERNAME:}")
    private String username;

    @Value("${BOOTSTRAP_FULL_NAME:}")
    private String fullName;

    @Value("${BOOTSTRAP_PASSWORD:}")
    private String password;

    public InitialSetup(
            ClinicRepository clinicRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.clinicRepository = clinicRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (clinicRepository.count() != 0 || userRepository.count() != 0) {
            System.out.println("Bootstrap skipped: clinic or user already exists.");
            return;
        }

        if (clinicName.isBlank()
                || clinicAddress.isBlank()
                || clinicPhone.isBlank()
                || clinicRegistration.isBlank()
                || username.isBlank()
                || fullName.isBlank()
                || password.isBlank()) {
            throw new IllegalStateException(
                    "Bootstrap refused: required bootstrap environment variables are missing.");
        }

        Clinic clinic = new Clinic();
        clinic.setName(clinicName);
        clinic.setClinicType(ClinicType.GENERAL_PRACTICE);
        clinic.setAddress(clinicAddress);
        clinic.setPhone(clinicPhone);
        clinic.setRegistrationNumber(clinicRegistration);

        Clinic savedClinic = clinicRepository.save(clinic);

        User user = new User();
        user.setClinic(savedClinic);
        user.setFullName(fullName);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(Roles.DOCTOR);
        user.setActive(true);

        userRepository.save(user);

        System.out.println("Initial clinic and doctor account created successfully.");
    }
}
