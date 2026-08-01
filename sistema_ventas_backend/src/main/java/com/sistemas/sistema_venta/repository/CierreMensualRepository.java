package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.CierreMensual;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CierreMensualRepository extends JpaRepository<CierreMensual, Long> {

    Optional<CierreMensual> findByAnioMes(String anioMes);

    boolean existsByAnioMes(String anioMes);

    List<CierreMensual> findAllByOrderByAnioMesDesc();
}
