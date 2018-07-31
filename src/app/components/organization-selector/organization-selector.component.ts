import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { getOrganizationUnitsForUser, login, settings, store } from '@springtree/eva-sdk-redux';
import { map, first, delay, pairwise, filter, takeUntil } from 'rxjs/operators';
import isNotNil from '../../shared/operators/is-not-nil';
import { Logger, ILoggable } from '../../decorators/logger';
import { Subject } from 'rxjs/Subject';
import { MatSnackBar } from '@angular/material';

@Logger
@Component({
  selector: 'eva-organization-selector',
  templateUrl: './organization-selector.component.html',
  styleUrls: ['./organization-selector.component.scss']
})
export class OrganizationSelectorComponent implements OnInit, ILoggable, OnDestroy {
  logger: Partial<Console>;

  private _selectedOrganization: EVA.Core.OrganizationUnitDto;

  private get selectedOrganization(): EVA.Core.OrganizationUnitDto {
    return this._selectedOrganization || JSON.parse(localStorage.getItem('selectedOrganization'));
  }

  private set selectedOrganization(newselectedOrganization: EVA.Core.OrganizationUnitDto) {
    this._selectedOrganization = newselectedOrganization;

    localStorage.setItem('selectedOrganization', JSON.stringify(newselectedOrganization));
  }


  public form: FormGroup = this.fb.group({
    organization: []
  });

  public organizations$ = getOrganizationUnitsForUser.getResponse$().pipe(
    isNotNil(),
    map( res => res.Result )
  );

  public stop$ = new Subject<void>();

  constructor(public fb: FormBuilder, private snackbar: MatSnackBar) { }

  ngOnInit() {

    if ( this.selectedOrganization ) {
      // If an organization was already selected, lets ensure the UI represents that
      //
      this.form.get('organization').setValue(this.selectedOrganization.ID, { emitEvent: false });
    }

    this.form.get('organization').valueChanges
    .pipe(
      delay(500)
    )
    .subscribe(async (newOrganizationId) => {
      this.switchOrganization(newOrganizationId);
    });

    // If someone selects an organizatio somewhere else, we want the change to be reflected in the form
    //
    login.getRequest$().pipe(
      isNotNil(),
      map( request => request.OrganizationUnitID ),
      filter(organizationUnitId => organizationUnitId !== this.form.get('organization').value as number ),
      takeUntil(this.stop$)
    ).subscribe( organizationUnitId => {
      this.form.get('organization').setValue(organizationUnitId, { emitEvent: false });
    });
  }

  async switchOrganization(newOrganizationId: number) {

    const confirmed = confirm('Are you sure you want to switch organization?');

    if ( !confirmed ) {
      // Resetting control value
      //
      this.form.get('organization').setValue(this.selectedOrganization.ID, { emitEvent: false });
      return;
    }

    const organizations = await this.organizations$.pipe(first()).toPromise();

    const selectedOrganization = organizations.find(organization => organization.ID === newOrganizationId);

    const [action, fetchPromise] = login.createFetchAction({
      AuthenticationToken: settings.userToken,
      OrganizationUnitID: newOrganizationId
    });

    store.dispatch(action);

    try {
      await fetchPromise;

      this.selectedOrganization = selectedOrganization;

      this.snackbar.open(`Switched to ${selectedOrganization.Name}`, null, {duration: 3000});

    } catch (e) {
      this.logger.error('error switching organization...', e);
    }
  }

  ngOnDestroy(): void {
    this.stop$.next();
  }

}
