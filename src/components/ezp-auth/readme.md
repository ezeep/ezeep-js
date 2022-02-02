# ezp-auth

<!-- Auto Generated Below -->

## Properties

| Property      | Attribute        | Description | Type      | Default     |
| ------------- | ---------------- | ----------- | --------- | ----------- |
| `clientID`    | `client-i-d`     |             | `string`  | `undefined` |
| `hidelogin`   | `hidelogin`      |             | `boolean` | `undefined` |
| `redirectURI` | `redirect-u-r-i` |             | `string`  | `undefined` |

## Events

| Event         | Description | Type                      |
| ------------- | ----------- | ------------------------- |
| `authCancel`  |             | `CustomEvent<MouseEvent>` |
| `authSuccess` |             | `CustomEvent<any>`        |

## Dependencies

### Used by

- [ezp-printing](../ezp-printing)

### Depends on

- [ezp-status](../ezp-status)
- [ezp-dialog](../ezp-dialog)

### Graph

```mermaid
graph TD;
  ezp-auth --> ezp-status
  ezp-auth --> ezp-dialog
  ezp-status --> ezp-icon
  ezp-status --> ezp-label
  ezp-status --> ezp-text-button
  ezp-text-button --> ezp-label
  ezp-dialog --> ezp-icon-button
  ezp-dialog --> ezp-icon
  ezp-dialog --> ezp-label
  ezp-dialog --> ezp-text-button
  ezp-icon-button --> ezp-icon
  ezp-printing --> ezp-auth
  style ezp-auth fill:#f9f,stroke:#333,stroke-width:4px
```

---
