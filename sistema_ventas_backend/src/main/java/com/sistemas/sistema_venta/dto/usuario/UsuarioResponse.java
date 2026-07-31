package com.sistemas.sistema_venta.dto.usuario;

import com.sistemas.sistema_venta.enums.Rol;

import java.time.LocalDateTime;

public record UsuarioResponse(
        Long id,
        String username,
        String nombre,
        String email,
        Rol rol,
        Boolean activo,
        LocalDateTime fechaCreacion) {
}
