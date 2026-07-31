package com.sistemas.sistema_venta.dto.venta;

import com.sistemas.sistema_venta.dto.cliente.ClienteRequest;
import com.sistemas.sistema_venta.enums.TipoComprobante;
import com.sistemas.sistema_venta.enums.TipoPago;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record VentaRequest(
        Long clienteId,
        @Valid ClienteRequest clienteNuevo,
        @NotNull TipoPago tipoPago,
        @NotNull TipoComprobante tipoComprobante,
        BigDecimal descuento,
        @NotEmpty List<@Valid ItemVentaRequest> items) {
}
