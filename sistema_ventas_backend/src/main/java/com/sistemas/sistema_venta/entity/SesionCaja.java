package com.sistemas.sistema_venta.entity;

import com.sistemas.sistema_venta.enums.EstadoSesion;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sesion_caja")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SesionCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "caja_id", nullable = false)
    private Caja caja;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "monto_inicial", nullable = false, precision = 18, scale = 2)
    private BigDecimal montoInicial;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoSesion estado;

    @Column(length = 300)
    private String observaciones;

    @PrePersist
    void prePersist() {
        if (estado == null) estado = EstadoSesion.ABIERTA;
        if (fechaApertura == null) fechaApertura = LocalDateTime.now();
    }
}
