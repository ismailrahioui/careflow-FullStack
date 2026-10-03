package com.careflow.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.careflow.security.JWTGenerator;
import com.careflow.user.User;
import com.careflow.user.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JWTGenerator jwtGenerator;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
            JWTGenerator jwtGenerator) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtGenerator = jwtGenerator;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        Authentication authenticationRequest = UsernamePasswordAuthenticationToken
                .unauthenticated(request.getUsername(), request.getPassword());

        Authentication authenticationResponse = this.authenticationManager.authenticate(authenticationRequest);

        String token = jwtGenerator.generateToken(authenticationResponse);

        User user = userRepository.findByUsername(authenticationResponse.getName())
                .orElseThrow(
                        () -> new UsernameNotFoundException("User not found: " + authenticationResponse.getName()));

        LoginResponse response = new LoginResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole());
        if (user.getClinic() != null) {
            response.setClinicId(user.getClinic().getId());
        }
        response.setToken(token);

        return ResponseEntity.ok(response);
    }
}
