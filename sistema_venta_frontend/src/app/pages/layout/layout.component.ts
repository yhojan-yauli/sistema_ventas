import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CajaService } from '../../core/services/caja.service';
import { SesionResponse } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  highlight?: boolean;
}

const NAV: NavItem[] = [
  { path: 'dashboard', label: 'Inicio', icon: 'dashboard' },
  { path: 'ventas', label: 'Vender', icon: 'cart', highlight: true },
  { path: 'caja', label: 'Mi caja', icon: 'cash-register' },
  { path: 'productos', label: 'Productos', icon: 'box' },
  { path: 'compras', label: 'Compras', icon: 'bag', adminOnly: true },
  { path: 'proveedores', label: 'Proveedores', icon: 'truck', adminOnly: true },
  { path: 'clientes', label: 'Clientes', icon: 'users' },
  { path: 'categorias', label: 'Categorías', icon: 'tag', adminOnly: true },
  { path: 'reportes', label: 'Reportes', icon: 'chart', adminOnly: true },
  { path: 'historial', label: 'Historial', icon: 'history', adminOnly: true },
  { path: 'cajas', label: 'Cajas', icon: 'wallet', adminOnly: true },
  { path: 'movimientos', label: 'Movimientos', icon: 'history', adminOnly: true },
  { path: 'usuarios', label: 'Usuarios', icon: 'user', adminOnly: true },
  { path: 'configuracion', label: 'Configuración', icon: 'settings', adminOnly: true },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="layout" [class.side-open]="mobileOpen()">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-mark"><app-icon name="cash-register" [size]="22" /></span>
          <div class="brand-text">
            <b>Tienda</b>
            <small>Punto de venta</small>
          </div>
        </div>

        <nav class="nav">
          @for (item of navItems(); track item.path) {
            <a
              class="nav-item"
              routerLink="/{{ item.path }}"
              routerLinkActive="active"
              [class.nav-highlight]="item.highlight"
              [routerLinkActiveOptions]="{ exact: item.path === 'dashboard' }"
              (click)="mobileOpen.set(false)"
            >
              <app-icon [name]="item.icon" [size]="18" />
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-foot">
          <div class="side-user">
            <span class="avatar">{{ initial() }}</span>
            <div class="side-user-info">
              <b>{{ auth.nombre }}</b>
              <small>{{ rolLabel() }}</small>
            </div>
          </div>
          <button class="logout-btn" (click)="auth.logout()">
            <app-icon name="logout" [size]="17" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div class="backdrop" (click)="mobileOpen.set(false)"></div>

      <div class="main">
        <header class="topbar">
          <button class="menu-btn" (click)="mobileOpen.set(!mobileOpen())" aria-label="Menú">
            <app-icon name="menu" [size]="20" />
          </button>

          <div class="topbar-title">
            <span class="crumb">Tienda</span>
            <app-icon name="chevron-down" [size]="14" class="crumb-arrow" />
            <span class="crumb current">{{ currentTitle() }}</span>
          </div>

          <div class="topbar-right">
            @if (sesion(); as s) {
              <a class="sesion-chip" routerLink="/caja">
                <span class="dot"></span>
                <span class="sesion-chip-text">
                  <b>{{ s.cajaNombre }}</b>
                  <small>Caja abierta · {{ s.montoFinalEsperado.toFixed(2) }} → {{ s.totalVentas.toFixed(2) }}</small>
                </span>
              </a>
            }
            <span class="avatar user-avatar">{{ initial() }}</span>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .layout {
        display: flex;
        min-height: 100vh;
      }

      .sidebar {
        width: var(--sidebar-w);
        background: var(--sidebar);
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: 200;
      }

      .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 20px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }

      .brand-mark {
        width: 40px;
        height: 40px;
        border-radius: 11px;
        background: linear-gradient(135deg, #14b8a6, #0f766e);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }

      .brand-text b {
        color: #fff;
        font-size: 16px;
        letter-spacing: -0.02em;
      }

      .brand-text small {
        color: var(--sidebar-text);
        font-size: 11.5px;
        opacity: 0.7;
      }

      .nav {
        flex: 1;
        overflow-y: auto;
        padding: 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 9px;
        color: var(--sidebar-text);
        font-weight: 600;
        font-size: 13.5px;
        transition: background 0.13s ease, color 0.13s ease;
      }

      .nav-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
      }

      .nav-item.active {
        background: var(--sidebar-active);
        color: #fff;
      }

      .nav-item.active app-icon {
        color: #5eead4;
      }

      .nav-highlight {
        background: rgba(15, 118, 110, 0.22);
        border: 1px solid rgba(94, 234, 212, 0.16);
        color: #fff;
      }

      .nav-highlight app-icon {
        color: #5eead4;
      }

      .sidebar-foot {
        padding: 14px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.07);
      }

      .side-user {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 10px;
        padding: 10px;
      }

      .side-user-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }

      .side-user-info b {
        color: #fff;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .side-user-info small {
        color: var(--sidebar-text);
        font-size: 11.5px;
      }

      .logout-btn {
        margin-top: 10px;
        width: 100%;
        border: 1px solid rgba(252, 165, 165, 0.25);
        background: rgba(220, 38, 38, 0.12);
        color: #fca5a5;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        border-radius: 9px;
        font-weight: 700;
        font-size: 13px;
        transition: background 0.13s ease, border-color 0.13s ease;
      }

      .logout-btn:hover {
        background: rgba(220, 38, 38, 0.28);
        border-color: rgba(252, 165, 165, 0.45);
      }

      .main {
        flex: 1;
        margin-left: var(--sidebar-w);
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        min-width: 0;
      }

      .topbar {
        height: 64px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 0 24px;
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .menu-btn {
        display: none;
        border: 1px solid var(--border);
        background: #fff;
        border-radius: 8px;
        width: 38px;
        height: 38px;
        align-items: center;
        justify-content: center;
        color: var(--text-soft);
      }

      .topbar-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
      }

      .crumb {
        color: var(--text-faint);
        font-size: 13px;
      }

      .crumb.current {
        color: var(--text);
        font-weight: 700;
      }

      .crumb-arrow {
        transform: rotate(-90deg);
        color: var(--text-faint);
      }

      .topbar-right {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .user-avatar {
        background: var(--brand-soft);
        color: var(--brand-deep);
      }

      .sesion-chip {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--border);
        background: var(--surface-soft);
        border-radius: 10px;
        padding: 6px 12px;
        transition: border-color 0.13s ease;
      }

      .sesion-chip:hover {
        border-color: var(--brand);
      }

      .sesion-chip .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--success);
        box-shadow: 0 0 0 3px var(--success-soft);
        flex-shrink: 0;
      }

      .sesion-chip-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .sesion-chip-text b {
        font-size: 12.5px;
        color: var(--text);
      }

      .sesion-chip-text small {
        font-size: 11px;
        color: var(--text-faint);
      }

      .content {
        flex: 1;
        padding-bottom: 40px;
      }

      .backdrop {
        display: none;
      }

      @media (max-width: 940px) {
        .sidebar {
          transform: translateX(-100%);
          transition: transform 0.22s ease;
        }
        .side-open .sidebar {
          transform: translateX(0);
        }
        .main {
          margin-left: 0;
        }
        .menu-btn {
          display: flex;
        }
        .side-open .backdrop {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(13, 26, 30, 0.45);
          z-index: 150;
        }
      }
    `,
  ],
})
export class LayoutComponent {
  readonly auth = inject(AuthService);
  private readonly caja = inject(CajaService);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);

  readonly mobileOpen = signal(false);
  readonly sesion = signal<SesionResponse | null>(null);
  readonly currentTitle = signal('Inicio');

  readonly navItems = signal(
    NAV.filter((n) => !n.adminOnly || this.auth.isAdmin)
  );

  constructor() {
    this.auth.user.set(this.auth.user());
    this.refreshSesion();

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe(() => {
        const url = this.router.url.replace('/', '');
        const item = NAV.find((n) => n.path === url);
        this.currentTitle.set(item?.label ?? 'Inicio');
        this.refreshSesion();
      });

    fromEvent(window, 'sesion:changed')
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => this.refreshSesion());
  }

  private refreshSesion() {
    if (!this.auth.token()) return;
    this.caja.miSesion().subscribe({
      next: (s) => this.sesion.set(s),
      error: () => this.sesion.set(null),
    });
  }

  initial(): string {
    return (this.auth.nombre || 'U').charAt(0);
  }

  rolLabel(): string {
    return this.auth.isAdmin ? 'Administrador' : 'Vendedor';
  }
}
