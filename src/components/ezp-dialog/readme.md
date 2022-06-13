# ezp-dialog

<!-- Auto Generated Below -->

## Properties

| Property      | Attribute     | Description | Type                                                                                                                                                                                                                                                                                                                 | Default                             |
| ------------- | ------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `action`      | `action`      |             | `string`                                                                                                                                                                                                                                                                                                             | `i18next.t('button_actions.close')` |
| `description` | `description` |             | `string`                                                                                                                                                                                                                                                                                                             | `undefined`                         |
| `heading`     | `heading`     | Properties  | `string`                                                                                                                                                                                                                                                                                                             | `undefined`                         |
| `iconFramed`  | `icon-framed` |             | `boolean`                                                                                                                                                                                                                                                                                                            | `true`                              |
| `iconName`    | `icon-name`   |             | `"account" \| "checkmark" \| "close" \| "color" \| "copies" \| "dark" \| "duplex" \| "expand" \| "help" \| "light" \| "logout" \| "menu" \| "minus" \| "orientation" \| "plus" \| "printer" \| "quality" \| "size" \| "system" \| "drag-drop" \| "checkmark-alt" \| "question-mark" \| "exclamation-mark" \| "logo"` | `undefined`                         |
| `iconSize`    | `icon-size`   |             | `"huge" \| "large" \| "normal"`                                                                                                                                                                                                                                                                                      | `'large'`                           |
| `instance`    | `instance`    |             | `string`                                                                                                                                                                                                                                                                                                             | `undefined`                         |

## Events

| Event          | Description | Type               |
| -------------- | ----------- | ------------------ |
| `dialogAction` |             | `CustomEvent<any>` |
| `dialogClose`  | Events      | `CustomEvent<any>` |

## Dependencies

### Used by

- [ezp-auth](../ezp-auth)
- [ezp-printing](../ezp-printing)

### Depends on

- [ezp-icon-button](../ezp-icon-button)
- [ezp-icon](../ezp-icon)
- [ezp-label](../ezp-label)
- [ezp-text-button](../ezp-text-button)

### Graph

```mermaid
graph TD;
  ezp-dialog --> ezp-icon-button
  ezp-dialog --> ezp-icon
  ezp-dialog --> ezp-label
  ezp-dialog --> ezp-text-button
  ezp-icon-button --> ezp-icon
  ezp-text-button --> ezp-label
  ezp-auth --> ezp-dialog
  ezp-printing --> ezp-dialog
  style ezp-dialog fill:#f9f,stroke:#333,stroke-width:4px
```

---
