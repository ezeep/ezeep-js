import { Component, Host, Prop, h, Fragment, EventEmitter, Event } from '@stencil/core';
import { PAPER_ID } from '../../utils/utils';
import { IconNameTypes } from './../../shared/types';

@Component({
  tag: 'ezp-input',
  styleUrl: 'ezp-input.scss',
  shadow: true,
})
export class EzpInput {

  @Prop() label: string = 'Label'
  @Prop({ mutable: true }) value: number | string;
  @Prop() type: string = "number"
  @Prop() paperid: string | number
  @Prop() icon : IconNameTypes = "color"
  @Event() inputValueChanged: EventEmitter

  private timeout = null

  handleChange(event) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.value = event.target.value ? event.target.value : 0;
    this.timeout = setTimeout(() => {
      this.inputValueChanged.emit({
        type: this.label.toLowerCase(),
        value: this.value
      })
    }, 500);

  }



  render() {

    const labelLevel = 'secondary'
    return (
      <Host>
        <>
          {(this.paperid == PAPER_ID) && (
            <div id="wrap">
                <ezp-icon id="icon" name={this.icon} />
                <ezp-label id="label" noWrap level={labelLevel} text={this.label} />
                <input class="no-counter" id="input" type={this.type} value={this.value} onInput={(event) => this.handleChange(event)} />
            </div>
          )}
        </>
      </Host>
    );
  }

}
