package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.sesion.GastoRequest;
import com.sistemas.sistema_venta.dto.sesion.GastoResponse;
import com.sistemas.sistema_venta.entity.Gasto;
import com.sistemas.sistema_venta.entity.SesionCaja;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.enums.TipoPago;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.GastoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GastoService {

    private final GastoRepository gastoRepository;
    private final SesionService sesionService;

    public GastoService(GastoRepository gastoRepository, SesionService sesionService) {
        this.gastoRepository = gastoRepository;
        this.sesionService = sesionService;
    }

    @Transactional
    public GastoResponse crear(Long sesionId, Usuario usuario, GastoRequest request) {
        SesionCaja sesion = sesionService.getSesionAbiertaParaAccion(sesionId, usuario);
        Gasto gasto = Gasto.builder()
                .sesion(sesion)
                .concepto(request.concepto())
                .monto(request.monto())
                .tipoPago(request.tipoPago() == null ? TipoPago.EFECTIVO : request.tipoPago())
                .build();
        return Mapper.toGastoResponse(gastoRepository.save(gasto));
    }

    @Transactional(readOnly = true)
    public List<GastoResponse> listar(Long sesionId, Usuario usuario) {
        sesionService.getSesionParaAccion(sesionId, usuario);
        return gastoRepository.findBySesion_IdOrderByFechaDesc(sesionId).stream().map(Mapper::toGastoResponse).toList();
    }

    @Transactional
    public void eliminar(Long sesionId, Long gastoId, Usuario usuario) {
        sesionService.getSesionAbiertaParaAccion(sesionId, usuario);
        Gasto gasto = gastoRepository.findById(gastoId)
                .orElseThrow(() -> new NotFoundException("Gasto no encontrado"));
        if (!gasto.getSesion().getId().equals(sesionId)) {
            throw new BusinessException("El gasto no pertenece a esta sesión");
        }
        gastoRepository.delete(gasto);
    }
}
