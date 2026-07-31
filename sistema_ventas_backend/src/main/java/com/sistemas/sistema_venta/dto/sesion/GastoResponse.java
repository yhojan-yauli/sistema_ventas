package com.sistemas.sistema_venta.dto.sesion;

import com.sistemas.sistema_venta.enums.TipoPago;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GastoResponse(
        Long id,
        Long sesionId,
        String concepto,
        BigDecimal monto,
        TipoPago tipoPago,
        LocalDateTime fecha) {
}
