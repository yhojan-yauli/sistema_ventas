package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.SerieComprobante;
import com.sistemas.sistema_venta.enums.TipoComprobante;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SerieComprobanteRepository extends JpaRepository<SerieComprobante, Long> {

    Optional<SerieComprobante> findByTipoComprobante(TipoComprobante tipoComprobante);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SerieComprobante s WHERE s.tipoComprobante = :tipoComprobante")
    Optional<SerieComprobante> findByTipoComprobanteParaActualizar(@Param("tipoComprobante") TipoComprobante tipoComprobante);
}
