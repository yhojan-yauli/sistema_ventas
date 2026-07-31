package com.sistemas.sistema_venta.dto.sesion;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CerrarSesionRequest(
        String observaciones,
        @NotEmpty List<@Valid CuadreMetodoRequest> cuadre) {
}
