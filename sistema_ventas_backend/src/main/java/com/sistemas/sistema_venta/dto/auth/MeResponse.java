package com.sistemas.sistema_venta.dto.auth;

import com.sistemas.sistema_venta.enums.Rol;

public record MeResponse(
        Long id,
        String username,
        String nombre,
        String email,
        Rol rol,
        Boolean activo) {
}
