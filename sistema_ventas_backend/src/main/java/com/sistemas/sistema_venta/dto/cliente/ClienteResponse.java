package com.sistemas.sistema_venta.dto.cliente;

import com.sistemas.sistema_venta.enums.TipoDocumento;

public record ClienteResponse(
        Long id,
        TipoDocumento tipoDocumento,
        String numeroDocumento,
        String razonSocial,
        String telefono,
        String direccion,
        String email) {
}
