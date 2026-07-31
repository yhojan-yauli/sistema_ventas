package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Compra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompraRepository extends JpaRepository<Compra, Long> {

    List<Compra> findTop50ByOrderByFechaDesc();
}
