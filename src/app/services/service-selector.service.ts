import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IListServiceItem } from './list-services.service';
import { END_POINT_URL } from '../app.module';
export interface IServiceResponse {
  description: string;
  request: IServiceResponseField;
  response: IServiceResponseField;
  routes: {
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
    path: string;
  };
  security: {
    requiredFunctionalities: Array<{
      functionality: string;
      scope: string
    }>,
    requiresAuthentication: boolean;
    requiredUserType: string[]
  };
}
interface IServiceResponseField extends IListServiceItem {
  description: string;
  fields: IServiceResponseField[];
  optional: boolean;
}

@Injectable()
export class ServiceSelectorService {

  constructor(private http: HttpClient ) { }

  fetch( serviceType: string ) {
    return this.http.get<IServiceResponse>(END_POINT_URL + '/tester/api/services/' + serviceType);
  }
}
