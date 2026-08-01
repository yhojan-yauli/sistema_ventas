package com.sistemas.sistema_venta.config;

import com.sistemas.sistema_venta.entity.Categoria;
import com.sistemas.sistema_venta.entity.Producto;
import com.sistemas.sistema_venta.repository.CategoriaRepository;
import com.sistemas.sistema_venta.repository.ProductoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MinimarketSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MinimarketSeeder.class);

    private static final String TABLES = "detalle_venta,ventas,detalle_compra,compras,retiros,gastos,movimiento_stock," +
            "cuadre_metodo,sesion_caja,cierre_mensual,productos,categorias,proveedores,clientes,cajas,serie_comprobante";

    private final Environment environment;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public MinimarketSeeder(Environment environment, CategoriaRepository categoriaRepository,
                            ProductoRepository productoRepository) {
        this.environment = environment;
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!"true".equalsIgnoreCase(environment.getProperty("app.seed.minimarket"))) {
            return;
        }
        log.warn("=== SEED MINIMARKET ACTIVADO: se borraran todos los datos excepto usuarios/configuracion ===");
        limpiar();
        sembrar();
        log.warn("=== SEED MINIMARKET FINALIZADO ===");
    }

    private void limpiar() {
        entityManager.createQuery("DELETE FROM DetalleVenta").executeUpdate();
        entityManager.createQuery("DELETE FROM Venta").executeUpdate();
        entityManager.createQuery("DELETE FROM DetalleCompra").executeUpdate();
        entityManager.createQuery("DELETE FROM Compra").executeUpdate();
        entityManager.createQuery("DELETE FROM Retiro").executeUpdate();
        entityManager.createQuery("DELETE FROM Gasto").executeUpdate();
        entityManager.createQuery("DELETE FROM MovimientoStock").executeUpdate();
        entityManager.createQuery("DELETE FROM CuadreMetodo").executeUpdate();
        entityManager.createQuery("DELETE FROM SesionCaja").executeUpdate();
        entityManager.createQuery("DELETE FROM CierreMensual").executeUpdate();
        entityManager.createQuery("DELETE FROM Producto").executeUpdate();
        entityManager.createQuery("DELETE FROM Categoria").executeUpdate();
        entityManager.createQuery("DELETE FROM Proveedor").executeUpdate();
        entityManager.createQuery("DELETE FROM Cliente").executeUpdate();
        entityManager.createQuery("DELETE FROM Caja").executeUpdate();
        entityManager.createQuery("DELETE FROM SerieComprobante").executeUpdate();

        for (String tabla : TABLES.split(",")) {
            try {
                entityManager.createNativeQuery("ALTER TABLE " + tabla + " AUTO_INCREMENT = 1").executeUpdate();
            } catch (Exception e) {
                log.debug("No se pudo resetear auto_increment de {}: {}", tabla, e.getMessage());
            }
        }
    }

    private void sembrar() {
        List<Categoria> categorias = new ArrayList<>();
        for (String nombre : List.of(
                "Abarrotes", "Bebidas y refrescos", "Lácteos y huevos", "Panadería y pastelería",
                "Snacks", "Golosinas y confitería", "Limpieza", "Cuidado personal",
                "Congelados", "Enlatados y conservas", "Bebidas alcohólicas", "Café y té")) {
            categorias.add(categoriaRepository.save(Categoria.builder().nombre(nombre).build()));
        }

        List<Producto> productos = List.of(
                p("ABR001", "Arroz costeño 1kg", categorias.get(0), "3.50", "5.00", 80, 20),
                p("ABR002", "Azúcar rubia 1kg", categorias.get(0), "3.20", "4.50", 60, 15),
                p("ABR003", "Fideos tallarín 500g", categorias.get(0), "1.50", "2.50", 50, 12),
                p("ABR004", "Aceite vegetal 1L", categorias.get(0), "7.00", "9.50", 40, 10),
                p("ABR005", "Avena instantánea 400g", categorias.get(0), "2.40", "3.80", 30, 8),
                p("ABR006", "Sal de mesa 1kg", categorias.get(0), "0.80", "1.50", 45, 10),
                p("ABR007", "Harina de trigo 1kg", categorias.get(0), "2.80", "4.20", 35, 8),
                p("ABR008", "Lentejas 500g", categorias.get(0), "2.60", "4.00", 40, 10),
                p("ABR009", "Milo 500g", categorias.get(0), "8.00", "11.00", 25, 6),
                p("ABR010", "Frijol canario 500g", categorias.get(0), "3.10", "4.60", 35, 8),

                p("BEB001", "Gaseosa Coca-Cola 1L", categorias.get(1), "4.50", "6.00", 60, 15),
                p("BEB002", "Gaseosa Inca Kola 1L", categorias.get(1), "4.30", "5.80", 55, 15),
                p("BEB003", "Agua mineral 625ml", categorias.get(1), "0.80", "1.20", 100, 20),
                p("BEB004", "Jugo de frutas 1L", categorias.get(1), "4.00", "5.50", 30, 8),
                p("BEB005", "Gaseosa Sprite 1.5L", categorias.get(1), "6.00", "8.00", 40, 10),
                p("BEB006", "Bebida rehidratante 500ml", categorias.get(1), "2.00", "3.00", 50, 12),
                p("BEB007", "Gaseosa Kola Real 2L", categorias.get(1), "6.50", "8.50", 40, 10),

                p("LAC001", "Leche evaporada 400g", categorias.get(2), "3.40", "4.60", 70, 15),
                p("LAC002", "Leche fresca 1L", categorias.get(2), "5.00", "6.80", 45, 10),
                p("LAC003", "Yogurt 500ml", categorias.get(2), "3.00", "4.20", 30, 8),
                p("LAC004", "Mantequilla 200g", categorias.get(2), "6.50", "8.50", 25, 6),
                p("LAC005", "Queso fresco 500g", categorias.get(2), "8.00", "11.00", 20, 5),
                p("LAC006", "Huevos x12", categorias.get(2), "6.00", "8.00", 35, 10),

                p("PAN001", "Pan francés unidad", categorias.get(3), "0.25", "0.50", 120, 30),
                p("PAN002", "Galletas de soda 300g", categorias.get(3), "1.80", "2.80", 60, 15),
                p("PAN003", "Torta de chocolate", categorias.get(3), "12.00", "18.00", 10, 2),

                p("SNA001", "Papas fritas 60g", categorias.get(4), "2.00", "3.00", 70, 15),
                p("SNA002", "Chizitos 45g", categorias.get(4), "1.20", "2.00", 65, 15),
                p("SNA003", "Canchita tostada 120g", categorias.get(4), "1.60", "2.50", 55, 12),

                p("GOL001", "Chocolate 50g", categorias.get(5), "1.50", "2.50", 60, 15),
                p("GOL002", "Caramelos (bolsa 20u)", categorias.get(5), "1.00", "1.80", 80, 20),
                p("GOL003", "Galletas rellenas de chocolate 90g", categorias.get(5), "1.20", "2.00", 70, 15),
                p("GOL004", "Chupetes surtidos", categorias.get(5), "0.50", "1.00", 100, 25),

                p("LIM001", "Detergente 1kg", categorias.get(6), "4.50", "6.50", 40, 10),
                p("LIM002", "Jabón de lavar 250g", categorias.get(6), "3.00", "4.50", 30, 8),
                p("LIM003", "Lejía 1L", categorias.get(6), "2.20", "3.50", 35, 8),
                p("LIM004", "Papel higiénico x4", categorias.get(6), "5.00", "7.00", 45, 10),
                p("LIM005", "Esponjas de cocina x3", categorias.get(6), "1.00", "1.80", 40, 10),
                p("LIM006", "Bolsas de basura x10", categorias.get(6), "1.50", "2.50", 50, 12),

                p("CUI001", "Jabón de tocador", categorias.get(7), "1.50", "2.50", 50, 12),
                p("CUI002", "Shampoo 300ml", categorias.get(7), "6.00", "8.50", 25, 6),
                p("CUI003", "Pasta dental 90g", categorias.get(7), "2.50", "3.80", 40, 10),
                p("CUI004", "Papel toalla de cocina", categorias.get(7), "3.00", "4.50", 30, 8),
                p("CUI005", "Crema facial 100ml", categorias.get(7), "5.00", "8.00", 15, 4),

                p("CON001", "Helado 1L", categorias.get(8), "8.00", "12.00", 15, 4),
                p("CON002", "Verduras congeladas 500g", categorias.get(8), "4.00", "6.00", 20, 5),
                p("CON003", "Pollo congelado 1kg", categorias.get(8), "9.00", "12.50", 25, 6),

                p("ENL001", "Atún en lata 170g", categorias.get(9), "3.20", "4.80", 40, 10),
                p("ENL002", "Alverjas 425g", categorias.get(9), "2.50", "3.80", 30, 8),
                p("ENL003", "Maíz dulce 425g", categorias.get(9), "2.80", "4.00", 30, 8),
                p("ENL004", "Leche condensada 400g", categorias.get(9), "3.50", "5.00", 35, 8),

                p("ALB001", "Cerveza 620ml", categorias.get(10), "5.00", "7.50", 50, 12),
                p("ALB002", "Vino 750ml", categorias.get(10), "18.00", "26.00", 15, 3),

                p("CAF001", "Café instantáneo 100g", categorias.get(11), "5.50", "7.80", 30, 8),
                p("CAF002", "Té en caja 25 sobres", categorias.get(11), "3.00", "4.50", 35, 8),
                p("CAF003", "Café molido 250g", categorias.get(11), "6.00", "8.50", 25, 6)
        );

        productoRepository.saveAll(productos);
        log.info("SEED: {} categorías y {} productos creados", categorias.size(), productos.size());
    }

    private Producto p(String codigo, String nombre, Categoria categoria, String costo, String venta,
                       int stock, int stockMinimo) {
        return Producto.builder()
                .codigo(codigo)
                .nombre(nombre)
                .categoria(categoria)
                .precioCompra(new BigDecimal(costo))
                .precioVenta(new BigDecimal(venta))
                .incluyeIGV(true)
                .stock(stock)
                .stockMinimo(stockMinimo)
                .ventaPorPeso(false)
                .activo(true)
                .build();
    }
}
