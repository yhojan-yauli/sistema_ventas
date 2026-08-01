package com.sistemas.sistema_venta.dto.reporte;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CierreMensualResponse(Long id, String anioMes, LocalDateTime fechaCierre,
                                    Long cantidadVentas, BigDecimal totalVentas, BigDecimal ganancia,
                                    Long cantidadCompras, BigDecimal totalCompras,
                                    String usuario, List<CajaCierreResponse> cajas) {
}
