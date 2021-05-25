# ejs-print

<!-- Auto Generated Below -->

## Properties

| Property       | Attribute       | Description    | Type      | Default |
| -------------- | --------------- | -------------- | --------- | ------- |
| `withBackdrop` | `with-backdrop` | Description... | `boolean` | `true`  |

## Events

| Event         | Description    | Type                      |
| ------------- | -------------- | ------------------------- |
| `printCancel` | Description... | `CustomEvent<MouseEvent>` |
| `printSubmit` | Description... | `CustomEvent<MouseEvent>` |

## Dependencies

### Used by

- [ejs-root](../ejs-root)

### Depends on

- [ejs-typo-body](../ejs-typo-body)
- [ejs-input-select](../ejs-input-select)

### Graph

```mermaid
graph TD;
  ejs-print --> ejs-typo-body
  ejs-print --> ejs-input-select
  ejs-input-select --> ejs-typo-body
  ejs-input-select --> ejs-icon
  ejs-root --> ejs-print
  style ejs-print fill:#f9f,stroke:#333,stroke-width:4px
```

---
