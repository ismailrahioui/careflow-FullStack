package com.careflow.user;

import java.util.List;

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
        response.setActive(user.isActive());
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
        user.setActive(true);
        String encryptedPassword = passwordEncoder.encode(request.getPassword());
        user.setPasswordHash(encryptedPassword);

        User SavedUser = userRepository.save(user);
        return toResponse(SavedUser);
    }

    public UserResponse getUserById(Long Id, Long ClinicId) {
        User user = userRepository.findByIdAndClinicId(Id, ClinicId)
                .orElseThrow(() -> new UserNotFoundException("User not Found"));

        return toResponse(user);
    }

    public List<UserResponse> getAllUsers(Long clinicId) {
        List<User> Users = userRepository.findAllByClinicId(clinicId);

        return Users.stream()
                .map(app -> toResponse(app)).toList();
    }

    public UserResponse deleteUser(Long Id, Long clinicId) {
        User User = userRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new UserNotFoundException("User not Found"));
        userRepository.delete(User);

        return toResponse(User);
    }

    public UserResponse updateUser(Long Id, Long clinicId, UserUpdateRequest request) {
        User existingUser = userRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        existingUser.setFullName(request.getFullname());
        existingUser.setUsername(request.getUsername());

        String encryptedPassword = passwordEncoder.encode(request.getPassword());
        existingUser.setPasswordHash(encryptedPassword);

        User updateUser = userRepository.save(existingUser);
        return toResponse(updateUser);
    }

}
