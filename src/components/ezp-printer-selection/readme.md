# ezp-print

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute        | Description    | Type     | Default     |
| ------------- | ---------------- | -------------- | -------- | ----------- |
| `clientID`    | `client-i-d`     | Description... | `string` | `undefined` |
| `redirectURI` | `redirect-u-r-i` | Description... | `string` | `undefined` |


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
| `--dialog-border`             | Description... |
| `--dialog-radius`             | Description... |
| `--dialog-separator-position` | Description... |
| `--duration`                  | Description... |
| `--footer-separator-position` | Description... |
| `--header-separator-position` | Description... |


## Dependencies

### Used by

 - [ezp-printing](../ezp-printing)

### Depends on

- [ezp-typo-body](../ezp-typo-body)
- [ezp-icon-button](../ezp-icon-button)
- [ezp-select](../ezp-select)
- [ezp-text-button](../ezp-text-button)
- [ezp-auth](../ezp-auth)

### Graph
```mermaid
graph TD;
  ezp-printer-selection --> ezp-typo-body
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-text-button
  ezp-printer-selection --> ezp-auth
  ezp-icon-button --> ezp-icon
  ezp-select --> ezp-icon
  ezp-select --> ezp-typo-body
  ezp-text-button --> ezp-typo-body
  ezp-printing --> ezp-printer-selection
  style ezp-printer-selection fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


