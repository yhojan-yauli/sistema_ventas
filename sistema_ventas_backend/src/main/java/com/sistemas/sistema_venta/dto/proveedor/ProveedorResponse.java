package com.sistemas.sistema_venta.dto.proveedor;

public record ProveedorResponse(
        Long id,
        String razonSocial,
        String ruc,
        String telefono,
        String direccion,
        String email) {
}
