package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.caja.CajaRequest;
import com.sistemas.sistema_venta.dto.caja.CajaResponse;
import com.sistemas.sistema_venta.entity.Caja;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.CajaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CajaService {

    private final CajaRepository cajaRepository;

    public CajaService(CajaRepository cajaRepository) {
        this.cajaRepository = cajaRepository;
    }

    @Transactional(readOnly = true)
    public List<CajaResponse> listar() {
        return cajaRepository.findAllByOrderByNombreAsc().stream().map(Mapper::toCajaResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CajaResponse> listarActivas() {
        return cajaRepository.findByActivaTrueOrderByNombreAsc().stream().map(Mapper::toCajaResponse).toList();
    }

    @Transactional(readOnly = true)
    public CajaResponse obtener(Long id) {
        return Mapper.toCajaResponse(getCaja(id));
    }

    @Transactional
    public CajaResponse crear(CajaRequest request) {
        if (cajaRepository.existsByNombreIgnoreCase(request.nombre())) {
            throw new BusinessException("Ya existe una caja con ese nombre");
        }
        Caja caja = Caja.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .activa(request.activa() == null || request.activa())
                .build();
        return Mapper.toCajaResponse(cajaRepository.save(caja));
    }

    @Transactional
    public CajaResponse actualizar(Long id, CajaRequest request) {
        Caja caja = getCaja(id);
        caja.setNombre(request.nombre());
        caja.setDescripcion(request.descripcion());
        if (request.activa() != null) {
            caja.setActiva(request.activa());
        }
        return Mapper.toCajaResponse(cajaRepository.save(caja));
    }

    @Transactional
    public void eliminar(Long id) {
        Caja caja = getCaja(id);
        caja.setActiva(false);
        cajaRepository.save(caja);
    }

    @Transactional
    public CajaResponse actualizarSaldo(Long id, BigDecimal saldo) {
        Caja caja = getCaja(id);
        caja.setSaldo(saldo == null ? BigDecimal.ZERO : saldo);
        caja.setFechaUltimoCierre(LocalDateTime.now());
        return Mapper.toCajaResponse(cajaRepository.save(caja));
    }

    public Caja getCaja(Long id) {
        return cajaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Caja no encontrada con id " + id));
    }
}
