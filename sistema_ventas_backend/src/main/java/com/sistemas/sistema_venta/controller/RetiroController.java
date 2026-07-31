package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.sesion.RetiroRequest;
import com.sistemas.sistema_venta.dto.sesion.RetiroResponse;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.service.AuthService;
import com.sistemas.sistema_venta.service.RetiroService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sesiones/{sesionId}/retiros")
public class RetiroController {

    private final RetiroService retiroService;
    private final AuthService authService;

    public RetiroController(RetiroService retiroService, AuthService authService) {
        this.retiroService = retiroService;
        this.authService = authService;
    }

    @GetMapping
    public List<RetiroResponse> listar(@PathVariable Long sesionId) {
        Usuario usuario = authService.getCurrentUser();
        return retiroService.listar(sesionId, usuario);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RetiroResponse> crear(@PathVariable Long sesionId, @Valid @RequestBody RetiroRequest request) {
        Usuario admin = authService.getCurrentUser();
        return ResponseEntity.status(201).body(retiroService.crear(sesionId, admin, request));
    }
}
