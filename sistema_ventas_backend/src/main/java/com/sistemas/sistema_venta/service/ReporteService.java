package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.compra.CompraResponse;
import com.sistemas.sistema_venta.dto.reporte.DashboardResponse;
import com.sistemas.sistema_venta.dto.reporte.GrupoVenta;
import com.sistemas.sistema_venta.dto.reporte.ProductoVendido;
import com.sistemas.sistema_venta.dto.reporte.StockReport;
import com.sistemas.sistema_venta.dto.reporte.VentaResumen;
import com.sistemas.sistema_venta.dto.venta.VentaResponse;
import com.sistemas.sistema_venta.entity.Producto;
import com.sistemas.sistema_venta.entity.Venta;
import com.sistemas.sistema_venta.enums.TipoComprobante;
import com.sistemas.sistema_venta.enums.TipoPago;
import com.sistemas.sistema_venta.repository.CompraRepository;
import com.sistemas.sistema_venta.repository.DetalleVentaRepository;
import com.sistemas.sistema_venta.repository.ProductoRepository;
import com.sistemas.sistema_venta.repository.VentaRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ReporteService {

    private static final BigDecimal CERO = BigDecimal.ZERO;
    private static final int SCALE = 2;

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final ProductoRepository productoRepository;
    private final CompraRepository compraRepository;
    private final SesionService sesionService;

    public ReporteService(VentaRepository ventaRepository, DetalleVentaRepository detalleVentaRepository,
                          ProductoRepository productoRepository, CompraRepository compraRepository,
                          SesionService sesionService) {
        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.productoRepository = productoRepository;
        this.compraRepository = compraRepository;
        this.sesionService = sesionService;
    }

    @Transactional(readOnly = true)
    public VentaResumen resumenVentas(LocalDateTime desde, LocalDateTime hasta, Long vendedorId, Long cajaId,
                                      Long productoId, TipoPago tipoPago, TipoComprobante tipoComprobante) {
        Object[] r = primeraFila(ventaRepository.resumenVentas(desde, hasta, vendedorId, cajaId, tipoPago, tipoComprobante, productoId));
        BigDecimal ganancia = ventaRepository.sumGanancia(desde, hasta, vendedorId, cajaId, tipoPago, tipoComprobante, productoId);
        return new VentaResumen(
                (Long) r[0],
                (BigDecimal) r[1],
                (BigDecimal) r[2],
                (BigDecimal) r[3],
                (BigDecimal) r[4],
                ganancia);
    }

    private Object[] primeraFila(List<Object[]> filas) {
        if (filas.isEmpty()) {
            return new Object[]{0L, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};
        }
        return filas.get(0);
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarVentas(LocalDateTime desde, LocalDateTime hasta, Long vendedorId, Long cajaId,
                                            Long productoId, TipoPago tipoPago, TipoComprobante tipoComprobante) {
        List<Long> ventaIds = null;
        if (productoId != null) {
            ventaIds = detalleVentaRepository.findVentaIdsByProducto(productoId);
            if (ventaIds.isEmpty()) {
                return List.of();
            }
        }
        List<Long> ids = ventaIds;
        Specification<Venta> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (desde != null) preds.add(cb.greaterThanOrEqualTo(root.get("fecha"), desde));
            if (hasta != null) preds.add(cb.lessThanOrEqualTo(root.get("fecha"), hasta));
            if (vendedorId != null) preds.add(cb.equal(root.get("vendedor").get("id"), vendedorId));
            if (cajaId != null) preds.add(cb.equal(root.get("sesion").get("caja").get("id"), cajaId));
            if (tipoPago != null) preds.add(cb.equal(root.get("tipoPago"), tipoPago));
            if (tipoComprobante != null) preds.add(cb.equal(root.get("tipoComprobante"), tipoComprobante));
            if (ids != null) preds.add(root.get("id").in(ids));
            return cb.and(preds.toArray(new Predicate[0]));
        };
        List<Venta> ventas = ventaRepository.findAll(spec);
        ventas.sort(Comparator.comparing(Venta::getFecha).reversed());
        return ventas.stream().map(Mapper::toVentaResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoVendido> porProducto(LocalDateTime desde, LocalDateTime hasta, Long vendedorId, Long cajaId,
                                             Long productoId, TipoPago tipoPago, TipoComprobante tipoComprobante) {
        return ventaRepository.resumenPorProducto(desde, hasta, vendedorId, cajaId, tipoPago, tipoComprobante, productoId)
                .stream()
                .map(r -> new ProductoVendido(
                        (Long) r[0], (String) r[1], (String) r[2], (Long) r[3], (BigDecimal) r[4], (BigDecimal) r[5],
                        (BigDecimal) r[6], (BigDecimal) r[7], margen((BigDecimal) r[6], (BigDecimal) r[7]),
                        (Boolean) r[8]))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GrupoVenta> porVendedor(LocalDateTime desde, LocalDateTime hasta, Long vendedorId, Long cajaId,
                                        Long productoId, TipoPago tipoPago, TipoComprobante tipoComprobante) {
        return ventaRepository.resumenPorVendedor(desde, hasta, vendedorId, cajaId, tipoPago, tipoComprobante, productoId)
                .stream()
                .map(r -> new GrupoVenta(
                        (String) r[1], (Long) r[2], (BigDecimal) r[3], (BigDecimal) r[4], (BigDecimal) r[5]))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GrupoVenta> porCaja(LocalDateTime desde, LocalDateTime hasta, Long vendedorId, Long cajaId,
                                    Long productoId, TipoPago tipoPago, TipoComprobante tipoComprobante) {
        return ventaRepository.resumenPorCaja(desde, hasta, vendedorId, cajaId, tipoPago, tipoComprobante, productoId)
                .stream()
                .map(r -> new GrupoVenta(
                        (String) r[1], (Long) r[2], (BigDecimal) r[3], (BigDecimal) r[4], (BigDecimal) r[5]))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GrupoVenta> porFecha(LocalDateTime desde, LocalDateTime hasta, Long vendedorId, Long cajaId,
                                     Long productoId, TipoPago tipoPago, TipoComprobante tipoComprobante) {
        return ventaRepository.resumenPorFecha(desde, hasta, vendedorId, cajaId, tipoPago, tipoComprobante, productoId)
                .stream()
                .map(r -> new GrupoVenta(
                        r[0].toString(), (Long) r[1], (BigDecimal) r[2], (BigDecimal) r[3], BigDecimal.ZERO))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GrupoVenta> porTipoPago(LocalDateTime desde, LocalDateTime hasta, Long vendedorId, Long cajaId,
                                        Long productoId, TipoPago tipoPago, TipoComprobante tipoComprobante) {
        return ventaRepository.resumenPorTipoPago(desde, hasta, vendedorId, cajaId, tipoPago, tipoComprobante, productoId)
                .stream()
                .map(r -> new GrupoVenta(
                        ((TipoPago) r[0]).name(), (Long) r[1], (BigDecimal) r[2], BigDecimal.ZERO, BigDecimal.ZERO))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GrupoVenta> porTipoComprobante(LocalDateTime desde, LocalDateTime hasta, Long vendedorId, Long cajaId,
                                               Long productoId, TipoPago tipoPago, TipoComprobante tipoComprobante) {
        return ventaRepository.resumenPorTipoComprobante(desde, hasta, vendedorId, cajaId, tipoPago, tipoComprobante, productoId)
                .stream()
                .map(r -> new GrupoVenta(
                        ((TipoComprobante) r[0]).name(), (Long) r[1], (BigDecimal) r[2], BigDecimal.ZERO, BigDecimal.ZERO))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CompraResponse> compras(LocalDateTime desde, LocalDateTime hasta) {
        if (desde == null && hasta == null) {
            return compraRepository.findTop50ByOrderByFechaDesc().stream().map(Mapper::toCompraResponse).toList();
        }
        return compraRepository.findByFechaBetweenOrderByFechaDesc(desde, hasta)
                .stream().map(Mapper::toCompraResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<StockReport> stock() {
        return productoRepository.findAll().stream()
                .map(p -> {
                    BigDecimal costoUnidad = unidadPrecio(p.getPrecioCompra(), p);
                    BigDecimal ventaUnidad = unidadPrecio(p.getPrecioVenta(), p);
                    return new StockReport(
                            p.getId(),
                            p.getCodigo(),
                            p.getNombre(),
                            p.getCategoria() != null ? p.getCategoria().getNombre() : null,
                            p.getStock(),
                            p.getStockMinimo(),
                            p.getPrecioCompra(),
                            p.getPrecioVenta(),
                            p.getVentaPorPeso(),
                            p.getPesoGramos(),
                            costoUnidad.multiply(BigDecimal.valueOf(p.getStock())).setScale(SCALE, RoundingMode.HALF_UP),
                            ventaUnidad.multiply(BigDecimal.valueOf(p.getStock())).setScale(SCALE, RoundingMode.HALF_UP),
                            margen(p.getPrecioCompra(), p.getPrecioVenta()));
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        LocalDateTime inicioHoy = LocalDate.now().atStartOfDay();
        LocalDateTime finHoy = inicioHoy.plusDays(1);
        Object[] r = primeraFila(ventaRepository.resumenVentas(inicioHoy, finHoy, null, null, null, null, null));
        BigDecimal gananciaHoy = ventaRepository.sumGanancia(inicioHoy, finHoy, null, null, null, null, null);

        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        Object[] rMes = primeraFila(ventaRepository.resumenVentas(inicioMes, null, null, null, null, null, null));

        long stockBajo = productoRepository.findByActivoTrueAndStockLessThanEqualOrderByStockAsc(0).size();
        return new DashboardResponse(
                (BigDecimal) r[1],
                (Long) r[0],
                gananciaHoy,
                sesionService.contarAbiertas(),
                stockBajo,
                (BigDecimal) rMes[1]);
    }

    private BigDecimal margen(BigDecimal precioCompra, BigDecimal precioVenta) {
        if (precioCompra == null || precioVenta == null || precioCompra.signum() <= 0) {
            return null;
        }
        return precioVenta.subtract(precioCompra)
                .divide(precioCompra, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal unidadPrecio(BigDecimal precioBase, Producto p) {
        if (!Boolean.TRUE.equals(p.getVentaPorPeso()) || p.getPesoGramos() == null || p.getPesoGramos() <= 0) {
            return precioBase;
        }
        return precioBase.multiply(BigDecimal.valueOf(p.getPesoGramos()))
                .divide(BigDecimal.valueOf(1000), SCALE, RoundingMode.HALF_UP);
    }
}
