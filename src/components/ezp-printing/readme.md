# ezp-root

<!-- Auto Generated Below -->

## Properties

| Property      | Attribute     | Description | Type      | Default     |
| ------------- | ------------- | ----------- | --------- | ----------- |
| `clientid`    | `clientid`    |             | `string`  | `undefined` |
| `custom`      | `custom`      |             | `boolean` | `undefined` |
| `filename`    | `filename`    |             | `string`  | `undefined` |
| `filetype`    | `filetype`    |             | `string`  | `undefined` |
| `fileurl`     | `fileurl`     |             | `string`  | `undefined` |
| `redirecturi` | `redirecturi` |             | `string`  | `undefined` |

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
  ezp-auth --> ezp-icon-button
  ezp-auth --> ezp-icon
  ezp-auth --> ips-heading
  ezp-auth --> ips-label
  ezp-auth --> ezp-text-button
  ezp-icon-button --> ezp-icon
  ezp-text-button --> ips-label
  ezp-printer-selection --> ezp-progress
  ezp-printer-selection --> ips-label
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-text-button
  ezp-progress --> ips-label
  ezp-select --> ezp-icon
  ezp-select --> ips-label
  style ezp-printing fill:#f9f,stroke:#333,stroke-width:4px
```

---
