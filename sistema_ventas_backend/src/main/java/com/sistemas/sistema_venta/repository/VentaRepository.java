package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Venta;
import com.sistemas.sistema_venta.enums.TipoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Long>, JpaSpecificationExecutor<Venta> {

    String FILTROS_VENTA =
            "v.fecha >= COALESCE(:desde, v.fecha) " +
            "AND v.fecha <= COALESCE(:hasta, v.fecha) " +
            "AND v.vendedor.id = COALESCE(:vendedorId, v.vendedor.id) " +
            "AND v.sesion.caja.id = COALESCE(:cajaId, v.sesion.caja.id) " +
            "AND v.tipoPago = COALESCE(:tipoPago, v.tipoPago) " +
            "AND v.tipoComprobante = COALESCE(:tipoComprobante, v.tipoComprobante) " +
            "AND (:productoId IS NULL OR v.id IN (SELECT d.venta.id FROM DetalleVenta d WHERE d.producto.id = :productoId))";

    String FILTROS_DETALLE =
            "v.fecha >= COALESCE(:desde, v.fecha) " +
            "AND v.fecha <= COALESCE(:hasta, v.fecha) " +
            "AND v.vendedor.id = COALESCE(:vendedorId, v.vendedor.id) " +
            "AND v.sesion.caja.id = COALESCE(:cajaId, v.sesion.caja.id) " +
            "AND v.tipoPago = COALESCE(:tipoPago, v.tipoPago) " +
            "AND v.tipoComprobante = COALESCE(:tipoComprobante, v.tipoComprobante) " +
            "AND d.producto.id = COALESCE(:productoId, d.producto.id)";

    boolean existsBySerieAndNumero(String serie, Long numero);

    Optional<Venta> findBySerieAndNumero(String serie, Long numero);

    List<Venta> findTop100ByOrderByFechaDesc();

    List<Venta> findTop100ByVendedor_IdOrderByFechaDesc(Long vendedorId);

    List<Venta> findBySesion_IdOrderByFechaAsc(Long sesionId);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.sesion.id = :sesionId")
    BigDecimal sumTotalBySesion(@Param("sesionId") Long sesionId);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.sesion.id = :sesionId AND v.tipoPago = :tipoPago")
    BigDecimal sumTotalBySesionAndTipoPago(@Param("sesionId") Long sesionId, @Param("tipoPago") TipoPago tipoPago);

    @Query("SELECT COUNT(v), COALESCE(SUM(v.total), 0), COALESCE(SUM(v.igv), 0), " +
            "COALESCE(SUM(v.subtotal), 0), COALESCE(SUM(v.descuento), 0) " +
            "FROM Venta v WHERE " + FILTROS_VENTA)
    List<Object[]> resumenVentas(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("vendedorId") Long vendedorId,
            @Param("cajaId") Long cajaId,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("tipoComprobante") com.sistemas.sistema_venta.enums.TipoComprobante tipoComprobante,
            @Param("productoId") Long productoId);

    @Query("SELECT COALESCE(SUM((d.precioVenta - d.precioCompra) * d.cantidad - d.descuentoLinea), 0) " +
            "FROM DetalleVenta d JOIN d.venta v WHERE " + FILTROS_DETALLE)
    BigDecimal sumGanancia(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("vendedorId") Long vendedorId,
            @Param("cajaId") Long cajaId,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("tipoComprobante") com.sistemas.sistema_venta.enums.TipoComprobante tipoComprobante,
            @Param("productoId") Long productoId);

    @Query("SELECT d.producto.id, d.producto.nombre, d.producto.codigo, SUM(d.cantidad), " +
            "COALESCE(SUM(d.subtotal), 0), COALESCE(SUM((d.precioVenta - d.precioCompra) * d.cantidad - d.descuentoLinea), 0), " +
            "d.producto.precioCompra, d.producto.precioVenta, d.producto.ventaPorPeso " +
            "FROM DetalleVenta d JOIN d.venta v WHERE " + FILTROS_DETALLE +
            " GROUP BY d.producto.id, d.producto.nombre, d.producto.codigo, d.producto.precioCompra, " +
            "d.producto.precioVenta, d.producto.ventaPorPeso ORDER BY SUM(d.cantidad) DESC")
    List<Object[]> resumenPorProducto(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("vendedorId") Long vendedorId,
            @Param("cajaId") Long cajaId,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("tipoComprobante") com.sistemas.sistema_venta.enums.TipoComprobante tipoComprobante,
            @Param("productoId") Long productoId);

    @Query("SELECT v.vendedor.id, v.vendedor.nombre, COUNT(v), COALESCE(SUM(v.total), 0), " +
            "COALESCE(SUM(v.igv), 0), COALESCE(SUM(v.descuento), 0) " +
            "FROM Venta v WHERE " + FILTROS_VENTA +
            " GROUP BY v.vendedor.id, v.vendedor.nombre ORDER BY SUM(v.total) DESC")
    List<Object[]> resumenPorVendedor(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("vendedorId") Long vendedorId,
            @Param("cajaId") Long cajaId,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("tipoComprobante") com.sistemas.sistema_venta.enums.TipoComprobante tipoComprobante,
            @Param("productoId") Long productoId);

    @Query("SELECT v.sesion.caja.id, v.sesion.caja.nombre, COUNT(v), COALESCE(SUM(v.total), 0), " +
            "COALESCE(SUM(v.igv), 0), COALESCE(SUM(v.descuento), 0) " +
            "FROM Venta v WHERE " + FILTROS_VENTA +
            " GROUP BY v.sesion.caja.id, v.sesion.caja.nombre ORDER BY SUM(v.total) DESC")
    List<Object[]> resumenPorCaja(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("vendedorId") Long vendedorId,
            @Param("cajaId") Long cajaId,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("tipoComprobante") com.sistemas.sistema_venta.enums.TipoComprobante tipoComprobante,
            @Param("productoId") Long productoId);

    @Query("SELECT FUNCTION('DATE', v.fecha), COUNT(v), COALESCE(SUM(v.total), 0), COALESCE(SUM(v.igv), 0) " +
            "FROM Venta v WHERE " + FILTROS_VENTA +
            " GROUP BY FUNCTION('DATE', v.fecha) ORDER BY FUNCTION('DATE', v.fecha) DESC")
    List<Object[]> resumenPorFecha(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("vendedorId") Long vendedorId,
            @Param("cajaId") Long cajaId,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("tipoComprobante") com.sistemas.sistema_venta.enums.TipoComprobante tipoComprobante,
            @Param("productoId") Long productoId);

    @Query("SELECT v.tipoPago, COUNT(v), COALESCE(SUM(v.total), 0) FROM Venta v WHERE " + FILTROS_VENTA +
            " GROUP BY v.tipoPago")
    List<Object[]> resumenPorTipoPago(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("vendedorId") Long vendedorId,
            @Param("cajaId") Long cajaId,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("tipoComprobante") com.sistemas.sistema_venta.enums.TipoComprobante tipoComprobante,
            @Param("productoId") Long productoId);

    @Query("SELECT v.tipoComprobante, COUNT(v), COALESCE(SUM(v.total), 0) FROM Venta v WHERE " + FILTROS_VENTA +
            " GROUP BY v.tipoComprobante")
    List<Object[]> resumenPorTipoComprobante(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("vendedorId") Long vendedorId,
            @Param("cajaId") Long cajaId,
            @Param("tipoPago") TipoPago tipoPago,
            @Param("tipoComprobante") com.sistemas.sistema_venta.enums.TipoComprobante tipoComprobante,
            @Param("productoId") Long productoId);
}
