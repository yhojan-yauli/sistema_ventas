package com.sistemas.sistema_venta.dto.configuracion;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ConfiguracionRequest(
        @NotNull @DecimalMin("0.0") BigDecimal igvPorcentaje,
        @NotNull Boolean precioIncluyeIGV,
        String razonSocial,
        String ruc,
        String direccion,
        String telefono,
        String email) {
}
