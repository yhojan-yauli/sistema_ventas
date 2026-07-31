package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Caja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CajaRepository extends JpaRepository<Caja, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    List<Caja> findAllByOrderByNombreAsc();

    List<Caja> findByActivaTrueOrderByNombreAsc();
}
