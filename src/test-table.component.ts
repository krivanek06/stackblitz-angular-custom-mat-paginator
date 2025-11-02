import { afterNextRender, ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BubblePaginationDirective } from './bubble-pagination.directive';

type Data = { position: number; name: string; weight: number; symbol: string };

@Component({
  selector: 'app-test-table',
  imports: [MatTableModule, MatPaginatorModule, BubblePaginationDirective],
  host: { ngSkipHydration: 'true' },
  template: `
    <table mat-table [dataSource]="dataSource">
      <!-- Position Column -->
      <ng-container matColumnDef="position">
        <th mat-header-cell *matHeaderCellDef>No.</th>
        <td mat-cell *matCellDef="let element">{{ element.position }}</td>
      </ng-container>

      <!-- Name Column -->
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let element">{{ element.name }}</td>
      </ng-container>

      <!-- Weight Column -->
      <ng-container matColumnDef="weight">
        <th mat-header-cell *matHeaderCellDef>Weight</th>
        <td mat-cell *matCellDef="let element">{{ element.weight }}</td>
      </ng-container>

      <!-- Symbol Column -->
      <ng-container matColumnDef="symbol">
        <th mat-header-cell *matHeaderCellDef>Symbol</th>
        <td mat-cell *matCellDef="let element">{{ element.symbol }}</td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>

    <mat-paginator
      [appBubblePagination]="dataSource.data.length"
      (page)="onPageChange($event)"
      [length]="dataSource.data.length"
      [pageSize]="15">
    </mat-paginator>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestTableComponent {
  readonly dataSource = new MatTableDataSource<Data>([]);
  readonly paginator = viewChild(MatPaginator);

  readonly displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];

  constructor() {
    this.dataSource.data = this.renderData(0);

    setTimeout(() => {
      console.log('Updating data source with more elements');

      this.dataSource.data = [...this.dataSource.data, ...this.renderData(101)];
    }, 3000);

    afterNextRender(() => {
      const paginator = this.paginator();

      if (paginator) {
        this.dataSource.paginator = paginator;
      }
    });
  }

  onPageChange(event: PageEvent) {
    console.log('Page changed to index:', event);
  }

  private renderData(startingVal: number): Data[] {
    const data: Data[] = [];
    Array.from({ length: 100 }, (_, k) => k + 1).forEach(v => {
      const val = startingVal ? startingVal + v : v;
      data.push({ position: v, name: `Element ${val}`, weight: val * 1.5, symbol: `E${val}` });
    });

    return data;
  }
}
