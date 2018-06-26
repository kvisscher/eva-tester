import { Injectable } from '@angular/core';
import { END_POINT_URL } from '../app.module';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ListApplicationsService {

  constructor(private http: HttpClient) { }

  async fetch() {

    this.http.get(END_POINT_URL + 'tester/api/services');
  }
}
