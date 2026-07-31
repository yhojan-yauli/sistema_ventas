package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Configuracion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfiguracionRepository extends JpaRepository<Configuracion, Long> {

    Optional<Configuracion> findByClave(String clave);
}
