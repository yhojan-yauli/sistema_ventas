package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Compra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface CompraRepository extends JpaRepository<Compra, Long> {

    List<Compra> findTop50ByOrderByFechaDesc();

    List<Compra> findByFechaBetweenOrderByFechaDesc(LocalDateTime desde, LocalDateTime hasta);

    @Query("SELECT COALESCE(COUNT(c), 0) FROM Compra c " +
            "WHERE c.fecha >= COALESCE(:desde, c.fecha) AND c.fecha <= COALESCE(:hasta, c.fecha)")
    Long countByFechaBetween(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("SELECT COALESCE(SUM(c.total), 0) FROM Compra c " +
            "WHERE c.fecha >= COALESCE(:desde, c.fecha) AND c.fecha <= COALESCE(:hasta, c.fecha)")
    BigDecimal sumTotalByFechaBetween(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
