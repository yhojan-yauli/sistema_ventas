package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.sesion.*;
import com.sistemas.sistema_venta.entity.Caja;
import com.sistemas.sistema_venta.entity.CuadreMetodo;
import com.sistemas.sistema_venta.entity.Gasto;
import com.sistemas.sistema_venta.entity.Retiro;
import com.sistemas.sistema_venta.entity.SesionCaja;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.enums.EstadoSesion;
import com.sistemas.sistema_venta.enums.Rol;
import com.sistemas.sistema_venta.enums.TipoPago;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.CuadreMetodoRepository;
import com.sistemas.sistema_venta.repository.GastoRepository;
import com.sistemas.sistema_venta.repository.RetiroRepository;
import com.sistemas.sistema_venta.repository.SesionCajaRepository;
import com.sistemas.sistema_venta.repository.VentaRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SesionService {

    private static final BigDecimal CERO = BigDecimal.ZERO;

    private final SesionCajaRepository sesionRepository;
    private final CajaService cajaService;
    private final CuadreMetodoRepository cuadreMetodoRepository;
    private final GastoRepository gastoRepository;
    private final RetiroRepository retiroRepository;
    private final VentaRepository ventaRepository;

    public SesionService(SesionCajaRepository sesionRepository, CajaService cajaService,
                         CuadreMetodoRepository cuadreMetodoRepository, GastoRepository gastoRepository,
                         RetiroRepository retiroRepository, VentaRepository ventaRepository) {
        this.sesionRepository = sesionRepository;
        this.cajaService = cajaService;
        this.cuadreMetodoRepository = cuadreMetodoRepository;
        this.gastoRepository = gastoRepository;
        this.retiroRepository = retiroRepository;
        this.ventaRepository = ventaRepository;
    }

    @Transactional
    public SesionResponse abrir(Usuario usuario, AbrirSesionRequest request) {
        Caja caja = cajaService.getCaja(request.cajaId());
        if (!Boolean.TRUE.equals(caja.getActiva())) {
            throw new BusinessException("La caja '" + caja.getNombre() + "' está deshabilitada");
        }
        if (sesionRepository.existsByCaja_IdAndEstado(caja.getId(), EstadoSesion.ABIERTA)) {
            throw new BusinessException("La caja '" + caja.getNombre() + "' ya tiene una sesión abierta");
        }
        if (!sesionRepository.findByEstadoAndUsuario_Id(EstadoSesion.ABIERTA, usuario.getId()).isEmpty()) {
            throw new BusinessException("Ya tiene una sesión de caja abierta; ciérrela antes de abrir otra");
        }
        SesionCaja sesion = SesionCaja.builder()
                .caja(caja)
                .usuario(usuario)
                .montoInicial(request.montoInicial() == null ? (caja.getSaldo() == null ? CERO : caja.getSaldo()) : request.montoInicial())
                .estado(EstadoSesion.ABIERTA)
                .observaciones(request.observaciones())
                .build();
        return toResponse(sesionRepository.save(sesion));
    }

    @Transactional
    public SesionResponse cerrar(Long id, Usuario usuario, CerrarSesionRequest request) {
        SesionCaja sesion = getSesion(id);
        validarAcceso(sesion, usuario);
        if (sesion.getEstado() != EstadoSesion.ABIERTA) {
            throw new BusinessException("La sesión ya está cerrada");
        }

        Map<TipoPago, BigDecimal> esperado = calcularEsperadoPorMetodo(sesion);
        Map<TipoPago, BigDecimal> real = new EnumMap<>(TipoPago.class);
        for (CuadreMetodoRequest c : request.cuadre()) {
            real.put(c.tipoPago(), c.montoReal() == null ? CERO : c.montoReal());
        }
        for (TipoPago tp : TipoPago.values()) {
            if (esperado.getOrDefault(tp, CERO).compareTo(CERO) != 0 && !real.containsKey(tp)) {
                real.put(tp, esperado.get(tp));
            }
        }

        for (TipoPago tp : TipoPago.values()) {
            BigDecimal esperadoMetodo = esperado.getOrDefault(tp, CERO);
            if (esperadoMetodo.compareTo(CERO) == 0 && !real.containsKey(tp)) {
                continue;
            }
            BigDecimal realMetodo = real.getOrDefault(tp, CERO);
            cuadreMetodoRepository.save(CuadreMetodo.builder()
                    .sesion(sesion)
                    .tipoPago(tp)
                    .montoEsperado(esperadoMetodo)
                    .montoReal(realMetodo)
                    .diferencia(realMetodo.subtract(esperadoMetodo))
                    .build());
        }

        BigDecimal efectivoFinal = esperado.getOrDefault(TipoPago.EFECTIVO, CERO);
        cajaService.actualizarSaldo(sesion.getCaja().getId(), efectivoFinal);

        sesion.setEstado(EstadoSesion.CERRADA);
        sesion.setFechaCierre(LocalDateTime.now());
        if (request.observaciones() != null && !request.observaciones().isBlank()) {
            String previa = sesion.getObservaciones() == null ? "" : sesion.getObservaciones() + " | ";
            sesion.setObservaciones(previa + request.observaciones());
        }
        return toResponse(sesionRepository.save(sesion));
    }

    @Transactional(readOnly = true)
    public SesionResponse obtener(Long id, Usuario usuario) {
        SesionCaja sesion = getSesion(id);
        validarAcceso(sesion, usuario);
        return toResponse(sesion);
    }

    @Transactional(readOnly = true)
    public List<SesionResponse> listarActivas() {
        return sesionRepository.findByEstadoOrderByFechaAperturaDesc(EstadoSesion.ABIERTA)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SesionResponse> historial() {
        return sesionRepository.findTop30ByOrderByFechaAperturaDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SesionResponse miSesionAbierta(Usuario usuario) {
        return sesionRepository.findByEstadoAndUsuario_Id(EstadoSesion.ABIERTA, usuario.getId())
                .stream().findFirst().map(this::toResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public long contarAbiertas() {
        return sesionRepository.countByEstado(EstadoSesion.ABIERTA);
    }

    public SesionCaja getSesion(Long id) {
        return sesionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sesión de caja no encontrada con id " + id));
    }

    public SesionCaja getSesionParaAccion(Long id, Usuario usuario) {
        SesionCaja sesion = getSesion(id);
        validarAcceso(sesion, usuario);
        return sesion;
    }

    public SesionCaja getSesionAbiertaParaAccion(Long id, Usuario usuario) {
        SesionCaja sesion = getSesionParaAccion(id, usuario);
        if (sesion.getEstado() != EstadoSesion.ABIERTA) {
            throw new BusinessException("La sesión de caja está cerrada");
        }
        return sesion;
    }

    public SesionCaja getSesionAbiertaDeUsuario(Usuario usuario) {
        return sesionRepository.findByEstadoAndUsuario_Id(EstadoSesion.ABIERTA, usuario.getId())
                .stream().findFirst()
                .orElseThrow(() -> new BusinessException("No tiene una caja abierta. Aperture su caja primero"));
    }

    private Map<TipoPago, BigDecimal> calcularEsperadoPorMetodo(SesionCaja sesion) {
        Map<TipoPago, BigDecimal> map = new EnumMap<>(TipoPago.class);
        List<Gasto> gastos = gastoRepository.findBySesion_IdOrderByFechaDesc(sesion.getId());
        List<Retiro> retiros = retiroRepository.findBySesion_IdOrderByFechaDesc(sesion.getId());
        for (TipoPago tp : TipoPago.values()) {
            BigDecimal ventas = ventaRepository.sumTotalBySesionAndTipoPago(sesion.getId(), tp);
            BigDecimal gastosMetodo = gastos.stream()
                    .filter(g -> g.getTipoPago() == tp).map(Gasto::getMonto).reduce(CERO, BigDecimal::add);
            BigDecimal retirosMetodo = retiros.stream()
                    .filter(r -> r.getTipoPago() == tp).map(Retiro::getMonto).reduce(CERO, BigDecimal::add);
            BigDecimal esperado = ventas.subtract(gastosMetodo).subtract(retirosMetodo);
            if (tp == TipoPago.EFECTIVO) {
                esperado = esperado.add(sesion.getMontoInicial());
            }
            map.put(tp, esperado);
        }
        return map;
    }

    private SesionResponse toResponse(SesionCaja s) {
        Map<String, BigDecimal> ventasPorMetodo = new LinkedHashMap<>();
        BigDecimal totalVentas = CERO;
        for (TipoPago tp : TipoPago.values()) {
            BigDecimal monto = ventaRepository.sumTotalBySesionAndTipoPago(s.getId(), tp);
            ventasPorMetodo.put(tp.name(), monto);
            totalVentas = totalVentas.add(monto);
        }
        List<Gasto> gastos = gastoRepository.findBySesion_IdOrderByFechaDesc(s.getId());
        List<Retiro> retiros = retiroRepository.findBySesion_IdOrderByFechaDesc(s.getId());
        BigDecimal totalGastos = gastos.stream().map(Gasto::getMonto).reduce(CERO, BigDecimal::add);
        BigDecimal totalRetiros = retiros.stream().map(Retiro::getMonto).reduce(CERO, BigDecimal::add);
        BigDecimal montoFinalEsperado = s.getMontoInicial().add(totalVentas).subtract(totalGastos).subtract(totalRetiros);

        List<CuadreMetodoResponse> cuadre = cuadreMetodoRepository.findBySesion_IdOrderByTipoPago(s.getId())
                .stream()
                .map(c -> new CuadreMetodoResponse(c.getTipoPago(), c.getMontoEsperado(), c.getMontoReal(), c.getDiferencia()))
                .toList();

        return new SesionResponse(
                s.getId(),
                s.getCaja().getId(),
                s.getCaja().getNombre(),
                s.getUsuario().getId(),
                s.getUsuario().getNombre(),
                s.getFechaApertura(),
                s.getFechaCierre(),
                s.getMontoInicial(),
                s.getEstado().name(),
                s.getObservaciones(),
                totalVentas,
                totalGastos,
                totalRetiros,
                montoFinalEsperado,
                ventasPorMetodo,
                cuadre,
                gastos.stream().map(Mapper::toGastoResponse).toList(),
                retiros.stream().map(Mapper::toRetiroResponse).toList());
    }

    private void validarAcceso(SesionCaja sesion, Usuario usuario) {
        if (usuario.getRol() != Rol.ADMIN && !sesion.getUsuario().getId().equals(usuario.getId())) {
            throw new AccessDeniedException("No tiene permisos sobre esta sesión de caja");
        }
    }
}
