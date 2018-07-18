import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'eva-tester-tabs',
  templateUrl: './tester-tabs.component.html',
  styleUrls: ['./tester-tabs.component.scss']
})
export class TesterTabsComponent implements OnInit {

  public tabs = ['Service 1', 'Service 2', 'Service 3'];

  constructor() { }

  ngOnInit() {
  }

}
