# ezp-file-name



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Type                                     | Default       |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------- |
| `anchor`    | `anchor`    | What the tooltip is placed against.  `container`: the nearest positioned ancestor, by CSS alone. The consumer makes the row that ancestor, and the bubble opens at the row's edge.  `parent`: the element the name sits in, measured when the tooltip opens. For rows inside a scroll container, which would clip a bubble anchored to the row. The consumer puts the positioned ancestor outside the scroller instead, and the bubble spans that ancestor but lines up with the row. | `"container" \| "parent"`                | `'container'` |
| `level`     | `level`     | Type scale of the rendered name, passed through to `ezp-label`.                                                                                                                                                                                                                                                                                                                                                                                                                       | `"primary" \| "secondary" \| "tertiary"` | `'secondary'` |
| `name`      | `name`      | The full file name. Always present in the DOM, so screen readers and copy-paste get it in full however it is truncated on screen.                                                                                                                                                                                                                                                                                                                                                     | `string`                                 | `''`          |
| `placement` | `placement` | Side the tooltip opens on. Consumers point it away from the edge their row sits against — `bottom` for the first row of a list, `top` below it.                                                                                                                                                                                                                                                                                                                                       | `"bottom" \| "top"`                      | `'top'`       |
| `weight`    | `weight`    | Font weight of the rendered name, passed through to `ezp-label`.                                                                                                                                                                                                                                                                                                                                                                                                                      | `"heavy" \| "soft" \| "strong"`          | `'soft'`      |


## Dependencies

### Used by

 - [ezp-printer-selection](../ezp-printer-selection)
 - [ezp-upload](../ezp-upload)

### Depends on

- [ezp-label](../ezp-label)

### Graph
```mermaid
graph TD;
  ezp-file-name --> ezp-label
  ezp-printer-selection --> ezp-file-name
  ezp-upload --> ezp-file-name
  style ezp-file-name fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------


