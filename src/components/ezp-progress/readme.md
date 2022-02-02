# ezp-progress

<!-- Auto Generated Below -->

## Properties

| Property     | Attribute    | Description | Type                                                                                                                                                                                                                                                                                                       | Default     |
| ------------ | ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `cancel`     | `cancel`     |             | `boolean \| string`                                                                                                                                                                                                                                                                                        | `undefined` |
| `close`      | `close`      |             | `boolean \| string`                                                                                                                                                                                                                                                                                        | `undefined` |
| `icon`       | `icon`       |             | `"account" \| "checkmark" \| "close" \| "color" \| "copies" \| "dark" \| "duplex" \| "expand" \| "help" \| "light" \| "logout" \| "menu" \| "minus" \| "orientation" \| "plus" \| "printer" \| "quality" \| "size" \| "system" \| "drag-drop" \| "checkmark-alt" \| "question-mark" \| "exclamation-mark"` | `undefined` |
| `instance`   | `instance`   |             | `string`                                                                                                                                                                                                                                                                                                   | `undefined` |
| `processing` | `processing` |             | `boolean`                                                                                                                                                                                                                                                                                                  | `false`     |
| `retry`      | `retry`      |             | `boolean \| string`                                                                                                                                                                                                                                                                                        | `undefined` |
| `status`     | `status`     | Properties  | `string`                                                                                                                                                                                                                                                                                                   | `'Status'`  |

## Events

| Event            | Description | Type               |
| ---------------- | ----------- | ------------------ |
| `progressCancel` | Events      | `CustomEvent<any>` |
| `progressClose`  |             | `CustomEvent<any>` |
| `progressRetry`  |             | `CustomEvent<any>` |

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
  ezp-progress --> ezp-icon
  ezp-progress --> ezp-label
  ezp-progress --> ezp-text-button
  ezp-text-button --> ezp-label
  ezp-auth --> ezp-progress
  ezp-printer-selection --> ezp-progress
  style ezp-progress fill:#f9f,stroke:#333,stroke-width:4px
```

---
