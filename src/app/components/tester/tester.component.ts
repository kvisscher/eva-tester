import { Component, OnInit } from '@angular/core';
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
    keys: ['name'],
    maximumScore: 0.5,
    shouldSort: true
  };

  public searchForm = this.formBuilder.group({
    search: [null]
  });

  searchTerms: string;

  selectedService: IListServiceItem;

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
