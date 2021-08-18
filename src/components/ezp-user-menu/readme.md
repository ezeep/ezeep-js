# ezp-user-menu

<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type      | Default      |
| -------- | --------- | ----------- | --------- | ------------ |
| `name`   | `name`    |             | `string`  | `'John Doe'` |
| `open`   | `open`    |             | `boolean` | `false`      |


## Events

| Event             | Description | Type               |
| ----------------- | ----------- | ------------------ |
| `logoutEmitter`   |             | `CustomEvent<any>` |
| `userMenuClosure` | Events      | `CustomEvent<any>` |


## Dependencies

### Used by

 - [ezp-printer-selection](../ezp-printer-selection)

### Depends on

- cap-label
- [ezp-icon-button](../ezp-icon-button)
- [ezp-select](../ezp-select)
- [ezp-icon](../ezp-icon)

### Graph
```mermaid
graph TD;
  ezp-user-menu --> cap-label
  ezp-user-menu --> ezp-icon-button
  ezp-user-menu --> ezp-select
  ezp-user-menu --> ezp-icon
  ezp-icon-button --> ezp-icon
  ezp-select --> ezp-backdrop
  ezp-select --> ezp-icon
  ezp-select --> cap-label
  ezp-printer-selection --> ezp-user-menu
  style ezp-user-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


