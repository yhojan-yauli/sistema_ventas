package com.sistemas.sistema_venta.dto.compra;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ItemCompraRequest(
        @NotNull Long productoId,
        @NotNull @Min(1) Integer cantidad,
        @NotNull BigDecimal precioUnitario) {
}
