package com.sistemas.sistema_venta.dto.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordRequest(
        @NotBlank @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres") String password) {
}
