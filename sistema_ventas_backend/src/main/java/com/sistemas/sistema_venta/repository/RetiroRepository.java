package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Retiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RetiroRepository extends JpaRepository<Retiro, Long> {

    List<Retiro> findBySesion_IdOrderByFechaDesc(Long sesionId);
}
