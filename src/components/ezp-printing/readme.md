# ezp-root

<!-- Auto Generated Below -->

## Properties

| Property      | Attribute     | Description | Type      | Default     |
| ------------- | ------------- | ----------- | --------- | ----------- |
| `clientid`    | `clientid`    |             | `string`  | `undefined` |
| `custom`      | `custom`      |             | `boolean` | `undefined` |
| `filename`    | `filename`    |             | `string`  | `undefined` |
| `fileurl`     | `fileurl`     |             | `string`  | `undefined` |
| `redirecturi` | `redirecturi` |             | `string`  | `undefined` |

## Methods

### `closeAuth() => Promise<void>`

#### Returns

Type: `Promise<void>`

### `closePrint() => Promise<void>`

Description...

#### Returns

Type: `Promise<void>`

### `openAuth() => Promise<void>`

#### Returns

Type: `Promise<void>`

### `openPrint() => Promise<void>`

Description...

#### Returns

Type: `Promise<void>`

## Dependencies

### Depends on

- [ezp-auth](../ezp-auth)
- [ezp-icon-button](../ezp-icon-button)

### Graph

```mermaid
graph TD;
  ezp-printing --> ezp-auth
  ezp-printing --> ezp-icon-button
  ezp-auth --> ezp-printer-selection
  ezp-printer-selection --> ezp-typo-body
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-text-button
  ezp-icon-button --> ezp-icon
  ezp-select --> ezp-icon
  ezp-select --> ezp-typo-body
  ezp-text-button --> ezp-typo-body
  style ezp-printing fill:#f9f,stroke:#333,stroke-width:4px
```

---
