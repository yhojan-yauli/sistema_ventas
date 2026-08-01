package com.sistemas.sistema_venta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "cierre_mensual_caja")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CierreMensualCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cierre_id", nullable = false)
    private CierreMensual cierre;

    @Column(name = "caja_id", nullable = false)
    private Long cajaId;

    @Column(name = "caja_nombre", nullable = false, length = 120)
    private String cajaNombre;

    @Column(name = "cantidad_ventas", nullable = false)
    private Long cantidadVentas;

    @Column(name = "total_ventas", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalVentas;
}
