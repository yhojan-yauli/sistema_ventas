package com.sistemas.sistema_venta.repository;

import com.sistemas.sistema_venta.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    Optional<Usuario> findByUsernameAndActivoTrue(String username);

    boolean existsByUsername(String username);

    List<Usuario> findAllByOrderByNombreAsc();

    List<Usuario> findByRolAndActivoTrueOrderByNombreAsc(com.sistemas.sistema_venta.enums.Rol rol);
}
