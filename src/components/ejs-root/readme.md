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
  ejs-print --> ejs-input-select
  ejs-print --> ejs-auth
  ejs-input-select --> ejs-typo-body
  ejs-input-select --> ejs-icon
  style ejs-root fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


