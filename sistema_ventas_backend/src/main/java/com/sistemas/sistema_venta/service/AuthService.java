package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.auth.LoginRequest;
import com.sistemas.sistema_venta.dto.auth.LoginResponse;
import com.sistemas.sistema_venta.dto.auth.MeResponse;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.repository.UsuarioRepository;
import com.sistemas.sistema_venta.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        Usuario usuario = usuarioRepository.findByUsernameAndActivoTrue(request.username())
                .orElseThrow(() -> new com.sistemas.sistema_venta.exception.BusinessException("Usuario no encontrado"));
        UserDetails userDetails = User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPassword())
                .roles(usuario.getRol().name())
                .build();
        String token = jwtService.generateToken(userDetails);
        return new LoginResponse(token, usuario.getUsername(), usuario.getNombre(), usuario.getRol());
    }

    public MeResponse me() {
        return new MeResponse(
                getCurrentUser().getId(),
                getCurrentUser().getUsername(),
                getCurrentUser().getNombre(),
                getCurrentUser().getEmail(),
                getCurrentUser().getRol(),
                getCurrentUser().getActivo());
    }

    public Usuario getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return usuarioRepository.findByUsernameAndActivoTrue(username)
                .orElseThrow(() -> new com.sistemas.sistema_venta.exception.NotFoundException("Usuario no encontrado"));
    }
}
