import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { TestTableComponent } from './test-table.component';

@Component({
  selector: 'app-root',
  imports: [TestTableComponent],
  template: `
    <div class="wrapper">
      <app-test-table />
    </div>
  `,
  styles: [
    `
      .wrapper {
        width: 80%;
        margin: auto;
        padding-top: 50px;
      }
    `,
  ],
})
export class App {}

bootstrapApplication(App);
