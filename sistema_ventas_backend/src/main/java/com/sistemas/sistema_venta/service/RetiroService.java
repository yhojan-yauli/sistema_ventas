package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.sesion.RetiroRequest;
import com.sistemas.sistema_venta.dto.sesion.RetiroResponse;
import com.sistemas.sistema_venta.entity.Retiro;
import com.sistemas.sistema_venta.entity.SesionCaja;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.enums.TipoPago;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.repository.GastoRepository;
import com.sistemas.sistema_venta.repository.RetiroRepository;
import com.sistemas.sistema_venta.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class RetiroService {

    private static final BigDecimal CERO = BigDecimal.ZERO;

    private final RetiroRepository retiroRepository;
    private final SesionService sesionService;
    private final VentaRepository ventaRepository;
    private final GastoRepository gastoRepository;

    public RetiroService(RetiroRepository retiroRepository, SesionService sesionService,
                         VentaRepository ventaRepository, GastoRepository gastoRepository) {
        this.retiroRepository = retiroRepository;
        this.sesionService = sesionService;
        this.ventaRepository = ventaRepository;
        this.gastoRepository = gastoRepository;
    }

    @Transactional
    public RetiroResponse crear(Long sesionId, Usuario admin, RetiroRequest request) {
        SesionCaja sesion = sesionService.getSesionAbiertaParaAccion(sesionId, admin);
        TipoPago tipoPago = request.tipoPago() == null ? TipoPago.EFECTIVO : request.tipoPago();

        BigDecimal ventas = ventaRepository.sumTotalBySesionAndTipoPago(sesion.getId(), tipoPago);
        BigDecimal gastos = gastoRepository.findBySesion_IdOrderByFechaDesc(sesion.getId()).stream()
                .filter(g -> g.getTipoPago() == tipoPago).map(g -> g.getMonto()).reduce(CERO, BigDecimal::add);
        BigDecimal retirosPrevio = retiroRepository.findBySesion_IdOrderByFechaDesc(sesion.getId()).stream()
                .filter(r -> r.getTipoPago() == tipoPago).map(Retiro::getMonto).reduce(CERO, BigDecimal::add);
        BigDecimal disponible = ventas.subtract(gastos).subtract(retirosPrevio);
        if (tipoPago == TipoPago.EFECTIVO) {
            disponible = disponible.add(sesion.getMontoInicial());
        }
        if (request.monto().compareTo(disponible) > 0) {
            throw new BusinessException("El monto a retirar supera el disponible (" + disponible + ") del método " + tipoPago);
        }

        Retiro retiro = Retiro.builder()
                .sesion(sesion)
                .usuario(admin)
                .monto(request.monto())
                .tipoPago(tipoPago)
                .motivo(request.motivo())
                .build();
        return Mapper.toRetiroResponse(retiroRepository.save(retiro));
    }

    @Transactional(readOnly = true)
    public List<RetiroResponse> listar(Long sesionId, Usuario usuario) {
        sesionService.getSesionParaAccion(sesionId, usuario);
        return retiroRepository.findBySesion_IdOrderByFechaDesc(sesionId).stream().map(Mapper::toRetiroResponse).toList();
    }
}
