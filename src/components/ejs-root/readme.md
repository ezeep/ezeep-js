# ejs-root

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type     | Default     |
| ------------- | ------------- | ----------- | -------- | ----------- |
| `clientid`    | `clientid`    |             | `string` | `undefined` |
| `redirecturi` | `redirecturi` |             | `string` | `undefined` |


## Methods

### `closePrint() => Promise<void>`

Description...

#### Returns

Type: `Promise<void>`



### `openPrint() => Promise<void>`

Description...

#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [ejs-print](../ejs-print)

### Graph
```mermaid
graph TD;
  ejs-root --> ejs-print
  ejs-print --> ejs-typo-body
  ejs-print --> ejs-icon-button
  ejs-print --> ejs-select
  ejs-print --> ejs-text-button
  ejs-print --> ejs-auth
  ejs-icon-button --> ejs-icon
  ejs-select --> ejs-icon
  ejs-select --> ejs-typo-body
  ejs-text-button --> ejs-typo-body
  style ejs-root fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


