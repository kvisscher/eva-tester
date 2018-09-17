import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { IListServiceItem } from '../../services/list-services.service';
import { IServiceResponse, ServiceSelectorService } from '../../services/service-selector.service';
import uuid from '../../shared/random-id';
import { TEditorContainerState } from '../service-tester/service-tester.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import isRequired from '../../decorators/is-required';
import { IServiceChangePayload } from '../../pages/tester-container/tester-container.component';

/** Represents an editor tab */
export interface ITesterState {
  listMetaData: IListServiceItem;
  detailMetaData: Observable<IServiceResponse>;
  tabName: string;
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
    tabName: 'Service',
    editorModel: null,
    response: null,
    detailMetaData: null,
    listMetaData: null
  }];

  @Input()
  @isRequired
  selectedService$: BehaviorSubject<IServiceChangePayload>;

  public selectedTabIndex = 0;

  constructor(private $serviceSelector: ServiceSelectorService) {}

  ngOnInit(): void {
    this.selectedService$.subscribe( serviceChangePayload => {
      if ( serviceChangePayload.newTab ) {
        this.addTab();
      }

      this.selectedServices[this.selectedTabIndex] = {
        tabName: serviceChangePayload.service.name,
        detailMetaData: this.$serviceSelector.fetch(serviceChangePayload.service.type),
        listMetaData: serviceChangePayload.service,
        editorModel: null,
        response: null
      };
    });
  }

  public addTab() {
    this.selectedServices.push({
      tabName: null,
      response: null,
      detailMetaData: null,
      editorModel: null,
      listMetaData: null
    });

    this.selectedTabIndex = this.selectedServices.length - 1;
  }

  selectedServiceChange(serviceName: IListServiceItem, index: number) {
    this.selectedServices[index].tabName = serviceName.name;
  }

  updateServicesState(editorContainerState: TEditorContainerState, selectedTabIndex: number) {
    this.selectedServices[selectedTabIndex].editorModel = editorContainerState.editorModel;
    this.selectedServices[selectedTabIndex].response = editorContainerState.response;
  }

}
