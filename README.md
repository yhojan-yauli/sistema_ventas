<img src="assets/anim/header.svg" width="100%" alt="Sistema de Ventas">

# Sistema de Ventas (POS)

> Plataforma web de punto de venta para tiendas pequeñas y medianas: gestiona productos, ventas, cajas, clientes, compras y reportes desde un solo lugar.

[![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-green?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-21-red?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8-blue?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

## 📋 Tabla de contenido

- [Características](#-características)
- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Manual de instalación](#-manual-de-instalación)
- [Credenciales iniciales](#-credenciales-iniciales)
- [Uso rápido](#-uso-rápido)
- [Documentación de la API](#-documentación-de-la-api)
- [Hoja de ruta](#-hoja-de-ruta)

---

## ✨ Características

### 🔐 Autenticación y usuarios
- Inicio de sesión seguro con **JWT**.
- Roles **ADMIN** y **VENDEDOR** con permisos diferenciados.
- Gestión de usuarios: crear, editar, activar/desactivar y restablecer contraseñas.

### 🛒 Punto de venta (POS)
- Carrito de compras ágil con búsqueda por nombre o código.
- **Venta por unidad** y **venta por peso** (gramos/kilogramos).
- Descuento global y control de **stock en tiempo real**.
- **6 métodos de pago**: efectivo, tarjeta, transferencia, Yape, Plin y otro.
- Cálculo automático del **vuelto**.
- **IGV configurable** (precios con o sin impuesto incluido).

### 🧾 Comprobantes
- **Boleta**, **factura** y **ticket** con correlativos automáticos por serie (`B001`, `F001`, `T001`).
- Impresión de comprobante en formato **ticket de 80 mm**.
- Reimpresión desde el historial de ventas.
- Envío por **correo** con el comprobante adjunto en **PDF A4 con formato SUNAT** (boleta y factura), desde una cuenta SMTP configurable.

### 📦 Productos y categorías
- Catálogo completo: código, nombre, categoría, descripción, precios de compra/venta, stock y stock mínimo.
- Categorías para organizar el catálogo.
- **Ajustes de stock** y registro de **movimientos** (entradas y salidas).

### 👥 Clientes y proveedores
- Registro y gestión de clientes y proveedores.
- **Autocompletado de DNI/RUC** al escribir el documento (búsqueda en línea).
- Creación rápida del cliente directamente desde la venta.
- Ventas a cliente **de mostrador** (consumidor final).

### 💰 Cajas y sesiones
- Apertura y cierre de caja con monto inicial.
- Registro de **gastos** y **retiros** durante la jornada.
- **Cuadre de caja** por método de pago con diferencia esperada vs. real.

### 🧾 Compras
- Registro de compras a proveedores.
- Actualización automática de **stock** y **costos**.

### 📊 Reportes y dashboard
- Dashboard con indicadores: ventas de hoy, ganancias, stock bajo y sesiones abiertas.
- Reportes de **ventas** (por rango de fechas, caja y producto).
- Reportes de **ganancias**, **stock**, **compras** y **cierre mensual**.

### ⚙️ Configuración
- Datos del negocio (razón social, RUC, dirección, teléfono, correo).
- Parámetros de IGV.
- Configuración de **correo SMTP** con botón de **prueba de envío**.

---

## 🧩 Stack tecnológico

| Capa       | Tecnologías                                                                        |
| ---------- | ---------------------------------------------------------------------------------- |
| Backend    | Java 21 · Spring Boot 4.1 · Spring Security (JWT) · Spring Data JPA · OpenPDF · JavaMail · jsoup |
| Frontend   | Angular 21 · TypeScript 5.9 · RxJS · Angular Signals                                |
| Base de datos | MySQL 8                                                                          |
| API        | REST · OpenAPI / Swagger                                                           |

---

## 📁 Estructura del proyecto

```text
sistema_ventas/
├── sistema_ventas_backend/        # API REST (Spring Boot)
│   └── src/main/java/com/sistemas/sistema_venta/
│       ├── config/                # Seguridad, JWT, datos iniciales
│       ├── controller/            # Endpoints REST
│       ├── dto/                   # Objetos de transferencia
│       ├── entity/                # Entidades JPA
│       ├── enums/                 # Enumerados del dominio
│       ├── repository/            # Acceso a datos
│       ├── scraper/               # Consulta DNI/RUC en línea
│       └── service/               # Lógica de negocio
├── sistema_venta_frontend/        # Aplicación web (Angular)
│   └── src/app/
│       ├── core/                  # Servicios, modelos y utilidades
│       ├── pages/                 # Módulos de la interfaz
│       └── shared/                # Componentes reutilizables
└── assets/anim/                   # Recursos visuales del README
```

---

## 🚀 Manual de instalación

### 1️⃣ Requisitos previos

| Herramienta | Versión mínima |
| ----------- | -------------- |
| JDK         | 21             |
| Node.js     | 20.17 (recomendado 22) |
| npm         | 11             |
| MySQL       | 8              |
| Angular CLI | 21             |

> 💡 Verifica tu instalación con `java -version`, `node -v`, `npm -v` y `mysql --version`.

### 2️⃣ Base de datos

La aplicación **crea la base de datos automáticamente** la primera vez que se ejecuta (`createDatabaseIfNotExist=true`). Solo asegúrate de tener MySQL corriendo en `localhost:3306`.

Opcional: crearla manualmente.

```sql
CREATE DATABASE sistema_ventas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3️⃣ Backend (Spring Boot)

**a)** Configura la conexión a MySQL y los secretos en el archivo:

```text
sistema_ventas_backend/src/main/resources/application.properties
```

```properties
# MySQL
spring.datasource.username=tu_usuario
spring.datasource.password=tu_contraseña

# JWT (genera una clave segura)
jwt.secret=clave_secreta_larga_y_segura_para_firmar_tokens
```

**b)** Compila e inicia el servidor:

```bash
cd sistema_ventas_backend
./gradlew bootRun
```

El backend quedará disponible en: **http://localhost:8080**

> La primera ejecución crea las tablas y los datos iniciales (usuario administrador, cajas y series de comprobantes).

### 4️⃣ Frontend (Angular)

**a)** Instala las dependencias:

```bash
cd sistema_venta_frontend
npm install
```

**b)** Inicia el servidor de desarrollo:

```bash
npm start
```

La aplicación abrirá en: **http://localhost:4200**

> El frontend se conecta a la API en `http://localhost:8080/api` (configurable en `src/environments/environment.ts`).

### 5️⃣ Configuración inicial del negocio

1. Inicia sesión con las credenciales iniciales.
2. Ve a **Configuración** e ingresa:
   - **Datos del negocio**: razón social, RUC, dirección, teléfono y correo.
   - **IGV**: porcentaje y si los precios ya incluyen impuesto.
   - **Correo SMTP**: servidor, puerto, usuario y contraseña de aplicación (ej. Gmail).
3. Usa **"Probar envío"** para validar el correo antes de vender.

---

## 🔑 Credenciales iniciales

| Usuario  | Contraseña   | Rol       |
| -------- | ------------ | --------- |
| `admin`  | `admin123`   | ADMIN     |
| `vendedor` | `vendedor123` | VENDEDOR |

> ⚠️ Cambia estas contraseñas la primera vez que uses el sistema en producción.

---

## 🖥️ Uso rápido

```text
1. Abrir caja   → Módulo Caja → "Abrir caja"
2. Vender       → Punto de venta → selecciona productos (cantidad o peso)
3. Cliente      → Mostrador o buscar/crear cliente (autocompletado DNI/RUC)
4. Cobrar       → Elige método de pago y comprobante → "Cobrar"
5. Imprimir     → Imprime el ticket o reimprime desde el historial
6. Enviar       → Envía el comprobante por correo (PDF A4 formato SUNAT)
```

---

## 📚 Documentación de la API

Con el backend en ejecución, la documentación interactiva (Swagger) está disponible en:

**http://localhost:8080/swagger-ui/index.html**

---

## 🗺️ Hoja de ruta

- 💾 **Respaldo automático de la base de datos** (backups programados y restauración).
- 🏛️ **Facturación electrónica SUNAT** — integración con la API de SUNAT para emisión de comprobantes electrónicos (generación de XML, firma digital y envío de CDR).

---

<div align="center">
  <sub>Hecho con ❤️ para emprendedores y tiendas de barrio.</sub>
</div>
