# ezp-status

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type                                                                                                                                                                                                                                                                                                                 | Default         |
| ------------- | ------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `cancel`      | `cancel`      |             | `boolean \| string`                                                                                                                                                                                                                                                                                                  | `undefined`     |
| `close`       | `close`       |             | `boolean \| string`                                                                                                                                                                                                                                                                                                  | `undefined`     |
| `description` | `description` |  Properties | `string`                                                                                                                                                                                                                                                                                                             | `'Description'` |
| `icon`        | `icon`        |             | `"account" \| "checkmark" \| "close" \| "color" \| "copies" \| "dark" \| "duplex" \| "expand" \| "help" \| "light" \| "logout" \| "menu" \| "minus" \| "orientation" \| "plus" \| "printer" \| "quality" \| "size" \| "system" \| "drag-drop" \| "checkmark-alt" \| "question-mark" \| "exclamation-mark" \| "logo"` | `undefined`     |
| `instance`    | `instance`    |             | `string`                                                                                                                                                                                                                                                                                                             | `undefined`     |
| `processing`  | `processing`  |             | `boolean`                                                                                                                                                                                                                                                                                                            | `false`         |
| `retry`       | `retry`       |             | `boolean \| string`                                                                                                                                                                                                                                                                                                  | `undefined`     |


## Events

| Event          | Description | Type               |
| -------------- | ----------- | ------------------ |
| `statusCancel` |  Events     | `CustomEvent<any>` |
| `statusClose`  |             | `CustomEvent<any>` |
| `statusRetry`  |             | `CustomEvent<any>` |


## Dependencies

### Used by

 - [ezp-auth](../ezp-auth)
 - [ezp-printer-selection](../ezp-printer-selection)

### Depends on

- [ezp-icon](../ezp-icon)
- [ezp-label](../ezp-label)
- [ezp-text-button](../ezp-text-button)

### Graph
```mermaid
graph TD;
  ezp-status --> ezp-icon
  ezp-status --> ezp-label
  ezp-status --> ezp-text-button
  ezp-text-button --> ezp-label
  ezp-auth --> ezp-status
  ezp-printer-selection --> ezp-status
  style ezp-status fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


