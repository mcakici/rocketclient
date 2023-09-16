import { NgModule } from '@angular/core';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './main-layout/main-layout.component';
import { HomeComponent } from './home/home.component';

const appRoutes: Routes = [
	{ path: '', redirectTo: '/home', pathMatch: 'full' },
	{
		path: '',
		component: MainLayoutComponent,
		children: [
			{ path: 'home', component: HomeComponent, title: 'Rocket Launch Station Control System' },
			//{ path: 'Test', component: HomeComponent, title: 'Test' },
		],
	},
];

@NgModule({
	imports: [RouterModule.forRoot(appRoutes, { enableTracing: false, onSameUrlNavigation: 'reload' })],
	exports: [RouterModule],
})
export class AppRoutingModule {}
