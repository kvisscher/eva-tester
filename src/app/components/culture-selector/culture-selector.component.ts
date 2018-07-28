import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { listApplicationCultures } from '@springtree/eva-sdk-redux';
import { map, first } from 'rxjs/operators';
import isNotNil from '../../shared/operators/is-not-nil';

@Component({
  selector: 'eva-culture-selector',
  templateUrl: './culture-selector.component.html',
  styleUrls: ['./culture-selector.component.scss']
})
export class CultureSelectorComponent implements OnInit {
  private _selectedCulture: EVA.PIM.Core.ListApplicationContentCulture;

  private get selectedCulture(): EVA.PIM.Core.ListApplicationContentCulture {
    return this._selectedCulture || JSON.parse(localStorage.getItem('selectedCulture'));
  }

  private set selectedCulture(newSelectedCulture: EVA.PIM.Core.ListApplicationContentCulture) {
    this._selectedCulture = newSelectedCulture;

    localStorage.setItem('selectedCulture', JSON.stringify(newSelectedCulture));
  }


  public cultures$ = listApplicationCultures.getResponse$().pipe(
    isNotNil(),
    map( res =>  res.Result )
  );

  public form: FormGroup = this.fb.group({
    culture: []
  });

  constructor(public fb: FormBuilder) { }

  async ngOnInit() {
    if (this.selectedCulture) {

      const cultures = await this.cultures$.pipe(first()).toPromise();

      // While we have the culture locally, its not the same object as the objects being rendered in the view
      // so we will find for teh matching culture on 'Culture'
      //
      const matchingCulture = cultures.find( culture => culture.Culture === this.selectedCulture.Culture );

      // If an organization was already selected, lets ensure the UI represents that
      //
      this.form.get('culture').setValue(matchingCulture, { emitEvent: false });
    }


    this.form.get('culture').valueChanges.subscribe(newCulture => {
      this.selectedCulture = newCulture;
    });

  }

  public getCultureKey(): string | null {
    if ( this.selectedCulture ) {
      return this.selectedCulture.Culture;
    } else {
      return null;
    }
  }

}
