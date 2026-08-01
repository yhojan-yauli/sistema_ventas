package com.sistemas.sistema_venta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "detalle_venta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetalleVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venta_id", nullable = false)
    private Venta venta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_venta", nullable = false, precision = 18, scale = 2)
    private BigDecimal precioVenta;

    @Column(name = "precio_compra", nullable = false, precision = 18, scale = 2)
    private BigDecimal precioCompra;

    @Column(name = "peso_gramos")
    private Integer pesoGramos;

    @Column(name = "descuento_linea", nullable = false, precision = 18, scale = 2)
    private BigDecimal descuentoLinea;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotal;
}
