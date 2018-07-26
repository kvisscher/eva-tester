import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { AngularFusejsOptions } from 'angular-fusejs';
import { ListServicesService, IService } from '../../services/list-services.service';
import { debounceTime, tap, map } from 'rxjs/operators';
import { settings } from '@springtree/eva-sdk-redux';

interface IServicesFormValue {
  [type: string]: boolean;
}

@Component({
  selector: 'eva-services-selector',
  templateUrl: './services-selector.component.html',
  styleUrls: ['./services-selector.component.scss']
})
export class ServicesSelectorComponent implements OnInit {

  private readonly portNumber: number;

  public readonly services$ = this.$listServices.services$.pipe(
    tap( services => {
      // Creating form controls for every service
      //
      services.forEach( service => {
        this.servicesForm.addControl( service.type, this.formBuilder.control(false) );
      });
    })
  );

  public readonly loading$ = this.services$.pipe(
    map( services => services.length === 0  )
  );

  public searchOptions: AngularFusejsOptions = {
    keys: ['name'],
    maximumScore: 0.5,
    shouldSort: true
  };

  public searchForm = this.formBuilder.group({
    search: [null]
  });

  public servicesForm = this.formBuilder.group({ });

  searchTerms: string;

  public get reducerIsSelected(): boolean {
    const reducerIsSelected = Object.keys(this.servicesForm.value)
      .filter(el => this.servicesForm.value[el] === true)
      .some(Boolean);

    return reducerIsSelected;
  }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private $listServices: ListServicesService
  ) {
    this.portNumber = this.route.snapshot.params['portNumber'];

    this.searchForm.get('search')
    .valueChanges
    .pipe( debounceTime(300) )
    .subscribe((value: string) => {
      this.searchTerms = value;
    });
  }

  ngOnInit() {
  }

  createServices(values: IServicesFormValue) {
    /** The service types the user chose */
    const serviceTypes: string[] = Object.keys(values)
      .filter( el => values[el] === true );

    /** The entire service meta data the user chose, we want as much meta data about the service as possible */
    const services: IService[] = this.$listServices.services$.value.filter( service => {
      return serviceTypes.includes(service.type);
    });

    this.http.post(`http://localhost:${this.portNumber}/create`, {
      services: services,
      userToken: settings.userToken
     }).subscribe(() => {

    });
  }

  stopPropagation(mouseEvent: MouseEvent) {
    mouseEvent.stopPropagation();
  }

  programmaticallySelectFormControl(type: string) {
    const control = this.servicesForm.controls[type];

    const newValue = !control.value as boolean;

    control.setValue(newValue);
  }

}
