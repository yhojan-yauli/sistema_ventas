package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.CuadreMetodo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CuadreMetodoRepository extends JpaRepository<CuadreMetodo, Long> {

    List<CuadreMetodo> findBySesion_IdOrderByTipoPago(Long sesionId);
}
