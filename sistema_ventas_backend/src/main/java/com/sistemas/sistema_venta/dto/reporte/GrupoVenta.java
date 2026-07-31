package com.sistemas.sistema_venta.dto.reporte;

import java.math.BigDecimal;

public record GrupoVenta(
        String grupo,
        Long cantidad,
        BigDecimal total,
        BigDecimal igv,
        BigDecimal descuento) {
}
