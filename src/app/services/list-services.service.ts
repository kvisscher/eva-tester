import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { END_POINT_URL } from '../app.module';
import { Logger, ILoggable } from '../decorators/logger';
import { first } from '../../../node_modules/rxjs/operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export interface IListServiceItem {
  name: string;
  ns: string;
  type: string;
}

interface ISericesResponse {
  services: IListServiceItem[];
}

@Logger
@Injectable()
export class ListServicesService implements ILoggable {
  public logger: Partial<Console>;

  public services$ = new BehaviorSubject<IListServiceItem[]>([]);

  constructor(private http: HttpClient) {}

  fetch() {
    this.http.get<ISericesResponse>(END_POINT_URL + '/tester/api/services')
      .pipe( first() )
      .subscribe( serviceResponse => this.services$.next(serviceResponse.services) );
  }

}
