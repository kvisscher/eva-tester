import { Component, Input, OnInit } from '@angular/core';
import { IServiceResponse } from '../../services/service-selector.service';
import { listAnimation } from '../../shared/animations';
import { ITesterState } from '../tester/tester.component';

@Component({
  selector: 'eva-service-tester-info',
  templateUrl: './service-tester-info.component.html',
  styleUrls: ['./service-tester-info.component.scss'],
  animations: [listAnimation]
})
export class ServiceTesterInfoComponent implements OnInit {

  @Input() testerState: ITesterState;

  constructor() { }

  ngOnInit() {
  }

}
