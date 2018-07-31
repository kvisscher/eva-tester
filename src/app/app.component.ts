import { Component } from '@angular/core';
import { ILoggable, Logger } from './decorators/logger';
import { ApplicationsService } from './services/applications.service';
import { StoreInitService } from './services/store-init.service';

@Logger
@Component({
  selector: 'eva-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements ILoggable {

  public logger: Partial<Console>;

  constructor(
    private $applicationService: ApplicationsService,
    private storeInitService: StoreInitService
  ) {
    if ( this.$applicationService.getSelected() ) {
      this.storeInitService.initializeStore();
    }
  }
}
