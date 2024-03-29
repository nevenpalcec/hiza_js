
if (typeof hiza === 'undefined') {
    hiza = {};
}

hiza.engine = new function() {

    let GLOBAL = {};
    this.ver = '2022-04-08';

    // Used to convert strings to literal chars,
    // e.g.  hiza.engine._lit`encoded newline: \n`
    this._lit = function(str) {
        return str.raw[0];
    }

    // Decode chars such as &lt; to <
    this.decode = function (html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html || '';
        return txt.value;
    }

    // Encode chars such as < to &lt;
    this.encode = function(html) {
        var div = document.createElement('div');
        div.innerText = html;
        return div.innerHTML;
    }

    this.sleep = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.innertext = function(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.innerText;
    }

    this.fetch_remote = async function(url, body) {
        
        let data = null;

        if (typeof body === 'undefined') {
            data = await fetch(url).then(res => res.text());
        }
        else {
            data = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(body)
            }).then(res => res.text());
        }

        if (url.endsWith('.js')) {
            data = '<script>\n    // Fetched by hiza.engine: "' + url + "'\n" +
                data.replace('\n', '\n    ').trim() + '\n</script>';
        }
        return data;
    }

    // Insert HTML or script from source without script exec
    this.load_no_execute = async function(destination_el, url, body, insert_pos = 'beforeend') {

        let data = await hiza.engine.fetch_remote(url, body);

        if (destination_el.tagName == 'TEMPLATE') {

            // insertAdjacentHTML does not work on <template>
            destination_el.innerHTML += data;
        }
        else {
            destination_el.insertAdjacentHTML(insert_pos, data);
        }
    }

    this.exec_element_scripts = async function(parent_el, remote_path='') {

        // Load and/or execute scripts
        let defers = [];

        for (let script of parent_el.querySelectorAll('script')) {

            if ((script.src || '').startsWith('./') && remote_path) {

                // Allow script URLs that start with './...'
                let dir_path = remote_path.replace(/\/[^\/]+$/, '');
                script.src = script.src.replace(/^\.\//, dir_path);
            }

            if (!script.src) {

                // Inline
                eval(script.innerText);
            }
            else if (script.async) {

                // Async
                fetch(script.src).then(res => res.text()).then(eval);
            }
            else if (script.defer) {

                // Defer
                d_scripts.push(fetch(script.src).then(res => res.text()));
            }
            else {

                // Sync
                eval(await fetch(script.src).then(res => res.text()));
            }
        }

        // Run defer scripts
        for (let d_script of defers) {
            await d_script.then(eval);
        }
    }

    // Load HTML page
    this.load = async function(destination_el, url, body) {

        // Load HTML first
        await hiza.engine.load_no_execute(destination_el, url, body);

        // Exec scripts
        await hiza.engine.exec_element_scripts(destination_el, url);

    }

    /*
        Extract data:
        -
        -
        ...
    */
    function extract_regex_data(regx) {

        let condition = regx[4];
        if (condition) {
            condition = condition.slice(1, -1);
        }

        let mag = {
            'expr': regx[1],
            'script_attr': regx[2],
            'keyword': regx[3],
            'condition': condition,
            'start': regx['index'],
            'scope_start': regx['index'] + regx[0].length - 1,
            'is_sync': (regx[2] == 'sync'),
            'is_async': (regx[2] == 'async'),
            'is_defer': (regx[2] == 'defer')
        };

        // Find script end
        if (typeof mag.keyword !== 'undefined') {
            
            mag['scope_end'] = get_scope_end(regx['input'], mag['scope_start']);
        }
        else if (typeof mag.script_attr !== 'undefined') {
            mag['scope_end'] = get_script_end(regx['input'], mag['scope_start']);
        }
        else {
            // Odd behaviour - regx should either catch script or $keyword
            throw new Error('Unexpected error.');
        }

        // Get text between scope start and end
        mag['scope_html'] = regx['input'].substring(mag['scope_start'] + 1, mag['scope_end']);
        mag['condition'] = hiza.engine.decode(mag['condition']);

        return mag;
    }

    function replace_substring(text, start_idx, end_idx, replacement) {
        return text.substring(0, start_idx) + replacement + text.substring(end_idx);
    }

    function make_regexp(raw_reg = [], prn_reg = []) {

        if (raw_reg.length + prn_reg.length == 0) {
            throw Error('Invalid call of make_regexp');
        }

        let mag_prn_arg = hiza.engine._lit`\s*(|\([^{]*\))`;
        let mag_parentheses = hiza.engine._lit`\$(`
            + prn_reg.join('|') + ')'
            + mag_prn_arg
            + hiza.engine._lit`\s*\{`;

        let magic_regex = new RegExp(
            '('
            + raw_reg.join('|') + '|'
            + mag_parentheses
            + ')'
        );
        return magic_regex;
    }

    function check_illegal(html) {

        let errors = [];
        let warnings = [];

        let scripts_rgx = Array.from(html.matchAll(/<script>/g));
        scripts_rgx.forEach(rgx => {
            warnings.push(
                'Found <script> element without [hiza-*] attribute ' +
                'at index ' + rgx['index'] + '. These scripts are run after template is done drawing.'
            );
        });

        if (errors.length > 0) {
            
            let pretty_err_arr = errors.map((er, idx) => {
                return '\t' + (idx + 1) + ': ' + er
            }).join('\n');
            throw `Errors found in html:\n` + pretty_err_arr;
        }
        if (warnings.length > 0) {
            
            let pretty_err_arr = warnings.map((er, idx) => {
                return '\t' + (idx + 1) + ': ' + er
            }).join('\n');
            console.warn(`HIŽA notices:\n` + pretty_err_arr);
        }
    }

    function remove_comments(html) {
        
        for (let idx = html.indexOf('<!--'); idx > 0; idx = html.indexOf('<!--')) {
            let end = html.indexOf('-->', idx);
            html = html.substring(0, idx) + html.substring(end + 3);
        }
        return html;
    }

    function scope_vars_js(namespace, __variables__) {

        let javascript = '';
        for (let [var_name, var_value] of Object.entries(__variables__)) {
            javascript += `var ${var_name} = ${namespace}['${var_name}']; \n`;
        }
        return javascript
    }

    function exec_scope(scope_str, __variables__) {

        eval(scope_vars_js('__variables__', __variables__));

        // Run
        return eval('`' + scope_str + '`');
    }

    function exec_js(condit_str, __variables__) {

        eval(scope_vars_js('__variables__', __variables__));

        // Run
        return eval(condit_str);
    }

    function exec_script_scope(script_str, var_name, __variables__) {

        if (var_name) {
            eval(`var ${var_name} = __variables__;`);
        }
        return eval(script_str);
    }

    function get_script_end(txt, script_start) {

        let end = txt.indexOf('</script>', script_start);
        if (end < 0) {
            throw new Error('Found unclosed <script> tag.');
        }
        return end;
    }

    function get_scope_end(txt, scope_start) {

        let scope_end = -1;
        let openings = [];

        for (let i = scope_start; i < txt.length; ++i) {

            // Ignore brackets if they are in an entity
            if (txt[i] == '{' || txt[i] == '}') {

                let entity_check = txt.substring(i - 3, i + 3);
                if (entity_check == "${'{'}" || entity_check == "${'}'}") {
                    continue;
                }
            }

            if (txt[i] == '{') {
                openings.push(i);
            }
            else if (txt[i] == '}') {

                if (openings.length == 0) {
                    // Error
                    break;
                }
                if (openings.length == 1) {
                    // Found scope end
                    scope_end = i;
                    break;
                }

                // Found a matching opening bracket
                openings.shift();
            }
        }

        return scope_end;
    }

    async function process_script(html, mag, variables, config) {

        // mag['scope_html'] = hiza.engine.decode(mag['scope_html']);

        async function exec () {

            let prom = exec_script_scope(`
                ${mag['is_sync'] ? '' : 'async'} function _hiza_script_() {
                    ${mag['scope_html']}
                }
                _hiza_script_()
            `, 'SCOPE', variables);

            if (mag['is_sync'] == false) {
                await prom;
            }
        }

        if (mag['script_attr'] == 'defer') {

            config['defer'].push(exec);
        }
        else {
            await exec();
        }

        return replace_substring(html, mag['start'], mag['scope_end'] + '</script>'.length, '');
        // return html.substring(0, script_start) + html.substring(script_scope_end + 1);
    }

    async function process_for(html, mag, variables) {

        let _loop_var_ = mag['condition'].match(/(var |let |)\s*(\w+)/)[2];

        let result = await exec_js(`

            async function __f__() {
                
                let result = '';
                eval(scope_vars_js('variables', variables));
    
                for (${mag['condition']}) {
                    let variables_copy = {
                        ...variables,
                        '${_loop_var_}': ${_loop_var_}
                    };
                    result += await hiza.engine.build(scope_html, variables_copy);
                }
    
                return result;
            }
            __f__()
        `, {
            'variables': variables,
            'scope_html': mag['scope_html']
        });

        return replace_substring(html, mag['start'], mag['scope_end'] + 1, result);
        // return html.substring(0, mag['start']) + result + html.substring(mag['scope_end'] + 1);
    }

    function process_if(html, mag, variables) {

        let global_else_if_end = mag['scope_end'] + 1;

        // Try to find else ifs
        let else_ifs = [];
        let _else_result = null;
        let html_after = html.substring(mag['scope_end']);
        let else_if_regex = /^\}\s*\$(else\s+if|else)(\s*\([^{]+\)|\s*)\s*\{/;

        for (let else_if = html_after.match(else_if_regex); !!else_if == true; else_if = html_after.match(else_if_regex)) {

            else_if[2] = else_if[2].trim();
            if (else_if[1] == 'else') {

                let _else_start = else_if['index'] + else_if[0].length;
                let _else_end = get_scope_end(html_after, _else_start - 1);
                _else_result = html_after.substring(_else_start, _else_end);

                global_else_if_end += _else_end;
            }
            else if (else_if[1] == 'else if') {

                if (!!else_if[2].match(/^\([^)]+\)$/) == false) {
                    throw new Error('Found an "else if" without a condition.');
                }
                let _elseif_start = else_if['index'] + else_if[0].length + 1;
                let _elseif_end = get_scope_end(html_after, _elseif_start - 2);
                let _elseif_res = html_after.substring(_elseif_start, _elseif_end);

                // Decode entities to text
                let _elseif_condition = hiza.engine.decode(else_if[2]);
                
                // Decode entities to text
                else_ifs.push({
                    'condition': _elseif_condition,
                    'result': _elseif_res
                });
                global_else_if_end += _elseif_end;
            }

            html_after = html.substring(global_else_if_end - 1);

            if (_else_result !== null) {
                // stop after processing 'else'
                break;
            }
        }

        let result = '';

        if (exec_js(mag['condition'], variables)) {
            result = html.substring(mag['scope_start'] + 1, mag['scope_end']);
        }
        else {
            let condition_found = false;

            else_ifs.forEach(else_if => {
                if (condition_found == false && exec_js(else_if['condition'], variables)) {
                    condition_found = true;
                    result = else_if['result'];
                }
            })

            if (condition_found == false && _else_result != null) {

                // Put _else_result or '' if it is null
                result = _else_result || '';
            }
        }

        return replace_substring(html, mag['start'], global_else_if_end + 1, result);
        // return html.substring(0, mag['start']) + result + html.substring(global_else_if_end + 1);
    }

    // $decode {}
    function process_decode(html, mag, variables) {

        let data = exec_scope(mag['scope_html'], variables)
        let decoded = hiza.engine.decode(data);
        return replace_substring(html, mag['start'], mag['scope_end'] + 1, decoded);
    }

    // $encode {}
    function process_encode(html, mag, variables) {

        let data = exec_scope(mag['scope_html'], variables);
        let encoded = hiza.engine.encode(data);
        let res_html = replace_substring(html, mag['start'], mag['scope_end'] + 1, encoded);

        return res_html.replaceAll('\n', ' ');
    }

    // $innertext {}
    function process_innertext(html, mag, variables) {

        let data = exec_scope(mag['scope_html'], variables);
        let innertext = hiza.engine.innertext(data);

        // Remove whitespaces
        innertext = innertext.trim().replace(/\s*\n+\s*/g, '<br>');
        return replace_substring(html, mag['start'], mag['scope_end'] + 1, innertext);
    }

    // $json, $formatted
    function process_json(html, mag, variables, pretty=false) {

        mag['scope_html'] = hiza.engine.decode(mag['scope_html']);
        let obj = exec_js(`
            let _o_ = ${mag['scope_html']};
            _o_
        `, variables);
        let args = pretty ? 'obj, null, 2' : 'obj';

        let json = eval(`JSON.stringify(${args})`);

        if (pretty) {

            // Convert prettified JSON to HTML
            json = hiza.engine.encode(json).replace(/ /g, '&nbsp;');
        }
        return replace_substring(html, mag['start'], mag['scope_end'] + 1, json);
    }

    this.build = async function (html, variables, config = {}) {
        
        if (typeof variables === 'undefined') {
            variables = {};
        }
        
        // Check for illegal commands or unsupported features
        check_illegal(html);
        
        // Remove comments
        html = remove_comments(html);
        
        // Remove ="" from script
        html = html.replaceAll(/<script hiza-(a?sync|defer)=?(""|''|)>/g, '<script hiza-$1>');
        
        // Make regex to catch magic
        let mag_raw = [
            '<script hiza-(a?sync|defer)>',
        ];

        let mag_prn = [
            'if',
            'for',
            'decode',
            'encode',
            'innertext',
            'json',
            'formatted',
        ];

        let magic_regex = make_regexp(mag_raw, mag_prn);
        
        let max_magic = 100000;
        while (--max_magic) {

            // Try to find raw patterns or $keywords
            let magic = html.match(magic_regex);
            // /(<script hiza-(a?sync|defer)>|\$(if|for)\s*(|\([^{]*\))\s*\{)/

            if (!magic) {
                break;
            }

            // Extract data from regex result
            let mag = extract_regex_data(magic);

            if (mag.keyword == 'if') {
                html = process_if(html, mag, variables);
            }
            else if (mag.keyword == 'for') {
                html = await process_for(html, mag, variables);
            }
            else if (mag.keyword == 'decode') {
                html = process_decode(html, mag, variables);
            }
            else if (mag.keyword == 'encode') {
                html = process_encode(html, mag, variables);
            }
            else if (mag.keyword == 'innertext') {
                html = process_innertext(html, mag, variables);
            }
            else if (mag.keyword == 'json') {
                html = process_json(html, mag, variables);
            }
            else if (mag.keyword == 'formatted') {
                html = process_json(html, mag, variables, true);
            }
            else if (typeof mag.script_attr !== 'undefined') {
                html = await process_script(html, mag, variables, config);
            }
            else {
                console.warn('HIŽA: Keyword not implemented: $' + mag.keyword + '. Removing...');
                html = replace_substring(html, mag['start'], mag['scope_end'] + 1, '');
            }
        }

        if (max_magic == 0) {
            throw new Error('You have reached limit of one template: 100 000 expressions.');
        }

        return exec_scope(html, variables);
    }

    this.init_non_template = async function(el) {

        if (el.dataset.url) {
            await hiza.engine.load(el, el.dataset.url);
        }
        
    }

    // Get or make destination element
    function get_dest_el(template) {

        let data_dest = template.dataset.dest;
        let dest_el = null;

        // If [data-dest] exists
        if (data_dest) {
            
            dest_el = document.querySelector(data_dest);
        }

        // If not found
        if (!dest_el) {

            // If exists in scope
            if (template?.hiza?.SCOPE?.DEST) {
                return template.hiza.SCOPE['DEST'];
            }

            let warn_str = !template.id ? '.' : ` for #${template.id}.`;
            console.warn('HIŽA: Destination element or "data-dest" attribute not found' + warn_str +
                ' Hiža will insert a new <div> after the template.');
            dest_el = document.createElement('div');
            template.insertAdjacentElement('afterend', dest_el);
        }
        return dest_el;
    }

    // Handle [data-url]
    async function handle_remote_template(template) {

        // Reset initial HTML
        template.innerHTML = template?.hiza?.initial_html || '';

        let req_body;
        
        if (template.hasAttribute('data-body')) {

            // Parse body
            req_body = JSON.parse(template.dataset.body);
            
            // Save to SCOPE.REQUEST
            template.hiza.SCOPE.REQUEST = {
                'body': req_body
            };
        }
        await hiza.engine.load_no_execute(template, template.dataset.url, req_body);
    }

    this.init_one = async function(template) {

        // Process other type of element
        if (template.tagName != 'TEMPLATE') {
            await hiza.engine.init_non_template(template);
            return;
        }

        // Template destination
        let dest_el = get_dest_el(template);
        
        // Make scope
        let scope = {
            ...(template?.hiza?.SCOPE || {}),

            'SELF': template,
            'DEST': dest_el,
            'REQUEST': {}
        };

        // Make namespace on <template>
        // Reuse values if exist
        template.hiza = {
            run: () => hiza.engine.init_one(template),
            SCOPE: template?.hiza?.SCOPE || scope,
            initial_html: template?.hiza?.initial_html ?? template.innerHTML,
            interval_tid: template?.hiza?.interval_tid || null,
            timeout_tid: template?.hiza?.timeout_tid || null,
        };

        // Templating configuration
        var config = {

            // Defer script container
            'defer': []
        };

        async function build_and_deploy() {
            
            // Remote template
            if (template.dataset.url) {
                await handle_remote_template(template);
            }

            // Generate HTML
            let templated_html = await hiza.engine.build(template.innerHTML, scope, config);

            // Insert HTML
            dest_el.innerHTML = templated_html;

            // Run defer scripts
            for (let i = 0; i < config['defer'].length; ++i) {
                await config['defer'][i]();
            }

            // Run non-HIŽA scripts
            if (scope['DEST']) {
                hiza.engine.exec_element_scripts(scope['DEST']);
            }
        }

        // [data-timeout]
        if (isNaN(template.dataset.timeout) == false) {

            template.hiza.timeout_tid = setTimeout(build_and_deploy, template.dataset.timeout);
        }

        // [data-interval]
        else if (isNaN(template.dataset.interval) == false) {

            clearInterval(template.hiza.interval_tid);
            build_and_deploy();
            template.hiza.interval_tid = setInterval(async function() {
                
                try {
                    await build_and_deploy();
                }
                catch (err) {
                    console.error(err);
                    console.warn('HIŽA: Error found. Stopping interval...');
                    clearInterval(template.hiza.interval_tid);
                }
            }, template.dataset.interval);
            
        }

        // Regular templating (no timeout and interval)
        else {
            await build_and_deploy();
        }

    }

    this.init = async function(init_el) {

        if (typeof init_el?.querySelectorAll === 'undefined') {

            // Use document if element cannot select
            init_el = document;
        }

        // Run all at once
        let promises = [];
        for (let el of init_el.querySelectorAll('[hiza]')) {

            if (el.hasAttribute("data-ignore_init")) {
                continue;
            }

            let p = hiza.engine.init_one(el);
            promises.push(p);
        }

        // Wait for each to finish
        for (let p of promises) {
            await p;
        }
    }
};

// Initialize HIŽA namespace
window.addEventListener('load', function() {

    document.querySelectorAll('template[hiza]').forEach(template => {

        if (typeof template.hiza === 'undefined') {

            template.hiza = {
                run: () => hiza.engine.init_one(template)
            };
        }
    });
});

if (typeof DISABLE_HIZA_INIT === 'undefined' || DISABLE_HIZA_INIT !== true) {
    window.addEventListener('load', hiza.engine.init);
}
