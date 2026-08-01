package com.sistemas.sistema_venta.dto.reporte;

import java.math.BigDecimal;

public record CajaCierreResponse(Long cajaId, String cajaNombre, Long cantidadVentas, BigDecimal totalVentas) {
}
