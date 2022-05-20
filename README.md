# Hiža.js

## Imports
[hiza.core](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/core/hiza.core.js)  
[hiza.engine](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/engine/hiza.engine.js)  
[hiza.import](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/import/hiza.import.js)  
[hiza.dropdown](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/components/hiza.dropdown.js)  
[hiza.anim](https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/components/hiza.anim.css)

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
    <button class="hiza_dropdown-btn hiza_dropdown-toggle" type="button" style="max-width: 13rem;"
        data-value="02">Select example</button>
    <ul class="hiza_dropdown-menu hidden">
        <li class="hiza_dropdown-item" data-value="01">Example 01</li>
        <li class="hiza_dropdown-item" data-value="02">Example 02</li>
        <li class="hiza_dropdown-item" data-value="03">Example 03</li>
    </ul>
</div>
```
