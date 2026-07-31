package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.producto.AjusteStockRequest;
import com.sistemas.sistema_venta.dto.producto.MovimientoStockResponse;
import com.sistemas.sistema_venta.dto.producto.ProductoRequest;
import com.sistemas.sistema_venta.dto.producto.ProductoResponse;
import com.sistemas.sistema_venta.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public List<ProductoResponse> listar(@RequestParam(required = false, defaultValue = "true") Boolean activos) {
        return productoService.listar(activos);
    }

    @GetMapping("/buscar")
    public List<ProductoResponse> buscar(@RequestParam(required = false) String q) {
        return productoService.buscar(q);
    }

    @GetMapping("/stock-bajo")
    public List<ProductoResponse> stockBajo() {
        return productoService.stockBajo();
    }

    @GetMapping("/{id}")
    public ProductoResponse obtener(@PathVariable Long id) {
        return productoService.obtener(id);
    }

    @GetMapping("/{id}/movimientos")
    @PreAuthorize("hasRole('ADMIN')")
    public List<MovimientoStockResponse> movimientos(@PathVariable Long id) {
        return productoService.movimientos(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(201).body(productoService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductoResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest request) {
        return productoService.actualizar(id, request);
    }

    @PatchMapping("/{id}/activo")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductoResponse cambiarActivo(@PathVariable Long id) {
        return productoService.cambiarActivo(id);
    }

    @PostMapping("/{id}/stock/ajuste")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductoResponse ajustarStock(@PathVariable Long id, @Valid @RequestBody AjusteStockRequest request) {
        return productoService.ajustarStock(id, request);
    }
}
