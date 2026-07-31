package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.venta.VentaRequest;
import com.sistemas.sistema_venta.dto.venta.VentaResponse;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.service.AuthService;
import com.sistemas.sistema_venta.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaService ventaService;
    private final AuthService authService;

    public VentaController(VentaService ventaService, AuthService authService) {
        this.ventaService = ventaService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<VentaResponse> crear(@Valid @RequestBody VentaRequest request) {
        Usuario vendedor = authService.getCurrentUser();
        return ResponseEntity.status(201).body(ventaService.crear(vendedor, request));
    }

    @GetMapping("/mias")
    public List<VentaResponse> misVentas() {
        return ventaService.historialUsuario(authService.getCurrentUser());
    }

    @GetMapping("/sesion/{sesionId}")
    public List<VentaResponse> porSesion(@PathVariable Long sesionId) {
        return ventaService.listarPorSesion(sesionId, authService.getCurrentUser());
    }

    @GetMapping("/comprobante/{serie}/{numero}")
    public VentaResponse comprobante(@PathVariable String serie, @PathVariable Long numero) {
        return ventaService.obtenerComprobante(serie, numero);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<VentaResponse> listar() {
        return ventaService.listarRecientes();
    }
}
