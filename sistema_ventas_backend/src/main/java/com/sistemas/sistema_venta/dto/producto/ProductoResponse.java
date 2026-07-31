package com.sistemas.sistema_venta.dto.producto;

import java.math.BigDecimal;

public record ProductoResponse(
        Long id,
        String codigo,
        String nombre,
        Long categoriaId,
        String categoriaNombre,
        String descripcion,
        BigDecimal precioCompra,
        BigDecimal precioVenta,
        Boolean incluyeIGV,
        Integer stock,
        Integer stockMinimo,
        Boolean activo) {
}
