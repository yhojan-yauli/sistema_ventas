package com.sistemas.sistema_venta.dto.sesion;

import com.sistemas.sistema_venta.enums.TipoPago;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record GastoRequest(
        @NotBlank String concepto,
        @NotNull @Positive BigDecimal monto,
        TipoPago tipoPago) {
}
