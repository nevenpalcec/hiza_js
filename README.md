    var DISABLE\_HIZA\_INIT = true; .page\_title { font-family: 'Courier New', Courier, monospace; display: inline-block; text-decoration: underline; } .tutorial { padding: 5px 10px; /\* border-bottom: 1px solid black; \*/ } .tutorial pre { border: 1px solid lightgray; border-left: 4px solid #04AA6D; white-space: pre-wrap; word-wrap: break-word; }

hiza.engine
===========

### Import

    <!-- Disable automatic hiza.engine.init() -->
    <script>
        var DISABLE\_HIZA\_INIT = true;
    </script>

    <script src="https://raw.githubusercontent.com/nevenpalcec/hiza\_js/main/hiza/engine/hiza.engine.js">
                

### <template hiza>

### <script hiza-async>

### $if, $else if, $else

### $for (let idx ...)

### $for (let ... of)                

tut\_1.innerText = '' + \` <div id="container"></div> <template id="templ\_id" hiza data-dest="#container"> <!-- Code... --> </template> \\n\`; tut\_2.innerText = '' + \` // Code inside <script hiza-async> /\* Keywords: SCOPE - template scope SCOPE.DEST - destination element \*/ // Put variable on global scope SCOPE\['objects'\] = \[1, 2, 3\]; // Using await blocks processing until <script> is finished SCOPE\['objects'\] = await fetch(...).then(res => res.json()); \\n\`; tut\_3.innerText = '' + \` <div id="container"></div> <template id="templ\_id" hiza data-dest="#container"> <!-- Use variable of SCOPE --> $if (objects.length > 10) { <span> Found a lot of objects </span> } $else if (objects.length > 5) { <span> Found some objects </span> } $else { <!-- Print variable --> Found \\${ objects.length } objects. } </template> \\n\`; tut\_4.innerText = '' + \` <div id="container"></div> <template id="templ\_id" hiza data-dest="#container"> $for (let i = 0; i < objects.length; ++i) { <!-- Write objects --> Objects \\${i}: \\${ objects\[i\] } <br> } </template> \\n\`; tut\_5.innerText = '' + \` <div id="container"></div> <template id="templ\_id" hiza data-dest="#container"> $for (let object of objects) { <!-- Write objects --> Object: \\${ object } <br> } </template> \\n\`;