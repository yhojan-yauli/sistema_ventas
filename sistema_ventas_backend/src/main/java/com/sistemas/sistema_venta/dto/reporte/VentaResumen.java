package com.sistemas.sistema_venta.dto.reporte;

import java.math.BigDecimal;

public record VentaResumen(
        Long cantidad,
        BigDecimal total,
        BigDecimal igv,
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal ganancia) {
}
