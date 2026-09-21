package com.careflow.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final ClinicRepository clinicRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(ClinicRepository clinicRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.clinicRepository = clinicRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();

        response.setId(user.getId());
        response.setClinicId(user.getClinic().getId());
        response.setFullname(user.getFullName());
        response.setUsername(user.getUsername());
        response.setRole(user.getRole());
        response.setCreatedAt(user.getCreatedAt());

        return response;
    }

    @Transactional
    public UserResponse createUser(Long clinicId, UserCreateRequest request) {

        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic Not Found"));

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("An account with this username already exists.");
        }

        User user = new User();
        user.setClinic(clinic);
        user.setFullName(request.getFullname());
        user.setUsername(request.getUsername());
        user.setRole(request.getRole());
        String encryptedPassword = passwordEncoder.encode(request.getPassword());
        user.setPasswordHash(encryptedPassword);

        User SavedUser = userRepository.save(user);
        return toResponse(SavedUser);
    }

}
