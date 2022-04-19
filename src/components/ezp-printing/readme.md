# ezp-root

<!-- Auto Generated Below -->


## Properties

| Property          | Attribute         | Description | Type                                                                               | Default     |
| ----------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------- | ----------- |
| `appearance`      | `appearance`      |             | `"dark" \| "light" \| "system"`                                                    | `'system'`  |
| `authapihosturl`  | `authapihosturl`  |             | `string`                                                                           | `undefined` |
| `clientid`        | `clientid`        |             | `string`                                                                           | `undefined` |
| `custom`          | `custom`          |             | `boolean`                                                                          | `undefined` |
| `file`            | --                |             | `File`                                                                             | `undefined` |
| `fileid`          | `fileid`          |             | `string`                                                                           | `undefined` |
| `filename`        | `filename`        |             | `string`                                                                           | `''`        |
| `filetype`        | `filetype`        |             | `string`                                                                           | `undefined` |
| `fileurl`         | `fileurl`         |             | `string`                                                                           | `undefined` |
| `hidelogin`       | `hidelogin`       |             | `boolean`                                                                          | `undefined` |
| `hidemenu`        | `hidemenu`        |             | `boolean`                                                                          | `false`     |
| `language`        | `language`        |             | `string`                                                                           | `''`        |
| `printapihosturl` | `printapihosturl` |             | `string`                                                                           | `undefined` |
| `redirecturi`     | `redirecturi`     |             | `string`                                                                           | `undefined` |
| `theme`           | `theme`           |             | `"blue" \| "cyan" \| "green" \| "orange" \| "pink" \| "red" \| "teal" \| "violet"` | `'cyan'`    |
| `trigger`         | `trigger`         |             | `"button" \| "custom" \| "file"`                                                   | `undefined` |


## Methods

### `getAuthUri() => Promise<string>`



#### Returns

Type: `Promise<string>`



### `getSasUri() => Promise<string>`



#### Returns

Type: `Promise<string>`



### `logOut() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `open() => Promise<void>`


Public methods

#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [ezp-upload](../ezp-upload)
- [ezp-icon-button](../ezp-icon-button)
- [ezp-auth](../ezp-auth)
- [ezp-printer-selection](../ezp-printer-selection)
- [ezp-dialog](../ezp-dialog)

### Graph
```mermaid
graph TD;
  ezp-printing --> ezp-upload
  ezp-printing --> ezp-icon-button
  ezp-printing --> ezp-auth
  ezp-printing --> ezp-printer-selection
  ezp-printing --> ezp-dialog
  ezp-upload --> ezp-icon
  ezp-upload --> ezp-label
  ezp-icon-button --> ezp-icon
  ezp-auth --> ezp-status
  ezp-auth --> ezp-text-button
  ezp-auth --> ezp-dialog
  ezp-status --> ezp-icon
  ezp-status --> ezp-label
  ezp-status --> ezp-text-button
  ezp-text-button --> ezp-label
  ezp-dialog --> ezp-icon-button
  ezp-dialog --> ezp-icon
  ezp-dialog --> ezp-label
  ezp-dialog --> ezp-text-button
  ezp-printer-selection --> ezp-status
  ezp-printer-selection --> ezp-label
  ezp-printer-selection --> ezp-icon-button
  ezp-printer-selection --> ezp-select
  ezp-printer-selection --> ezp-stepper
  ezp-printer-selection --> ezp-text-button
  ezp-printer-selection --> ezp-user-menu
  ezp-select --> ezp-backdrop
  ezp-select --> ezp-icon
  ezp-select --> ezp-label
  ezp-stepper --> ezp-icon
  ezp-stepper --> ezp-label
  ezp-user-menu --> ezp-backdrop
  ezp-user-menu --> ezp-label
  ezp-user-menu --> ezp-icon-button
  ezp-user-menu --> ezp-icon
  style ezp-printing fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


