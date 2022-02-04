# ezp-print

<!-- Auto Generated Below -->

## Properties

| Property      | Attribute        | Description | Type      | Default     |
| ------------- | ---------------- | ----------- | --------- | ----------- |
| `clientID`    | `client-i-d`     | Properties  | `string`  | `undefined` |
| `file`        | --               |             | `File`    | `undefined` |
| `fileid`      | `fileid`         |             | `string`  | `undefined` |
| `filename`    | `filename`       |             | `string`  | `undefined` |
| `filetype`    | `filetype`       |             | `string`  | `undefined` |
| `fileurl`     | `fileurl`        |             | `string`  | `undefined` |
| `hidelogout`  | `hidelogout`     |             | `boolean` | `undefined` |
| `redirectURI` | `redirect-u-r-i` |             | `string`  | `undefined` |

## Events

| Event         | Description    | Type                      |
| ------------- | -------------- | ------------------------- |
| `printCancel` | Description... | `CustomEvent<MouseEvent>` |
| `printSubmit` | Description... | `CustomEvent<MouseEvent>` |

## Dependencies

### Used by

- [ezp-printing](../ezp-printing)

### Depends on

- [ezp-status](../ezp-status)
- [ezp-label](../ezp-label)
- [ezp-icon-button](../ezp-icon-button)
- [ezp-select](../ezp-select)
- [ezp-stepper](../ezp-stepper)
- [ezp-text-button](../ezp-text-button)
- [ezp-user-menu](../ezp-user-menu)

### Graph

```mermaid
graph TD;
  ezp-printer-selection --> ezp-status
  ezp-printer-selection --> ezp-label
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-stepper
  ezp-printer-selection --> ezp-text-button
  ezp-printer-selection --> ezp-user-menu
  ezp-status --> ezp-icon
  ezp-status --> ezp-label
  ezp-status --> ezp-text-button
  ezp-text-button --> ezp-label
  ezp-icon-button --> ezp-icon
  ezp-select --> ezp-backdrop
  ezp-select --> ezp-icon
  ezp-select --> ezp-label
  ezp-stepper --> ezp-icon
  ezp-stepper --> ezp-label
  ezp-user-menu --> ezp-backdrop
  ezp-user-menu --> ezp-label
  ezp-user-menu --> ezp-icon-button
  ezp-user-menu --> ezp-icon
  ezp-printing --> ezp-printer-selection
  style ezp-printer-selection fill:#f9f,stroke:#333,stroke-width:4px
```

---
