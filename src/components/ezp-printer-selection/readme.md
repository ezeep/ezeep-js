# ezp-print

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute        | Description | Type     | Default     |
| ------------- | ---------------- | ----------- | -------- | ----------- |
| `clientID`    | `client-i-d`     | Properties  | `string` | `undefined` |
| `filename`    | `filename`       |             | `string` | `undefined` |
| `filetype`    | `filetype`       |             | `string` | `undefined` |
| `fileurl`     | `fileurl`        |             | `string` | `undefined` |
| `redirectURI` | `redirect-u-r-i` |             | `string` | `undefined` |


## Events

| Event         | Description    | Type                      |
| ------------- | -------------- | ------------------------- |
| `printCancel` | Description... | `CustomEvent<MouseEvent>` |
| `printSubmit` | Description... | `CustomEvent<MouseEvent>` |


## CSS Custom Properties

| Name                          | Description    |
| ----------------------------- | -------------- |
| `--backdrop-opacity`          | Description... |
| `--backdrop-radius`           | Description... |
| `--backdrop-transition`       | Description... |
| `--backdrop-visibility`       | Description... |
| `--content-separator`         | Description... |
| `--dialog-radius`             | Description... |
| `--dialog-separator-position` | Description... |
| `--duration`                  | Description... |
| `--footer-separator-position` | Description... |
| `--header-separator-position` | Description... |


## Dependencies

### Used by

 - [ezp-printing](../ezp-printing)

### Depends on

- [ezp-progress](../ezp-progress)
- cap-label
- [ezp-icon-button](../ezp-icon-button)
- [ezp-select](../ezp-select)
- [ezp-text-button](../ezp-text-button)
- [ezp-user-menu](../ezp-user-menu)

### Graph
```mermaid
graph TD;
  ezp-printer-selection --> ezp-progress
  ezp-printer-selection --> cap-label
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-text-button
  ezp-printer-selection --> ezp-user-menu
  ezp-progress --> cap-label
  ezp-icon-button --> ezp-icon
  ezp-select --> ezp-icon
  ezp-select --> cap-label
  ezp-text-button --> cap-label
  ezp-user-menu --> cap-label
  ezp-user-menu --> ezp-icon-button
  ezp-user-menu --> ezp-icon
  ezp-printing --> ezp-printer-selection
  style ezp-printer-selection fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


