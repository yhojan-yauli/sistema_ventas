package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.SesionCaja;
import com.sistemas.sistema_venta.enums.EstadoSesion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SesionCajaRepository extends JpaRepository<SesionCaja, Long> {

    Optional<SesionCaja> findByCaja_IdAndEstado(Long cajaId, EstadoSesion estado);

    List<SesionCaja> findByEstadoAndUsuario_Id(EstadoSesion estado, Long usuarioId);

    boolean existsByCaja_IdAndEstado(Long cajaId, EstadoSesion estado);

    List<SesionCaja> findTop30ByOrderByFechaAperturaDesc();

    List<SesionCaja> findByEstadoOrderByFechaAperturaDesc(EstadoSesion estado);

    List<SesionCaja> findByFechaAperturaBetweenOrderByFechaAperturaDesc(LocalDateTime desde, LocalDateTime hasta);

    long countByEstado(EstadoSesion estado);
}
