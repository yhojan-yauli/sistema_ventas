package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.notificacion.EmailRequest;
import com.sistemas.sistema_venta.service.NotificacionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @PostMapping("/email")
    public Map<String, String> enviarCorreo(@Valid @RequestBody EmailRequest request) {
        notificacionService.enviarCorreo(request.para(), request.asunto(), request.cuerpo(), request.ventaId());
        return Map.of("mensaje", "Correo enviado");
    }
}
