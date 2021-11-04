# ezp-progress

<!-- Auto Generated Below -->

## Properties

| Property | Attribute | Description | Type     | Default       |
| -------- | --------- | ----------- | -------- | ------------- |
| `status` | `status`  | Status...   | `string` | `'Status...'` |

## Dependencies

### Used by

- [ezp-auth](../ezp-auth)
- [ezp-printer-selection](../ezp-printer-selection)

### Depends on

- [ezp-label](../ezp-label)

### Graph

```mermaid
graph TD;
  ezp-progress --> ezp-label
  ezp-auth --> ezp-progress
  ezp-printer-selection --> ezp-progress
  style ezp-progress fill:#f9f,stroke:#333,stroke-width:4px
```

---
