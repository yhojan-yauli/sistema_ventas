package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.caja.CajaRequest;
import com.sistemas.sistema_venta.dto.caja.CajaResponse;
import com.sistemas.sistema_venta.service.CajaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cajas")
public class CajaController {

    private final CajaService cajaService;

    public CajaController(CajaService cajaService) {
        this.cajaService = cajaService;
    }

    @GetMapping("/activas")
    public List<CajaResponse> listarActivas() {
        return cajaService.listarActivas();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<CajaResponse> listar() {
        return cajaService.listar();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CajaResponse obtener(@PathVariable Long id) {
        return cajaService.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CajaResponse> crear(@Valid @RequestBody CajaRequest request) {
        return ResponseEntity.status(201).body(cajaService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CajaResponse actualizar(@PathVariable Long id, @Valid @RequestBody CajaRequest request) {
        return cajaService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        cajaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
