package com.sistemas.sistema_venta.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "configuracion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Configuracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String clave;

    @Column(nullable = false, length = 500)
    private String valor;
}
