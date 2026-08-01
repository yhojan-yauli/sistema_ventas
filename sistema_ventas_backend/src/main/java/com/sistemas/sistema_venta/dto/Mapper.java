package com.sistemas.sistema_venta.dto;

import com.sistemas.sistema_venta.dto.caja.CajaResponse;
import com.sistemas.sistema_venta.dto.categoria.CategoriaResponse;
import com.sistemas.sistema_venta.dto.cliente.ClienteResponse;
import com.sistemas.sistema_venta.dto.compra.CompraResponse;
import com.sistemas.sistema_venta.dto.compra.ItemCompraResponse;
import com.sistemas.sistema_venta.dto.producto.ProductoResponse;
import com.sistemas.sistema_venta.dto.proveedor.ProveedorResponse;
import com.sistemas.sistema_venta.dto.sesion.GastoResponse;
import com.sistemas.sistema_venta.dto.sesion.RetiroResponse;
import com.sistemas.sistema_venta.dto.usuario.UsuarioResponse;
import com.sistemas.sistema_venta.dto.venta.ItemVentaResponse;
import com.sistemas.sistema_venta.dto.venta.VentaResponse;
import com.sistemas.sistema_venta.entity.*;

import java.math.BigDecimal;
import java.util.List;

public final class Mapper {

    private Mapper() {
    }

    public static UsuarioResponse toUsuarioResponse(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getUsername(), u.getNombre(), u.getEmail(), u.getRol(), u.getActivo(), u.getFechaCreacion());
    }

    public static CajaResponse toCajaResponse(Caja c) {
        return new CajaResponse(c.getId(), c.getNombre(), c.getDescripcion(), c.getActiva(), c.getFechaCreacion(), c.getSaldo(), c.getFechaUltimoCierre());
    }

    public static CategoriaResponse toCategoriaResponse(Categoria c) {
        return new CategoriaResponse(c.getId(), c.getNombre());
    }

    public static ProductoResponse toProductoResponse(Producto p) {
        return new ProductoResponse(
                p.getId(),
                p.getCodigo(),
                p.getNombre(),
                p.getCategoria() != null ? p.getCategoria().getId() : null,
                p.getCategoria() != null ? p.getCategoria().getNombre() : null,
                p.getDescripcion(),
                p.getPrecioCompra(),
                p.getPrecioVenta(),
                p.getIncluyeIGV(),
                p.getStock(),
                p.getStockMinimo(),
                p.getVentaPorPeso(),
                p.getPesoGramos(),
                p.getActivo());
    }

    public static ProveedorResponse toProveedorResponse(Proveedor p) {
        return new ProveedorResponse(p.getId(), p.getRazonSocial(), p.getRuc(), p.getTelefono(), p.getDireccion(), p.getEmail());
    }

    public static ClienteResponse toClienteResponse(Cliente c) {
        return new ClienteResponse(c.getId(), c.getTipoDocumento(), c.getNumeroDocumento(), c.getRazonSocial(), c.getTelefono(), c.getDireccion(), c.getEmail());
    }

    public static GastoResponse toGastoResponse(Gasto g) {
        return new GastoResponse(g.getId(), g.getSesion().getId(), g.getConcepto(), g.getMonto(), g.getTipoPago(), g.getFecha());
    }

    public static RetiroResponse toRetiroResponse(Retiro r) {
        return new RetiroResponse(r.getId(), r.getSesion().getId(), r.getUsuario().getId(), r.getUsuario().getNombre(),
                r.getMonto(), r.getTipoPago(), r.getMotivo(), r.getFecha());
    }

    public static ItemCompraResponse toItemCompraResponse(DetalleCompra d) {
        return new ItemCompraResponse(d.getProducto().getId(), d.getProducto().getNombre(), d.getCantidad(), d.getPrecioUnitario(), d.getSubtotal());
    }

    public static CompraResponse toCompraResponse(Compra c) {
        List<ItemCompraResponse> items = c.getDetalles().stream().map(Mapper::toItemCompraResponse).toList();
        return new CompraResponse(c.getId(), c.getProveedor().getId(), c.getProveedor().getRazonSocial(), c.getFecha(),
                c.getNumeroDocumento(), c.getTotal(), items);
    }

    public static ItemVentaResponse toItemVentaResponse(DetalleVenta d) {
        BigDecimal ganancia = d.getPrecioVenta().subtract(d.getPrecioCompra())
                .multiply(BigDecimal.valueOf(d.getCantidad()))
                .subtract(d.getDescuentoLinea());
        return new ItemVentaResponse(
                d.getProducto().getId(),
                d.getProducto().getNombre(),
                d.getProducto().getCodigo(),
                d.getCantidad(),
                d.getPrecioVenta(),
                d.getPrecioCompra(),
                d.getPesoGramos(),
                d.getDescuentoLinea(),
                d.getSubtotal(),
                ganancia);
    }

    public static VentaResponse toVentaResponse(Venta v) {
        String clienteNombre = null;
        String clienteDocumento = null;
        if (v.getCliente() != null) {
            clienteNombre = v.getCliente().getRazonSocial();
            clienteDocumento = v.getCliente().getTipoDocumento() + " " + v.getCliente().getNumeroDocumento();
        }
        List<ItemVentaResponse> items = v.getDetalles().stream().map(Mapper::toItemVentaResponse).toList();
        return new VentaResponse(
                v.getId(),
                v.getSesion().getId(),
                v.getSesion().getCaja().getId(),
                v.getSesion().getCaja().getNombre(),
                v.getVendedor().getId(),
                v.getVendedor().getNombre(),
                v.getCliente() != null ? v.getCliente().getId() : null,
                clienteNombre,
                clienteDocumento,
                v.getTipoPago(),
                v.getTipoComprobante(),
                v.getSerie(),
                v.getNumero(),
                v.getFecha(),
                v.getSubtotal(),
                v.getDescuento(),
                v.getIgv(),
                v.getTotal(),
                v.getIgvPorcentaje(),
                v.getIncluyeIGV(),
                items);
    }
}
