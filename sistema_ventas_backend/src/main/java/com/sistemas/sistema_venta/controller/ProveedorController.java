package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.proveedor.ProveedorRequest;
import com.sistemas.sistema_venta.dto.proveedor.ProveedorResponse;
import com.sistemas.sistema_venta.service.ProveedorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@PreAuthorize("hasRole('ADMIN')")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping
    public List<ProveedorResponse> listar() {
        return proveedorService.listar();
    }

    @GetMapping("/{id}")
    public ProveedorResponse obtener(@PathVariable Long id) {
        return proveedorService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<ProveedorResponse> crear(@Valid @RequestBody ProveedorRequest request) {
        return ResponseEntity.status(201).body(proveedorService.crear(request));
    }

    @PutMapping("/{id}")
    public ProveedorResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProveedorRequest request) {
        return proveedorService.actualizar(id, request);
    }
}
