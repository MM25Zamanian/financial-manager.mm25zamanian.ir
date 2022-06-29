import {pickerController} from '@ionic/core';
import {LocalizeController} from '@shoelace-style/localize/dist/index.js';
import {css, html} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';
import {when} from 'lit/directives/when.js';

import '../components/data-chart';

import {AppElement} from '../app-debt/app-element';
import {financialCategory, financialOperationTypes} from '../config';
import {dbPromise} from '../utilities/database';

import type {financialOperation} from '../utilities/database';
import type {ListenerInterface} from '@alwatr/signal';
import type {DataTableLike} from '@google-web-components/google-chart/loader';
import type {SelectCustomEvent} from '@ionic/core';
import type {TemplateResult, CSSResult, PropertyDeclaration} from 'lit';

declare global {
  interface HTMLElementTagNameMap {
    'page-charts': PageCharts;
  }
}

/**
 * ```html
 * <page-charts></page-charts>
 * ```
 */
@customElement('page-charts')
export class PageCharts extends AppElement {
  static override styles = [
    ...(<CSSResult[]>AppElement.styles),
    css`
      :host {
        display: flex;
        flex-direction: column;
      }
    `,
  ];

  protected _localize = new LocalizeController(this);
  protected _listenerList: Array<unknown> = [];
  protected _financialOperationList: financialOperation[] = [];
  protected _financialOperationSelectedList: financialOperation[] = [];
  protected _financialOperationCategories: financialCategory[] = [];
  protected _selectedType: 'expenses' | 'income' = financialOperationTypes[0];
  protected _selectedYear = 0;
  protected _selectedMonth = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    // this._listenerList.push(router.signal.addListener(() => this.requestUpdate()));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._listenerList.forEach((listener) => (listener as ListenerInterface<keyof AlwatrSignals>).remove());
  }

  override render(): TemplateResult {
    return html`
      ${this._renderHeader()}
      <ion-content>
        <data-chart></data-chart>
        ${this._renderFinancialCategories()}
      </ion-content>
    `;
  }

  protected _renderHeader(): TemplateResult {
    return html`
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button @click=${this._renderPicker}>
            ${when(this._selectedMonth, () => this._localize.term(`$month${this._selectedMonth}`))}
            ${this._selectedYear}
          </ion-button>
        </ion-buttons>

        ${this._renderFinancialTypeSelect()}
      </ion-toolbar>
    `;
  }
  protected _renderFinancialTypeSelect(): TemplateResult {
    const listTemplate = financialOperationTypes.map(
        (type) => html`<ion-select-option value=${type}>${this._localize.term(type)}</ion-select-option>`,
    );

    return html`
      <ion-select
        interface="alert"
        value=${financialOperationTypes[0]}
        ok-text=${this._localize.term('ok')}
        cancel-text=${this._localize.term('cancel')}
        @ionChange=${this._selectedTypeChanged}
      >
        ${listTemplate}
      </ion-select>
    `;
  }
  protected _renderFinancialCategories(): TemplateResult {
    const listCategoriesTemplate = this._financialOperationCategories.map(
        (category) => html`
        <ion-item>
          <er-iconsax name=${category.icon} category="broken" slot="start"></er-iconsax>
          <ion-label>${this._localize.term(category.name)}</ion-label>
          <ion-label slot="end">${this._localize.number(category.value ?? 0)}</ion-label>
        </ion-item>
      `,
    );

    return html`<ion-list>${listCategoriesTemplate}</ion-list>`;
  }
  protected async _renderPicker(): Promise<void> {
    const picker = await pickerController.create({
      columns: [
        {
          name: 'year',
          selectedIndex: this._years.indexOf(this._selectedYear),
          options: this._years.map((year) => {
            return {
              text: year.toString(),
              value: year,
            };
          }),
        },
        {
          name: 'month',
          selectedIndex: this._monthes.indexOf(this._selectedMonth),
          options: this._monthes.map((month) => {
            return {
              text: this._localize.term(`$month${month}`),
              value: month,
            };
          }),
        },
      ],
      buttons: [
        {
          text: this._localize.term('cancel'),
          role: 'cancel',
        },
        {
          text: this._localize.term('ok'),
          handler: (value) => this._selectedDateChanged(value.year.value, value.month.value),
        },
      ],
    });
    await picker.present();
  }

  protected _selectedTypeChanged(event: SelectCustomEvent): void {
    const oldValues = {
      _selectedType: this._selectedType,
    };

    this._selectedType = event.detail.value;

    this.requestUpdate('_selectedType', oldValues._selectedType);
  }
  protected _selectedDateChanged(year?: number, month?: number): void {
    const oldValues = {
      _selectedYear: this._selectedYear,
      _selectedMonth: this._selectedMonth,
    };

    this._selectedYear = year ?? this._selectedYear;
    this._selectedMonth = month ?? this._selectedMonth;

    this.requestUpdate('_selectedMonth', oldValues._selectedMonth);
    this.requestUpdate('_selectedYear', oldValues._selectedYear);
  }

  protected get _dataChart(): DataTableLike {
    return [
      ['name', 'value'],
      ...this._financialOperationCategories.map((category) => {
        return [this._localize.term(category.name), category.value];
      }),
    ];
  }
  protected get _monthes(): number[] {
    const monthes = this._financialOperationList.map((foItem) => foItem.datetime.getUTCMonth() + 1);

    return monthes.filter((value, index) => monthes.indexOf(value) == index).sort((a, b) => a - b);
  }
  protected get _years(): number[] {
    const years = this._financialOperationList.map((foItem) => foItem.datetime.getUTCFullYear());

    return years
        .filter((value, index) => years.indexOf(value) == index)
        .sort((a, b) => a - b)
        .reverse();
  }

  override requestUpdate(
      name?: PropertyKey | undefined,
      oldValue?: unknown,
      options?: PropertyDeclaration<unknown, unknown> | undefined,
  ): void {
    super.requestUpdate(name, oldValue, options);

    if (name === '_selectedMonth' || name === '_selectedYear' || name === '_selectedType') {
      this._financialOperationSelectedList = this._financialOperationList.filter((foItem) => {
        return (
          foItem.type === this._selectedType &&
          foItem.datetime.getUTCMonth() + 1 === this._selectedMonth &&
          foItem.datetime.getUTCFullYear() === this._selectedYear
        );
      });
      this.requestUpdate('_financialOperationSelectedList');
    }
    if (name === '_financialOperationSelectedList') {
      const categories = this._financialOperationSelectedList.map((foItem) => foItem.category);
      this._financialOperationCategories = categories
          .filter((value, index) => {
            const selectedCategory = categories.find(
                (category) => category.name === value.name && category.type === value.type,
            );

            return selectedCategory ? categories.indexOf(selectedCategory) === index : false;
          })
          .map((category) => {
            category.value = this._financialOperationSelectedList
                .filter((foItem) => {
                  return category.name.includes(foItem.category.name) && category.type.includes(foItem.category.type);
                })
                .map((foItem) => foItem.value)
                .reduce((a, b) => a + b, 0);

            return category;
          });

      (<HTMLDataChartElement>(<ShadowRoot> this.shadowRoot).querySelector('data-chart')).data = this._dataChart;
    }
  }
  protected override firstUpdated(): void {
    dbPromise.then(async (db) => {
      this._financialOperationList = await db.getAll('financial-operation', undefined, 1000);

      this._selectedMonth = this._monthes[new Date().getUTCMonth()] ?? this._monthes[0];
      this._selectedYear = this._years[0];

      this.requestUpdate('_selectedMonth');
      this.requestUpdate('_selectedYear');
      this.requestUpdate('_selectedType');
    });
  }
}
