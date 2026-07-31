package com.sistemas.sistema_venta.dto.sesion;

import com.sistemas.sistema_venta.enums.TipoPago;

import java.math.BigDecimal;

public record CuadreMetodoResponse(
        TipoPago tipoPago,
        BigDecimal montoEsperado,
        BigDecimal montoReal,
        BigDecimal diferencia) {
}
