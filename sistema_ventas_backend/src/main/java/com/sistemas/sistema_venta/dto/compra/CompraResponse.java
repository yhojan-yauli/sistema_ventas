package com.sistemas.sistema_venta.dto.compra;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CompraResponse(
        Long id,
        Long proveedorId,
        String proveedorNombre,
        LocalDateTime fecha,
        String numeroDocumento,
        BigDecimal total,
        List<ItemCompraResponse> items) {
}
