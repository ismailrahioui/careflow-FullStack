package com.careflow.user;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clinics/{clinicId}/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getuserById(@PathVariable Long clinicId,
            @PathVariable Long id) {

        UserResponse user = userService.getUserById(id, clinicId);
        return ResponseEntity.ok(user);
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(@PathVariable Long clinicId) {
        List<UserResponse> users = userService.getAllUsers(clinicId);
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @PathVariable Long clinicId,
            @Valid @RequestBody UserCreateRequest request) {

        UserResponse savedUser = userService.createUser(clinicId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateConsultation(@PathVariable Long id,
            @PathVariable Long clinicId,
            @Valid @RequestBody UserUpdateRequest request) {
        UserResponse updateUser = userService.updateUser(id, clinicId, request);
        return ResponseEntity.ok(updateUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long clinicId, @PathVariable Long id) {
        userService.deleteUser(id, clinicId);
        return ResponseEntity.noContent().build();
    }

}
