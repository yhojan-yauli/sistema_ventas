package com.sistemas.sistema_venta.dto.sesion;

import com.sistemas.sistema_venta.enums.TipoPago;

public record CuadreMetodoRequest(
        TipoPago tipoPago,
        java.math.BigDecimal montoReal) {
}
