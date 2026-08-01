package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.configuracion.ConfiguracionRequest;
import com.sistemas.sistema_venta.dto.configuracion.ConfiguracionResponse;
import com.sistemas.sistema_venta.entity.Configuracion;
import com.sistemas.sistema_venta.repository.ConfiguracionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class ConfiguracionService {

    public static final String KEY_IGV_PORCENTAJE = "igv.porcentaje";
    public static final String KEY_IGV_PRECIO_INCLUIDO = "igv.precioIncluyeIGV";
    public static final String KEY_RAZON_SOCIAL = "negocio.razonSocial";
    public static final String KEY_RUC = "negocio.ruc";
    public static final String KEY_DIRECCION = "negocio.direccion";
    public static final String KEY_TELEFONO = "negocio.telefono";
    public static final String KEY_EMAIL = "negocio.email";
    public static final String KEY_SMTP_HOST = "smtp.host";
    public static final String KEY_SMTP_PORT = "smtp.port";
    public static final String KEY_SMTP_USERNAME = "smtp.username";
    public static final String KEY_SMTP_PASSWORD = "smtp.password";

    private final ConfiguracionRepository configuracionRepository;

    public ConfiguracionService(ConfiguracionRepository configuracionRepository) {
        this.configuracionRepository = configuracionRepository;
    }

    @Transactional(readOnly = true)
    public BigDecimal igvPorcentaje() {
        return new BigDecimal(get(KEY_IGV_PORCENTAJE, "18"));
    }

    @Transactional(readOnly = true)
    public boolean precioIncluyeIGV() {
        return Boolean.parseBoolean(get(KEY_IGV_PRECIO_INCLUIDO, "true"));
    }

    @Transactional(readOnly = true)
    public ConfiguracionResponse obtener() {
        return new ConfiguracionResponse(
                igvPorcentaje(),
                precioIncluyeIGV(),
                get(KEY_RAZON_SOCIAL, ""),
                get(KEY_RUC, ""),
                get(KEY_DIRECCION, ""),
                get(KEY_TELEFONO, ""),
                get(KEY_EMAIL, ""),
                get(KEY_SMTP_HOST, "smtp.gmail.com"),
                get(KEY_SMTP_PORT, "587"),
                get(KEY_SMTP_USERNAME, ""),
                get(KEY_SMTP_PASSWORD, ""));
    }

    @Transactional
    public ConfiguracionResponse actualizar(ConfiguracionRequest request) {
        Map<String, String> valores = new HashMap<>();
        valores.put(KEY_IGV_PORCENTAJE, request.igvPorcentaje().toPlainString());
        valores.put(KEY_IGV_PRECIO_INCLUIDO, request.precioIncluyeIGV().toString());
        valores.put(KEY_RAZON_SOCIAL, request.razonSocial() == null ? "" : request.razonSocial());
        valores.put(KEY_RUC, request.ruc() == null ? "" : request.ruc());
        valores.put(KEY_DIRECCION, request.direccion() == null ? "" : request.direccion());
        valores.put(KEY_TELEFONO, request.telefono() == null ? "" : request.telefono());
        valores.put(KEY_EMAIL, request.email() == null ? "" : request.email());
        valores.put(KEY_SMTP_HOST, request.smtpHost() == null ? "" : request.smtpHost());
        valores.put(KEY_SMTP_PORT, request.smtpPort() == null ? "" : request.smtpPort());
        valores.put(KEY_SMTP_USERNAME, request.smtpUsername() == null ? "" : request.smtpUsername());
        valores.put(KEY_SMTP_PASSWORD, request.smtpPassword() == null ? "" : request.smtpPassword());
        for (Map.Entry<String, String> entry : valores.entrySet()) {
            guardar(entry.getKey(), entry.getValue());
        }
        return obtener();
    }

    private void guardar(String clave, String valor) {
        configuracionRepository.findByClave(clave)
                .ifPresentOrElse(c -> c.setValor(valor), () -> configuracionRepository.save(
                        Configuracion.builder().clave(clave).valor(valor).build()));
    }

    private String get(String clave, String valorPorDefecto) {
        return configuracionRepository.findByClave(clave)
                .map(Configuracion::getValor)
                .orElse(valorPorDefecto);
    }
}
