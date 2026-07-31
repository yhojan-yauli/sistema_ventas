package com.sistemas.sistema_venta.dto.usuario;

import com.sistemas.sistema_venta.enums.Rol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotBlank @Size(max = 50) String username,
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres") String password,
        @NotBlank @Size(max = 120) String nombre,
        @Size(max = 120) String email,
        @NotNull Rol rol) {
}
