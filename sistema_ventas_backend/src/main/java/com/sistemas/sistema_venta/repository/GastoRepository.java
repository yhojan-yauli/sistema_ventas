package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GastoRepository extends JpaRepository<Gasto, Long> {

    List<Gasto> findBySesion_IdOrderByFechaDesc(Long sesionId);
}
