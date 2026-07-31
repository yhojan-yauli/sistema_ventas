package com.sistemas.sistema_venta.entity;

import com.sistemas.sistema_venta.enums.TipoMovimientoStock;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_stock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimientoStock tipo;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(length = 300)
    private String motivo;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    void prePersist() {
        if (fecha == null) fecha = LocalDateTime.now();
    }
}
