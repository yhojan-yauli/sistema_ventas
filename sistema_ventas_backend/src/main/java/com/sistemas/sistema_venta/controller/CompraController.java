package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.compra.CompraRequest;
import com.sistemas.sistema_venta.dto.compra.CompraResponse;
import com.sistemas.sistema_venta.service.CompraService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compras")
@PreAuthorize("hasRole('ADMIN')")
public class CompraController {

    private final CompraService compraService;

    public CompraController(CompraService compraService) {
        this.compraService = compraService;
    }

    @GetMapping
    public List<CompraResponse> listar() {
        return compraService.listar();
    }

    @GetMapping("/{id}")
    public CompraResponse obtener(@PathVariable Long id) {
        return compraService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<CompraResponse> crear(@Valid @RequestBody CompraRequest request) {
        return ResponseEntity.status(201).body(compraService.crear(request));
    }
}
