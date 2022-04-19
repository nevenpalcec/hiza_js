if (typeof hiza === 'undefined') {
    hiza = {};
}

hiza.import = new function() {

    // Import CSS file to current page
    this.style = function(url) {

        var fp_style = document.createElement('link');
        fp_style.rel = 'stylesheet';
        fp_style.href = url;
        document.head.appendChild(fp_style);
    }

    // Import script to current page
    this.script = function(url) {
        
        var fp_script = document.createElement('script');
        fp_script.src = url;
        document.head.appendChild(fp_script);
    }

    this.html = async function(destination_el, url) {

        destination_el.innerHTML = await fetch(url).then(res => res.text());

        // Note: stylesheets are loaded by default

        // Load scripts
        let scripts = destination_el.querySelectorAll('script');

        for (let s of scripts) {

            if (s.src) {
                eval(await fetch(s.src).then(res => res.text()));
            }
            else {
                eval(s.innerText);
            }
        }
    }

}
