package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {

    @Query("SELECT DISTINCT d.venta.id FROM DetalleVenta d WHERE d.producto.id = :productoId")
    List<Long> findVentaIdsByProducto(@Param("productoId") Long productoId);

    List<DetalleVenta> findByVenta_IdOrderByIdAsc(Long ventaId);
}
