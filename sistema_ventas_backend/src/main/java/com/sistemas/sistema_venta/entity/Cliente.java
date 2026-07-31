package com.sistemas.sistema_venta.entity;

import com.sistemas.sistema_venta.enums.TipoDocumento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "clientes", uniqueConstraints = @UniqueConstraint(columnNames = {"tipo_documento", "numero_documento"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento", nullable = false, length = 20)
    private TipoDocumento tipoDocumento;

    @Column(name = "numero_documento", nullable = false, length = 20)
    private String numeroDocumento;

    @Column(name = "razon_social", nullable = false, length = 180)
    private String razonSocial;

    @Column(length = 30)
    private String telefono;

    @Column(length = 200)
    private String direccion;

    @Column(length = 120)
    private String email;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    void prePersist() {
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
    }
}
