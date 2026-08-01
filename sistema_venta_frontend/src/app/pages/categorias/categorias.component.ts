import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaResponse } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { IconComponent } from '../../shared/icon.component';
import { ModalComponent, ModalFooterDirective } from '../../shared/modal.component';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, ModalFooterDirective],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Categorías</h1>
          <p class="page-sub">Organiza tus productos por familias</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="openForm()"><app-icon name="plus" [size]="16" /> Nueva categoría</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-block"><app-icon name="refresh" [size]="26" /></div>
      } @else {
        <div class="grid-cats">
          @for (c of categorias(); track c.id) {
            <div class="cat-card">
              <div class="cat-top">
                <span class="avatar soft" [style.--hue]="hue(c.id)">{{ c.nombre.charAt(0) }}</span>
                <div class="cat-info">
                  <b>{{ c.nombre }}</b>
                  <small>ID {{ c.id }}</small>
                </div>
              </div>
              <div class="cat-actions">
                <button class="btn btn-ghost btn-sm" (click)="openForm(c)"><app-icon name="pencil" [size]="14" /> Editar</button>
                <button class="btn btn-ghost btn-sm danger-text" (click)="remove(c)"><app-icon name="trash" [size]="14" /> Eliminar</button>
              </div>
            </div>
          } @empty {
            <div class="empty-state span-3"><app-icon name="tag" [size]="34" /><p>Aún no hay categorías. Crea la primera.</p></div>
          }
        </div>
      }
    </div>

    <app-modal [open]="formOpen()" (closed)="closeForm()" size="sm">
      <span head>{{ editando() ? 'Editar categoría' : 'Nueva categoría' }}</span>
      <form [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="field">
          <label class="label">Nombre <span class="opt">obligatorio</span></label>
          <input class="input" formControlName="nombre" placeholder="Ej. Bebidas" autofocus />
          @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
            <span class="field-err">El nombre es obligatorio</span>
          }
        </div>
      </form>
      <div foot>
        <button class="btn btn-ghost" (click)="closeForm()">Cancelar</button>
        <button class="btn btn-primary" (click)="save()">Guardar</button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .grid-cats {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 14px;
      }
      .cat-card {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition: box-shadow 0.15s ease, transform 0.15s ease;
      }
      .cat-card:hover {
        box-shadow: var(--shadow);
        transform: translateY(-1px);
      }
      .cat-top {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .cat-info {
        display: flex;
        flex-direction: column;
        line-height: 1.4;
      }
      .cat-info b {
        font-size: 14px;
      }
      .cat-info small {
        color: var(--text-faint);
        font-size: 12.5px;
      }
      .cat-actions {
        display: flex;
        gap: 8px;
      }
      .span-3 {
        grid-column: 1 / -1;
      }
    `,
  ],
})
export class CategoriasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy = inject(DestroyRef);

  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly editando = signal(false);
  private editingId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
  });

  ngOnInit() {
    this.api
      .categorias()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((cs) => {
        this.categorias.set(cs);
        this.loading.set(false);
      });
  }

  openForm(c?: CategoriaResponse) {
    this.editingId = c?.id ?? null;
    this.editando.set(!!c);
    this.form.reset({ nombre: c?.nombre ?? '' });
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = { nombre: v.nombre };
    const call = this.editingId ? this.api.actualizarCategoria(this.editingId, body) : this.api.crearCategoria(body);
    call.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Categoría actualizada' : 'Categoría creada');
        this.closeForm();
        this.reload();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  remove(c: CategoriaResponse) {
    this.confirm
      .confirm({
        title: 'Eliminar categoría',
        message: `¿Eliminar "${c.nombre}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        danger: true,
      })
      .then((ok) => {
        if (!ok) return;
        this.api.eliminarCategoria(c.id).pipe(takeUntilDestroyed(this.destroy)).subscribe({
          next: () => {
            this.toast.success('Categoría eliminada');
            this.reload();
          },
          error: (e) => this.toast.error(errorMessage(e)),
        });
      });
  }

  private reload() {
    this.api.categorias().pipe(takeUntilDestroyed(this.destroy)).subscribe((cs) => this.categorias.set(cs));
  }

  hue(id: number) {
    return ((id * 47) % 360).toString();
  }
}
