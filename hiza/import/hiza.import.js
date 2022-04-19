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

    // Load html with its css and js
    this.html = async function(destination_el, url) {
        destination_el.innerHTML = `<object type="text/html" data="${url}" ></object>`;
    }

}
