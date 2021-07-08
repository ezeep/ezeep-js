# ezp-auth

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute        | Description | Type     | Default     |
| ------------- | ---------------- | ----------- | -------- | ----------- |
| `clientID`    | `client-i-d`     |             | `string` | `undefined` |
| `redirectURI` | `redirect-u-r-i` |             | `string` | `undefined` |


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

- [ezp-icon-button](../ezp-icon-button)
- [ezp-icon](../ezp-icon)
- ips-heading
- ips-label
- [ezp-text-button](../ezp-text-button)

### Graph
```mermaid
graph TD;
  ezp-auth --> ezp-icon-button
  ezp-auth --> ezp-icon
  ezp-auth --> ips-heading
  ezp-auth --> ips-label
  ezp-auth --> ezp-text-button
  ezp-icon-button --> ezp-icon
  ezp-text-button --> ips-label
  ezp-printing --> ezp-auth
  style ezp-auth fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


