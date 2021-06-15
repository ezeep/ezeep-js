# ezp-auth

<!-- Auto Generated Below -->

## Properties

| Property      | Attribute        | Description | Type     | Default     |
| ------------- | ---------------- | ----------- | -------- | ----------- |
| `clientID`    | `client-i-d`     |             | `string` | `undefined` |
| `redirectURI` | `redirect-u-r-i` |             | `string` | `undefined` |

## Dependencies

### Used by

- [ezp-printing](../ezp-printing)

### Depends on

- [ezp-printer-selection](../ezp-printer-selection)

### Graph

```mermaid
graph TD;
  ezp-auth --> ezp-printer-selection
  ezp-printer-selection --> ezp-typo-body
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-text-button
  ezp-icon-button --> ezp-icon
  ezp-select --> ezp-icon
  ezp-select --> ezp-typo-body
  ezp-text-button --> ezp-typo-body
  ezp-printing --> ezp-auth
  style ezp-auth fill:#f9f,stroke:#333,stroke-width:4px
```

---
