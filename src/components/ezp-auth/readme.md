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

## CSS Custom Properties

| Name                          | Description    |
| ----------------------------- | -------------- |
| `--dialog-radius`             | Description... |
| `--dialog-separator-position` | Description... |

## Dependencies

### Used by

- [ezp-printing](../ezp-printing)

### Depends on

- [ezp-progress](../ezp-progress)
- [ezp-icon-button](../ezp-icon-button)
- [ezp-icon](../ezp-icon)
- cap-heading
- cap-label
- [ezp-text-button](../ezp-text-button)

### Graph

```mermaid
graph TD;
  ezp-auth --> ezp-progress
  ezp-auth --> ezp-icon-button
  ezp-auth --> ezp-icon
  ezp-auth --> cap-heading
  ezp-auth --> cap-label
  ezp-auth --> ezp-text-button
  ezp-progress --> cap-label
  ezp-icon-button --> ezp-icon
  ezp-text-button --> cap-label
  ezp-printing --> ezp-auth
  style ezp-auth fill:#f9f,stroke:#333,stroke-width:4px
```

---
