package com.careflow.user;

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

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @PathVariable Long clinicId,
            @Valid @RequestBody UserCreateRequest request) {

        UserResponse savedUser = userService.createUser(clinicId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedUser);
    }

}
