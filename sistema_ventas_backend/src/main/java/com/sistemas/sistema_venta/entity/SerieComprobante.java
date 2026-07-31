package com.sistemas.sistema_venta.entity;

import com.sistemas.sistema_venta.enums.TipoComprobante;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "serie_comprobante")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SerieComprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_comprobante", nullable = false, unique = true, length = 20)
    private TipoComprobante tipoComprobante;

    @Column(nullable = false, length = 4)
    private String serie;

    @Column(nullable = false)
    private Long correlativo;
}
