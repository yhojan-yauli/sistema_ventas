package com.sistemas.sistema_venta.dto.reporte;

import java.math.BigDecimal;

public record ProductoVendido(
        Long productoId,
        String nombre,
        String codigo,
        Long cantidad,
        BigDecimal subtotal,
        BigDecimal ganancia,
        BigDecimal precioCompra,
        BigDecimal precioVenta,
        BigDecimal margen,
        Boolean ventaPorPeso) {
}
