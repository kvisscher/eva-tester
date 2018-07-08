import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { END_POINT_URL } from '../app.module';
import { Logger, ILoggable } from '../decorators/logger';

@Logger
@Injectable()
export class ListServicesService implements ILoggable {
  public logger: Partial<Console>;

  constructor(private http: HttpClient) {}

  fetch() {
    return this.http.get(END_POINT_URL + '/tester/api/services');
  }
}
