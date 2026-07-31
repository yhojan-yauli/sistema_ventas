package com.sistemas.sistema_venta.dto.sesion;

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record SesionResponse(
        Long id,
        Long cajaId,
        String cajaNombre,
        Long usuarioId,
        String usuarioNombre,
        LocalDateTime fechaApertura,
        LocalDateTime fechaCierre,
        BigDecimal montoInicial,
        String estado,
        String observaciones,
        BigDecimal totalVentas,
        BigDecimal totalGastos,
        BigDecimal totalRetiros,
        BigDecimal montoFinalEsperado,
        Map<String, BigDecimal> ventasPorMetodo,
        List<CuadreMetodoResponse> cuadre,
        @Valid List<GastoResponse> gastos,
        @Valid List<RetiroResponse> retiros) {
}
