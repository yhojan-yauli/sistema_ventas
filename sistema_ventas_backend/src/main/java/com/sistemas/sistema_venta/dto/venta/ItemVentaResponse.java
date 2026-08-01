package com.sistemas.sistema_venta.dto.venta;

import java.math.BigDecimal;

public record ItemVentaResponse(
        Long productoId,
        String productoNombre,
        String productoCodigo,
        Integer cantidad,
        BigDecimal precioVenta,
        BigDecimal precioCompra,
        Integer pesoGramos,
        BigDecimal descuentoLinea,
        BigDecimal subtotal,
        BigDecimal ganancia) {
}
