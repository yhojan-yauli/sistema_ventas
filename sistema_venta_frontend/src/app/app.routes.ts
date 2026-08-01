import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/productos/productos.component').then((m) => m.ProductosComponent),
      },
      {
        path: 'categorias',
        loadComponent: () => import('./pages/categorias/categorias.component').then((m) => m.CategoriasComponent),
      },
      {
        path: 'proveedores',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/proveedores/proveedores.component').then((m) => m.ProveedoresComponent),
      },
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/clientes.component').then((m) => m.ClientesComponent),
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'cajas',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/cajas/cajas.component').then((m) => m.CajasComponent),
      },
      {
        path: 'movimientos',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/movimientos/movimientos.component').then((m) => m.MovimientosComponent),
      },
      {
        path: 'caja',
        loadComponent: () => import('./pages/caja/caja.component').then((m) => m.CajaComponent),
      },
      {
        path: 'ventas',
        loadComponent: () => import('./pages/ventas/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'compras',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/compras/compras.component').then((m) => m.ComprasComponent),
      },
      {
        path: 'reportes',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/reportes/reportes.component').then((m) => m.ReportesComponent),
      },
      {
        path: 'historial',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/historial/historial.component').then((m) => m.HistorialComponent),
      },
      {
        path: 'configuracion',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
