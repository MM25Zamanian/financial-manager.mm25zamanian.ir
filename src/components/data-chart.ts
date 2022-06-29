import {LocalizeController} from '@shoelace-style/localize/dist/index.js';
import {css, html} from 'lit';
import {customElement} from 'lit/decorators/custom-element.js';
import {property} from 'lit/decorators/property.js';
import {query} from 'lit/decorators/query.js';

import '@google-web-components/google-chart';

import {AppElement} from '../app-debt/app-element';
import {DataTableRow} from '../types';

import type {GoogleChart} from '@google-web-components/google-chart';
import type {TemplateResult, PropertyValues} from 'lit';

declare global {
  type HTMLDataChartElement = DataChart;
  interface HTMLElementTagNameMap {
    'data-chart': HTMLDataChartElement;
  }
}

/**
 * APP PWA About Page Element
 *
 * ```html
 * <data-chart></data-chart>
 * ```
 */
@customElement('data-chart')
export class DataChart extends AppElement {
  static override styles = [css``];

  @property({type: Array}) data: DataTableRow[] = [];
  @query('google-chart') protected _googleChartComponent?: GoogleChart;

  protected _localize = new LocalizeController(this);

  protected override render(): TemplateResult {
    return html`<google-chart></google-chart>`;
  }

  protected override update(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    if (changedProperties.has('data')) {
      const chart = this._googleChartComponent;
      if (chart) {
        chart.data = this.data.length ? this.data : undefined;
        chart.type = 'pie';
      }
    }
  }
}
