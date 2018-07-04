import { Injectable } from '@angular/core';
import { END_POINT_URL } from '../app.module';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ListApplicationsService {

  constructor(private http: HttpClient) { }

  fetch() {
    return this.http.post(END_POINT_URL + '/message/ListApplications', {});
  }
}
