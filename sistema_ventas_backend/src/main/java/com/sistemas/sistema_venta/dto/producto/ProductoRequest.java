package com.sistemas.sistema_venta.dto.producto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductoRequest(
        @Size(max = 40) String codigo,
        @NotBlank @Size(max = 150) String nombre,
        Long categoriaId,
        @Size(max = 300) String descripcion,
        @NotNull @DecimalMin("0.0") BigDecimal precioCompra,
        @NotNull @DecimalMin("0.0") BigDecimal precioVenta,
        Boolean incluyeIGV,
        @Min(0) Integer stock,
        @Min(0) Integer stockMinimo,
        Boolean activo) {
}
