import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { getCurrentUser, settings } from '@springtree/eva-sdk-redux';
import { filter, map, take, mergeMap } from 'rxjs/operators';
import { isNil } from 'lodash';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (!isNil(settings.userToken)) {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json',
          authorization: settings.userToken
        }
      });
    }

    return next.handle(request);
  }
}

export const tokenInterceptor = {
    provide: HTTP_INTERCEPTORS,
    useClass: TokenInterceptor,
    multi: true
};
