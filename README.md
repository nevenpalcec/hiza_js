# Hiža.js

## Imports
[hiza.core](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/core/hiza.core.js)  
[hiza.engine](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/engine/hiza.engine.js)  
[hiza.import](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/import/hiza.import.js)  
[hiza.anim](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/components/hiza.anim.css)  
hiza.dropdown - [css](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/components/hiza.dropdown.js)
                [js](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/components/hiza.dropdown.css)  

## hiza.engine
[Open tutorial](https://app.my-rents.com/web/hiza-tutorial.html)
```html
<!-- Ever wanted to use a RAZOR-like synthax in HTML? -->
<template hiza>
    $if (3 == 2) {
        <h5> 3 == 2 </h5>
    }
    $else if (4 == 3) {
        <h5> 4 == 3 </h5>
    }
    $else {
        <h5> None of the conditions have been met. </h5>
    }
</template>
```

## hiza.dropdown
```html
<div id="dropdown_example" class="hiza_dropdown">
    <button class="hiza_dropdown-btn hiza_dropdown-toggle" type="button" data-value="">
      Select a peron
    </button>
    <ul class="hiza_dropdown-menu hidden">
        <li class="hiza_dropdown-item" data-value="1">John</li>
        <li class="hiza_dropdown-item" data-value="2">Catherine</li>
        <li class="hiza_dropdown-item" data-value="3">Mat</li>
    </ul>
</div>

<script>
    hiza.dropdown.init('#dropdown_example');
</script>
```
