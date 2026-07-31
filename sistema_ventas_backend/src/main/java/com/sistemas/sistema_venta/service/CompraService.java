package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.compra.CompraRequest;
import com.sistemas.sistema_venta.dto.compra.CompraResponse;
import com.sistemas.sistema_venta.dto.compra.ItemCompraRequest;
import com.sistemas.sistema_venta.entity.Compra;
import com.sistemas.sistema_venta.entity.DetalleCompra;
import com.sistemas.sistema_venta.entity.MovimientoStock;
import com.sistemas.sistema_venta.entity.Producto;
import com.sistemas.sistema_venta.entity.Proveedor;
import com.sistemas.sistema_venta.enums.TipoMovimientoStock;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.CompraRepository;
import com.sistemas.sistema_venta.repository.MovimientoStockRepository;
import com.sistemas.sistema_venta.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CompraService {

    private static final BigDecimal CERO = BigDecimal.ZERO;

    private final CompraRepository compraRepository;
    private final ProveedorService proveedorService;
    private final ProductoService productoService;
    private final ProductoRepository productoRepository;
    private final MovimientoStockRepository movimientoStockRepository;

    public CompraService(CompraRepository compraRepository, ProveedorService proveedorService,
                         ProductoService productoService, ProductoRepository productoRepository,
                         MovimientoStockRepository movimientoStockRepository) {
        this.compraRepository = compraRepository;
        this.proveedorService = proveedorService;
        this.productoService = productoService;
        this.productoRepository = productoRepository;
        this.movimientoStockRepository = movimientoStockRepository;
    }

    @Transactional
    public CompraResponse crear(CompraRequest request) {
        Proveedor proveedor = proveedorService.getProveedor(request.proveedorId());
        Compra compra = Compra.builder()
                .proveedor(proveedor)
                .fecha(request.fecha() == null ? LocalDateTime.now() : request.fecha())
                .numeroDocumento(request.numeroDocumento())
                .total(CERO)
                .build();

        BigDecimal total = CERO;
        for (ItemCompraRequest item : request.items()) {
            Producto producto = productoService.getProducto(item.productoId());
            BigDecimal subtotal = item.precioUnitario().multiply(BigDecimal.valueOf(item.cantidad()));
            total = total.add(subtotal);

            DetalleCompra detalle = DetalleCompra.builder()
                    .compra(compra)
                    .producto(producto)
                    .cantidad(item.cantidad())
                    .precioUnitario(item.precioUnitario())
                    .subtotal(subtotal)
                    .build();
            compra.getDetalles().add(detalle);

            producto.setStock(producto.getStock() + item.cantidad());
            producto.setPrecioCompra(item.precioUnitario());
            productoRepository.save(producto);

            movimientoStockRepository.save(MovimientoStock.builder()
                    .producto(producto)
                    .tipo(TipoMovimientoStock.ENTRADA)
                    .cantidad(item.cantidad())
                    .motivo("Compra a proveedor " + proveedor.getRazonSocial() + (request.numeroDocumento() != null ? " (" + request.numeroDocumento() + ")" : ""))
                    .build());
        }
        compra.setTotal(total);
        return Mapper.toCompraResponse(compraRepository.save(compra));
    }

    @Transactional(readOnly = true)
    public List<CompraResponse> listar() {
        return compraRepository.findTop50ByOrderByFechaDesc().stream().map(Mapper::toCompraResponse).toList();
    }

    @Transactional(readOnly = true)
    public CompraResponse obtener(Long id) {
        return Mapper.toCompraResponse(compraRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Compra no encontrada con id " + id)));
    }
}
