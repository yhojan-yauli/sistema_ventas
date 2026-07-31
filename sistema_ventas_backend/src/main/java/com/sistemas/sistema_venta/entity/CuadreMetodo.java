package com.sistemas.sistema_venta.entity;

import com.sistemas.sistema_venta.enums.TipoPago;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "cuadre_metodo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuadreMetodo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sesion_id", nullable = false)
    private SesionCaja sesion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pago", nullable = false, length = 20)
    private TipoPago tipoPago;

    @Column(name = "monto_esperado", nullable = false, precision = 18, scale = 2)
    private BigDecimal montoEsperado;

    @Column(name = "monto_real", nullable = false, precision = 18, scale = 2)
    private BigDecimal montoReal;

    @Column(precision = 18, scale = 2)
    private BigDecimal diferencia;
}
