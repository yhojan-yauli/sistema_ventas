package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.cliente.ClienteRequest;
import com.sistemas.sistema_venta.dto.cliente.ClienteResponse;
import com.sistemas.sistema_venta.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public List<ClienteResponse> listar(@RequestParam(required = false) String q) {
        return clienteService.buscar(q);
    }

    @GetMapping("/{id}")
    public ClienteResponse obtener(@PathVariable Long id) {
        return clienteService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> crear(@Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.status(201).body(clienteService.crear(request));
    }

    @PutMapping("/{id}")
    public ClienteResponse actualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest request) {
        return clienteService.actualizar(id, request);
    }
}
