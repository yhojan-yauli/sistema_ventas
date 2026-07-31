package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.sesion.AbrirSesionRequest;
import com.sistemas.sistema_venta.dto.sesion.CerrarSesionRequest;
import com.sistemas.sistema_venta.dto.sesion.SesionResponse;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.service.AuthService;
import com.sistemas.sistema_venta.service.SesionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sesiones")
public class SesionController {

    private final SesionService sesionService;
    private final AuthService authService;

    public SesionController(SesionService sesionService, AuthService authService) {
        this.sesionService = sesionService;
        this.authService = authService;
    }

    @PostMapping("/abrir")
    public ResponseEntity<SesionResponse> abrir(@Valid @RequestBody AbrirSesionRequest request) {
        Usuario usuario = authService.getCurrentUser();
        return ResponseEntity.status(201).body(sesionService.abrir(usuario, request));
    }

    @PostMapping("/{id}/cerrar")
    public SesionResponse cerrar(@PathVariable Long id, @Valid @RequestBody CerrarSesionRequest request) {
        Usuario usuario = authService.getCurrentUser();
        return sesionService.cerrar(id, usuario, request);
    }

    @GetMapping("/mi")
    public SesionResponse miSesion() {
        Usuario usuario = authService.getCurrentUser();
        return sesionService.miSesionAbierta(usuario);
    }

    @GetMapping("/{id}")
    public SesionResponse obtener(@PathVariable Long id) {
        Usuario usuario = authService.getCurrentUser();
        return sesionService.obtener(id, usuario);
    }

    @GetMapping("/activas")
    @PreAuthorize("hasRole('ADMIN')")
    public List<SesionResponse> listarActivas() {
        return sesionService.listarActivas();
    }

    @GetMapping("/historial")
    @PreAuthorize("hasRole('ADMIN')")
    public List<SesionResponse> historial() {
        return sesionService.historial();
    }
}
