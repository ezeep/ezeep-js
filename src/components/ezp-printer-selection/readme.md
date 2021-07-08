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
- ips-label
- [ezp-icon-button](../ezp-icon-button)
- [ezp-select](../ezp-select)
- [ezp-text-button](../ezp-text-button)

### Graph
```mermaid
graph TD;
  ezp-printer-selection --> ezp-progress
  ezp-printer-selection --> ips-label
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-text-button
  ezp-progress --> ips-label
  ezp-icon-button --> ezp-icon
  ezp-select --> ezp-icon
  ezp-select --> ips-label
  ezp-text-button --> ips-label
  ezp-printing --> ezp-printer-selection
  style ezp-printer-selection fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


