# ezp-icon-button

<!-- Auto Generated Below -->

## Properties

| Property            | Attribute  | Description    | Type                                                                                                                                                                                           | Default     |
| ------------------- | ---------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `blank`             | `blank`    | Description... | `boolean`                                                                                                                                                                                      | `false`     |
| `disabled`          | `disabled` | Description... | `boolean`                                                                                                                                                                                      | `false`     |
| `href`              | `href`     | Description... | `string`                                                                                                                                                                                       | `undefined` |
| `icon` _(required)_ | `icon`     | Description... | `"account" \| "checkmark" \| "close" \| "color" \| "copies" \| "duplex" \| "expand" \| "help" \| "logout" \| "menu" \| "minus" \| "orientation" \| "plus" \| "printer" \| "quality" \| "size"` | `undefined` |
| `level`             | `level`    | Description... | `"primary" \| "quaternary" \| "secondary" \| "tertiary"`                                                                                                                                       | `'primary'` |
| `type`              | `type`     | Description... | `"button"`                                                                                                                                                                                     | `undefined` |

## Dependencies

### Used by

- [ezp-auth](../ezp-auth)
- [ezp-printer-selection](../ezp-printer-selection)
- [ezp-printing](../ezp-printing)
- [ezp-user-menu](../ezp-user-menu)

### Depends on

- [ezp-icon](../ezp-icon)

### Graph

```mermaid
graph TD;
  ezp-icon-button --> ezp-icon
  ezp-auth --> ezp-icon-button
  ezp-printer-selection --> ezp-icon-button
  ezp-printing --> ezp-icon-button
  ezp-user-menu --> ezp-icon-button
  style ezp-icon-button fill:#f9f,stroke:#333,stroke-width:4px
```

---
