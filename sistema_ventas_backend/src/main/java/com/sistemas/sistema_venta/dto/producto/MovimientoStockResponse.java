package com.sistemas.sistema_venta.dto.producto;

import com.sistemas.sistema_venta.enums.TipoMovimientoStock;

import java.time.LocalDateTime;

public record MovimientoStockResponse(
        Long id,
        Long productoId,
        TipoMovimientoStock tipo,
        Integer cantidad,
        String motivo,
        LocalDateTime fecha) {
}
