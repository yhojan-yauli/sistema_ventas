package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.configuracion.ConfiguracionResponse;
import com.sistemas.sistema_venta.entity.Venta;
import com.sistemas.sistema_venta.enums.TipoComprobante;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.VentaRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Properties;

@Service
public class NotificacionService {

    private final ConfiguracionService configuracionService;
    private final VentaRepository ventaRepository;
    private final PdfComprobanteService pdfComprobanteService;

    public NotificacionService(ConfiguracionService configuracionService,
                               VentaRepository ventaRepository,
                               PdfComprobanteService pdfComprobanteService) {
        this.configuracionService = configuracionService;
        this.ventaRepository = ventaRepository;
        this.pdfComprobanteService = pdfComprobanteService;
    }

    @Transactional
    public void enviarCorreo(String para, String asunto, String cuerpo, Long ventaId) {
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

        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(usuario);
            helper.setTo(para);
            helper.setSubject(asunto);
            String texto = (cuerpo == null || cuerpo.isBlank()) ? "Adjunto se envía el comprobante." : cuerpo;
            helper.setText(texto, false);

            if (ventaId != null) {
                Venta venta = ventaRepository.findById(ventaId)
                        .orElseThrow(() -> new NotFoundException("Venta no encontrada con id " + ventaId));
                if (venta.getTipoComprobante() != TipoComprobante.TICKET) {
                    byte[] pdf = pdfComprobanteService.generarComprobanteA4(venta, cfg);
                    helper.addAttachment(nombreArchivo(venta), new ByteArrayResource(pdf), "application/pdf");
                }
            }

            sender.send(message);
        } catch (BusinessException | NotFoundException ex) {
            throw ex;
        } catch (MessagingException | MailException ex) {
            throw new BusinessException("No se pudo enviar el correo. Verifica los datos SMTP y que la contraseña de aplicación sea la correcta");
        }
    }

    private String nombreArchivo(Venta venta) {
        String serie = venta.getSerie();
        String numero = String.format(Locale.ROOT, "%04d", venta.getNumero());
        return serie + "-" + numero + ".pdf";
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
