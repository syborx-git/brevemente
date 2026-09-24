import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/layout/sidebar/sidebar.component';
import { HeaderComponent } from './core/layout/header/header.component';
import { LevaDrawerComponent } from './core/components/leva-drawer/leva-drawer.component';
import { LevaButtonComponent } from './core/components/leva-button/leva-button.component';
import { RiskAlertBannerComponent } from './core/components/risk-banner/risk-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    LevaDrawerComponent,
    LevaButtonComponent,
    RiskAlertBannerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'BreveMente - Plataforma Clínica TBE';
}
