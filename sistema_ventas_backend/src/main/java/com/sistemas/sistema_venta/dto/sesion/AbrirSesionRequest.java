package com.sistemas.sistema_venta.dto.sesion;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record AbrirSesionRequest(
        @NotNull Long cajaId,
        @PositiveOrZero BigDecimal montoInicial,
        String observaciones) {
}
