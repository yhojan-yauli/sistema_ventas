package com.sistemas.sistema_venta.dto.sesion;

import com.sistemas.sistema_venta.enums.TipoPago;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RetiroResponse(
        Long id,
        Long sesionId,
        Long usuarioId,
        String usuarioNombre,
        BigDecimal monto,
        TipoPago tipoPago,
        String motivo,
        LocalDateTime fecha) {
}
