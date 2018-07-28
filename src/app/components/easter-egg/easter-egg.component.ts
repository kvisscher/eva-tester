import { Component, HostListener, OnInit, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { sample } from 'lodash';

@Component({
  selector: 'eva-easter-egg-dialog',
  template: `
    <a href="https://www.ah.nl/zoeken?rq=m%26m&searchType=product" target="_blank">You know whats up 😏</a>
  `,
})
export class EasterEggDialogComponent {

  @HostListener('click') onclick() {
    this.dialogRef.close();
  }

  constructor(
    public dialogRef: MatDialogRef<EasterEggDialogComponent>,
  ) { }
}


@Component({
  selector: 'eva-easter-egg',
  templateUrl: './easter-egg.component.html',
  styleUrls: ['./easter-egg.component.scss']
})
export class EasterEggComponent implements OnInit {

  public weights = [200, 255, 300, 374, 440, 1000];

  @HostBinding('style.left.%') left = 0;

  @HostBinding('style.display') display = 'none';

  @HostListener('click') onclick() {
    const dialog = this.dialog.open(EasterEggDialogComponent);

    dialog.afterClosed().subscribe(() => this.display = 'none' );
  }

  constructor(public dialog: MatDialog) { }


  ngOnInit() {
    const randomWeight = sample(this.weights);

    // BINGO, a kilo of m&ms, Lets show the alert
    //
    if ( randomWeight === 1000 ) {
      this.setupEasterEgg();
    }

  }

  setupEasterEgg() {
    // Safety check around request idle callback as it only has 70% browser support as of writing now
    // @see https://caniuse.com/#search=requestIdleCallback
    //
    if ((window as any).requestIdleCallback) {
      const requestIdleCallback = (window as any).requestIdleCallback;

      // We only want to show the easter egg if the browser is idle
      //
      requestIdleCallback(() => {

        // If we never shown the easter egg, we will show it. Otherwise we never will.
        // This is a special easter egg
        //
        if (!window.localStorage.getItem('easter-egg-shown')) {
          this.display = 'block';
          window.localStorage.setItem('easter-egg-shown', 'true');
          this.move();
        }
      });
    }
  }

  move = () => {
    if ( this.left < 80 ) {
      this.left++;
      window.requestAnimationFrame(this.move);
    }
  }

}

