
if (typeof hiza === 'undefined') {
    hiza = {};
}

hiza.core = new function () {

    this.test = () => {
        alert('JS tets: OK!');
    };

    // Make object and listen for its changes
    // - getter -> function(obj_in, key)
    // - setter -> function(obj_in, key, new_val)
    this.make_obj = function(obj_in, getter, setter) {

        var cfg = {};
        if (typeof getter === 'function') {
            cfg['get'] = getter;
        }
        if (typeof setter === 'function') {
            cfg['set'] = setter;
        }
        return new Proxy(obj_in, cfg);
    }

    // form logic
    this.form = new function () {

        this.submit = function (form, callback, async) {

            //get form
            var f = $(form);
            var url = f.attr('action');
            var data = decodeURIComponent(f.serialize());

            if (async == true) {
                return form_submit(url, data, callback);
            }
            else {
                return form_submit_async(url, data, callback);
            }
        }

        //submit form
        function form_submit(url, d, callback) {

            //debugger;

            var response;

            var request = $.ajax({
                type: "POST",
                url: url,
                data: d,
                dataType: "text",
                async: false

            });

            request.done(function (r) {
                //debugger;
                console.log('submit: done');

                response = r;

                if (callback !== undefined) {
                    callback();
                }
            });

            request.fail(function (jqXHR, textStatus) {
                console.log('submit error: ' + textStatus + ", " + jqXHR);
            });

            request.always(function (dataOrjqXHR, textStatus, jqXHRorErrorThrown) {
                Ladda.stopAll();
            });

            return response;
        };

        function form_submit_async(url, d, callback) {

            var response;

            var request = $.ajax({
                type: "POST",
                url: url,
                data: d,
                dataType: "text",
                async: true

            });

            request.done(function (r) {
                console.log('submit: done');

                response = r;

                if (callback !== undefined) {
                    callback();
                }
            });

            request.fail(function (jqXHR, textStatus) {
                console.log('submit error: ' + textStatus + ", " + jqXHR);
            });

            request.always(function (dataOrjqXHR, textStatus, jqXHRorErrorThrown) {
                Ladda.stopAll();
            });

            return response;
        };

        // serialize form
        this.serialize = function (form) {

            // Setup our serialized data
            var serialized = [];

            // Loop through each field in the form
            for (var i = 0; i < form.elements.length; i++) {

                var field = form.elements[i];

                // Don't serialize fields without a name, submits, buttons, file and reset inputs, and disabled fields
                if (!field.name || field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') continue;

                // If a multi-select, get all selections
                if (field.type === 'select-multiple') {
                    for (var n = 0; n < field.options.length; n++) {
                        if (!field.options[n].selected) continue;
                        serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.options[n].value));
                    }
                }

                // Convert field data to a query string
                else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
                    serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
                }
            }

            return serialized.join('&');
        }

        this.serialize_json = function (form) {
            var obj = {};
            var elements = form.querySelectorAll("input, select, textarea");
            for (var i = 0; i < elements.length; ++i) {
                var element = elements[i];
                var name = element.name;
                var value = element.value;

                if (name) {
                    obj[name] = value;
                }
            }
            return obj;
        }

        this.serialize_json_string = function (form) {
            var j = this.serialize_json(form);
            return JSON.stringify(j);
        }

        this.form_submit_auto = function (form_id) {

            //debugger;
            var url = document.getElementById(form_id).action;
            var data = $('#' + form_id).serialize();

            js.ajax.post_promise(url, data).then((data) => {

                //debugger;
                console.log('ok' + data);

            });

        }

    }

    // AJAX calls
    this.ajax = new function () {

        //POST syncronize
        this.post_sync = function (url, d) {

            //debugger;

            var xhttp = new XMLHttpRequest();
            xhttp.open("POST", url, false);
            xhttp.send(d);
            var response = xhttp.responseText;


        }

        //GET syncronize
        this.get_sync = function (url) {

            //debugger

            var xhttp = new XMLHttpRequest();
            xhttp.open("GET", url, false);
            xhttp.send();
            var response = xhttp.responseText;


        }

        // then
        this.get_promise = function (url) {

            //debugger;

            return new Promise(function (resolve, reject) {

                //debugger;

                var xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.onload = resolve;
                xhr.onerror = reject;

                try {
                    xhr.send();
                }
                catch (err) {
                    reject(err);
                }

            });

        }

        // then
        this.get_promis_reponse = function (url) {

            //debugger;

            return new Promise(function (resolve, reject) {

                //debugger;

                const xhr = new XMLHttpRequest();
                xhr.open("GET", url);
                xhr.onload = () => resolve(xhr.responseText);
                xhr.onerror = () => reject(xhr.statusText);
                xhr.send();

            });

        }

        // then
        this.post_promise = function (url, data) {

            //debugger;

            return new Promise(function (resolve, reject) {

                //debugger;

                var xhr = new XMLHttpRequest();
                xhr.open('POST', url);
                xhr.onload = resolve;
                xhr.onerror = reject;

                try {
                    xhr.send(data);
                }
                catch (err) {
                    reject(err);
                }

            });

        }

        this.vget = function (url, app, parametar, p) {
            $.ajax({
                method: "GET",
                url: url,
                success: function (data, status) {
                    app[parametar] = data;
                    Ladda.stopAll();
                    unblock_all();
                }
            });
        }

        this.vpost = function (url, json, app, parametar, p) {

            $.post(url, json, function (data) {
                app[parametar] = data;
                Ladda.stopAll();
                unblock_all();
            });

            //$.ajax({
            //    method: "POST",
            //    url: url,
            //    data: json,
            //    success: function (data, status) {
            //        app[parametar] = data;
            //        Ladda.stopAll();
            //        unblock_all();
            //    }
            //});
        }

        // post and save to vue varable
        this.vppost = function (url, json, variable) {
            $.ajax({
                method: "POST",
                url: url,
                data: json,
                success: function (data, status) {
                    variable = data;
                    Ladda.stopAll();
                    unblock_all();
                }
            });
        }

    }

    // script
    this.script = new function () {

        this.int = function (html) {
            var newElement = document.createElement('div');
            newElement.innerHTML = html;

            var scripts = newElement.getElementsByTagName("script");
            for (var i = 0; i < scripts.length; ++i) {
                var script = scripts[i];
                eval(script.innerHTML);
            }
        }

        this.include = function (file) {

            var script = document.createElement('script');
            script.src = file;
            script.type = 'text/javascript';
            script.defer = true;

            document.getElementsByTagName('head').item(0).appendChild(script);

        }

        // sleep function, stops excuting for some time
        // duration in ms
        this.sleep = function (duration) {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve()
                }, duration)
            })
        }
    }

    //array functions
    this.array = new function () {
        this.to_one_row = function (array, column) {
            var row = ''
            array.forEach(function (a) {
                //console.log(a, a[column], column);
                row += a[column] + ',';
            });
            return row;
        }

    }

    //Dates
    this.date = new function () {

        this.weekday = new Array(7);
        this.weekday[0] = "Sunday";
        this.weekday[1] = "Monday";
        this.weekday[2] = "Tuesday";
        this.weekday[3] = "Wednesday";
        this.weekday[4] = "Thursday";
        this.weekday[5] = "Friday";
        this.weekday[6] = "Saturday";

        // get 3 letter day
        this.weekday_3_letters = function (n) {
            var w = js.date.weekday[n];
            return w.substring(0, 3);
        }

        // get 2 day letter
        this.weekday_2_letters = function (n) {
            var w = js.date.weekday[n];
            return w.substring(0, 2);
        }

        //add days to date
        this.add_day = function (date, days) {

            // Copy to avoid changing the original
            var date_copy = new Date(date);

            // Ignore time
            date_copy.setHours(0, 0, 0);

            date_copy.setDate(date_copy.getDate() + days);
            var date_iso = this.toIso(date_copy);
            return date_iso;
        }

        // convert date to ISO but, eliminate time offset (timezone)
        this.toIso_old = function (date) {
            if (date.toString().length > 10) {
                var tzoffset = (date).getTimezoneOffset() * 60000; //offset in milliseconds
                var localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, -1);
                return localISOTime.substring(0, 10);
            } else {
                return date;
            }
        }

        // to iso format => normal
        this.toIso = function (date) {

            var is_date = (date instanceof Date);

            if (is_date == false) {
                date = new Date(date);
            }

            var year = date.getFullYear();
            var month = ('0' + (date.getMonth() + 1)).slice(-2);
            var day = ('0' + date.getDate()).slice(-2);

            var date_iso = year + '-' + month + '-' + day;

            return date_iso;
        }

        // Croatian format 1.1.2021
        this.toHR = function (date) {

            var is_date = (date instanceof Date);

            if (is_date == false) {
                date = new Date(date);
            }

            var result;
            result = ('0' + date.getDate()).slice(-2) + '.' +
                ('0' + (date.getMonth() + 1)).slice(-2) + '.' +
                date.getFullYear();

            return result;
        };

        // get how many days between 2 dates
        this.days_between = function (date1, date2) {

            //debugger;

            var d1 = new Date(date1);
            var d2 = new Date(date2);

            // The number of milliseconds in one day
            const ONE_DAY = 1000 * 60 * 60 * 24;

            // Calculate the difference in milliseconds
            const differenceMs = Math.abs(d1 - d2);

            // Convert back to days and return
            return Math.round(differenceMs / ONE_DAY);
        }

        // converte unix time to human datetime
        this.unix_to_date = function ToLocalDate(inDate) {
            var inDate = new Date(inDate);
            var date = new Date();
            date.setTime(inDate.valueOf() - 60000 * inDate.getTimezoneOffset());
            return date;
        }

        this.to_right_timezone = function (date) {
            var d = new Date(date);
            d = new Date(d.getTime() + d.getTimezoneOffset() * 60000)
            return d;
        }

        this.add_month = function (date, months) {
            var newDate = new Date(date.setMonth(date.getMonth() + months));
            return newDate;
        }

        // convert valid date to iso format
        this.toIsoFormat = function (date) {
            var year = date.getFullYear();
            var month = ("0" + (date.getMonth() + 1)).slice(-2)
            var day = ("0" + (date.getDate())).slice(-2);
            var formatted = year + '-' + month + '-' + day;
            return formatted;
        }

        // convert string to valid js date
        this.get_valid_date = function (date) {
            var d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        }

        // check if day is betwween dates
        this.if_day_is_between = function (date_from, date_until, date) {
            return this.get_valid_date(date) <= this.get_valid_date(date_until) && this.get_valid_date(date) >= this.get_valid_date(date_from);
        }

        // find how many days is between two dates
        this.days_between_two_daates = function (date__from, date_until) {
            // The number of milliseconds in one day
            const ONE_DAY = 1000 * 60 * 60 * 24;


            // Calculate the difference in milliseconds
            const differenceMs = Math.abs(this.get_valid_date(date_until) - this.get_valid_date(date__from));

            // Convert back to days and return
            return Math.round(differenceMs / ONE_DAY);
        }

        // check if one date is smaller then the other
        this.is_date_smaler = function (smallerDate, biggerDate) {

            // Make a copy
            smallerDate = new Date(smallerDate);
            biggerDate = new Date(biggerDate);

            // Nullify time and then compare
            smallerDate.setHours(0, 0, 0, 0);
            biggerDate.setHours(0, 0, 0, 0);
            return smallerDate < biggerDate;
        }

        // day of the mounth
        this.get_day = function (date) {
            var day = date.substring(8, 10);
            return day;
        }

        // day of the mounth
        this.get_mounth = function (date) {
            var mounth = date.substring(5, 7);
            return mounth;
        }

        // get year
        this.get_year = function (date) {
            var year = date.substring(0, 4);
            return year;
        }

        // check if its date
        this.is_date = function (date) {
            return date instanceof Date && date.getTime();
        }

        // get local time format (short)
        this.time_local_short = function (date, locales = 'en') {

            var is_date = (date instanceof Date);

            if (is_date == false) {
                date = new Date(date);
            }

            d.toLocaleTimeString(locales || [], { hour: '2-digit', minute: '2-digit' })

        }

        // get local time long
        this.time_local = function (date, locales = 'en') {

            var is_date = (date instanceof Date);

            if (is_date == false) {
                date = new Date(date);
            }

            d.toLocaleTimeString(locales || [], { hour: '2-digit', minute: '2-digit' })

        }

    }

    // Html manipulation
    this.html = new function () {

        this.delayed_keyup = function(input, trigger_function, delay=250) {

            let tid = null;
            input.addEventListener('keyup', function() {
                clearTimeout(tid);
                tid = setTimeout(trigger_function, delay);
            });
        }

        // add html to element, like div
        this.insertAdjacentHTML = function (id, html) {
            //debugger;
            var el = document.getElementById(id);
            el.insertAdjacentHTML('beforeend', html);
        }

        // table functions
        this.table = function () {

            // when click chekbox select whole row
            this.tr_select_with_checkbox = function (tbody) {

                var cb = tbody.querySelectorAll('input[type="checkbox"]');
                for (var i of cb) {
                    i.addEventListener('change', function () {
                        //console.log(this.checked);
                        var tr_background = this.parentElement.parentElement;
                        if (this.checked) {
                            console.log('checked');
                            tr_background.style.backgroundColor = "rgba(221, 221, 221, 0.2)";
                        } else {
                            console.log('not');
                            tr_background.style.backgroundColor = "";
                        }
                    });
                }


            }

        }

        // async lodad partal views
        this.load_async = () => {
            $(".partl_html_async").each((index, item) => {
                var url = $(item).data("url");
                if (url && url.length > 0) {
                    $(item).load(url);
                }
            });
        }

    }

    // Validations
    this.valiations = new function () {

        this.email = function (email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        }

        this.email_full = function (email) {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }

        this.tel = function phoneNumberCheck(phoneNumber) {
            var regEx = /^\+{ 0, 2}([\-\. ]) ? (\(?\d{ 0, 3 } \))?([\-\. ]) ?\(?\d{ 0, 3 } \)?([\-\. ]) ?\d{ 3 } ([\-\. ]) ?\d{ 4 }/;
            if (phoneNumber.value.match(regEx)) {
                return true;
            }
            else {
                alert("Please enter a valid phone number.");
                return false;
            }
        }

    }

    // format values (localy)
    this.format = new function () {

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat

        this.decimal = (n, culture = 'hr-HR') => {

            var d = new Intl.NumberFormat(culture, { style: 'decimal' }).format(Number(n).toFixed(2));
            return d;

        }

        this.date = (n, culture = 'hr-HR') => {

            if (js.date.is_date(n) == false) {
                n = new Date(n);
            }

            const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
            var d = n.toLocaleDateString('hr-HR', options).replaceAll(/\s/g, '');

            return d;
        }

    }

    // transformations
    this.transformations = new function () {

        this.json_to_query_string = (json) => {

            var str = [];
            for (var p in json)
                if (json.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(json[p]));
                }
            return str.join("&");
        }

    }

    // images
    this.images = new function () {

        this.lazy_load = function (element) {

            // how to use
            // put class lazy in img
            // example: <img src="blank.gif" data-src="my_image.png" class="lazy" width="600" height="400" >`

            // run after window.load  
            // window.onload = function () { fr.img_lazy_load(); }

            var $q = function (q, res) {
                if (document.querySelectorAll) {
                    res = document.querySelectorAll(q);
                } else {
                    var d = document
                        , a = d.styleSheets[0] || d.createStyleSheet();
                    a.addRule(q, 'f:b');
                    for (var l = d.all, b = 0, c = [], f = l.length; b < f; b++)
                        l[b].currentStyle.f && c.push(l[b]);

                    a.removeRule(0);
                    res = c;
                }
                return res;
            }, addEventListener = function (evt, fn) {
                window.addEventListener
                    ? this.addEventListener(evt, fn, false)
                    : (window.attachEvent)
                        ? this.attachEvent('on' + evt, fn)
                        : this['on' + evt] = fn;
            }, _has = function (obj, key) {
                return Object.prototype.hasOwnProperty.call(obj, key);
            };

            function loadImage(el, fn) {
                var img = new Image()
                    , src = el.getAttribute('data-src');
                img.onload = function () {
                    if (!!el.parent)
                        el.parent.replaceChild(img, el)
                    else
                        el.src = src;

                    fn ? fn() : null;
                }
                img.src = src;
            }

            function elementInViewport(el) {
                var rect = el.getBoundingClientRect()

                return (
                    rect.top >= 0
                    && rect.left >= 0
                    && rect.top <= (window.innerHeight || document.documentElement.clientHeight)
                )
            }

            var images = new Array()
                , query = $q('img.lazy')
                , processScroll = function () {
                    for (var i = 0; i < images.length; i++) {
                        if (elementInViewport(images[i])) {
                            loadImage(images[i], function () {
                                images.splice(i, i);
                            });
                        }
                    };
                };

            // Array.prototype.slice.call is not callable under our lovely IE8 
            for (var i = 0; i < query.length; i++) {
                images.push(query[i]);
            };

            processScroll();


            // addEventListener('scroll', processScroll);


            document.querySelector(element).addEventListener('scroll', (event) => {
                processScroll();
            });


        }

    }

    // text & string manipulation
    this.text = new function () {

        // Emails regex: ([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})
        /* Matches these e-mails:
        support@my-rents.com
        support.abc@my-rents.com
        Suppor123_myr.test@my-rents_2.com.hr
        ...
        */
        let emails_regex = /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g;

        // Phone numbers regex: ((\+|0*)\d{1,3}(-|\/|\s|))?\d{2,3}(-|\/|\s|)\d{3}(-|\/|\s|)\d{3,4}
        /* Matches these numbers:
            098-111-1111
            098 111 1111
            098/111-1111
            0981111111
            +38598 111 1111
            00385 98 111 1111
            0385 98 111 1111
            0385 98 111 111
            ...
            */
        let phone_num_regex = /((\+|0*)\d{1,3}(-|\/|\s|))?\d{2,3}(-|\/|\s|)\d{3}(-|\/|\s|)\d{3,4}/g;

        this.check_if_empty = (text) => {
            if (!text == true) {
                return '-';
            }

            else {
                return text;
            }
        }

        this.remove_html_tags = (s) => {
            let el = document.createElement('div');
            el.innerText = s;
            s = el.innerHTML;
            el.remove();
            return s;
        }

        this.find_contacts = (s) => {

            let found_emails = Array.from(s.matchAll(emails_regex)).map(regx => {
                return {
                    email: regx[0],
                    index: regx['index']
                }
            });
            let found_tel = Array.from(s.matchAll(phone_num_regex)).map(regx => {
                return {
                    tel: regx[0],
                    index: regx['index']
                }
            });

            let info = {
                input: s,
                emails: found_emails,
                phone_numbers: found_tel
            };
            return info;
        }

        this.remove_contacts = (s) => {
            
            s = s.replace(emails_regex, '');
            s = s.replace(phone_num_regex, '');
            return s;
        }

    }

    // Class containing useful url methods
    this.url = new function () {

        /* Demonstration code:

            var url = js.url.get_current();  // "http://marcopolo.hr/en/home/search"
            const param = "from";
            const value = "2021-05-15";

            url = js.url.set_param(url, param, value);  // "http://marcopolo.hr/en/home/search?from=2021-05-15"

            var fetched_value = js.url.get_param(url, param);  // 2021-05-15
        
        */

        this.get_current = () => window.location.href;

        // Gets a query parameter from a given url
        this.get_param = function (url, key) {
            const params = url.split("?")[1] || "";
            var value = params.split("&").filter(el => el.split("=")[0] == key && el.length > 0)[0] || "";
            value = value ? (value.split("=")[1] || "") : "";
            return value;
        }

        // Sets a query parameter to a given url and returns it
        this.set_param = function (url, key, value) {
            const before_qmark = url.split("?")[0];
            var after_qmark = url.split("?")[1] || "";
            var params = after_qmark.split("&").filter(el => el.split("=")[0] !== key && el.length > 0);
            params.push(key + "=" + value);
            after_qmark = params.join("&");
            return before_qmark + "?" + after_qmark;
        }
    }

    // Rest calls - no jQuery
    this.http = new function () {

        // Examples (GET request):
        //
        // Await:
        // var text_data = await js.http.async.get(url)
        //
        // Callbacks:
        // js.http.get(url, function (text_data) { }, function (err) { })
        //
        // Promises:
        // js.http.async.get(url).then((text_data) => { }).catch(function(err) { })
        //

        this.async = new function () {

            this.get = function (url) {
                return fetch(url).then(res => res.text());
            };

            this.get_json = function (url) {
                return fetch(url).then(res => res.json());
            };

            this.post = function (url, body) {
                return fetch(url, {
                    method: "POST",
                    body: JSON.stringify(body)
                }).then(res => res.text());
            };

            this.post_json = function (url, body) {
                return fetch(url, {
                    method: "POST",
                    body: JSON.stringify(body)
                }).then(res => res.json());
            };

            this.put = function (url, body) {
                return fetch(url, {
                    method: "PUT",
                    body: JSON.stringify(body)
                }).then(res => res.text());
            };

            this.patch = function (url, body) {
                return fetch(url, {
                    method: "PATCH",
                    body: JSON.stringify(body)
                }).then(res => res.text());
            };

            this.delete = function (url) {
                return fetch(url, {
                    method: "DELETE"
                }).then(res => res.text());
            };

        }

        this.get = function (url, callback, on_error) {
            let prom = this.async.get(url);
            if (callback) prom.then(callback);
            if (on_error) prom.catch(on_error);
        }

        this.post = function (url, body, callback, on_error) {
            let prom = this.async.post(url, body);
            if (callback) prom.then(callback);
            if (on_error) prom.catch(on_error);
        }

        this.put = function (url, body, callback, on_error) {
            let prom = this.async.put(url, body);
            if (callback) prom.then(callback);
            if (on_error) prom.catch(on_error);
        }

        this.patch = function (url, body, callback, on_error) {
            let prom = this.async.patch(url, body);
            if (callback) prom.then(callback);
            if (on_error) prom.catch(on_error);
        }

        this.delete = function (url, callback, on_error) {
            let prom = this.async.delete(url);
            if (callback) prom.then(callback);
            if (on_error) prom.catch(on_error);
        }

    }

    // fetch calls
    this.fetch = new function () {

        this.get = async function (url) {

            var response = await fetch(url);
            return response;

        }

        this.get_json = async function (url) {
            var response = await fetch(url);
            var json = await response.json();
            return json;
        }

        this.post = async function (url, body) {

            if (typeof body !== 'string') {
                body = JSON.stringify(body);
            }

            var respone = await fetch(url, { method: 'post', body: body });

            return respone;

        }

        this.post_json = async function (url, body) {

            if (typeof body !== 'string') {
                body = JSON.stringify(body);
            }

            var respone = await fetch(url, { method: 'post', body: body });
            var json = await respone.json();

            return json;

        }

        this.submit = async function (div, url = '') {

            if (!url) {
                url = document.getElementById(div).dataset.url;
            }

            var body = await hiza.core.template.div_to_json(div);
            var response = await hiza.core.fetch.post(url, body);
            return response;

        }

        this.submit_json = async function (div, url = '') {

            if (!url) {
                url = document.getElementById(div).dataset.url;
            }

            var body = await hiza.core.template.div_to_json(div);
            var response = await hiza.core.fetch.post(url, body);
            var json = response.json();
            return json();

        }

    }

    // loadcion
    this.location = new function () {

        this.get = async function () {

            if (navigator.geolocation) {

                await navigator.geolocation.getCurrentPosition(await success, await error, null);

                async function success(pos) {

                    var lat = pos.coords.latitude;
                    var lng = pos.coords.longitude;

                    var loc = {
                        lat: lat,
                        lng: lng
                    }

                    return loc;

                }

                async function error(err) {
                    console.log(err);
                    return err;
                }

            }

            else {
                x.innerHTML = "Geolocation is not supported by this browser.";
            }

        }

        this.GeoLocationDB = async function () {
            var url = 'https://geolocation-db.com/json/';
            var response = await js.http.async.get_json(url);
            return response;
        }

    }

    this.guid = new function () {

        this.generate = async function () {

            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

        }

    }

    // tempalting
    this.template = new function () {

        this.dev = false;

        this.run = async function (el, data, template, load) {

            //debugger;

            if (js.template.dev == true) {
                console.log(data);
            }

            var element = document.getElementById(el);
            var template_html = template.innerHTML;
            var load_html = !load == false ? load.innerHTML : '';

            // clear element
            element.innerHTML = '';

            try {
                for (var r of data) {
                    js.html.insertAdjacentHTML(
                        el
                        , eval('`' + template_html + '`')
                    );
                }
            }
            catch (error) {
                console.error(error);
            }

            // add template & load again
            js.html.insertAdjacentHTML(el, '<template>' + template_html + '</template>');
            js.html.insertAdjacentHTML(el, '<template>' + load_html + '</template>');

        }

        this.post = async function (el, url, data) {

            //debugger;

            var element = document.getElementById(el);
            var templates = element.getElementsByTagName('template');

            var template = templates[0];
            var load = '';

            if (templates.length > 1) {
                load = templates[1];
                element.innerHTML = load.innerHTML;
            }
            else {
                element.innerHTML = '';
            }

            js.template.run(el, await js.http.async.post_json(url, data), template, load);
        }

        this.get = async function (el, url) {

            var element = document.getElementById(el);
            var templates = element.getElementsByTagName('template');

            var template = templates[0];
            var load = templates[1];

            // add loading 
            element.innerHTML = !load == false ? load.innerHTML : '';

            js.template.run(el, await js.http.async.get_json(url), template, load);
        }

        this.data = async function (el, data) {


            var element = document.getElementById(el);
            var templates = element.getElementsByTagName('template');

            var template = templates[0];
            var load = templates[1];

            // add loading 
            element.innerHTML = !load == false ? load.innerHTML : '';

            js.template.run(el, data, template, load);
        }

        // Make HTML from template string that uses ${item['KEY']}
        this.templ = function (template, item) {
            item = item || {};
            return eval('`' + template + '`');
        }

        // Make HTML from template string that uses ${item['KEY']} of each item in array
        this.templ_arr = function (template, item_arr) {
            let html_arr = Array.from(item_arr).map(item => {
                item = item || {};
                return eval('`' + template + '`');
            });
            return html_arr.join('');
        }

        /* Demonstration code:

          // Create template
          var t = document.createElement("template");
          t.id = "example_cases_templating";

          // Insert template to document
          document.body.insertAdjacentElement("beforeend", t);

          // Write HTML with selectors
          document.querySelector("#example_cases_templating").innerHTML = "Example template\n" +
          "Simple case:           ${ key_in_obj }\n" + 
          "Using global backup:   ${ non_existent_key }\n" + 
          "Using unique backup:   ${ non_existent_key | 'Unique backup' }\n" +
          "Using backup keys:     ${ non_existent_key | backup_key }\n" + 
          "Using backup keys and unique backup string: ${ non_existent_key | other_non_existent_key | 'No data' }";
          
          // Make object and backups
          var obj = {
              key_in_obj: "Hello world",
              backup_key: "I'm a backup",
              backup_key_2: "..." // each selector ${} can have different backups
          };
          var global_backup_value = "&nbsp;"; // Global backup is given to all selectors with no value
          
          // Insert object to template
          js.template.insert_object("#example_cases_templating", obj, global_backup_value);
          // "Example template
          // Simple case:            Hello world
          // Using global backup:    &nbsp;
          // Using unique backup:    Unique backup
          // Using backup keys:      I'm a backup
          // Using backup keys and unique backup string: No data"

          // insert_all_objects:
          // calls insert_object on an array and returns array of strings
          // to get array as one string, use .join("")
      */

        // Swap all entities with keys in object (more info above js.template declaration)
        this.insert_object = function (template_selector, obj, backup_value) {
            if (!backup_value) backup_value = "-";
            if (!obj) obj = {};

            const regex = /\$\{([^}]+)\}/g
            let templ = document.querySelector(template_selector).innerHTML;

            // Get all templates, such as key[0] = [ "${ hello | test | 'No data' }", " hello | test | 'No data' " ]
            let all_selectors = [...templ.matchAll(regex)];

            for (let i = 0; i < all_selectors.length; ++i) {

                // Get options from selector, such as " hello | test | 'No data' "
                let options = all_selectors[i][1];
                let curr_selector = all_selectors[i][0];
                if (options.length < 1) {
                    console.warn("js.template.insert_object: Incorrect selector used: " + curr_selector);
                }
                options = options.split("|").map(option => option.trim());

                let replace_with = null;
                for (let opt = 0; opt < options.length; ++opt) {
                    let o = options[opt];
                    if (!o || o.length < 1) continue;

                    // An option can be a string or a value in obj
                    if (o[0] == '"' && o.slice(-1) == '"' || o[0] == "'" && o.slice(-1) == "'") {
                        replace_with = o.slice(1, -1);
                        // Replacement found, stop search
                        break;
                    }
                    else {
                        if (obj[o]) {
                            replace_with = obj[o];
                            // Stop search
                            break;
                        }
                    }
                }
                // If no value found (and no constant string given as backup)
                if (!replace_with) {
                    console.warn("js.template.insert_object: No value found found in given object for the following key(s): " + options.join(", "));
                    replace_with = backup_value;
                }

                templ = templ.replace(curr_selector, replace_with);
            }
            return templ;
        }

        /* Old
        // Swap all ${keys} with obj[keys] in template inner HTML
        this.insert_object = function (template_selector, obj) {
            const regex = /\$\{([^}]+)\}/g
            let templ = document.querySelector(template_selector).innerHTML;

            let keys = [...templ.matchAll(regex)];
            for (let i = 0; i < keys.length; ++i) {
                // ${key_string}
                let selector = keys[i][0];
                // key_string
                let key = keys[i][1];

                templ = templ.replace(selector, obj[key] || selector);
            }
            return templ;
        }
        */

        // Swap all entities with keys in each object (more info above js.template declaration)
        this.insert_all_objects = function (template_selector, object_arr, backup_value) {
            var ret_arr = [];
            for (let i = 0, len = object_arr.length; i < len; ++i) {
                let html = this.insert_object(template_selector, object_arr[i], backup_value);
                ret_arr.push(html);
            }
            return ret_arr;
        }

        // convert all intputs with data-hiza_id to json
        this.div_to_json = async function (div) {

            var div = document.getElementById(div);
            var inputs = div.querySelectorAll('[data-hiza_id]');

            // get json body
            var json = {};
            await inputs.forEach(async (e) => {
                json[e.dataset.hiza_id] = e.value;
            });

            return json;

        }
    }

}
