package com.sistemas.sistema_venta.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.sistemas.sistema_venta.dto.configuracion.ConfiguracionResponse;
import com.sistemas.sistema_venta.entity.Cliente;
import com.sistemas.sistema_venta.entity.DetalleVenta;
import com.sistemas.sistema_venta.entity.Venta;
import com.sistemas.sistema_venta.enums.TipoComprobante;
import com.sistemas.sistema_venta.enums.TipoPago;
import com.sistemas.sistema_venta.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfComprobanteService {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final Font TITULO_TIPO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
    private static final Font SERIE_NUMERO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
    private static final Font EMPRESA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
    private static final Font NEGRITA = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
    private static final Font NORMAL = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final Font PEQUENA = FontFactory.getFont(FontFactory.HELVETICA, 8);

    public byte[] generarComprobanteA4(Venta venta, ConfiguracionResponse cfg) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            encabezado(doc, venta, cfg);
            datosCliente(doc, venta);
            tablaItems(doc, venta);
            totales(doc, venta);
            footer(doc, venta);

            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new BusinessException("No se pudo generar el PDF del comprobante");
        }
    }

    private void encabezado(Document doc, Venta venta, ConfiguracionResponse cfg) throws Exception {
        PdfPTable head = new PdfPTable(2);
        head.setWidthPercentage(100);
        head.setWidths(new float[]{62f, 38f});
        head.setKeepTogether(true);

        PdfPCell izq = celda("", NORMAL, Element.ALIGN_LEFT, false);
        Paragraph empresa = new Paragraph();
        if (cfg.razonSocial() != null && !cfg.razonSocial().isBlank()) {
            empresa.add(new Paragraph(cfg.razonSocial(), EMPRESA));
        }
        if (cfg.ruc() != null && !cfg.ruc().isBlank()) {
            empresa.add(new Paragraph("RUC: " + cfg.ruc(), NEGRITA));
        }
        if (cfg.direccion() != null && !cfg.direccion().isBlank()) {
            empresa.add(new Paragraph(cfg.direccion(), NORMAL));
        }
        if (cfg.telefono() != null && !cfg.telefono().isBlank()) {
            empresa.add(new Paragraph("Tel: " + cfg.telefono(), NORMAL));
        }
        if (cfg.email() != null && !cfg.email().isBlank()) {
            empresa.add(new Paragraph(cfg.email(), NORMAL));
        }
        izq.addElement(empresa);

        PdfPCell der = new PdfPCell();
        der.setBorder(Rectangle.BOX);
        der.setHorizontalAlignment(Element.ALIGN_CENTER);
        der.setPadding(10);
        der.addElement(new Paragraph("RUC", PEQUENA));
        der.addElement(new Paragraph(cfg.ruc() == null || cfg.ruc().isBlank() ? "-" : cfg.ruc(), NEGRITA));
        der.addElement(new Paragraph(tipoLabel(venta.getTipoComprobante()), TITULO_TIPO));
        der.addElement(new Paragraph(serieNumero(venta), SERIE_NUMERO));

        head.addCell(izq);
        head.addCell(der);
        doc.add(head);
        doc.add(new Paragraph(" "));
    }

    private void datosCliente(Document doc, Venta venta) throws Exception {
        PdfPTable datos = new PdfPTable(2);
        datos.setWidthPercentage(100);
        datos.setWidths(new float[]{55f, 45f});
        datos.setKeepTogether(true);

        PdfPCell izquierda = celda("", NORMAL, Element.ALIGN_LEFT, false);
        Cliente cliente = venta.getCliente();
        if (cliente != null) {
            izquierda.addElement(new Paragraph("Señor(es): " + valor(cliente.getRazonSocial()), NEGRITA));
            if (cliente.getNumeroDocumento() != null) {
                izquierda.addElement(new Paragraph(cliente.getTipoDocumento().name() + ": " + cliente.getNumeroDocumento(), NORMAL));
            }
            if (cliente.getDireccion() != null && !cliente.getDireccion().isBlank()) {
                izquierda.addElement(new Paragraph("Dirección: " + cliente.getDireccion(), NORMAL));
            }
            if (cliente.getTelefono() != null && !cliente.getTelefono().isBlank()) {
                izquierda.addElement(new Paragraph("Teléfono: " + cliente.getTelefono(), NORMAL));
            }
        } else {
            izquierda.addElement(new Paragraph("Señor(es): Consumidor final", NORMAL));
        }

        PdfPCell derecha = celda("", NORMAL, Element.ALIGN_LEFT, false);
        derecha.addElement(new Paragraph("Fecha: " + venta.getFecha().format(FECHA), NORMAL));
        derecha.addElement(new Paragraph("Forma de pago: " + pagoLabel(venta.getTipoPago()), NORMAL));

        datos.addCell(izquierda);
        datos.addCell(derecha);
        doc.add(datos);
        doc.add(new Paragraph(" "));
    }

    private void tablaItems(Document doc, Venta venta) throws Exception {
        PdfPTable tabla = new PdfPTable(4);
        tabla.setWidthPercentage(100);
        tabla.setWidths(new float[]{12f, 52f, 18f, 18f});
        tabla.setKeepTogether(true);

        tabla.addCell(cabecera("Cant.", Element.ALIGN_CENTER));
        tabla.addCell(cabecera("Descripción", Element.ALIGN_LEFT));
        tabla.addCell(cabecera("P. Unit.", Element.ALIGN_RIGHT));
        tabla.addCell(cabecera("Importe", Element.ALIGN_RIGHT));

        for (DetalleVenta detalle : venta.getDetalles()) {
            tabla.addCell(celda(cantidad(detalle), NORMAL, Element.ALIGN_CENTER, true));
            tabla.addCell(celda(detalle.getProducto().getNombre(), NORMAL, Element.ALIGN_LEFT, true));
            tabla.addCell(celda(sol(detalle.getPrecioVenta()), NORMAL, Element.ALIGN_RIGHT, true));
            tabla.addCell(celda(sol(detalle.getSubtotal()), NORMAL, Element.ALIGN_RIGHT, true));
        }
        doc.add(tabla);
        doc.add(new Paragraph(" "));
    }

    private void totales(Document doc, Venta venta) throws Exception {
        PdfPTable tabla = new PdfPTable(2);
        tabla.setWidthPercentage(55);
        tabla.setHorizontalAlignment(Element.ALIGN_RIGHT);
        tabla.setWidths(new float[]{55f, 45f});
        tabla.setKeepTogether(true);

        tabla.addCell(celda("Op. Gravada", NORMAL, Element.ALIGN_LEFT, true));
        tabla.addCell(celda(sol(venta.getSubtotal()), NORMAL, Element.ALIGN_RIGHT, true));
        if (venta.getDescuento().compareTo(BigDecimal.ZERO) > 0) {
            tabla.addCell(celda("Descuento", NORMAL, Element.ALIGN_LEFT, true));
            tabla.addCell(celda("-" + sol(venta.getDescuento()), NORMAL, Element.ALIGN_RIGHT, true));
        }
        tabla.addCell(celda("IGV (" + venta.getIgvPorcentaje() + "%)", NORMAL, Element.ALIGN_LEFT, true));
        tabla.addCell(celda(sol(venta.getIgv()), NORMAL, Element.ALIGN_RIGHT, true));
        tabla.addCell(celda("IMPORTE TOTAL", NEGRITA, Element.ALIGN_LEFT, true));
        tabla.addCell(celda(sol(venta.getTotal()), NEGRITA, Element.ALIGN_RIGHT, true));

        doc.add(tabla);
        doc.add(new Paragraph(" "));
    }

    private void footer(Document doc, Venta venta) throws Exception {
        Paragraph leyenda = new Paragraph();
        leyenda.setAlignment(Element.ALIGN_CENTER);
        if (venta.getTipoComprobante() == TipoComprobante.FACTURA) {
            leyenda.add(new Paragraph("Representación impresa de la factura electrónica", PEQUENA));
        } else {
            leyenda.add(new Paragraph("Representación impresa de la boleta de venta", PEQUENA));
        }
        leyenda.add(new Paragraph("Atendió: " + valor(venta.getVendedor().getNombre())
                + " · Caja: " + valor(venta.getSesion().getCaja().getNombre()), PEQUENA));
        doc.add(leyenda);
    }

    private PdfPCell cabecera(String texto, int align) {
        PdfPCell cell = celda(texto, NEGRITA, align, true);
        cell.setBackgroundColor(new Color(0xE8, 0xE8, 0xE8));
        return cell;
    }

    private PdfPCell celda(String texto, Font font, int align, boolean borde) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setBorder(borde ? Rectangle.BOX : Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4);
        return cell;
    }

    private String cantidad(DetalleVenta detalle) {
        if (detalle.getPesoGramos() != null && detalle.getPesoGramos() > 0) {
            return kg(detalle.getPesoGramos()) + " kg";
        }
        return String.valueOf(detalle.getCantidad());
    }

    private String kg(Integer gramos) {
        BigDecimal g = BigDecimal.valueOf(gramos);
        return g.divide(BigDecimal.valueOf(1000)).stripTrailingZeros().toPlainString();
    }

    private String sol(BigDecimal valor) {
        return String.format(Locale.ROOT, "S/ %.2f", valor);
    }

    private String tipoLabel(TipoComprobante tipo) {
        return switch (tipo) {
            case BOLETA -> "BOLETA DE VENTA";
            case FACTURA -> "FACTURA";
            case TICKET -> "BOLETA";
        };
    }

    private String pagoLabel(TipoPago pago) {
        return switch (pago) {
            case EFECTIVO -> "EFECTIVO";
            case TARJETA -> "TARJETA";
            case TRANSFERENCIA -> "TRANSFERENCIA";
            case YAPE -> "YAPE";
            case PLIN -> "PLIN";
            case OTRO -> "OTRO";
        };
    }

    private String serieNumero(Venta venta) {
        return venta.getSerie() + "-" + String.format(Locale.ROOT, "%04d", venta.getNumero());
    }

    private String valor(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }
}
