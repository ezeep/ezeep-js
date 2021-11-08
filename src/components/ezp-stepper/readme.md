# ezp-stepper

<!-- Auto Generated Below -->

## Properties

| Property | Attribute | Description    | Type     | Default     |
| -------- | --------- | -------------- | -------- | ----------- |
| `label`  | `label`   | Description... | `string` | `'Label'`   |
| `max`    | `max`     | Description... | `number` | `undefined` |
| `min`    | `min`     | Description... | `number` | `1`         |

## Events

| Event            | Description | Type               |
| ---------------- | ----------- | ------------------ |
| `stepperChanged` | Events      | `CustomEvent<any>` |

## Dependencies

### Used by

- [ezp-printer-selection](../ezp-printer-selection)

### Depends on

- [ezp-label](../ezp-label)
- [ezp-icon](../ezp-icon)

### Graph

```mermaid
graph TD;
  ezp-stepper --> ezp-label
  ezp-stepper --> ezp-icon
  ezp-printer-selection --> ezp-stepper
  style ezp-stepper fill:#f9f,stroke:#333,stroke-width:4px
```

---
