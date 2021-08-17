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
  ezp-auth --> cap-heading
  ezp-auth --> cap-label
  ezp-auth --> ezp-text-button
  ezp-progress --> cap-label
  ezp-icon-button --> ezp-icon
  ezp-text-button --> cap-label
  ezp-printer-selection --> ezp-progress
  ezp-printer-selection --> cap-label
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-text-button
  ezp-printer-selection --> ezp-user-menu
  ezp-select --> ezp-backdrop
  ezp-select --> ezp-icon
  ezp-select --> cap-label
  ezp-user-menu --> cap-label
  ezp-user-menu --> ezp-icon-button
  ezp-user-menu --> ezp-select
  ezp-user-menu --> ezp-icon
  style ezp-printing fill:#f9f,stroke:#333,stroke-width:4px
```

---
