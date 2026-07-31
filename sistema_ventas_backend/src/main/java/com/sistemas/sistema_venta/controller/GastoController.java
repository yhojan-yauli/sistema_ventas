package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.sesion.GastoRequest;
import com.sistemas.sistema_venta.dto.sesion.GastoResponse;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.service.AuthService;
import com.sistemas.sistema_venta.service.GastoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sesiones/{sesionId}/gastos")
public class GastoController {

    private final GastoService gastoService;
    private final AuthService authService;

    public GastoController(GastoService gastoService, AuthService authService) {
        this.gastoService = gastoService;
        this.authService = authService;
    }

    @GetMapping
    public List<GastoResponse> listar(@PathVariable Long sesionId) {
        Usuario usuario = authService.getCurrentUser();
        return gastoService.listar(sesionId, usuario);
    }

    @PostMapping
    public ResponseEntity<GastoResponse> crear(@PathVariable Long sesionId, @Valid @RequestBody GastoRequest request) {
        Usuario usuario = authService.getCurrentUser();
        return ResponseEntity.status(201).body(gastoService.crear(sesionId, usuario, request));
    }

    @DeleteMapping("/{gastoId}")
    public ResponseEntity<Void> eliminar(@PathVariable Long sesionId, @PathVariable Long gastoId) {
        Usuario usuario = authService.getCurrentUser();
        gastoService.eliminar(sesionId, gastoId, usuario);
        return ResponseEntity.noContent().build();
    }
}
