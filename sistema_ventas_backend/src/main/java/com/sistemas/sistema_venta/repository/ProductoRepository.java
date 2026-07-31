package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Optional<Producto> findByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCase(String codigo);

    List<Producto> findByActivoTrueOrderByNombreAsc();

    List<Producto> findByActivoTrueAndStockLessThanEqualOrderByStockAsc(Integer stockMinimo);

    List<Producto> findByNombreContainingIgnoreCaseOrCodigoContainingIgnoreCaseOrderByNombreAsc(String nombre, String codigo);
}
