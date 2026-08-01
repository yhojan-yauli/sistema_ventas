package com.sistemas.sistema_venta.dto.cliente;

public record ClienteConsultaResponse(
        String tipoDocumento,
        String numeroDocumento,
        String razonSocial,
        String telefono,
        String direccion,
        String email,
        boolean local) {
}
