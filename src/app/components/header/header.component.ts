import { Component, HostListener, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { get, isNil } from 'lodash';
import { first, map, filter, withLatestFrom } from 'rxjs/operators';
import { ILoggable, Logger } from '../../decorators/logger';
import { ApplicationsService } from '../../services/applications.service';
import { slideUpDown } from '../../shared/animations';
import { login, store, getCurrentUser, logout, settings } from '@springtree/eva-sdk-redux';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ListServicesService } from '../../services/list-services.service';
import { Observable } from 'rxjs/Observable';

interface ILoginFormValue {
  username: string;
  password: string;
}

@Logger
@Component({
  selector: 'eva-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [ slideUpDown ]
})
export class HeaderComponent implements OnInit, ILoggable {

  public logger: Partial<Console>;

  public applications$ = this.$applications.fetch()
    .pipe(
      first(),
      map( response => response.Result )
    );

  public selectedApplicationId: number = get(this.$applications.getSelected(), 'ID');

  public get applicationIsSelected(): boolean {
    return !isNil(this.selectedApplicationId);
  }

  public get selectedApplication(): Promise<EVA.Core.Services.ApplicationDto> {
    return this.applications$.pipe(
      first(),
      map( apps => apps.find( potentialApp => potentialApp.ID === this.selectedApplicationId) )
    ).toPromise();
  }

  public get currentSessionId(): string {
    return settings.sessionId;
  }

  public loginForm = this.formBuilder.group({
    username: [null, Validators.required],
    password: [null, Validators.required]
  });

  /** Whether to show login controls or not */
  public showLoginForm = false;

  public user$ = getCurrentUser.getLoggedInUser$();

  public noUser$: Observable<boolean> = getCurrentUser.getState$().pipe(
    filter(state => !state.isFetching),
    withLatestFrom(getCurrentUser.getLoggedInUser$()),
    map(([_currentUser, currentLoggedInUser]) => !Boolean(currentLoggedInUser))
  );

  constructor(
    private $applications: ApplicationsService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private $listServices: ListServicesService
  ) { }

  ngOnInit() {
  }


  async applicationChange(newApplicationId: number ) {
    this.selectedApplicationId = newApplicationId;

    const newApplication = await this.selectedApplication;

    this.$applications.setSelected(newApplication);
  }

  logout() {
     const [action, fetchPromise] = logout.createFetchAction();

     store.dispatch(action);

     fetchPromise
      .then(() => this.snackBar.open('Logged out', null, {duration: 3000 }) )
      .catch(() => this.snackBar.open('Failed to logout', null, {duration: 3000 }) );
  }

  @HostListener('window:keydown.Escape') onEscapePress() {
    this.showLoginForm = false;
  }

  async onLoginFormSubmit(formValue: ILoginFormValue ) {
    const selectedApplication = await this.selectedApplication;

    const [action, fetchPromise] = login.createFetchAction({
      Username: formValue.username,
      Password: formValue.password,
      RegisterApiKey: true,
      SelectOrganizationByApplicationID: true,
      OrganizationUnitID: selectedApplication.OrganizationUnitID,
      ApplicationID: selectedApplication.ID
    });

    store.dispatch(action);

    fetchPromise.then( response => {

      switch ( response.Authentication ) {
        case 0:
          this.snackBar.open('Failed to login, try again', null, { duration: 3000 });
        break;
        case 2:
          this.snackBar.open(`Welcome ${response.User.FullName}`, null, {duration: 3000 });

          this.showLoginForm = false;
          // Refetching the services
          //
          this.$listServices.fetch();
        break;

        default:
          this.logger.warn('Resposne authentication unsupported value' + response.Authentication);
      }
    }).catch(() => {
      this.snackBar.open('Failed to login, try again', null, { duration: 3000 });
    });
  }

  createNewSessionId() {
    settings.sessionId = settings.generateSessionId();

    this.snackBar.open(`Session id changed to ${settings.sessionId}`, null, { duration: 3000 });
  }
}
