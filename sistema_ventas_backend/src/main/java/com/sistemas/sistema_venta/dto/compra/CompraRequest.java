package com.sistemas.sistema_venta.dto.compra;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CompraRequest(
        @NotNull Long proveedorId,
        String numeroDocumento,
        LocalDateTime fecha,
        @NotEmpty List<@Valid ItemCompraRequest> items) {
}
