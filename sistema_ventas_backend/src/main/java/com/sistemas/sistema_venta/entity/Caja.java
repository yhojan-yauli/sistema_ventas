package com.sistemas.sistema_venta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cajas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Caja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String nombre;

    @Column(length = 200)
    private String descripcion;

    @Column(nullable = false)
    private Boolean activa;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal saldo;

    @Column(name = "fecha_ultimo_cierre")
    private LocalDateTime fechaUltimoCierre;

    @PrePersist
    void prePersist() {
        if (activa == null) activa = true;
        if (saldo == null) saldo = BigDecimal.ZERO;
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
    }
}
