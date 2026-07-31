package com.sistemas.sistema_venta.config;

import com.sistemas.sistema_venta.entity.Caja;
import com.sistemas.sistema_venta.entity.Configuracion;
import com.sistemas.sistema_venta.entity.SerieComprobante;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.enums.Rol;
import com.sistemas.sistema_venta.enums.TipoComprobante;
import com.sistemas.sistema_venta.repository.CajaRepository;
import com.sistemas.sistema_venta.repository.ConfiguracionRepository;
import com.sistemas.sistema_venta.repository.SerieComprobanteRepository;
import com.sistemas.sistema_venta.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final CajaRepository cajaRepository;
    private final SerieComprobanteRepository serieComprobanteRepository;
    private final ConfiguracionRepository configuracionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository, CajaRepository cajaRepository,
                           SerieComprobanteRepository serieComprobanteRepository,
                           ConfiguracionRepository configuracionRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.cajaRepository = cajaRepository;
        this.serieComprobanteRepository = serieComprobanteRepository;
        this.configuracionRepository = configuracionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsuarios();
        seedCajas();
        seedSeries();
        seedConfiguracion();
    }

    private void seedUsuarios() {
        if (usuarioRepository.count() == 0) {
            usuarioRepository.save(Usuario.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .nombre("Administrador")
                    .email("admin@tienda.com")
                    .rol(Rol.ADMIN)
                    .activo(true)
                    .build());
            usuarioRepository.save(Usuario.builder()
                    .username("vendedor")
                    .password(passwordEncoder.encode("vendedor123"))
                    .nombre("Vendedor Demo")
                    .rol(Rol.VENDEDOR)
                    .activo(true)
                    .build());
        }
    }

    private void seedCajas() {
        if (cajaRepository.count() == 0) {
            cajaRepository.save(Caja.builder().nombre("Caja 1").descripcion("Caja principal").activa(true).build());
            cajaRepository.save(Caja.builder().nombre("Caja 2").descripcion("Caja secundaria").activa(true).build());
            cajaRepository.save(Caja.builder().nombre("Caja 3").descripcion("Caja auxiliar").activa(true).build());
        }
    }

    private void seedSeries() {
        if (serieComprobanteRepository.count() == 0) {
            serieComprobanteRepository.save(SerieComprobante.builder()
                    .tipoComprobante(TipoComprobante.BOLETA).serie("B001").correlativo(0L).build());
            serieComprobanteRepository.save(SerieComprobante.builder()
                    .tipoComprobante(TipoComprobante.FACTURA).serie("F001").correlativo(0L).build());
            serieComprobanteRepository.save(SerieComprobante.builder()
                    .tipoComprobante(TipoComprobante.TICKET).serie("T001").correlativo(0L).build());
        }
    }

    private void seedConfiguracion() {
        guardarSiNoExiste("igv.porcentaje", "18");
        guardarSiNoExiste("igv.precioIncluyeIGV", "true");
        guardarSiNoExiste("negocio.razonSocial", "");
        guardarSiNoExiste("negocio.ruc", "");
        guardarSiNoExiste("negocio.direccion", "");
        guardarSiNoExiste("negocio.telefono", "");
        guardarSiNoExiste("negocio.email", "");
    }

    private void guardarSiNoExiste(String clave, String valor) {
        configuracionRepository.findByClave(clave).orElseGet(() ->
                configuracionRepository.save(Configuracion.builder().clave(clave).valor(valor).build()));
    }
}
