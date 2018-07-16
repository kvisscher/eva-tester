import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AngularFusejsOptions } from 'angular-fusejs';
import { debounceTime } from '../../../../node_modules/rxjs/operators';
import { ListServicesService } from '../../services/list-services.service';

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

  searchTerms: string;

  constructor(
    private $listServices: ListServicesService,
    private formBuilder: FormBuilder
  ) {
    this.$listServices.fetch();

    this.searchForm.get('search').valueChanges.pipe(debounceTime(500)).subscribe( (value: string) => {
      this.searchTerms = value;
    });
  }

  ngOnInit() {
  }

  selectService() {

  }

}
