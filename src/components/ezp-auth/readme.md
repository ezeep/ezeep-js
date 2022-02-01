# ezp-auth

<!-- Auto Generated Below -->

## Properties

| Property      | Attribute        | Description | Type      | Default     |
| ------------- | ---------------- | ----------- | --------- | ----------- |
| `clientID`    | `client-i-d`     |             | `string`  | `undefined` |
| `hidelogin`   | `hidelogin`      |             | `boolean` | `undefined` |
| `redirectURI` | `redirect-u-r-i` |             | `string`  | `undefined` |

## Events

| Event        | Description | Type                      |
| ------------ | ----------- | ------------------------- |
| `authCancel` |             | `CustomEvent<MouseEvent>` |
| `printShow`  |             | `CustomEvent<any>`        |

## Dependencies

### Used by

- [ezp-printing](../ezp-printing)

### Depends on

- [ezp-progress](../ezp-progress)
- [ezp-icon-button](../ezp-icon-button)
- [ezp-label](../ezp-label)
- [ezp-text-button](../ezp-text-button)

### Graph

```mermaid
graph TD;
  ezp-auth --> ezp-progress
  ezp-auth --> ezp-icon-button
  ezp-auth --> ezp-label
  ezp-auth --> ezp-text-button
  ezp-progress --> ezp-icon
  ezp-progress --> ezp-label
  ezp-icon-button --> ezp-icon
  ezp-text-button --> ezp-label
  ezp-printing --> ezp-auth
  style ezp-auth fill:#f9f,stroke:#333,stroke-width:4px
```

---
