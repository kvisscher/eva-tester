import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TYPINGS_END_POINT } from './eva-typings.service';

@Injectable()
export class ServiceSelectorService {

  constructor(private http: HttpClient ) { }

  fetch( serviceType: string ) {
    return this.http.get(TYPINGS_END_POINT + '/tester/api/services/' + serviceType);
  }
}
