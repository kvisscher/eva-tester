import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { finalize, shareReplay } from 'rxjs/operators';
import { EndPointUrlService } from './end-point-url.service';
import { IListServiceItem } from './list-services.service';
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

  fetch( serviceType: string ): Observable<IServiceResponse> {
    const stream$ = this.http.get<IServiceResponse>(this.$endPointUrlService.endPointUrl + '/tester/api/services/' + serviceType)
      .pipe(
        shareReplay()
      );

    return stream$;
  }
}
