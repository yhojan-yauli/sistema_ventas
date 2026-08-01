package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.reporte.CajaCierreResponse;
import com.sistemas.sistema_venta.dto.reporte.CierreMensualResponse;
import com.sistemas.sistema_venta.entity.Caja;
import com.sistemas.sistema_venta.entity.CierreMensual;
import com.sistemas.sistema_venta.entity.CierreMensualCaja;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.CajaRepository;
import com.sistemas.sistema_venta.repository.CierreMensualRepository;
import com.sistemas.sistema_venta.repository.CompraRepository;
import com.sistemas.sistema_venta.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CierreMensualService {

    private static final BigDecimal CERO = BigDecimal.ZERO;

    private final CierreMensualRepository cierreRepository;
    private final VentaRepository ventaRepository;
    private final CompraRepository compraRepository;
    private final CajaRepository cajaRepository;
    private final AuthService authService;

    public CierreMensualService(CierreMensualRepository cierreRepository, VentaRepository ventaRepository,
                                CompraRepository compraRepository, CajaRepository cajaRepository,
                                AuthService authService) {
        this.cierreRepository = cierreRepository;
        this.ventaRepository = ventaRepository;
        this.compraRepository = compraRepository;
        this.cajaRepository = cajaRepository;
        this.authService = authService;
    }

    @Transactional
    public CierreMensualResponse cerrarMes() {
        LocalDate hoy = LocalDate.now();
        String anioMes = String.format("%d-%02d", hoy.getYear(), hoy.getMonthValue());
        if (cierreRepository.existsByAnioMes(anioMes)) {
            throw new BusinessException("El mes " + anioMes + " ya fue cerrado");
        }
        LocalDateTime desde = hoy.withDayOfMonth(1).atStartOfDay();
        LocalDateTime hasta = hoy.plusMonths(1).withDayOfMonth(1).atStartOfDay();

        Object[] r = primeraFila(ventaRepository.resumenVentas(desde, hasta, null, null, null, null, null));
        BigDecimal totalVentas = (BigDecimal) r[1];
        BigDecimal ganancia = ventaRepository.sumGanancia(desde, hasta, null, null, null, null, null);

        CierreMensual cierre = CierreMensual.builder()
                .anioMes(anioMes)
                .fechaInicio(desde)
                .fechaFin(hasta)
                .fechaCierre(LocalDateTime.now())
                .cantidadVentas((Long) r[0])
                .totalVentas(totalVentas)
                .ganancia(ganancia)
                .cantidadCompras(compraRepository.countByFechaBetween(desde, hasta))
                .totalCompras(compraRepository.sumTotalByFechaBetween(desde, hasta))
                .usuario(authService.getCurrentUser().getUsername())
                .build();

        Map<Long, Object[]> porCaja = new HashMap<>();
        for (Object[] row : ventaRepository.resumenPorCaja(desde, hasta, null, null, null, null, null)) {
            porCaja.put((Long) row[0], row);
        }
        for (Caja caja : cajaRepository.findAll()) {
            Object[] row = porCaja.get(caja.getId());
            long cantidad = row == null ? 0L : (Long) row[2];
            BigDecimal total = row == null ? CERO : (BigDecimal) row[3];
            cierre.getCajas().add(CierreMensualCaja.builder()
                    .cierre(cierre)
                    .cajaId(caja.getId())
                    .cajaNombre(caja.getNombre())
                    .cantidadVentas(cantidad)
                    .totalVentas(total)
                    .build());
        }

        return toResponse(cierreRepository.save(cierre));
    }

    @Transactional(readOnly = true)
    public List<CierreMensualResponse> listar() {
        return cierreRepository.findAllByOrderByAnioMesDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CierreMensualResponse detalle(String anioMes) {
        CierreMensual cierre = cierreRepository.findByAnioMes(anioMes)
                .orElseThrow(() -> new NotFoundException("No existe un cierre mensual para " + anioMes));
        return toResponse(cierre);
    }

    private CierreMensualResponse toResponse(CierreMensual c) {
        List<CajaCierreResponse> cajas = c.getCajas().stream()
                .map(cj -> new CajaCierreResponse(cj.getCajaId(), cj.getCajaNombre(), cj.getCantidadVentas(), cj.getTotalVentas()))
                .toList();
        return new CierreMensualResponse(c.getId(), c.getAnioMes(), c.getFechaCierre(),
                c.getCantidadVentas(), c.getTotalVentas(), c.getGanancia(),
                c.getCantidadCompras(), c.getTotalCompras(), c.getUsuario(), cajas);
    }

    private Object[] primeraFila(List<Object[]> filas) {
        if (filas.isEmpty()) {
            return new Object[]{0L, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};
        }
        return filas.get(0);
    }
}
