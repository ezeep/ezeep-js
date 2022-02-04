# ezp-text-button

<!-- Auto Generated Below -->

## Properties

| Property   | Attribute  | Description    | Type                                     | Default     |
| ---------- | ---------- | -------------- | ---------------------------------------- | ----------- |
| `blank`    | `blank`    | Description... | `boolean`                                | `false`     |
| `disabled` | `disabled` | Description... | `boolean`                                | `false`     |
| `href`     | `href`     | Description... | `string`                                 | `undefined` |
| `label`    | `label`    | Description... | `string`                                 | `undefined` |
| `level`    | `level`    | Description... | `"primary" \| "secondary" \| "tertiary"` | `'primary'` |
| `small`    | `small`    | Description... | `boolean`                                | `false`     |
| `type`     | `type`     | Description... | `"button"`                               | `undefined` |

## Dependencies

### Used by

- [ezp-dialog](../ezp-dialog)
- [ezp-printer-selection](../ezp-printer-selection)
- [ezp-status](../ezp-status)

### Depends on

- [ezp-label](../ezp-label)

### Graph

```mermaid
graph TD;
  ezp-text-button --> ezp-label
  ezp-dialog --> ezp-text-button
  ezp-printer-selection --> ezp-text-button
  ezp-status --> ezp-text-button
  style ezp-text-button fill:#f9f,stroke:#333,stroke-width:4px
```

---
