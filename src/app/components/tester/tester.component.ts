import { Component, OnInit, Input } from '@angular/core';
import { IListServiceItem } from '../../services/list-services.service';
import { ServiceSelectorService, IServiceResponse } from '../../services/service-selector.service';
import { Observable } from 'rxjs/Observable';
import uuid from '../../shared/random-id';

/** Represents an editor tab */
export interface ITesterState {
  listMetaData: IListServiceItem;
  detailMetaData: Observable<IServiceResponse>;
  id: string;
  name: string;
  editorModel: string;
  response: string;
}

@Component({
  selector: 'eva-tester',
  templateUrl: './tester.component.html',
  styleUrls: ['./tester.component.scss']
})
export class TesterComponent implements OnInit {

  public selectedServices: Partial<ITesterState>[] = [{
    name: 'Service',
    editorModel: null,
    response: null,
    id: null,
    detailMetaData: null,
    listMetaData: null
  }];

  private _selectedService: IListServiceItem;

  public get selectedService(): IListServiceItem {
    return this._selectedService;
  }
  @Input()
  public set selectedService(value: IListServiceItem) {
    this._selectedService = value;

    this.selectedServices[this.selectedTabIndex] = {
      name: value.name,
      detailMetaData: this.$serviceSelector.fetch(value.type),
      listMetaData: value,
      editorModel: null,
      id: uuid(),
      response: null
    };
  }

  public selectedTabIndex = 0;

  constructor(private $serviceSelector: ServiceSelectorService) {}

  ngOnInit(): void {

  }

  public addTab() {
    this.selectedServices.push({
      name: null,
      id: uuid(),
      response: null,
      detailMetaData: null,
      editorModel: null,
      listMetaData: null
    });

    this.selectedTabIndex = this.selectedServices.length;
  }

  selectedServiceChange(serviceName: IListServiceItem, index: number) {
    this.selectedServices[index].name = serviceName.name;
  }

  onTabChange(index: number) {

  }

}
