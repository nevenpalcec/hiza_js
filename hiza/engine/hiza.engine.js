
if (typeof hiza === 'undefined') {
    hiza = {};
}

hiza.engine = new function() {

    function check_illegal(html) {

        let errors = [];

        let scripts_rgx = Array.from(html.matchAll(/<script>/g));
        scripts_rgx.forEach(rgx => {
            errors.push(
                'Found <script> element without [hiza-async] attribute ' +
                'at index ' + rgx['index'] + '. Please use <script hiza-async> or <script hiza-defer>.'
            );
        });

        if (errors.length > 0) {
            
            let pretty_err_arr = errors.map((er, idx) => {
                return '\t' + (idx + 1) + ': ' + er
            }).join('\n');
            throw `Errors found in html:\n` + pretty_err_arr;
        }
    }

    // Decode chars such as &lt; to <
    function decode(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
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
        // // Create scoped variables
        // for (let [var_name, var_value] of Object.entries(__variables__)) {
        //     eval('var ' + var_name + ' = ' + JSON.stringify(var_value));
        // }

        // Run
        return eval('`' + scope_str + '`');
    }

    function exec_js(condit_str, __variables__) {

        eval(scope_vars_js('__variables__', __variables__));
        // // Create scoped variables
        // for (let [var_name, var_value] of Object.entries(__variables__)) {
        //     eval(`var ${var_name} = __variables__['${var_name}']`);
        // }

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
                openings.unshift(i);
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

    async function process_script(html, regx, variables) {

        let txt = regx[0];
        // let scope_name = regx[4];
        let scope_name = 'SCOPE';

        let script_start = regx['index'];
        let script_scope_start = script_start + txt.length - 1;
        // let script_scope_end = regx[1] == '<script>' ? get_script_end(html, script_start) : get_scope_end(html, script_scope_start);
        let script_scope_end = get_script_end(html, script_start);
        let scope_html = html.substring(script_scope_start + 1, script_scope_end);
        scope_html = decode(scope_html);

        await exec_script_scope(`
            async function __f__() {
                ${scope_html}
            }
            __f__()
        `, scope_name, variables);

        script_scope_end += '</script>'.length - 1;
        return html.substring(0, script_start) + html.substring(script_scope_end + 1);
    }

    async function process_for(html, regx, variables) {

        let txt = regx[0];
        let condition = regx[4];
        let _loop_var_ = condition.match(/(var|let) (\w+)/)[2];

        // Decode entities to text
        condition = decode(condition);

        let _for_start = regx['index'];
        let _for_scope_start = _for_start + txt.length - 1;
        let _for_scope_end = get_scope_end(html, _for_scope_start);
        let scope_html = html.substring(_for_scope_start + 1, _for_scope_end);

        let result = await exec_js(`

            async function __f__() {
                
                let result = '';
                eval(scope_vars_js('variables', variables));
    
                for (${condition}) {
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
            'scope_html': scope_html
        });

        html = html.substring(0, _for_start) + result + html.substring(_for_scope_end + 1);
        return html;
    }

    function process_if(html, regx, variables) {

        let txt = regx[0];
        let condition = regx[3];
        let _if_start = regx['index'];
        let if_scope_start = _if_start + txt.length - 1;
        let if_scope_end = get_scope_end(html, if_scope_start);

        // Decode entities to text
        condition = decode(condition);

        let global_else_if_end = if_scope_end + 1;

        // Try to find else ifs
        let else_ifs = [];
        let _else_result = null;
        let html_after = html.substring(if_scope_end);
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
                let _elseif_condition = decode(else_if[2]);
                
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

        if (exec_js(condition, variables)) {
            result = html.substring(if_scope_start + 1, if_scope_end);
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

        html = html.substring(0, _if_start) + result + html.substring(global_else_if_end + 1);

        return html;
    }

    this.build = async function (html, variables) {

        if (typeof variables === 'undefined') {
            variables = {};
        }

        // Check for illegal commands or unsupported features
        check_illegal(html);
        
        // Remove comments
        html = remove_comments(html);

        html = html.replaceAll(/<script hiza-async=?(""|''|)>/g, '<script>');
        // html = html.replaceAll('<script hiza-async="">', '<script>');

        // // Convert chars such as &lt; to <
        // html = decode(html);

        let max_magic = 1000000;

        while (--max_magic) {

            // Try to find: <script>, $if, $for
            let magic = html.match(/(<script>|\$(if|for)\s*(\(([^{]+)\)|)\s*\{)/);
            // Try to find: <script>, $if, $for, $script, $script(SCOPE_NAME)
            // let magic = html.match(/(<script>|\$(if|for|script)\s*(\(([^)]+)\)|)\s*\{)/);

            if (!magic) {
                break;
            }

            if (magic[2] == 'if') {
                html = process_if(html, magic, variables);
            }
            else if (magic[2] == 'for') {
                html = await process_for(html, magic, variables);
            }
            else if (magic[1] == '<script>') {
                html = await process_script(html, magic, variables);
            }
        }

        return exec_scope(html, variables);
    }

    this.init_one = async function(template) {

        template.hiza = {
            run: () => hiza.engine.init_one(template)
        };

        // Find [data-dest]
        let destination = template.dataset['dest'];
        let scope = {
            'SELF': template,
        };

        if (destination) {
            destination = document.querySelector(destination);
            scope['DEST'] = destination;
        }
        else {
            console.log('Hiža: [data-dest] not found. Engine will overwrite the <template> element.')
        }

        async function build_and_deploy() {

            let templated_html = await hiza.engine.build(template.innerHTML, scope);
            if (destination) {
                destination.innerHTML = templated_html;
            }
            else {
                template.outerHTML = templated_html;
            }
        }

        if (isNaN(template.dataset.timeout) == false) {

            setTimeout(build_and_deploy, template.dataset.timeout);
        }
        else if (isNaN(template.dataset.interval) == false) {

            setInterval(build_and_deploy, template.dataset.timeout);
        }
        else {
            await build_and_deploy();
        }
    }

    this.init = function() {
        // Init
        document.querySelectorAll('template[hiza]').forEach(hiza.engine.init_one);
    }
};

if (typeof DISABLE_HIZA_ENGINE === 'undefined' || DISABLE_HIZA_ENGINE !== true) {
    window.addEventListener('load', hiza.engine.init);
}
