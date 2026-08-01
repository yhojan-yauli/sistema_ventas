import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
class GuardService {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  canActivate(): boolean {
    if (this.auth.token()) return true;
    this.router.navigate(['/login']);
    return false;
  }

  canActivateAdmin(): boolean {
    if (!this.canActivate()) return false;
    if (this.auth.isAdmin) return true;
    this.router.navigate(['/']);
    return false;
  }
}

export const authGuard: CanActivateFn = () => inject(GuardService).canActivate();
export const adminGuard: CanActivateFn = () => inject(GuardService).canActivateAdmin();
