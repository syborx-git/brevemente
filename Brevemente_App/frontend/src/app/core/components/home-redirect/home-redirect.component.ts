import { Component } from '@angular/core';

/**
 * Componente stub sin plantilla. Sirve de ancla para `homeRedirectGuard`
 * en las rutas raíz, porque en Angular `redirectTo` se evalúa antes que
 * los guards. El guard devuelve un `UrlTree` y produce la navegación real.
 */
@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: ''
})
export class HomeRedirectComponent {}
