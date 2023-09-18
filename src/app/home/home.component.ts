import { Component } from '@angular/core';
import { WebSocketService } from '../services/websocket/web-socket.service';
import { HttpService } from '../services/http/http.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
	public rocketTelemetry: any = [];
	public rockets: any = [];
	public weather: any = [];
	public selectedIndex: any;
	private loading: boolean = false;

	constructor(private websocketService: WebSocketService, private http: HttpService) {
		//console.log('home component initialized.');
	}

	ngOnInit() {
		this.websocketService.connect(null, false);

		setInterval(() => {
			this.refreshTelemetryData();
		}, 500);

		this.loadingState(true);

		this.refreshRocketInformation();
		let refreshRocketInterval = setInterval(() => {
			this.refreshRocketInformation();
		}, 10000);

		this.getWeather();
		let refreshWeatherData = setInterval(() => {
			this.getWeather();
		}, 10000);
	}

	private refreshTelemetryData() {
		if (this.rockets.length <= 0) return;

		this.rocketTelemetry = this.websocketService.data;

		this.rockets.forEach((roc: any) => {
			const host = roc.telemetry.host;
			const port = roc.telemetry.port;

			let wsinfo = this.websocketService.data.find((x: any) => x.port === port);
			if (wsinfo) {
				if (!wsinfo.speed && !wsinfo.altitude && !wsinfo.acceleration && !wsinfo.thrust && roc.status === 'launched') {
					roc.status = 'failed';
					this.refreshRocketInformation();
					return;
				} else if (
					wsinfo.speed &&
					wsinfo.altitude &&
					wsinfo.acceleration &&
					wsinfo.thrust &&
					(roc.status === 'deployed' || roc.status === 'waiting') &&
					(wsinfo.speed > roc.speed || !roc.speed)
				) {
					roc.status = 'launched';
					this.refreshRocketInformation();
					return;
				}

				roc.altitude = wsinfo.altitude;
				roc.speed = wsinfo.speed;
				roc.thrust = wsinfo.thrust;
				roc.temperature = wsinfo.temperature;
				roc.acceleration = wsinfo.acceleration;
				roc.telemetryConnection = true;
			} else {
				roc.telemetryConnection = false;
			}
		});
	}

	public refreshRocketInformation() {
		if (this.loading) return;

		this.loading = true;
		this.http.get(
			'//localhost:5000/rockets',
			[{ name: 'X-API-Key', value: 'API_KEY_1' }],
			(data: any) => {
				if (document.getElementById('loadingText')?.innerText === 'Loading..') this.loadingState(false);
				this.loading = false;
				if (this.rockets.length == 0) {
					this.rockets = data;
				} else {
					for (let index = 0; index < data.length; index++) {
						const e = data[index];
						var roc = this.rockets.findIndex((x: any) => x.id === e.id);
						this.rockets[roc].status = e.status;
						this.rockets[roc].timestamps = e.timestamps;
					}
				}
			},
			'json',
			(err: any) => {
				this.loading = false;
			}
		);
	}

	rocketSelected($event: any, rocket: any) {
		console.log($event, rocket);
		var rocketIndex = this.rockets.findIndex((x: any) => x.id === rocket.id);
		this.selectedIndex = rocketIndex;
	}

	deployRocket(rocketId: string) {
		this.loadingState(true, rocketId + ' is deploying..');
		this.http.put(
			'//localhost:5000/rocket/' + rocketId + '/status/deployed',
			[{ name: 'X-API-Key', value: 'API_KEY_1' }],
			(data: any) => {
				this.loadingState(false);
				console.log(data);
				var rocketIndex = this.rockets.findIndex((x: any) => x.id === rocketId);
				this.rockets[rocketIndex] = data;
			},
			'json',
			(err: any) => {
				this.loadingState(false);
				this.refreshRocketInformation();
			}
		);
	}

	launchRocket(rocketId: string) {
		this.loadingState(true, rocketId + ' is launching..');
		this.http.put(
			'//localhost:5000/rocket/' + rocketId + '/status/launched',
			[{ name: 'X-API-Key', value: 'API_KEY_1' }],
			(data: any) => {
				this.loadingState(false);
				console.log(data);
				var rocketIndex = this.rockets.findIndex((x: any) => x.id === rocketId);
				this.rockets[rocketIndex] = data;
			},
			'json',
			(err: any) => {
				this.loadingState(false);
				this.refreshRocketInformation();
			}
		);
	}

	cancelLaunch(rocketId: string) {
		this.loadingState(true, 'Rocket ' + rocketId + ' launch is being canceled..');
		this.http.delete(
			'//localhost:5000/rocket/' + rocketId + '/status/launched',
			[{ name: 'X-API-Key', value: 'API_KEY_1' }],
			(data: any) => {
				this.loadingState(false);
				console.log(data);

				var rocketIndex = this.rockets.findIndex((x: any) => x.id === rocketId);
				this.rockets[rocketIndex] = data;
			},
			'json',
			(err: any) => {
				this.loadingState(false);
				this.refreshRocketInformation();
			}
		);
	}

	getWeather() {
		this.http.get(
			'//localhost:5000/weather',
			[{ name: 'X-API-Key', value: 'API_KEY_1' }],
			(data: any) => {
				console.log(data);
				this.weather = data;
			},
			'json'
		);
	}

	loadingState(status: boolean, loadingText: string = 'Loading..') {
		if (status) {
			let loadingTxtElement = document.getElementById('loadingText');
			if (loadingTxtElement) loadingTxtElement.innerHTML = loadingText;

			document.getElementById('loadingOverlay')?.classList.remove('hidden');
		} else {
			document.getElementById('loadingOverlay')?.classList.add('hidden');
		}
	}
}
