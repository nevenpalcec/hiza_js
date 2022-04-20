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
    this.script = function(url, callback) {
        
        var fp_script = document.createElement('script');
        fp_script.src = url;
        fp_script.onload = callback;
        document.head.appendChild(fp_script);
    }

    // Run script in global scope
    this.run_globally = function(javascript) {

        var fp_script = document.createElement('script');
        fp_script.innerText = javascript;
        document.body.append(fp_script);
    }

    // Load HTML and its CSS, JS
    this.html = async function(destination_el, url) {

        // Load HTML into destination element
        destination_el.innerHTML = await fetch(url).then(res => res.text());
        
        // Load scripts
        let scripts = destination_el.querySelectorAll('script');
        
        for (let s of scripts) {
            
            if (s.src) {
                hiza.import.run_globally(await fetch(s.src).then(res => res.text()));
            }
            else {
                hiza.import.run_globally(s.innerText);
            }
        }

        // Stylesheets are loaded by default
    }


}
