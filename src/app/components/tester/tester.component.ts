import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AngularFusejsOptions } from 'angular-fusejs';
import { debounceTime } from '../../../../node_modules/rxjs/operators';
import { IListServiceItem, ListServicesService } from '../../services/list-services.service';
import { ServiceSelectorService } from '../../services/service-selector.service';

@Component({
  selector: 'eva-tester',
  templateUrl: './tester.component.html',
  styleUrls: ['./tester.component.scss']
})
export class TesterComponent implements OnInit {

  public readonly services$ = this.$listServices.services$;

  public searchOptions: AngularFusejsOptions = {
    keys: ['name', 'ns'],
    maximumScore: 0.5,
    shouldSort: true
  };

  public searchForm = this.formBuilder.group({
    search: [null]
  });

  searchTerms: string;

  @Output() selectedServiceChange = new EventEmitter<IListServiceItem>();

  private _selectedService: IListServiceItem;

  public get selectedService(): IListServiceItem {
    return this._selectedService;
  }

  public set selectedService(value: IListServiceItem) {
    this._selectedService = value;

    this.selectedServiceChange.emit(value);
  }

  constructor(
    private $listServices: ListServicesService,
    private formBuilder: FormBuilder,
    private $serviceSelector: ServiceSelectorService
  ) {
    this.searchForm.get('search').valueChanges.pipe(debounceTime(500)).subscribe( (value: string) => {
      this.searchTerms = value;
    });
  }

  ngOnInit() { }

  /** Whenever a service is selected, we will fetch it and create a code template */
  selectService(service: IListServiceItem) {
    this.selectedService = service;
  }
}
