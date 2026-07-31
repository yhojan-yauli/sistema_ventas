package com.sistemas.sistema_venta.dto.proveedor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProveedorRequest(
        @NotBlank @Size(max = 150) String razonSocial,
        @Size(max = 20) String ruc,
        @Size(max = 30) String telefono,
        @Size(max = 200) String direccion,
        @Size(max = 120) String email) {
}
