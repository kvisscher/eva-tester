import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { getCurrentUser } from '@springtree/eva-sdk-redux';
import { map, filter, take } from 'rxjs/operators';
import { isNil } from 'lodash';
import { END_POINT_URL } from '../app.module';

@Injectable()
export class ListServicesService {

  constructor(private http: HttpClient) { }

  async fetch() {
    const authorization = await getCurrentUser.getResponse$().pipe(
      filter( response => !isNil(response)),
      map(response => response.User.AuthenticationToken),
      take(1)
    ).toPromise();

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        authorization
      })
    };

    this.http.get(END_POINT_URL + 'tester/api/services', httpOptions);
  }
}
