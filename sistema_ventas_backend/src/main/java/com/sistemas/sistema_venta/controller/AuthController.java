package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.auth.LoginRequest;
import com.sistemas.sistema_venta.dto.auth.LoginResponse;
import com.sistemas.sistema_venta.dto.auth.MeResponse;
import com.sistemas.sistema_venta.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public MeResponse me() {
        return authService.me();
    }
}
