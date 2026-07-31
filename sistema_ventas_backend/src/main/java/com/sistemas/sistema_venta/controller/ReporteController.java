package com.sistemas.sistema_venta.controller;

import com.sistemas.sistema_venta.dto.reporte.DashboardResponse;
import com.sistemas.sistema_venta.dto.reporte.GrupoVenta;
import com.sistemas.sistema_venta.dto.reporte.ProductoVendido;
import com.sistemas.sistema_venta.dto.reporte.VentaResumen;
import com.sistemas.sistema_venta.dto.venta.VentaResponse;
import com.sistemas.sistema_venta.enums.TipoComprobante;
import com.sistemas.sistema_venta.enums.TipoPago;
import com.sistemas.sistema_venta.service.ReporteService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@PreAuthorize("hasRole('ADMIN')")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    @GetMapping("/resumen")
    public VentaResumen resumen(@RequestParam(required = false) LocalDate desde,
                                @RequestParam(required = false) LocalDate hasta,
                                @RequestParam(required = false) Long vendedorId,
                                @RequestParam(required = false) Long productoId,
                                @RequestParam(required = false) TipoPago tipoPago,
                                @RequestParam(required = false) TipoComprobante tipoComprobante) {
        return reporteService.resumenVentas(toInicio(desde), toFin(hasta), vendedorId, productoId, tipoPago, tipoComprobante);
    }

    @GetMapping("/ventas")
    public List<VentaResponse> ventas(@RequestParam(required = false) LocalDate desde,
                                      @RequestParam(required = false) LocalDate hasta,
                                      @RequestParam(required = false) Long vendedorId,
                                      @RequestParam(required = false) Long productoId,
                                      @RequestParam(required = false) TipoPago tipoPago,
                                      @RequestParam(required = false) TipoComprobante tipoComprobante) {
        return reporteService.listarVentas(toInicio(desde), toFin(hasta), vendedorId, productoId, tipoPago, tipoComprobante);
    }

    @GetMapping("/por-producto")
    public List<ProductoVendido> porProducto(@RequestParam(required = false) LocalDate desde,
                                             @RequestParam(required = false) LocalDate hasta,
                                             @RequestParam(required = false) Long vendedorId,
                                             @RequestParam(required = false) Long productoId,
                                             @RequestParam(required = false) TipoPago tipoPago,
                                             @RequestParam(required = false) TipoComprobante tipoComprobante) {
        return reporteService.porProducto(toInicio(desde), toFin(hasta), vendedorId, productoId, tipoPago, tipoComprobante);
    }

    @GetMapping("/por-vendedor")
    public List<GrupoVenta> porVendedor(@RequestParam(required = false) LocalDate desde,
                                        @RequestParam(required = false) LocalDate hasta,
                                        @RequestParam(required = false) Long vendedorId,
                                        @RequestParam(required = false) Long productoId,
                                        @RequestParam(required = false) TipoPago tipoPago,
                                        @RequestParam(required = false) TipoComprobante tipoComprobante) {
        return reporteService.porVendedor(toInicio(desde), toFin(hasta), vendedorId, productoId, tipoPago, tipoComprobante);
    }

    @GetMapping("/por-fecha")
    public List<GrupoVenta> porFecha(@RequestParam(required = false) LocalDate desde,
                                     @RequestParam(required = false) LocalDate hasta,
                                     @RequestParam(required = false) Long vendedorId,
                                     @RequestParam(required = false) Long productoId,
                                     @RequestParam(required = false) TipoPago tipoPago,
                                     @RequestParam(required = false) TipoComprobante tipoComprobante) {
        return reporteService.porFecha(toInicio(desde), toFin(hasta), vendedorId, productoId, tipoPago, tipoComprobante);
    }

    @GetMapping("/por-tipo-pago")
    public List<GrupoVenta> porTipoPago(@RequestParam(required = false) LocalDate desde,
                                        @RequestParam(required = false) LocalDate hasta,
                                        @RequestParam(required = false) Long vendedorId,
                                        @RequestParam(required = false) Long productoId,
                                        @RequestParam(required = false) TipoPago tipoPago,
                                        @RequestParam(required = false) TipoComprobante tipoComprobante) {
        return reporteService.porTipoPago(toInicio(desde), toFin(hasta), vendedorId, productoId, tipoPago, tipoComprobante);
    }

    @GetMapping("/por-comprobante")
    public List<GrupoVenta> porTipoComprobante(@RequestParam(required = false) LocalDate desde,
                                               @RequestParam(required = false) LocalDate hasta,
                                               @RequestParam(required = false) Long vendedorId,
                                               @RequestParam(required = false) Long productoId,
                                               @RequestParam(required = false) TipoPago tipoPago,
                                               @RequestParam(required = false) TipoComprobante tipoComprobante) {
        return reporteService.porTipoComprobante(toInicio(desde), toFin(hasta), vendedorId, productoId, tipoPago, tipoComprobante);
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return reporteService.dashboard();
    }

    private LocalDateTime toInicio(LocalDate fecha) {
        return fecha == null ? null : fecha.atStartOfDay();
    }

    private LocalDateTime toFin(LocalDate fecha) {
        return fecha == null ? null : fecha.plusDays(1).atStartOfDay();
    }
}
