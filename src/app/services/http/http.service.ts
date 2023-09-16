import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { retry, catchError, take } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class HttpService {
	constructor(private http: HttpClient, private router: Router) {}

	//private _baseUrl = isDevMode() ? '//' + window.location.host + '/' : '';

	get(url: string, header?: object[] | null, callback?: any, rspType?: any, errCallback?: any): any {
		let hdr = new HttpHeaders();
		hdr = hdr.append('Cache-Control', 'no-cache');
		if (header) {
			header.forEach((hd: any) => {
				hdr = hdr.append(hd.name, hd.value);
			});
		}

		return this.http
			.get<any>(url, { observe: 'response', responseType: rspType ? rspType : 'json', headers: hdr })
			.pipe(retry(20))
			.subscribe({
				next: (data: any) => {
					console.log(data);
					switch (data.status) {
						case 200:
							if (callback) callback(data.body);
							break;
					}
				},
				error: (error: any) => {
					//console.error(error);
					if (errCallback) errCallback(error);
				},
				complete: () => {},
			});
	}

	put(url: string, header?: object[] | null, callback?: any, rspType?: any, errCallback?: any): any {
		let hdr = new HttpHeaders();
		hdr = hdr.append('Cache-Control', 'no-cache');
		if (header) {
			header.forEach((hd: any) => {
				hdr = hdr.append(hd.name, hd.value);
			});
		}

		return this.http
			.put<any>(url, '', { observe: 'response', responseType: rspType ? rspType : 'json', headers: hdr })
			.pipe(retry(5))
			.subscribe({
				next: (data: any) => {
					console.log(data);
					switch (data.status) {
						case 200:
							if (callback) callback(data.body);
							break;
						case 304:
							console.log('304 hatası');
							if (callback) callback(304);
							break;
					}
				},
				error: (error: any) => {
					console.error('put hata verdi',error);
					if (errCallback) errCallback(error);
				},
				complete: () => {},
			});
	}

	delete(url: string, header?: object[] | null, callback?: any, rspType?: any, errCallback?: any): any {
		let hdr = new HttpHeaders();
		hdr = hdr.append('Cache-Control', 'no-cache');
		if (header) {
			header.forEach((hd: any) => {
				hdr = hdr.append(hd.name, hd.value);
			});
		}

		return this.http
			.delete<any>(url, { observe: 'response', responseType: rspType ? rspType : 'json', headers: hdr })
			.pipe(retry(5))
			.subscribe({
				next: (data: any) => {
					console.log(data);
					switch (data.status) {
						case 200:
							if (callback) callback(data.body);
							break;
						case 304:
							if (callback) callback(304);
							break;
					}
				},
				error: (error: any) => {
					//console.error(error);
					if (errCallback) errCallback(error);
				},
				complete: () => {},
			});
	}

	public post(url: string, params: object | [] | null, header?: object[] | null, callback?: any, rspType?: any, errCallback?: any): any {
		let hdr = new HttpHeaders();
		if (header) {
			header.forEach((hd: any) => {
				hdr = hdr.append(hd.name, hd.value);
			});
		}

		return this.http
			.post<any>(url, JSON.stringify(params), { observe: 'response', responseType: rspType ? rspType : 'json', headers: hdr })
			.pipe(retry(20))
			.subscribe({
				next: (data: any) => {
					if (callback) callback(data.body);
				},
				error: (error: any) => {
					console.error(error);
					if (errCallback) errCallback(error);
				},
				complete: () => {},
			});
	}
}
