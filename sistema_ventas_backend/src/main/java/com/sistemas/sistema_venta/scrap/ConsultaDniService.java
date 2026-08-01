package com.sistemas.sistema_venta.scrap;

import com.sistemas.sistema_venta.exception.BusinessException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class ConsultaDniService {

    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

    private final String dniUrl;
    private final String ruc10Url;
    private final long intervaloMs;
    private final RestClient restClient;
    private final ReentrantLock lock = new ReentrantLock();
    private volatile long ultimaConsulta = 0;

    public ConsultaDniService(@Value("${consulta.dni.url}") String dniUrl,
                              @Value("${consulta.ruc10.url}") String ruc10Url,
                              @Value("${consulta.intervalo-ms:1500}") long intervaloMs) {
        this.dniUrl = dniUrl;
        this.ruc10Url = ruc10Url;
        this.intervaloMs = intervaloMs;
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        HttpClient httpClient = HttpClient.newBuilder().cookieHandler(cookies).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(20));
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader("User-Agent", USER_AGENT)
                .defaultHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .build();
    }

    public String buscarNombrePorDni(String dni) {
        lock.lock();
        try {
            return consultar(dniUrl, "dni", dni);
        } finally {
            lock.unlock();
        }
    }

    public String buscarNombrePorRuc10(String ruc10) {
        lock.lock();
        try {
            return consultar(ruc10Url, "ruc10", ruc10);
        } finally {
            lock.unlock();
        }
    }

    private String consultar(String url, String campo, String valor) {
        esperarIntervalo();
        String token = obtenerToken(url);
        Document doc = postForm(url, campo, valor, token);
        String nombre = doc.selectFirst("samp.inline-block") != null
                ? doc.selectFirst("samp.inline-block").text().trim()
                : "";
        if (nombre.isEmpty()) {
            throw new BusinessException("No se encontraron resultados para el " + campo + " " + valor);
        }
        return nombre;
    }

    private String obtenerToken(String url) {
        Document doc = Jsoup.parse(getHtml(url));
        String token = doc.selectFirst("input[name=_token]") != null
                ? doc.selectFirst("input[name=_token]").attr("value")
                : null;
        if (token == null || token.isBlank()) {
            throw new BusinessException("No se pudo iniciar la consulta, intenta de nuevo");
        }
        return token;
    }

    private String getHtml(String url) {
        try {
            String body = restClient.get().uri(url).retrieve().body(String.class);
            return body == null ? "" : body;
        } catch (HttpClientErrorException e) {
            throw new BusinessException("El sitio de consulta está ocupado, espera unos segundos e intenta de nuevo");
        } catch (ResourceAccessException e) {
            throw new BusinessException("Sin conexión para realizar la consulta");
        }
    }

    private Document postForm(String url, String campo, String valor, String token) {
        try {
            String body = restClient.post().uri(url)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(campo + "=" + valor + "&_token=" + token)
                    .retrieve()
                    .body(String.class);
            return Jsoup.parse(body == null ? "" : body);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                throw new BusinessException("Demasiadas consultas seguidas, espera unos segundos e intenta de nuevo");
            }
            throw new BusinessException("El sitio de consulta respondió con un error, intenta de nuevo");
        } catch (ResourceAccessException e) {
            throw new BusinessException("Sin conexión para realizar la consulta");
        }
    }

    private void esperarIntervalo() {
        long ahora = System.currentTimeMillis();
        long falta = intervaloMs - (ahora - ultimaConsulta);
        if (falta > 0) {
            try {
                Thread.sleep(falta);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        ultimaConsulta = System.currentTimeMillis();
    }
}
