package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.reporte.CierreMensualResponse;
import com.sistemas.sistema_venta.service.CierreMensualService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reportes/cierre-mensual")
@PreAuthorize("hasRole('ADMIN')")
public class CierreMensualController {

    private final CierreMensualService cierreMensualService;

    public CierreMensualController(CierreMensualService cierreMensualService) {
        this.cierreMensualService = cierreMensualService;
    }

    @GetMapping
    public List<CierreMensualResponse> listar() {
        return cierreMensualService.listar();
    }

    @GetMapping("/{anioMes}")
    public CierreMensualResponse detalle(@PathVariable String anioMes) {
        return cierreMensualService.detalle(anioMes);
    }

    @PostMapping("/cerrar")
    public CierreMensualResponse cerrar() {
        return cierreMensualService.cerrarMes();
    }
}
