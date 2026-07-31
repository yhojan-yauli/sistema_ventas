package com.sistemas.sistema_venta.dto.cliente;

import com.sistemas.sistema_venta.enums.TipoDocumento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotNull TipoDocumento tipoDocumento,
        @NotBlank @Size(max = 20) String numeroDocumento,
        @NotBlank @Size(max = 180) String razonSocial,
        @Size(max = 30) String telefono,
        @Size(max = 200) String direccion,
        @Size(max = 120) String email) {
}
