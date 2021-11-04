# ezp-root

<!-- Auto Generated Below -->

## Properties

| Property          | Attribute         | Description | Type      | Default     |
| ----------------- | ----------------- | ----------- | --------- | ----------- |
| `authapihosturl`  | `authapihosturl`  |             | `string`  | `undefined` |
| `clientid`        | `clientid`        |             | `string`  | `undefined` |
| `custom`          | `custom`          |             | `boolean` | `undefined` |
| `filename`        | `filename`        |             | `string`  | `undefined` |
| `filetype`        | `filetype`        |             | `string`  | `undefined` |
| `fileurl`         | `fileurl`         |             | `string`  | `undefined` |
| `hidelogin`       | `hidelogin`       |             | `boolean` | `undefined` |
| `printapihosturl` | `printapihosturl` |             | `string`  | `undefined` |
| `redirecturi`     | `redirecturi`     |             | `string`  | `undefined` |

## Methods

### `open() => Promise<void>`

Public methods

#### Returns

Type: `Promise<void>`

## Dependencies

### Depends on

- [ezp-auth](../ezp-auth)
- [ezp-printer-selection](../ezp-printer-selection)
- [ezp-icon-button](../ezp-icon-button)

### Graph

```mermaid
graph TD;
  ezp-printing --> ezp-auth
  ezp-printing --> ezp-printer-selection
  ezp-printing --> ezp-icon-button
  ezp-auth --> ezp-progress
  ezp-auth --> ezp-icon-button
  ezp-auth --> ezp-icon
  ezp-auth --> ezp-label
  ezp-auth --> ezp-text-button
  ezp-progress --> ezp-label
  ezp-icon-button --> ezp-icon
  ezp-text-button --> ezp-label
  ezp-printer-selection --> ezp-progress
  ezp-printer-selection --> ezp-label
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-stepper
  ezp-printer-selection --> ezp-text-button
  ezp-printer-selection --> ezp-user-menu
  ezp-select --> ezp-backdrop
  ezp-select --> ezp-icon
  ezp-select --> ezp-label
  ezp-stepper --> ezp-label
  ezp-stepper --> ezp-icon
  ezp-user-menu --> ezp-backdrop
  ezp-user-menu --> ezp-label
  ezp-user-menu --> ezp-icon-button
  ezp-user-menu --> ezp-icon
  style ezp-printing fill:#f9f,stroke:#333,stroke-width:4px
```

---
