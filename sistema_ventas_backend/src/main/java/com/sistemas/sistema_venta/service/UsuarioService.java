package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.usuario.PasswordRequest;
import com.sistemas.sistema_venta.dto.usuario.UsuarioRequest;
import com.sistemas.sistema_venta.dto.usuario.UsuarioResponse;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAllByOrderByNombreAsc().stream().map(Mapper::toUsuarioResponse).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return Mapper.toUsuarioResponse(getUsuario(id));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new BusinessException("Ya existe un usuario con ese username");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new BusinessException("La contraseña es obligatoria");
        }
        Usuario usuario = Usuario.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .nombre(request.nombre())
                .email(request.email())
                .rol(request.rol())
                .activo(true)
                .build();
        return Mapper.toUsuarioResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest request) {
        Usuario usuario = getUsuario(id);
        usuario.setNombre(request.nombre());
        usuario.setEmail(request.email());
        usuario.setRol(request.rol());
        return Mapper.toUsuarioResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse cambiarActivo(Long id) {
        Usuario usuario = getUsuario(id);
        usuario.setActivo(!Boolean.TRUE.equals(usuario.getActivo()));
        return Mapper.toUsuarioResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public void cambiarPassword(Long id, PasswordRequest request) {
        Usuario usuario = getUsuario(id);
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuarioRepository.save(usuario);
    }

    private Usuario getUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado con id " + id));
    }
}
