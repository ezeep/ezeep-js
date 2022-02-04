# ezp-user-menu

<!-- Auto Generated Below -->

## Properties

| Property     | Attribute    | Description | Type      | Default      |
| ------------ | ------------ | ----------- | --------- | ------------ |
| `hidelogout` | `hidelogout` |             | `boolean` | `undefined`  |
| `name`       | `name`       |             | `string`  | `'John Doe'` |
| `open`       | `open`       |             | `boolean` | `false`      |

## Events

| Event             | Description | Type               |
| ----------------- | ----------- | ------------------ |
| `logoutEmitter`   |             | `CustomEvent<any>` |
| `userMenuClosure` | Events      | `CustomEvent<any>` |

## Dependencies

### Used by

- [ezp-printer-selection](../ezp-printer-selection)

### Depends on

- [ezp-backdrop](../ezp-backdrop)
- [ezp-label](../ezp-label)
- [ezp-icon-button](../ezp-icon-button)
- [ezp-icon](../ezp-icon)

### Graph

```mermaid
graph TD;
  ezp-user-menu --> ezp-backdrop
  ezp-user-menu --> ezp-label
  ezp-user-menu --> ezp-icon-button
  ezp-user-menu --> ezp-icon
  ezp-icon-button --> ezp-icon
  ezp-printer-selection --> ezp-user-menu
  style ezp-user-menu fill:#f9f,stroke:#333,stroke-width:4px
```

---
