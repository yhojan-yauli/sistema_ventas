package com.sistemas.sistema_venta.dto.venta;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ItemVentaRequest(
        @NotNull Long productoId,
        @NotNull @Min(1) Integer cantidad,
        BigDecimal descuento) {
}
