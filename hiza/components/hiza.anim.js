if (typeof hiza === 'undefined') {
    var hiza = {};
}

hiza.anim = new function() {

    async function import_css(url) {

        if (typeof h_anim_style === 'undefined') {
            let css = await fetch(url).then(res => res.text());
            let style = document.createElement('style');
            style.id = 'h_anim_style';
            style.innerHTML = css;
            document.head.insertAdjacentHTML('beforeend', style);
        }
    }

    this.fade_in = async function(element) {
        
        import_css('https://cdn.jsdelivr.net/gh/nevenpalcec/hiza_js/hiza/components/hiza.anim.css');
        
        element.classList.add('h-fade_in');
    }
}