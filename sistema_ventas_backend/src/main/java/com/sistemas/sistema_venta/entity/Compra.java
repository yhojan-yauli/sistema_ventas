package com.sistemas.sistema_venta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "compras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Compra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(name = "numero_documento", length = 40)
    private String numeroDocumento;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal total;

    @OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DetalleCompra> detalles = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (fecha == null) fecha = LocalDateTime.now();
    }
}
