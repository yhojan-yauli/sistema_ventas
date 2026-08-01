package com.sistemas.sistema_venta.dto.notificacion;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailRequest(
        @NotBlank @Email(message = "Correo de destino inválido") String para,
        @NotBlank String asunto,
        @NotBlank String cuerpo) {
}
