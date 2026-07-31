package com.sistemas.sistema_venta.dto.reporte;

import java.math.BigDecimal;

public record DashboardResponse(
        BigDecimal ventasHoy,
        Long ventasHoyCantidad,
        BigDecimal gananciaHoy,
        Long sesionesAbiertas,
        Long stockBajo,
        BigDecimal ventasDelMes) {
}
