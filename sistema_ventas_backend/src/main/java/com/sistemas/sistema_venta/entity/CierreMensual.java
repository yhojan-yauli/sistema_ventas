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
@Table(name = "cierre_mensual")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CierreMensual {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anio_mes", unique = true, nullable = false, length = 7)
    private String anioMes;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDateTime fechaFin;

    @Column(name = "fecha_cierre", nullable = false)
    private LocalDateTime fechaCierre;

    @Column(name = "cantidad_ventas", nullable = false)
    private Long cantidadVentas;

    @Column(name = "total_ventas", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalVentas;

    @Column(name = "ganancia", nullable = false, precision = 18, scale = 2)
    private BigDecimal ganancia;

    @Column(name = "cantidad_compras", nullable = false)
    private Long cantidadCompras;

    @Column(name = "total_compras", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalCompras;

    @Column(length = 80)
    private String usuario;

    @OneToMany(mappedBy = "cierre", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<CierreMensualCaja> cajas = new ArrayList<>();
}
