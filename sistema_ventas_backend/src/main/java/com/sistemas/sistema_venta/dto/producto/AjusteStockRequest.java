package com.sistemas.sistema_venta.dto.producto;

import jakarta.validation.constraints.NotNull;

public record AjusteStockRequest(
        @NotNull Integer cantidad,
        String motivo) {
}
