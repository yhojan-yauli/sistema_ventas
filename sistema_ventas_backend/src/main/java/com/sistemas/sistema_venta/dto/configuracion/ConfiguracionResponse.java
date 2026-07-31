package com.sistemas.sistema_venta.dto.configuracion;

import java.math.BigDecimal;

public record ConfiguracionResponse(
        BigDecimal igvPorcentaje,
        Boolean precioIncluyeIGV,
        String razonSocial,
        String ruc,
        String direccion,
        String telefono,
        String email) {
}
