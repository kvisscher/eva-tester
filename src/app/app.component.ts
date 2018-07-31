import { Component } from '@angular/core';
import { getOrganizationUnit, listApplicationCultures, settings, store, getOrganizationUnitsForUser } from '@springtree/eva-sdk-redux';
import { isNil } from 'lodash';
import { defer } from 'rxjs/observable/defer';
import { filter, retry, retryWhen, tap } from 'rxjs/operators';
import { ILoggable, Logger } from './decorators/logger';
import { ListServicesService } from './services/list-services.service';
import { bootstrapStore, IEnvironment } from './shared/bootstrap-store';
import { ApplicationsService } from './services/applications.service';
import { EndPointUrlService } from './services/end-point-url.service';

@Logger
@Component({
  selector: 'eva-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements ILoggable {

  public logger: Partial<Console>;

  constructor(
    private $listServices: ListServicesService,
    private $applicationService: ApplicationsService,
    private $endPointUrlService: EndPointUrlService
  ) {
    if ( this.$applicationService.getSelected() ) {
      this.initializeStore();
    }
  }

  async initializeStore() {

    // We will subscribe to setting changes in case a user logs in or the session id is set
    //
    (settings.changes$)
      .pipe(
        filter(setting => setting.name === 'userToken' || setting.name === 'sessionId'),
        tap(setting => this.logger.log(`${setting.name} has changed from ${setting.old} to ${setting.new}`))
      )
      .subscribe(setting => {
        /** The new value we will be storing in local storage cannot be null or undefined. So we will default that to an empty string */
        const newValue = isNil(setting.new) ? '' : setting.new;

        localStorage.setItem(setting.name, newValue);
      });

    try {
      const env = await Promise.resolve({
        defaultToken: this.$applicationService.getSelected().AuthenticationToken,
        endPointURL: this.$endPointUrlService.endPointUrl
      } as IEnvironment);
      defer(() => bootstrapStore(env)).pipe(
        retryWhen(source => {
          return source.pipe(
            filter(data => data instanceof Response),
            filter((response: Response) => response.status === 403),
            tap(() => settings.userToken = null),
            tap(data => this.logger.warn('[403] Session expired, restarting bootstrap with userToken')),
            retry()
          );
        })
      )
      .subscribe({
        error: error => this.logger.error('error bootstraping store', error),
        next: () => {
          const actions = [
            listApplicationCultures.createFetchAction(),
            getOrganizationUnitsForUser.createFetchAction()
          ];

          actions.forEach( action => store.dispatch(action[0]) );

          const promises: Promise<any>[] = actions.map( action => {
            const promise = action[1];

            return promise;
          } );

          Promise.all(promises).then(() => this.$listServices.fetch() );
        }
      });
    } catch (e) {
      this.logger.error('failed to fetch environment file', e);
    }
  }
}
