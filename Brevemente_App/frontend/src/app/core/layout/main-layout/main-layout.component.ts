import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { LevaDrawerComponent } from '../../components/leva-drawer/leva-drawer.component';
import { LevaButtonComponent } from '../../components/leva-button/leva-button.component';
import { RiskAlertBannerComponent } from '../../components/risk-banner/risk-banner.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    LevaDrawerComponent,
    LevaButtonComponent,
    RiskAlertBannerComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {}
