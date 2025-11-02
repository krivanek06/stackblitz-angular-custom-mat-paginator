import { Directive, ElementRef, Renderer2, afterRenderEffect, inject, input, untracked } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';

/**
 * Works from angular-material version 15. since all classes got the new prefix 'mdc-'
 */
@Directive({
  selector: '[appBubblePagination]',
})
export class BubblePaginationDirective {
  private readonly matPag = inject(MatPaginator, {
    optional: true,
    self: true,
    host: true,
  });
  private readonly elementRef = inject(ElementRef);
  private readonly ren = inject(Renderer2);

  /**
   * whether we want to display first/last button and dots
   */
  readonly showFirstButton = input(true);
  readonly showLastButton = input(true);

  /**
   * total number of items in pagination
   * needed to calculate how many buttons to render
   * when page size changes
   */
  readonly paginationSize = input(0, {
    alias: 'appBubblePagination',
  });

  /**
   * how many buttons to display before and after
   * the selected button
   */
  readonly renderButtonsNumber = input(2);

  /**
   * references to DOM elements
   */
  private dotsEndRef!: HTMLElement;
  private dotsStartRef!: HTMLElement;
  private bubbleContainerRef!: HTMLElement;

  // remember rendered buttons on UI that we can remove them when page index change
  private buttonsRef: HTMLElement[] = [];

  readonly buildButtonsEffect = afterRenderEffect(() => {
    // rebuild buttons when pagination size change
    this.paginationSize();

    untracked(() => {
      // remove buttons before creating new ones
      this.removeButtons();

      // set some default styles to mat pagination
      this.styleDefaultPagination();

      // create bubble container
      this.createBubbleDivRef();

      // create all buttons
      this.buildButtons();

      // switch back to page 0
      this.switchPage(0);
    });
  });

  /**
   * change the active button style to the current one and display/hide additional buttons
   * based on the navigated index
   */
  private changeActiveButtonStyles(previousIndex: number, newIndex: number) {
    const previouslyActive = this.buttonsRef[previousIndex];
    const currentActive = this.buttonsRef[newIndex];

    if (!previouslyActive && !currentActive) {
      return;
    }

    // remove active style from previously active button
    if (previouslyActive) {
      this.ren.removeClass(previouslyActive, 'g-bubble__active');
    }

    // add active style to new active button
    this.ren.addClass(currentActive, 'g-bubble__active');

    // hide all buttons
    this.buttonsRef.forEach(button => this.ren.setStyle(button, 'display', 'none'));

    // show N previous buttons and X next buttons
    const renderElements = this.renderButtonsNumber();
    const endDots = newIndex < this.buttonsRef.length - renderElements - 1;
    const startDots = newIndex - renderElements > 0;

    const firstButton = this.buttonsRef[0];
    const lastButton = this.buttonsRef[this.buttonsRef.length - 1];

    // last bubble and dots
    if (this.showLastButton()) {
      this.ren.setStyle(this.dotsEndRef, 'display', endDots ? 'block' : 'none');
      this.ren.setStyle(lastButton, 'display', endDots ? 'flex' : 'none');
    }

    // first bubble and dots
    if (this.showFirstButton()) {
      this.ren.setStyle(this.dotsStartRef, 'display', startDots ? 'block' : 'none');
      this.ren.setStyle(firstButton, 'display', startDots ? 'flex' : 'none');
    }

    // resolve starting and ending index to show buttons
    const startingIndex = startDots ? newIndex - renderElements : 0;

    const endingIndex = endDots ? newIndex + renderElements : this.buttonsRef.length - 1;

    // display starting buttons
    for (let i = startingIndex; i <= endingIndex; i++) {
      const button = this.buttonsRef[i];
      this.ren.setStyle(button, 'display', 'flex');
    }
  }

  /**
   * Removes or change styling of some html elements
   */
  private styleDefaultPagination() {
    const nativeElement = this.elementRef.nativeElement;
    const itemsPerPage = nativeElement.querySelector('.mat-mdc-paginator-page-size');
    const howManyDisplayedEl = nativeElement.querySelector('.mat-mdc-paginator-range-label');
    const previousButton = nativeElement.querySelector('button.mat-mdc-paginator-navigation-previous');
    const nextButtonDefault = nativeElement.querySelector('button.mat-mdc-paginator-navigation-next');

    // remove 'items per page'
    if (itemsPerPage) {
      this.ren.setStyle(itemsPerPage, 'display', 'none');
    }

    // style text of how many elements are currently displayed
    if (howManyDisplayedEl) {
      this.ren.setStyle(howManyDisplayedEl, 'position', 'absolute');
      this.ren.setStyle(howManyDisplayedEl, 'color', '#919191');
      this.ren.setStyle(howManyDisplayedEl, 'font-size', '14px');
      this.ren.setStyle(howManyDisplayedEl, 'left', '-0');
    }

    // check whether to remove left & right default arrows
    this.ren.setStyle(previousButton, 'display', 'none');
    this.ren.setStyle(nextButtonDefault, 'display', 'none');
  }

