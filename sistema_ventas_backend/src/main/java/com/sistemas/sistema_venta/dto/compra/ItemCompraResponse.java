package com.sistemas.sistema_venta.dto.compra;

import java.math.BigDecimal;

public record ItemCompraResponse(
        Long productoId,
        String productoNombre,
        Integer cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal) {
}
