package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.venta.ItemVentaRequest;
import com.sistemas.sistema_venta.dto.venta.VentaRequest;
import com.sistemas.sistema_venta.dto.venta.VentaResponse;
import com.sistemas.sistema_venta.entity.Cliente;
import com.sistemas.sistema_venta.entity.DetalleVenta;
import com.sistemas.sistema_venta.entity.MovimientoStock;
import com.sistemas.sistema_venta.entity.Producto;
import com.sistemas.sistema_venta.entity.SerieComprobante;
import com.sistemas.sistema_venta.entity.SesionCaja;
import com.sistemas.sistema_venta.entity.Usuario;
import com.sistemas.sistema_venta.entity.Venta;
import com.sistemas.sistema_venta.enums.TipoComprobante;
import com.sistemas.sistema_venta.enums.TipoDocumento;
import com.sistemas.sistema_venta.enums.TipoMovimientoStock;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.MovimientoStockRepository;
import com.sistemas.sistema_venta.repository.ProductoRepository;
import com.sistemas.sistema_venta.repository.SerieComprobanteRepository;
import com.sistemas.sistema_venta.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class VentaService {

    private static final BigDecimal CERO = BigDecimal.ZERO;
    private static final int SCALE = 2;

    private final VentaRepository ventaRepository;
    private final SerieComprobanteRepository serieComprobanteRepository;
    private final ProductoRepository productoRepository;
    private final MovimientoStockRepository movimientoStockRepository;
    private final SesionService sesionService;
    private final ClienteService clienteService;
    private final ProductoService productoService;
    private final ConfiguracionService configuracionService;

    public VentaService(VentaRepository ventaRepository, SerieComprobanteRepository serieComprobanteRepository,
                        ProductoRepository productoRepository, MovimientoStockRepository movimientoStockRepository,
                        SesionService sesionService, ClienteService clienteService, ProductoService productoService,
                        ConfiguracionService configuracionService) {
        this.ventaRepository = ventaRepository;
        this.serieComprobanteRepository = serieComprobanteRepository;
        this.productoRepository = productoRepository;
        this.movimientoStockRepository = movimientoStockRepository;
        this.sesionService = sesionService;
        this.clienteService = clienteService;
        this.productoService = productoService;
        this.configuracionService = configuracionService;
    }

    @Transactional
    public VentaResponse crear(Usuario vendedor, VentaRequest request) {
        SesionCaja sesion = sesionService.getSesionAbiertaDeUsuario(vendedor);
        BigDecimal igvPorcentaje = configuracionService.igvPorcentaje();
        boolean precioIncluyeIGV = configuracionService.precioIncluyeIGV();
        BigDecimal tasa = igvPorcentaje.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);

        Cliente cliente = resolverCliente(request);
        List<LineaCalculada> lineas = new ArrayList<>();
        BigDecimal totalSinDescuento = CERO;

        for (ItemVentaRequest item : request.items()) {
            Producto producto = productoService.getProducto(item.productoId());
            if (!Boolean.TRUE.equals(producto.getActivo())) {
                throw new BusinessException("El producto '" + producto.getNombre() + "' está inactivo");
            }
            Integer peso = pesoEfectivo(producto, item);
            if (producto.getStock() < item.cantidad()) {
                throw new BusinessException("Stock insuficiente de '" + producto.getNombre() + "' (disponible: " + producto.getStock() + ")");
            }
            BigDecimal descuentoLinea = item.descuento() == null ? CERO : item.descuento();
            BigDecimal linea = precioUnidad(producto, peso)
                    .multiply(BigDecimal.valueOf(item.cantidad()))
                    .subtract(descuentoLinea);
            if (linea.compareTo(CERO) < 0) {
                throw new BusinessException("El descuento no puede ser mayor al importe de la línea");
            }
            totalSinDescuento = totalSinDescuento.add(linea);
            lineas.add(new LineaCalculada(producto, item.cantidad(), descuentoLinea, linea, peso));
        }

        BigDecimal descuentoGlobal = request.descuento() == null ? CERO : request.descuento();
        if (descuentoGlobal.compareTo(totalSinDescuento) > 0) {
            throw new BusinessException("El descuento no puede ser mayor al total de la venta");
        }

        BigDecimal subtotal = CERO;
        BigDecimal igvTotal = CERO;
        BigDecimal total = CERO;
        List<DetalleVenta> detalles = new ArrayList<>();

        for (LineaCalculada line : lineas) {
            BigDecimal share = totalSinDescuento.compareTo(CERO) == 0
                    ? CERO
                    : descuentoGlobal.multiply(line.totalLinea).divide(totalSinDescuento, 8, RoundingMode.HALF_UP);
            BigDecimal totalLinea = line.totalLinea.subtract(share);

            BigDecimal valorVentaLinea;
            BigDecimal igvLinea;
            if (Boolean.TRUE.equals(line.producto().getIncluyeIGV())) {
                valorVentaLinea = totalLinea.divide(BigDecimal.ONE.add(tasa), SCALE, RoundingMode.HALF_UP);
                igvLinea = totalLinea.subtract(valorVentaLinea);
            } else {
                valorVentaLinea = totalLinea;
                igvLinea = totalLinea.multiply(tasa).setScale(SCALE, RoundingMode.HALF_UP);
            }

            subtotal = subtotal.add(valorVentaLinea);
            igvTotal = igvTotal.add(igvLinea);
            total = total.add(valorVentaLinea).add(igvLinea);

            DetalleVenta detalle = DetalleVenta.builder()
                    .producto(line.producto())
                    .cantidad(line.cantidad())
                    .precioVenta(precioUnidad(line.producto(), line.pesoGramos()))
                    .precioCompra(costoUnidad(line.producto(), line.pesoGramos()))
                    .pesoGramos(line.pesoGramos())
                    .descuentoLinea(line.descuentoLinea())
                    .subtotal(line.totalLinea().setScale(SCALE, RoundingMode.HALF_UP))
                    .build();
            detalles.add(detalle);
        }

        SerieComprobante serie = obtenerOSerieComprobante(request.tipoComprobante());
        serie.setCorrelativo(serie.getCorrelativo() + 1);
        serieComprobanteRepository.save(serie);

        Venta venta = Venta.builder()
                .sesion(sesion)
                .vendedor(vendedor)
                .cliente(cliente)
                .tipoPago(request.tipoPago())
                .tipoComprobante(request.tipoComprobante())
                .serie(serie.getSerie())
                .numero(serie.getCorrelativo())
                .subtotal(subtotal.setScale(SCALE, RoundingMode.HALF_UP))
                .descuento(descuentoGlobal.setScale(SCALE, RoundingMode.HALF_UP))
                .igv(igvTotal.setScale(SCALE, RoundingMode.HALF_UP))
                .total(total.setScale(SCALE, RoundingMode.HALF_UP))
                .igvPorcentaje(igvPorcentaje)
                .incluyeIGV(precioIncluyeIGV)
                .build();

        for (DetalleVenta detalle : detalles) {
            detalle.setVenta(venta);
            venta.getDetalles().add(detalle);
        }
        venta = ventaRepository.save(venta);

        for (LineaCalculada line : lineas) {
            Producto producto = line.producto();
            producto.setStock(producto.getStock() - line.cantidad());
            productoRepository.save(producto);
            movimientoStockRepository.save(MovimientoStock.builder()
                    .producto(producto)
                    .tipo(TipoMovimientoStock.SALIDA)
                    .cantidad(line.cantidad())
                    .motivo("Venta " + venta.getSerie() + "-" + venta.getNumero())
                    .build());
        }

        return Mapper.toVentaResponse(venta);
    }

    @Transactional(readOnly = true)
    public VentaResponse obtenerComprobante(String serie, Long numero) {
        return Mapper.toVentaResponse(getVentaPorSerieNumero(serie, numero));
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarRecientes() {
        return ventaRepository.findTop100ByOrderByFechaDesc().stream().map(Mapper::toVentaResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> historialUsuario(Usuario usuario) {
        return ventaRepository.findTop100ByVendedor_IdOrderByFechaDesc(usuario.getId())
                .stream().map(Mapper::toVentaResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listarPorSesion(Long sesionId, Usuario usuario) {
        sesionService.getSesionParaAccion(sesionId, usuario);
        return ventaRepository.findBySesion_IdOrderByFechaAsc(sesionId).stream().map(Mapper::toVentaResponse).toList();
    }

    public Venta getVentaPorSerieNumero(String serie, Long numero) {
        return ventaRepository.findBySerieAndNumero(serie, numero)
                .orElseThrow(() -> new NotFoundException("Comprobante no encontrado: " + serie + "-" + numero));
    }

    private Cliente resolverCliente(VentaRequest request) {
        if (request.tipoComprobante() == TipoComprobante.FACTURA) {
            if (request.clienteId() == null && request.clienteNuevo() == null) {
                throw new BusinessException("La factura requiere un cliente con RUC");
            }
            if (request.clienteNuevo() != null && request.clienteNuevo().tipoDocumento() != TipoDocumento.RUC) {
                throw new BusinessException("La factura requiere un cliente con tipo de documento RUC");
            }
        }
        if (request.clienteId() != null) {
            return clienteService.getCliente(request.clienteId());
        }
        if (request.clienteNuevo() != null && request.tipoComprobante() != TipoComprobante.TICKET) {
            return clienteService.findOrCreate(request.clienteNuevo());
        }
        return null;
    }

    private SerieComprobante obtenerOSerieComprobante(TipoComprobante tipo) {
        return serieComprobanteRepository.findByTipoComprobanteParaActualizar(tipo)
                .orElseGet(() -> {
                    String serie = switch (tipo) {
                        case BOLETA -> "B001";
                        case FACTURA -> "F001";
                        case TICKET -> "T001";
                    };
                    SerieComprobante nueva = SerieComprobante.builder()
                            .tipoComprobante(tipo)
                            .serie(serie)
                            .correlativo(0L)
                            .build();
                    return serieComprobanteRepository.save(nueva);
                });
    }

    private Integer pesoEfectivo(Producto producto, ItemVentaRequest item) {
        if (!Boolean.TRUE.equals(producto.getVentaPorPeso())) {
            return null;
        }
        Integer peso = item.pesoGramos() != null && item.pesoGramos() > 0
                ? item.pesoGramos()
                : producto.getPesoGramos();
        if (peso == null || peso <= 0) {
            throw new BusinessException("Indica el peso del producto '" + producto.getNombre() + "' (gramos)");
        }
        return peso;
    }

    private BigDecimal precioUnidad(Producto producto, Integer pesoGramos) {
        return precioPorUnidad(producto.getPrecioVenta(), producto.getVentaPorPeso(), pesoGramos);
    }

    private BigDecimal costoUnidad(Producto producto, Integer pesoGramos) {
        return precioPorUnidad(producto.getPrecioCompra(), producto.getVentaPorPeso(), pesoGramos);
    }

    private BigDecimal precioPorUnidad(BigDecimal precioBase, Boolean ventaPorPeso, Integer pesoGramos) {
        if (!Boolean.TRUE.equals(ventaPorPeso) || pesoGramos == null || pesoGramos <= 0) {
            return precioBase;
        }
        return precioBase.multiply(BigDecimal.valueOf(pesoGramos))
                .divide(BigDecimal.valueOf(1000), SCALE, RoundingMode.HALF_UP);
    }

    private record LineaCalculada(
            Producto producto,
            Integer cantidad,
            BigDecimal descuentoLinea,
            BigDecimal totalLinea,
            Integer pesoGramos) {
    }
}
