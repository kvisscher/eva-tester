import { Component, HostListener } from '@angular/core';
import { getOrganizationUnit, listApplicationCultures, login, settings, store } from '@springtree/eva-sdk-redux';
import { isEmpty, isNil } from 'lodash';
import { defer } from 'rxjs/observable/defer';
import { filter, first, retry, retryWhen, tap } from 'rxjs/operators';
import { NgxEditorModel } from './components/editor';
import { ILoggable, Logger } from './decorators/logger';
import { EvaTypingsService } from './services/eva-typings.service';
import { ListServicesService } from './services/list-services.service';
import { bootstrapStore, IEnvironment } from './shared/bootstrap-store';

@Logger
@Component({
  selector: 'eva-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements ILoggable {

  public logger: Partial<Console>;

  code = [
  'interface IFoo {',
  '  name: string',
  '}',
  ].join('\n');

  jsonCode = [
  '{',
  '}'
].join('\n');

  model: NgxEditorModel = {
    value: this.jsonCode,
    language: 'json',
    uri: 'internal://server/foo.json'
  };

  options = {
    theme: 'vs-dark'
  };

  constructor(
    private $evaTypings: EvaTypingsService,
    private $listServices: ListServicesService) {
    // You want to fetch the typings and store them somewhere (indexdb, localstorage?), after doing so
    // you want the editor to use those typings as part of the code.
    //

    this.initializeStore();
  }

  monacoLoad() {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas: [{
        uri: null,
        fileMatch: ['foo.json'],
        schema: {
          type: 'object',
          properties: {
            p1: {
              enum: ['v1', 'v2']
            }
          }
        }
      }]
    });
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
        defaultToken: 'CECD606DF7FDEF93D751978346C36A43A07B53D3D5694BDCBC6DA6596A4CBCFD',
        endPointURL: 'https://api.test.eva-online.cloud'
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
          [
            login.createFetchAction({
              Username: 'eva@springtree.nl',
              Password: 'Spring2017',
              RegisterApiKey: true,
              SelectOrganizationByApplicationID: true,
              OrganizationUnitID: 985, // <= comes from list application
              ApplicationID: 13 // <== comes from list application
            }),
            listApplicationCultures.createFetchAction(),
            getOrganizationUnit.createFetchAction({
              OrganizationUnitID: 985
            }), // <== needs to be replaced by a getOrganizationUnitForUser
          ].forEach((action, index) => {
            if ( !isEmpty(settings.userToken) && index === 0 ) {
              // If we already have a user token, return early
              //
              return;
            }
            store.dispatch(action[0]);
          });

          this.$listServices.fetch().pipe(first()).subscribe();
        }
      });
    } catch (e) {
      this.logger.error('failed to fetch environment file');
    }
  }

  @HostListener('window:keyup.shift.p', ['$event']) shiftP(e: KeyboardEvent) {
    e.preventDefault();

    this.logger.log('open spotlight');
  }
}
