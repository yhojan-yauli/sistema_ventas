package com.sistemas.sistema_venta.dto.caja;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CajaRequest(
        @NotBlank @Size(max = 60) String nombre,
        @Size(max = 200) String descripcion,
        Boolean activa) {
}
