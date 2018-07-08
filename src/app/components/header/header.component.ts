import { Component, OnInit } from '@angular/core';
import { ApplicationsService } from '../../services/applications.service';
import { first, map } from 'rxjs/operators';

@Component({
  selector: 'eva-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public applications$ = this.$application.fetch()
    .pipe(
      first(),
      map( response => response.Result )
    );

  public selectedApplication: EVA.Core.Services.ApplicationDto = this.$application.getSelected();

  constructor(private $application: ApplicationsService) { }

  ngOnInit() {
  }


  applicationChange(newApplication: EVA.Core.Services.ApplicationDto ) {
    this.selectedApplication = newApplication;
  }
}
