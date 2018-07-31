import { Injectable } from '@angular/core';
import { getOrganizationUnitsForUser, listApplicationCultures, settings, store } from '@springtree/eva-sdk-redux';
import { isNil } from 'lodash';
import { defer } from 'rxjs/observable/defer';
import { filter, retry, retryWhen, tap } from 'rxjs/operators';
import { bootstrapStore, IEnvironment } from '../shared/bootstrap-store';
import { Logger, ILoggable } from '../decorators/logger';
import { ApplicationsService } from './applications.service';
import { ListServicesService } from './list-services.service';
import { EndPointUrlService } from './end-point-url.service';

@Logger
@Injectable()
export class StoreInitService implements ILoggable {

  logger: Partial<Console>;


   constructor(
    private $applicationService: ApplicationsService,
    private $endPointUrlService: EndPointUrlService,
    private $listServices: ListServicesService
   ) { }

    /** You only want to init the store if there is an application selected */
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

          Promise.all(promises)
            .then(() => this.$listServices.fetch() )
            .catch(err => console.error(err));
        }
      });
    } catch (e) {
      this.logger.error('failed to fetch environment file', e);
    }
  }

}