  /**
   * creates `bubbleContainerRef` where all buttons will be rendered
   */
  private createBubbleDivRef(): void {
    const actionContainer = this.elementRef.nativeElement.querySelector('div.mat-mdc-paginator-range-actions');
    const nextButtonDefault = this.elementRef.nativeElement.querySelector('button.mat-mdc-paginator-navigation-next');

    // create a HTML element where all bubbles will be rendered
    this.bubbleContainerRef = this.ren.createElement('div') as HTMLElement;
    this.ren.addClass(this.bubbleContainerRef, 'g-bubble-container');

    // render element before the 'next button' is displayed
    this.ren.insertBefore(actionContainer, this.bubbleContainerRef, nextButtonDefault);
  }

  /**
   * helper function that builds all button and add dots
   * between the first button, the rest and the last button
   *
   * end result: (1) .... (4) (5) (6) ... (25)
   */
  private buildButtons(): void {
    if (!this.matPag) {
      return;
    }

    const neededButtons = Math.ceil(this.matPag.length / this.matPag.pageSize);

    // if there is only one page, do not render buttons
    if (neededButtons === 0 || neededButtons === 1) {
      this.ren.setStyle(this.elementRef.nativeElement, 'display', 'none');
      return;
    }

    // set back from hidden to block
    this.ren.setStyle(this.elementRef.nativeElement, 'display', 'block');

    // create first button
    this.buttonsRef = [this.createButton(0)];

    // add dots (....) to UI
    this.dotsStartRef = this.createDotsElement();

    // create all buttons needed for navigation (except the first & last one)
    for (let index = 1; index < neededButtons - 1; index++) {
      this.buttonsRef = [...this.buttonsRef, this.createButton(index)];
    }

    // add dots (....) to UI
    this.dotsEndRef = this.createDotsElement();

    // create last button to UI after the dots (....)
    this.buttonsRef = [...this.buttonsRef, this.createButton(neededButtons - 1)];
  }

  /**
   * Remove all buttons from DOM
   */
  private removeButtons(): void {
    this.buttonsRef.forEach(button => {
      this.ren.removeChild(this.bubbleContainerRef, button);
    });

    // remove dots
    if (this.dotsStartRef) {
      this.ren.removeChild(this.bubbleContainerRef, this.dotsStartRef);
    }
    if (this.dotsEndRef) {
      this.ren.removeChild(this.bubbleContainerRef, this.dotsEndRef);
    }

    // Empty state array
    this.buttonsRef.length = 0;
  }

  /**
   * create button HTML element
   */
  private createButton(i: number): HTMLElement {
    const bubbleButton = this.ren.createElement('div');
    const text = this.ren.createText(String(i + 1));

    // add class & text
    this.ren.addClass(bubbleButton, 'g-bubble');
    this.ren.setStyle(bubbleButton, 'margin-right', '8px');
    this.ren.appendChild(bubbleButton, text);

    // react on click
    this.ren.listen(bubbleButton, 'click', () => {
      this.switchPage(i);
    });

    // render on UI
    this.ren.appendChild(this.bubbleContainerRef, bubbleButton);

    // set style to hidden by default
    this.ren.setStyle(bubbleButton, 'display', 'none');

    return bubbleButton;
  }

  /**
   * helper function to create dots (....) on DOM indicating that there are
   * many more bubbles until the last one
   */
  private createDotsElement(): HTMLElement {
    const dotsEl = this.ren.createElement('span');
    const dotsText = this.ren.createText('.....');

    // add class
    this.ren.setStyle(dotsEl, 'font-size', '18px');
    this.ren.setStyle(dotsEl, 'margin-right', '8px');
    this.ren.setStyle(dotsEl, 'padding-top', '6px');
    this.ren.setStyle(dotsEl, 'color', '#919191');

    // append text to element
    this.ren.appendChild(dotsEl, dotsText);

    // render dots to UI
    this.ren.appendChild(this.bubbleContainerRef, dotsEl);

    // set style none by default
    this.ren.setStyle(dotsEl, 'display', 'none');

    return dotsEl;
  }

  /**
   * Helper function to switch page
   */
  private switchPage(i: number): void {
    if (!this.matPag) {
      return;
    }

    const previousPageIndex = this.matPag.pageIndex;

    // switch page index of mat paginator
    this.matPag.pageIndex = i;

    // change active button styles
    this.changeActiveButtonStyles(previousPageIndex, this.matPag.pageIndex);

    // need to trigger page event manually, because we are changing pageIndex programmatically
    this.matPag.page.emit({
      pageIndex: i,
      pageSize: this.matPag.pageSize,
      length: this.matPag.length,
      previousPageIndex: previousPageIndex,
    });
  }
}
