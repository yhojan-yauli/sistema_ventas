package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.configuracion.ConfiguracionResponse;
import com.sistemas.sistema_venta.exception.BusinessException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Properties;

@Service
public class NotificacionService {

    private final ConfiguracionService configuracionService;

    public NotificacionService(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @Transactional
    public void enviarCorreo(String para, String asunto, String cuerpo) {
        ConfiguracionResponse cfg = configuracionService.obtener();
        String host = cfg.smtpHost();
        String usuario = cfg.smtpUsername();
        String clave = cfg.smtpPassword();

        if (host == null || host.isBlank() || usuario == null || usuario.isBlank()) {
            throw new BusinessException("No se ha configurado el correo SMTP en Configuración");
        }

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(parsePort(cfg.smtpPort()));
        sender.setUsername(usuario);
        sender.setPassword(clave);
        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "15000");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(usuario);
        message.setTo(para);
        message.setSubject(asunto);
        message.setText(cuerpo);

        try {
            sender.send(message);
        } catch (MailException ex) {
            throw new BusinessException("No se pudo enviar el correo. Verifica los datos SMTP y que la contraseña de aplicación sea la correcta");
        }
    }

    private int parsePort(String port) {
        if (port == null || port.isBlank()) return 587;
        try {
            return Integer.parseInt(port.trim());
        } catch (NumberFormatException ex) {
            return 587;
        }
    }
}
