package com.sistemas.sistema_venta.dto.reporte;

import java.math.BigDecimal;

public record StockReport(
        Long id,
        String codigo,
        String nombre,
        String categoriaNombre,
        Integer stock,
        Integer stockMinimo,
        BigDecimal precioCompra,
        BigDecimal precioVenta,
        Boolean ventaPorPeso,
        Integer pesoGramos,
        BigDecimal costoInventario,
        BigDecimal ventaInventario,
        BigDecimal margen) {
}
