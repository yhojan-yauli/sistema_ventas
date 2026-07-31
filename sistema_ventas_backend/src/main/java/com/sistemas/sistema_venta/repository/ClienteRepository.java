package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Cliente;
import com.sistemas.sistema_venta.enums.TipoDocumento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByTipoDocumentoAndNumeroDocumento(TipoDocumento tipoDocumento, String numeroDocumento);

    List<Cliente> findAllByOrderByRazonSocialAsc();

    List<Cliente> findByRazonSocialContainingIgnoreCaseOrNumeroDocumentoContainingOrderByRazonSocialAsc(String razonSocial, String numeroDocumento);
}
