import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { delay, retry } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class WebSocketService {
	private webSocketSubject$!: WebSocketSubject<string>;
	public isConnected: boolean = false;
	private serviceURL: string = '//localhost:5001';
	private sslKullan: boolean = false;
	private channels: any = [];
	public data: any;

	constructor() {}

	public sendMessage(msg: string): void {
		if (this.isConnected) {
			this.webSocketSubject$.next(msg);
		} else {
			console.error('WebSocket is closed, message not sent');
		}
	}

	public listenMessage(): Observable<string> {
		return this.webSocketSubject$.asObservable();
	}

	public connect(channels: any, sslKullan: boolean, reconnectInterval: number = 250, reconnectAttempts: number = 15): void {
		if (this.isConnected) return;

		this.channels = this.channels.concat(channels);

		this.sslKullan = sslKullan;
		this.createWebSocketSubject();
		this.subscribeToSubject(reconnectInterval, reconnectAttempts);
	}

	public disconnect(): void {
		this.webSocketSubject$.complete();
	}

	private createWebSocketSubject(): void {
		this.webSocketSubject$ = new WebSocketSubject({
			url: (this.sslKullan ? 'wss:' : 'ws:') + this.serviceURL,
			openObserver: {
				next: () => {
					this.isConnected = true;
					//this.aboneOl(this.channels);
				},
			},
			closeObserver: {
				next: () => {
					this.isConnected = false;
					this.data = [];
				},
			},
			serializer: (msg: string) => msg,
		});
	}

	private subscribeToSubject(reconnectInterval: number, reconnectAttempts: number): void {
		this.webSocketSubject$.pipe(retry(reconnectAttempts), delay(reconnectInterval)).subscribe({
			next: (msg) => this.processMessages(msg) /* console.log('message received:', msg) */,
			error: (err) => {
				//console.error(err);
			},
			complete: () => console.log('complete'),
		});
	}

	private processMessages(data: any): void {
		//console.log(data);
		this.data = data;
	}
}
