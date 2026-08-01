package com.sistemas.sistema_venta.dto.venta;

import com.sistemas.sistema_venta.enums.TipoComprobante;
import com.sistemas.sistema_venta.enums.TipoPago;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VentaResponse(
        Long id,
        Long sesionId,
        Long cajaId,
        String cajaNombre,
        Long vendedorId,
        String vendedorNombre,
        Long clienteId,
        String clienteNombre,
        String clienteDocumento,
        String clienteTelefono,
        String clienteEmail,
        TipoPago tipoPago,
        TipoComprobante tipoComprobante,
        String serie,
        Long numero,
        LocalDateTime fecha,
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal igv,
        BigDecimal total,
        BigDecimal igvPorcentaje,
        Boolean incluyeIGV,
        List<ItemVentaResponse> items) {
}
