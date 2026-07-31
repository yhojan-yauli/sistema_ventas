package com.sistemas.sistema_venta.service;

import com.sistemas.sistema_venta.dto.Mapper;
import com.sistemas.sistema_venta.dto.producto.AjusteStockRequest;
import com.sistemas.sistema_venta.dto.producto.ProductoRequest;
import com.sistemas.sistema_venta.dto.producto.ProductoResponse;
import com.sistemas.sistema_venta.entity.Categoria;
import com.sistemas.sistema_venta.entity.MovimientoStock;
import com.sistemas.sistema_venta.entity.Producto;
import com.sistemas.sistema_venta.enums.TipoMovimientoStock;
import com.sistemas.sistema_venta.exception.BusinessException;
import com.sistemas.sistema_venta.exception.NotFoundException;
import com.sistemas.sistema_venta.repository.CategoriaRepository;
import com.sistemas.sistema_venta.repository.MovimientoStockRepository;
import com.sistemas.sistema_venta.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final MovimientoStockRepository movimientoStockRepository;

    public ProductoService(ProductoRepository productoRepository, CategoriaRepository categoriaRepository,
                           MovimientoStockRepository movimientoStockRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.movimientoStockRepository = movimientoStockRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(Boolean soloActivos) {
        if (Boolean.TRUE.equals(soloActivos)) {
            return productoRepository.findByActivoTrueOrderByNombreAsc().stream().map(Mapper::toProductoResponse).toList();
        }
        return productoRepository.findAll().stream().map(Mapper::toProductoResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> buscar(String q) {
        String termino = q == null ? "" : q.trim();
        if (termino.isEmpty()) {
            return listar(true);
        }
        return productoRepository
                .findByNombreContainingIgnoreCaseOrCodigoContainingIgnoreCaseOrderByNombreAsc(termino, termino)
                .stream()
                .map(Mapper::toProductoResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> stockBajo() {
        return productoRepository.findByActivoTrueAndStockLessThanEqualOrderByStockAsc(0)
                .stream().map(Mapper::toProductoResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtener(Long id) {
        return Mapper.toProductoResponse(getProducto(id));
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        if (request.codigo() != null && !request.codigo().isBlank()
                && productoRepository.existsByCodigoIgnoreCase(request.codigo())) {
            throw new BusinessException("Ya existe un producto con ese código");
        }
        Producto producto = toProducto(new Producto(), request);
        producto.setActivo(request.activo() == null || request.activo());
        Producto guardado = productoRepository.save(producto);
        if (guardado.getCodigo() == null || guardado.getCodigo().isBlank()) {
            guardado.setCodigo("P" + guardado.getId());
            guardado = productoRepository.save(guardado);
        }
        return Mapper.toProductoResponse(guardado);
    }

    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = getProducto(id);
        if (request.codigo() != null && !request.codigo().isBlank()
                && productoRepository.existsByCodigoIgnoreCase(request.codigo())
                && !producto.getCodigo().equalsIgnoreCase(request.codigo())) {
            throw new BusinessException("Ya existe un producto con ese código");
        }
        return Mapper.toProductoResponse(productoRepository.save(toProducto(producto, request)));
    }

    @Transactional
    public ProductoResponse cambiarActivo(Long id) {
        Producto producto = getProducto(id);
        producto.setActivo(!Boolean.TRUE.equals(producto.getActivo()));
        return Mapper.toProductoResponse(productoRepository.save(producto));
    }

    @Transactional
    public ProductoResponse ajustarStock(Long id, AjusteStockRequest request) {
        Producto producto = getProducto(id);
        int cantidad = request.cantidad();
        if (cantidad == 0) {
            throw new BusinessException("La cantidad debe ser distinta de cero");
        }
        int nuevoStock = producto.getStock() + cantidad;
        if (nuevoStock < 0) {
            throw new BusinessException("Stock insuficiente: el producto solo tiene " + producto.getStock());
        }
        producto.setStock(nuevoStock);
        productoRepository.save(producto);
        movimientoStockRepository.save(MovimientoStock.builder()
                .producto(producto)
                .tipo(cantidad > 0 ? TipoMovimientoStock.ENTRADA : TipoMovimientoStock.SALIDA)
                .cantidad(Math.abs(cantidad))
                .motivo(request.motivo() == null ? "Ajuste de inventario" : request.motivo())
                .build());
        return Mapper.toProductoResponse(producto);
    }

    @Transactional(readOnly = true)
    public List<com.sistemas.sistema_venta.dto.producto.MovimientoStockResponse> movimientos(Long id) {
        getProducto(id);
        return movimientoStockRepository.findByProducto_IdOrderByFechaDesc(id).stream()
                .map(m -> new com.sistemas.sistema_venta.dto.producto.MovimientoStockResponse(
                        m.getId(), m.getProducto().getId(), m.getTipo(), m.getCantidad(), m.getMotivo(), m.getFecha()))
                .toList();
    }

    private Producto toProducto(Producto producto, ProductoRequest request) {
        producto.setCodigo(request.codigo() == null ? null : request.codigo().trim());
        producto.setNombre(request.nombre());
        producto.setDescripcion(request.descripcion());
        producto.setPrecioCompra(request.precioCompra());
        producto.setPrecioVenta(request.precioVenta());
        producto.setIncluyeIGV(request.incluyeIGV() == null || request.incluyeIGV());
        producto.setStock(request.stock() == null ? 0 : request.stock());
        producto.setStockMinimo(request.stockMinimo() == null ? 0 : request.stockMinimo());
        if (request.categoriaId() != null) {
            Categoria categoria = categoriaRepository.findById(request.categoriaId())
                    .orElseThrow(() -> new NotFoundException("Categoría no encontrada"));
            producto.setCategoria(categoria);
        } else {
            producto.setCategoria(null);
        }
        return producto;
    }

    public Producto getProducto(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado con id " + id));
    }
}
