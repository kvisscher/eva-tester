import { Component } from '@angular/core';
import { ILoggable, Logger } from './decorators/logger';
import { ApplicationsService } from './services/applications.service';
import { StoreInitService } from './services/store-init.service';
import { ActivatedRoute, Params } from '@angular/router';
import { map, filter } from 'rxjs/operators';
import { EndPointUrlService } from './services/end-point-url.service';

@Logger
@Component({
  selector: 'eva-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements ILoggable {

  public logger: Partial<Console>;

  constructor(
    private $applicationService: ApplicationsService,
    private storeInitService: StoreInitService,
    private activatedRoute: ActivatedRoute,
    private $endPointUrlService: EndPointUrlService
  ) {
    if ( this.$applicationService.getSelected() ) {
      this.storeInitService.initializeStore();
    }

    this.activatedRoute.queryParamMap
    .pipe(
      map( paramsAsMap => paramsAsMap.get('endpoint') ),
      filter( Boolean ),
      filter( endPoint => {
        const differentEndPoint = endPoint !== this.$endPointUrlService.endPointUrl;

        this.logger.log(endPoint);
        this.logger.log(this.$endPointUrlService.endPointUrl);

        return differentEndPoint;
      } )
    )
    .subscribe( (endpoint: string) => {
      this.logger.log(endpoint);
      this.$endPointUrlService.onChange(endpoint);
    });
  }
}
