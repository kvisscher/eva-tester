import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IListServiceItem } from './list-services.service';
import { EndPointUrlService } from './end-point-url.service';
export interface IServiceResponse {
  description: string;
  request: IServiceResponseField;
  response: IServiceResponseField;
  routes: Array<{
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
    path: string;
  }>;
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

  constructor(private http: HttpClient, private $endPointUrlService: EndPointUrlService) { }

  fetch( serviceType: string ) {
    return this.http.get<IServiceResponse>(this.$endPointUrlService.endPointUrl + '/tester/api/services/' + serviceType);
  }
}
