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
	public selected: any;

	constructor(private websocketService: WebSocketService, private http: HttpService) {
		//console.log('home component initialized.');
	}

	ngOnInit() {
		this.websocketService.connect(null, false);

		setInterval(() => {
			this.refreshTelemetryData();
		}, 500);

		this.refreshRocketInformation();
		let refreshRocketInterval = setInterval(() => {
			this.refreshRocketInformation();
		}, 50000);
	}

	private refreshTelemetryData() {
		this.rocketTelemetry = this.websocketService.data;

		if (this.rockets.length <= 0) return;

		this.rockets.forEach((roc: any) => {
			const host = roc.telemetry.host;
			const port = roc.telemetry.port;

			let wsinfo = this.websocketService.data.find((x: any) => x.port === port);
			if (wsinfo) {
				roc.altitude = wsinfo.altitude;
				roc.speed = wsinfo.speed;
				roc.thrust = wsinfo.thrust;
				roc.temperature = wsinfo.temperature;
				roc.acceleration = wsinfo.acceleration;
			}
		});
	}

	public refreshRocketInformation() {
		this.http.get('//localhost:5000/rockets', [{ name: 'X-API-Key', value: 'API_KEY_1' }], (data: any) => {
			console.log(data);
			this.rockets = data;

      if (this.selected){
        let rocket = this.rockets.find((x: any) => x.id === this.selected.id);
        this.selected = rocket;
      }
		});
	}

	rocketSelected($event: any, rocket: any) {
		console.log($event, rocket);
		this.selected = rocket;
	}

	deployRocket(rocketId: string) {
		this.http.put(
			'//localhost:5000/rocket/' + rocketId + '/status/deployed',
			[{ name: 'X-API-Key', value: 'API_KEY_1' }],
			(data: any) => {
				console.log(data);
				if (data === 304) {
					this.refreshRocketInformation();
				} else {
					var rocketIndex = this.rockets.findIndex((x: any) => x.id === rocketId);
          this.rockets[rocketIndex] = data;
					//console.log('roket bulundu:', this.rockets[rocketIndex]);
					this.selected = data;
					//console.log('roketler:', this.rockets);
				}
			},
			'json',
			(err: any) => {
        console.log('hataya girildi.',err);
				this.refreshRocketInformation();
        let rocket = this.rockets.find((x: any) => x.id === rocketId);
        this.selected = rocket;
			}
		);
	}

  launchRocket(rocketId: string) {
		this.http.put(
			'//localhost:5000/rocket/' + rocketId + '/status/launched',
			[{ name: 'X-API-Key', value: 'API_KEY_1' }],
			(data: any) => {
				console.log(data);
				if (data === 304) {
					this.refreshRocketInformation();
				} else {
					var rocketIndex = this.rockets.findIndex((x: any) => x.id === rocketId);
          this.rockets[rocketIndex] = data;
					//console.log('roket bulundu:', this.rockets[rocketIndex]);
					this.selected = data;
					//console.log('roketler:', this.rockets);
				}
			},
			'json',
			(err: any) => {
        console.log('hataya girildi.',err);
				this.refreshRocketInformation();

        
			}
		);
	}

  cancelLaunch(rocketId: string) {
		this.http.delete(
			'//localhost:5000/rocket/' + rocketId + '/status/launched',
			[{ name: 'X-API-Key', value: 'API_KEY_1' }],
			(data: any) => {
				console.log(data);
				if (data === 304) {
					this.refreshRocketInformation();
				} else {
					var rocketIndex = this.rockets.findIndex((x: any) => x.id === rocketId);
          this.rockets[rocketIndex] = data;
					//console.log('roket bulundu:', this.rockets[rocketIndex]);
					this.selected = data;
					//console.log('roketler:', this.rockets);
				}
			},
			'json',
			(err: any) => {
        console.log('hataya girildi.',err);
				this.refreshRocketInformation();
        let rocket = this.rockets.find((x: any) => x.id === rocketId);
        this.selected = rocket;
			}
		);
	}

	/* getTelemetryData(port: number) {
		let wsdata = this.websocketService.data.find((x: any) => x.port === port);
		return wsdata ? wsdata : this.rockets.find((x: any) => x.telemetry.port === port);
	} */
}
