package com.sistemas.sistema_venta.dto.auth;

import com.sistemas.sistema_venta.enums.Rol;

public record LoginResponse(
        String token,
        String username,
        String nombre,
        Rol rol) {
}
