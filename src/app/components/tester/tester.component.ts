import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AngularFusejsOptions } from 'angular-fusejs';
import { debounceTime } from '../../../../node_modules/rxjs/operators';
import { EvaTypingsService } from '../../services/eva-typings.service';
import { IListServiceItem, ListServicesService } from '../../services/list-services.service';
import { ServiceSelectorService, IServiceResponse } from '../../services/service-selector.service';

@Component({
  selector: 'eva-tester',
  templateUrl: './tester.component.html',
  styleUrls: ['./tester.component.scss']
})
export class TesterComponent implements OnInit {

  public readonly services$ = this.$listServices.services$;

  public searchOptions: AngularFusejsOptions = {
    keys: ['name'],
    maximumScore: 0.5
  };

  public searchForm = this.formBuilder.group({
    search: [null]
  });

  public uniqueURI = `index-${Math.random()}.ts`;

  searchTerms: string;

  selectedService: IServiceResponse;

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
    this.$serviceSelector.fetch(service.type).subscribe( (value) => {
      this.selectedService = value;
    });
  }
}
