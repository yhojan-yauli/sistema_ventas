package com.sistemas.sistema_venta.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CajaResponse(
        Long id,
        String nombre,
        String descripcion,
        Boolean activa,
        LocalDateTime fechaCreacion,
        BigDecimal saldo,
        LocalDateTime fechaUltimoCierre) {
}
