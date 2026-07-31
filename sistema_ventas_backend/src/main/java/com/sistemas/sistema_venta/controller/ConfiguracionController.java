package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.configuracion.ConfiguracionRequest;
import com.sistemas.sistema_venta.dto.configuracion.ConfiguracionResponse;
import com.sistemas.sistema_venta.service.ConfiguracionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/configuracion")
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;

    public ConfiguracionController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @GetMapping
    public ConfiguracionResponse obtener() {
        return configuracionService.obtener();
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ConfiguracionResponse actualizar(@Valid @RequestBody ConfiguracionRequest request) {
        return configuracionService.actualizar(request);
    }
}
