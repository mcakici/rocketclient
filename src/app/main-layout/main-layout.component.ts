import { Component } from '@angular/core';
import { HomeComponent } from '../home/home.component';

@Component({
	selector: 'app-main-layout',
	templateUrl: './main-layout.component.html',
	styleUrls: ['./main-layout.component.scss'],
	providers: [HomeComponent],
})
export class MainLayoutComponent {

  constructor(private homeComponent: HomeComponent ) { }

	refresh() {
		this.homeComponent.refreshRocketInformation();
	}
}
