/// @file JSRootCore.js
/// Core methods of JavaScript ROOT

/// @namespace JSROOT
/// Holder of all JSROOT functions and classes

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {

      var dir = "scripts", ext = "";
      var scripts = document.getElementsByTagName('script');
      for (var n in scripts) {
         if (scripts[n]['type'] != 'text/javascript') continue;
         var src = scripts[n]['src'];
         if ((src == null) || (src.length == 0)) continue;
         var pos = src.indexOf("scripts/JSRootCore.");
         if (pos>=0) {
            dir = src.substr(0, pos+8);
            if (src.indexOf("scripts/JSRootCore.min.js")==pos) ext = ".min";
            break;
         }
      }

      var paths = {
            'd3'                   : dir+'d3.v3.min',
            'jquery'               : dir+'jquery.min',
            'jquery-ui'            : dir+'jquery-ui.min',
            'touch-punch'          : dir+'touch-punch.min',
            'rawinflate'           : dir+'rawinflate'+ext,
            'MathJax'              : 'https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_SVG&amp;delayStartupUntil=configured',
            'THREE'                : dir+'three.min',
            'THREE_ALL'            : dir+'jquery.mousewheel'+ext,
            'helvetiker_regular'   : dir+'helvetiker_regular.typeface',
            'helvetiker_bold'      : dir+'helvetiker_bold.typeface',
            'JSRootCore'           : dir+'JSRootCore'+ext,
            'JSRootMath'           : dir+'JSRootMath'+ext,
            'JSRootInterface'      : dir+'JSRootInterface'+ext,
            'JSRootIOEvolution'    : dir+'JSRootIOEvolution'+ext,
            'JSRootPainter'        : dir+'JSRootPainter'+ext,
            'JSRootPainter.more'   : dir+'JSRootPainter.more'+ext,
            'JSRootPainter.jquery' : dir+'JSRootPainter.jquery'+ext,
            'JSRoot3DPainter'      : dir+'JSRoot3DPainter'+ext
         };

      // check if modules are already loaded
      for (var module in paths)
        if (requirejs.defined(module))
           delete paths[module];

      // configure all dependencies
      requirejs.config({
       paths: paths,
       shim: {
         'touch-punch': { deps: ['jquery'] },
         'helvetiker_regular': { deps: ['THREE'] },
         'helvetiker_bold': { deps: ['THREE'] },
         'THREE_ALL': {deps: ['jquery', 'jquery-ui', 'THREE', 'helvetiker_regular', 'helvetiker_bold'] },
         'MathJax': {
             exports: 'MathJax',
             init: function () {
                MathJax.Hub.Config({ TeX: { extensions: ["color.js"] }});
                MathJax.Hub.Register.StartupHook("SVG Jax Ready",function () {
                   var VARIANT = MathJax.OutputJax.SVG.FONTDATA.VARIANT;
                   VARIANT["normal"].fonts.unshift("MathJax_SansSerif");
                   VARIANT["bold"].fonts.unshift("MathJax_SansSerif-bold");
                   VARIANT["italic"].fonts.unshift("MathJax_SansSerif");
                   VARIANT["-tex-mathit"].fonts.unshift("MathJax_SansSerif");
                });
                MathJax.Hub.Startup.onload();
                return MathJax;
             }
          }
       }
    });

      // AMD. Register as an anonymous module.
      define( factory );
   } else {

      if (typeof JSROOT != 'undefined')
         throw new Error("JSROOT is already defined", "JSRootCore.js");

      JSROOT = {};

      // Browser globals
      factory(JSROOT);
   }
} (function(JSROOT) {

   JSROOT.version = "dev 25/11/2015";

   JSROOT.source_dir = "";
   JSROOT.source_min = false;

   JSROOT.id_counter = 0;

   JSROOT.touches = ('ontouchend' in document); // identify if touch events are supported

   JSROOT.browser = {};

   JSROOT.browser.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
   JSROOT.browser.isFirefox = typeof InstallTrigger !== 'undefined';
   JSROOT.browser.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
   JSROOT.browser.isChrome = !!window.chrome && !JSROOT.browser.isOpera;
   JSROOT.browser.isIE = false || !!document.documentMode;
   JSROOT.browser.isWebKit = JSROOT.browser.isChrome || JSROOT.browser.isSafari;

   JSROOT.function_list = []; // do we really need it here?

   JSROOT.MathJax = 0; // indicate usage of mathjax 0 - off, 1 - on

   JSROOT.BIT = function(n) { return 1 << (n); }

   // TH1 status bits
   JSROOT.TH1StatusBits = {
         kNoStats       : JSROOT.BIT(9),  // don't draw stats box
         kUserContour   : JSROOT.BIT(10), // user specified contour levels
         kCanRebin      : JSROOT.BIT(11), // can rebin axis
         kLogX          : JSROOT.BIT(15), // X-axis in log scale
         kIsZoomed      : JSROOT.BIT(16), // bit set when zooming on Y axis
         kNoTitle       : JSROOT.BIT(17), // don't draw the histogram title
         kIsAverage     : JSROOT.BIT(18)  // Bin contents are average (used by Add)
   };

   JSROOT.EAxisBits = {
         kTickPlus      : JSROOT.BIT(9),
         kTickMinus     : JSROOT.BIT(10),
         kAxisRange     : JSROOT.BIT(11),
         kCenterTitle   : JSROOT.BIT(12),
         kCenterLabels  : JSROOT.BIT(14),
         kRotateTitle   : JSROOT.BIT(15),
         kPalette       : JSROOT.BIT(16),
         kNoExponent    : JSROOT.BIT(17),
         kLabelsHori    : JSROOT.BIT(18),
         kLabelsVert    : JSROOT.BIT(19),
         kLabelsDown    : JSROOT.BIT(20),
         kLabelsUp      : JSROOT.BIT(21),
         kIsInteger     : JSROOT.BIT(22),
         kMoreLogLabels : JSROOT.BIT(23),
         kDecimals      : JSROOT.BIT(11)
   };

   // wrapper for console.log, avoids missing console in IE
   // if divid specified, provide output to the HTML element
   JSROOT.console = function(value, divid) {
      if ((divid!=null) && (typeof divid=='string') && ((typeof document.getElementById(divid))!='undefined'))
         document.getElementById(divid).innerHTML = value;
      else
      if ((typeof console != 'undefined') && (typeof console.log == 'function'))
         console.log(value);
   }

   // This is part of the JSON-R code, found on
   // https://github.com/graniteds/jsonr
   // Only unref part was used, arrays are not accounted as objects
   // Should be used to reintroduce objects references, produced by TBufferJSON
   JSROOT.JSONR_unref = function(value, dy) {
      var c, i, k, ks;
      if (!dy) dy = [];

      switch (typeof value) {
      case 'string':
          if ((value.length > 5) && (value.substr(0, 5) == "$ref:")) {
             c = parseInt(value.substr(5));
             if (!isNaN(c) && (c < dy.length)) {
                value = dy[c];
             }
          }
          break;

      case 'object':
         if (value !== null) {

            if (Object.prototype.toString.apply(value) === '[object Array]') {
               for (i = 0; i < value.length; i++) {
                  value[i] = this.JSONR_unref(value[i], dy);
               }
            } else {

               // account only objects in ref table
               if (dy.indexOf(value) === -1) {
                  dy.push(value);
               }

               // add methods to all objects, where _typename is specified
               if ('_typename' in value) this.addMethods(value);

               ks = Object.keys(value);
               for (i = 0; i < ks.length; i++) {
                  k = ks[i];
                  value[k] = this.JSONR_unref(value[k], dy);
               }
            }
         }
         break;
      }

      return value;
   }

   JSROOT.debug = 0;

   // This should be similar to the jQuery.extend method
   // Just copy (not clone) all fields from source to the target object
   JSROOT.extend = function(tgt, src, map) {
      if (!map) map = { obj:[], clones:[] };

      if (typeof src != 'object') return src;

      if (src == null) return null;

      var i = map.obj.indexOf(src);
      if (i>=0) return map.clones[i];

      // process array
      if (Object.prototype.toString.apply(src) === '[object Array]') {
         if ((tgt==null) || (Object.prototype.toString.apply(tgt) != '[object Array]')) {
            tgt = [];
            map.obj.push(src);
            map.clones.push(tgt);
         }

         for (i = 0; i < src.length; i++)
            tgt.push(JSROOT.extend(null, src[i], map));

         return tgt;
      }

      if ((tgt==null) || (typeof tgt != 'object')) {
         tgt = {};
         map.obj.push(src);
         map.clones.push(tgt);
      }

      for (var k in src)
         tgt[k] = JSROOT.extend(tgt[k], src[k], map);

      return tgt;
   }

   // Instead of jquery use JSROOT.extend function
   JSROOT.clone = function(obj) {
      return JSROOT.extend(null, obj);
   }

   JSROOT.parse = function(arg) {
      if ((arg==null) || (arg=="")) return null;
      var obj = JSON.parse(arg);
      if (obj!=null) obj = this.JSONR_unref(obj);
      return obj;
   }

   JSROOT.GetUrlOption = function(opt, url, dflt) {
      // analyzes document.URL and extracts options after '?' mark
      // following options supported ?opt1&opt2=3
      // In case of opt1 empty string will be returned, in case of opt2 '3'
      // If option not found, null is returned (or provided default value)

      if ((opt==null) || (typeof opt != 'string') || (opt.length==0)) return dflt;

      if (!url) url = document.URL;

      var pos = url.indexOf("?");
      if (pos<0) return dflt;
      url = url.slice(pos+1);

      while (url.length>0) {

         if (url==opt) return "";

         pos = url.indexOf("&");
         if (pos < 0) pos = url.length;

         if (url.indexOf(opt) == 0) {
            if (url.charAt(opt.length)=="&") return "";

            // replace several symbols which are known to make a problem
            if (url.charAt(opt.length)=="=")
               return url.slice(opt.length+1, pos).replace(/%27/g, "'").replace(/%22/g, '"').replace(/%20/g, ' ').replace(/%3C/g, '<').replace(/%3E/g, '>').replace(/%5B/g, '[').replace(/%5D/g, ']');
         }

         url = url.slice(pos+1);
      }
      return dflt;
   }

   JSROOT.ParseAsArray = function(val) {
      // parse string value as array.
      // It could be just simple string:  "value"
      //  or array with or without string quotes:  [element], ['eleme1',elem2]

      var res = [];

      if (typeof val != 'string') return res;

      val = val.trim();
      if (val=="") return res;

      // return as array with single element
      if ((val.length<2) || (val[0]!='[') || (val[val.length-1]!=']')) {
         res.push(val); return res;
      }

      // try to parse ourself
      var arr = val.substr(1, val.length-2).split(","); // remove brackets

      for (var i in arr) {
         var sub = arr[i].trim();
         if ((sub.length>1) && (sub[0]==sub[sub.length-1]) && ((sub[0]=='"') || (sub[0]=="'")))
            sub = sub.substr(1, sub.length-2);
         res.push(sub);
      }
      return res;
   }

   JSROOT.GetUrlOptionAsArray = function(opt, url) {
      // special handling of URL options to produce array
      // if normal option is specified ...?opt=abc, than array with single element will be created
      // one could specify normal JSON array ...?opt=['item1','item2']
      // but also one could skip quotes ...?opt=[item1,item2]
      // one could collect values from several options, specifying
      // options names via semicolon like opt='item;items'

      var res = [];

      while (opt.length>0) {
         var separ = opt.indexOf(";");
         var part = separ>0 ? opt.substr(0, separ) : opt;
         if (separ>0) opt = opt.substr(separ+1); else opt = "";

         var val = this.GetUrlOption(part, url, null);
         res = res.concat(JSROOT.ParseAsArray(val));
      }
      return res;
   }

   JSROOT.findFunction = function(name) {
      var func = window[name];
      if (typeof func == 'function') return func;
      var separ = name.lastIndexOf(".");
      if (separ<0) return null;
      var namespace = name.slice(0, separ);
      name = name.slice(separ+1);
      if (namespace=="JSROOT") func = this[name]; else
      if (namespace=="JSROOT.Painter") { if ('Painter' in this) func = this['Painter'][name]; } else
      if (window[namespace]) func = window[namespace][name];
      return (typeof func == 'function') ? func : null;
   }

   JSROOT.CallBack = function(func, arg1, arg2) {
      // generic method to invoke callback function
      // func either normal function or container like
      // { obj: object_pointer, func: name of method to call }
      // { _this: object pointer, func: function to call }
      // arg1, arg2 are optional arguments of the callback

      if (func == null) return;

      if (typeof func == 'string') func = JSROOT.findFunction(func);

      if (typeof func == 'function') return func(arg1,arg2);

      if (typeof func != 'object') return;

      if (('obj' in func) && ('func' in func) &&
         (typeof func.obj == 'object') && (typeof func.func == 'string') &&
         (typeof func.obj[func.func] == 'function')) return func.obj[func.func](arg1, arg2);

      if (('_this' in func) && ('func' in func) &&
         (typeof func.func == 'function')) return func.func.call(func._this, arg1, arg2);
   }

   JSROOT.NewHttpRequest = function(url, kind, user_call_back) {
      // Create asynchronous XMLHttpRequest object.
      // One should call req.send() to submit request
      // kind of the request can be:
      //  "bin" - abstract binary data (default)
      //  "text" - returns req.responseText
      //  "object" - returns JSROOT.parse(req.responseText)
      //  "xml" - returns res.responseXML
      //  "head" - returns request itself, uses "HEAD" method
      // Result will be returned to the callback functions
      // Request will be set as this pointer in the callback
      // If failed, request returns null

      var xhr = new XMLHttpRequest();

      function callback(res) {
         // we set pointer on request when calling callback
         if (typeof user_call_back == 'function') user_call_back.call(xhr, res);
      }

      var pthis = this;

      if (window.ActiveXObject) {

         xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            if (xhr.status != 200 && xhr.status != 206) {
               // error
               return callback(null);
            }

            if (kind == "xml") return callback(xhr.responseXML);
            if (kind == "text") return callback(xhr.responseText);
            if (kind == "object") return callback(pthis.parse(xhr.responseText));
            if (kind == "head") return callback(xhr);

            var filecontent = new String("");
            var array = new VBArray(xhr.responseBody).toArray();
            for (var i = 0; i < array.length; i++) {
               filecontent = filecontent + String.fromCharCode(array[i]);
            }

            callback(filecontent);
            filecontent = null;
         }

         xhr.open(kind == 'head' ? 'HEAD' : 'GET', url, true);

      } else {

         xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;

            if (xhr.status != 200 && xhr.status != 206) {
               return callback(null);
            }

            if (kind == "xml") return callback(xhr.responseXML);
            if (kind == "text") return callback(xhr.responseText);
            if (kind == "object") return callback(pthis.parse(xhr.responseText));
            if (kind == "head") return callback(xhr);

            var HasArrayBuffer = ('ArrayBuffer' in window && 'Uint8Array' in window);
            var Buf, filecontent;
            if (HasArrayBuffer && 'mozResponse' in xhr) {
               Buf = xhr.mozResponse;
            } else if (HasArrayBuffer && xhr.mozResponseArrayBuffer) {
               Buf = xhr.mozResponseArrayBuffer;
            } else if ('responseType' in xhr) {
               Buf = xhr.response;
            } else {
               Buf = xhr.responseText;
               HasArrayBuffer = false;
            }

            if (HasArrayBuffer) {
               filecontent = new String("");
               var bLen = Buf.byteLength;
               var u8Arr = new Uint8Array(Buf, 0, bLen);
               for (var i = 0; i < u8Arr.length; i++) {
                  filecontent = filecontent + String.fromCharCode(u8Arr[i]);
               }
               delete u8Arr;
            } else {
               filecontent = Buf;
            }

            callback(filecontent);

            filecontent = null;
         }

         xhr.open(kind == 'head' ? 'HEAD' : 'GET', url, true);

         if (kind == "bin") {
            var HasArrayBuffer = ('ArrayBuffer' in window && 'Uint8Array' in window);
            if (HasArrayBuffer && 'mozResponseType' in xhr) {
               xhr.mozResponseType = 'arraybuffer';
            } else if (HasArrayBuffer && 'responseType' in xhr) {
               xhr.responseType = 'arraybuffer';
            } else {
               //XHR binary charset opt by Marcus Granado 2006 [http://mgran.blogspot.com]
               xhr.overrideMimeType("text/plain; charset=x-user-defined");
            }
         }
      }
      return xhr;
   }

   JSROOT.loadScript = function(urllist, callback, debugout) {
      // dynamic script loader using callback
      // (as loading scripts may be asynchronous)
      // one could specify list of scripts or style files, separated by semicolon ';'
      // one can prepend file name with '$$$' - than file will be loaded from JSROOT location
      // This location can be set by JSROOT.source_dir or it will be detected automatically
      // by the position of JSRootCore.js file, which must be loaded by normal methods:
      // <script type="text/javascript" src="scripts/JSRootCore.js"></script>

      function completeLoad() {
         if ((urllist!=null) && (urllist.length>0))
            return JSROOT.loadScript(urllist, callback, debugout);

         if (debugout)
            document.getElementById(debugout).innerHTML = "";

         JSROOT.CallBack(callback);
      }

      if ((urllist==null) || (urllist.length==0))
         return completeLoad();

      var filename = urllist;
      var separ = filename.indexOf(";");
      if (separ>0) {
         filename = filename.substr(0, separ);
         urllist = urllist.slice(separ+1);
      } else {
         urllist = "";
      }

      var isrootjs = false;
      if (filename.indexOf("$$$")==0) {
         isrootjs = true;
         filename = filename.slice(3);
         if ((filename.indexOf("style/")==0) && JSROOT.source_min &&
             (filename.lastIndexOf('.css')==filename.length-3) &&
             (filename.indexOf('.min.css')<0))
            filename = filename.slice(0, filename.length-4) + '.min.css';
      }
      var isstyle = filename.indexOf('.css') > 0;

      if (isstyle) {
         var styles = document.getElementsByTagName('link');
         for (var n in styles) {
            if ((styles[n]['type'] != 'text/css') || (styles[n]['rel'] != 'stylesheet')) continue;

            var href = styles[n]['href'];
            if ((href == null) || (href.length == 0)) continue;

            if (href.indexOf(filename)>=0) return completeLoad();
         }

      } else {
         var scripts = document.getElementsByTagName('script');

         for (var n in scripts) {
            if (scripts[n]['type'] != 'text/javascript') continue;

            var src = scripts[n]['src'];
            if ((src == null) || (src.length == 0)) continue;

            if ((src.indexOf(filename)>=0) && (src.indexOf("load=")<0)) {
               // avoid wrong decision when script name is specified as more argument
               return completeLoad();
            }
         }
      }

      if (isrootjs && (JSROOT.source_dir!=null)) filename = JSROOT.source_dir + filename;

      var element = null;

      JSROOT.console("loading " + filename + " ...", debugout);

      if (isstyle) {
         element = document.createElement("link");
         element.setAttribute("rel", "stylesheet");
         element.setAttribute("type", "text/css");
         element.setAttribute("href", filename);
      } else {
         element = document.createElement("script");
         element.setAttribute('type', "text/javascript");
         element.setAttribute('src', filename);
      }

      if (element.readyState) { // Internet Explorer specific
         element.onreadystatechange = function() {
            if (element.readyState == "loaded" || element.readyState == "complete") {
               element.onreadystatechange = null;
               completeLoad();
            }
         }
      } else { // Other browsers
         element.onload = function() {
            element.onload = null;
            completeLoad();
         }
      }

      document.getElementsByTagName("head")[0].appendChild(element);
   }

   JSROOT.AssertPrerequisites = function(kind, callback, debugout) {
      // one could specify kind of requirements
      // 'io' for I/O functionality (default)
      // '2d' for 2d graphic
      // 'jq' jQuery and jQuery-ui
      // 'jq2d' jQuery-dependend part of 2d graphic
      // '3d' for 3d graphic
      // 'simple' for basic user interface
      // 'load:' list of user-specific scripts at the end of kind string

      var jsroot = this;

      if ((typeof kind != 'string') || (kind == ''))
         return jsroot.CallBack(callback);

      if (kind=='shift') {
         var req = jsroot.doing_assert.shift();
         kind = req._kind;
         callback = req._callback;
         debugout = req._debug;
      } else
      if (jsroot.doing_assert != null) {
         // if function already called, store request
         return jsroot.doing_assert.push({_kind:kind, _callback:callback, _debug: debugout});
      } else {
         jsroot.doing_assert = [];
      }

      if (kind.charAt(kind.length-1)!=";") kind+=";";

      var ext = jsroot.source_min ? ".min" : "";

      var need_jquery = false;

      // file names should be separated with ';'
      var mainfiles = "", extrafiles = ""; // scripts for direct loadin
      var modules = [];  // modules used for require.js

      if (kind.indexOf('io;')>=0) {
         mainfiles += "$$$scripts/rawinflate" + ext + ".js;" +
                      "$$$scripts/JSRootIOEvolution" + ext + ".js;";
         modules.push('JSRootIOEvolution');
      }

      if (kind.indexOf('2d;')>=0) {
         if (!('_test_d3_' in jsroot)) {
            if (typeof d3 != 'undefined') {
               jsroot.console('Reuse existing d3.js ' + d3.version + ", required 3.4.10", debugout);
               jsroot['_test_d3_'] = 1;
            } else {
               mainfiles += '$$$scripts/d3.v3.min.js;';
               jsroot['_test_d3_'] = 2;
            }
         }
         modules.push('JSRootPainter');
         mainfiles += '$$$scripts/JSRootPainter' + ext + ".js;";
         extrafiles += '$$$style/JSRootPainter' + ext + '.css;';
      }

      if (kind.indexOf('jq;')>=0) need_jquery = true;

      if (kind.indexOf('math;')>=0)  {
         mainfiles += '$$$scripts/JSRootMath' + ext + ".js;";
         modules.push('JSRootMath');
      }

      if (kind.indexOf('more2d;')>=0) {
         mainfiles += '$$$scripts/JSRootPainter.more' + ext + ".js;";
         modules.push('JSRootPainter.more');
      }

      if (kind.indexOf('jq2d;')>=0) {
         mainfiles += '$$$scripts/JSRootPainter.jquery' + ext + ".js;";
         modules.push('JSRootPainter.jquery');
         need_jquery = true;
      }

      if (kind.indexOf("3d;")>=0) {
         need_jquery = true;
         mainfiles += "$$$scripts/jquery.mousewheel" + ext + ".js;" +
                      "$$$scripts/three.min.js;" +
                      "$$$scripts/helvetiker_regular.typeface.js;" +
                      "$$$scripts/helvetiker_bold.typeface.js;" +
                      "$$$scripts/JSRoot3DPainter" + ext + ".js;";
         modules.push('JSRoot3DPainter');
      }

      if (kind.indexOf("mathjax;")>=0) {
         if (typeof MathJax == 'undefined') {
            mainfiles += "https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_SVG," +
                          jsroot.source_dir + "scripts/mathjax_config.js;";
         }
         if (JSROOT.MathJax == 0) JSROOT.MathJax = 1;
         modules.push('MathJax');
      }

      if (kind.indexOf("simple;")>=0) {
         need_jquery = true;
         mainfiles += '$$$scripts/JSRootInterface' + ext + ".js;";
         extrafiles += '$$$style/JSRootInterface' + ext + '.css;';
         modules.push('JSRootInterface');
      }

      if (need_jquery && (JSROOT.load_jquery==null)) {
         var has_jq = (typeof jQuery != 'undefined'), lst_jq = "";

         if (has_jq)
            jsroot.console('Reuse existing jQuery ' + jQuery.fn.jquery + ", required 2.1.1", debugout);
         else
            lst_jq += "$$$scripts/jquery.min.js;";
         if (has_jq && typeof $.ui != 'undefined')
            jsroot.console('Reuse existing jQuery-ui ' + $.ui.version + ", required 1.11.0", debugout);
         else {
            lst_jq += '$$$scripts/jquery-ui.min.js;';
            extrafiles += '$$$style/jquery-ui' + ext + '.css;';
         }

         if (JSROOT.touches) {
            lst_jq += '$$$scripts/touch-punch.min.js;';
            modules.push('touch-punch');
         }

         modules.splice(0,0, 'jquery', 'jquery-ui');
         mainfiles = lst_jq + mainfiles;

         jsroot.load_jquery = true;
      }

      var pos = kind.indexOf("user:");
      if (pos<0) pos = kind.indexOf("load:");
      if (pos>=0) extrafiles += kind.slice(pos+5);

      var load_callback = function() {
         if (jsroot.doing_assert && jsroot.doing_assert.length==0) jsroot.doing_assert = null;
         jsroot.CallBack(callback);
         if (jsroot.doing_assert && (jsroot.doing_assert.length>0)) {
            jsroot.AssertPrerequisites('shift');
         }
      }

      if ((typeof define === "function") && define.amd && (modules.length>0)) {
         jsroot.console("loading " + modules + " with require.js", debugout);
         require(modules, function() {
            jsroot.loadScript(extrafiles, load_callback, debugout);
         });
      } else {
         jsroot.loadScript(mainfiles + extrafiles, load_callback, debugout);
      }
   }

   // function can be used to open ROOT file, I/O functionality will be loaded when missing
   JSROOT.OpenFile = function(filename, callback) {
      JSROOT.AssertPrerequisites("io", function() {
         new JSROOT.TFile(filename, callback);
      });
   }

   // function can be used to draw supported ROOT classes,
   // required functionality will be loaded automatically
   // if painter pointer required, one should load '2d' functionlity itself
   JSROOT.draw = function(divid, obj, opt) {
      JSROOT.AssertPrerequisites("2d", function() {
         JSROOT.draw(divid, obj, opt);
      });
   }

   JSROOT.BuildSimpleGUI = function(user_scripts, andThen) {

      var jsroot = this;

      if (typeof user_scripts == 'function') {
         andThen = user_scripts;
         user_scripts = null;
      }

      var debugout = null;
      var nobrowser = jsroot.GetUrlOption('nobrowser')!=null;
      var requirements = "io;2d;";

      if (document.getElementById('simpleGUI')) {
         debugout = 'simpleGUI';
         if ((jsroot.GetUrlOption('json')!=null) &&
             (jsroot.GetUrlOption('file')==null) &&
             (jsroot.GetUrlOption('files')==null)) requirements = "2d;";
      } else
      if (document.getElementById('onlineGUI')) { debugout = 'onlineGUI'; requirements = "2d;"; } else
      if (document.getElementById('drawGUI')) { debugout = 'drawGUI'; requirements = "2d;"; nobrowser = true; }

      if (user_scripts == 'check_existing_elements') {
         user_scripts = null;
         if (debugout == null) return;
      }

      if (!nobrowser) requirements += 'jq2d;simple;';

      if (user_scripts == null) user_scripts = jsroot.GetUrlOption("autoload");
      if (user_scripts == null) user_scripts = jsroot.GetUrlOption("load");

      if (user_scripts != null)
         requirements += "load:" + user_scripts + ";";

      this.AssertPrerequisites(requirements, function() {
         var func = jsroot.findFunction(nobrowser ? 'JSROOT.BuildNobrowserGUI' : 'BuildSimpleGUI');
         jsroot.CallBack(func);
         jsroot.CallBack(andThen);
      }, debugout);
   }

   JSROOT.addFormula = function(obj) {
      var formula = obj['fTitle'];
      formula = formula.replace('abs(', 'Math.abs(');
      formula = formula.replace('sin(', 'Math.sin(');
      formula = formula.replace('cos(', 'Math.cos(');
      formula = formula.replace('exp(', 'Math.exp(');
      var code = obj['fName'] + " = function(x) { return " + formula + " };";
      eval(code);
      var sig = obj['fName']+'(x)';

      var pos = JSROOT.function_list.indexOf(sig);
      if (pos >= 0) {
         JSROOT.function_list.splice(pos, 1);
      }
      JSROOT.function_list.push(sig);
   }

   JSROOT.Create = function(typename, target) {
      var obj = target;
      if (obj == null)
         obj = { _typename: typename };

      if (typename == 'TObject')
         JSROOT.extend(obj, { fUniqueID: 0, fBits: 0x3000008 });
      else
      if (typename == 'TNamed')
         JSROOT.extend(obj, { fUniqueID: 0, fBits: 0x3000008, fName: "", fTitle: "" });
      else
      if ((typename == 'TList') || (typename == 'THashList'))
         JSROOT.extend(obj, { name: typename, arr : [], opt : [] });
      else
      if (typename == 'TAttAxis') {
         JSROOT.extend(obj, { fNdivisions: 510, fAxisColor: 1,
            fLabelColor: 1, fLabelFont: 42, fLabelOffset: 0.005, fLabelSize: 0.035, fTickLength: 0.03,
            fTitleOffset: 1, fTitleSize: 0.035, fTitleColor: 1, fTitleFont : 42 });
      } else
      if (typename == 'TAxis') {
         JSROOT.Create("TNamed", obj);
         JSROOT.Create("TAttAxis", obj);
         JSROOT.extend(obj, { fNbins: 0, fXmin: 0, fXmax: 0, fXbins : [], fFirst: 0, fLast: 0,
                              fBits2: 0, fTimeDisplay: false, fTimeFormat: "", fLabels: null });
      } else
      if (typename == 'TAttLine') {
         JSROOT.extend(obj, { fLineColor: 1, fLineStyle : 1, fLineWidth : 1 });
      } else
      if (typename == 'TAttFill') {
         JSROOT.extend(obj, { fFillColor: 0, fFillStyle : 0 } );
      } else
      if (typename == 'TAttMarker') {
         JSROOT.extend(obj, { fMarkerColor: 1, fMarkerStyle : 1, fMarkerSize : 1. });
      } else
      if (typename == 'TBox') {
         JSROOT.Create("TObject", obj);
         JSROOT.Create("TAttLine", obj);
         JSROOT.Create("TAttFill", obj);
         JSROOT.extend(obj, { fX1: 0, fY1: 0, fX2: 1, fY2: 1 });
      } else
      if (typename == 'TPave') {
         JSROOT.Create("TBox", obj);
         JSROOT.extend(obj, { fX1NDC : 0., fY1NDC: 0, fX2NDC: 1, fY2NDC: 1,
                              fBorderSize: 0, fInit: 1, fShadowColor: 1,
                              fCornerRadius: 0, fOption: "blNDC", fName: "title" });
      } else
      if (typename == 'TAttText') {
         JSROOT.extend(obj, { fTextAngle: 0, fTextSize: 0, fTextAlign: 22, fTextColor: 1, fTextFont: 42});
      } else
      if (typename == 'TPaveText') {
         JSROOT.Create("TPave", obj);
         JSROOT.Create("TAttText", obj);
         JSROOT.extend(obj, { fLabel: "", fLongest: 27, fMargin: 0.05, fLines: JSROOT.Create("TList") });
      } else
      if (typename == 'TPaveStats') {
         JSROOT.Create("TPaveText", obj);
         JSROOT.extend(obj, { fOptFit: 0, fOptStat: 0, fFitFormat: "", fStatFormat: "", fParent: null });
      } else
      if (typename == 'TObjString') {
         JSROOT.Create("TObject", obj);
         JSROOT.extend(obj, { fString: ""});
      } else
      if (typename == 'TH1') {
         JSROOT.Create("TNamed", obj);
         JSROOT.Create("TAttLine", obj);
         JSROOT.Create("TAttFill", obj);
         JSROOT.Create("TAttMarker", obj);

         JSROOT.extend(obj, {
            fNcells : 0,
            fXaxis: JSROOT.Create("TAxis"),
            fYaxis: JSROOT.Create("TAxis"),
            fZaxis: JSROOT.Create("TAxis"),
            fBarOffset : 0, fBarWidth : 1000, fEntries : 0.,
            fTsumw : 0., fTsumw2 : 0., fTsumwx : 0., fTsumwx2 : 0.,
            fMaximum : -1111., fMinimum : -1111, fNormFactor : 0., fContour : [],
            fSumw2 : [], fOption : "",
            fFunctions : JSROOT.Create("TList"),
            fBufferSize : 0, fBuffer : [], fBinStatErrOpt : 0 });
      } else
      if (typename == 'TH1I' || typename == 'TH1F' || typename == 'TH1D' || typename == 'TH1S' || typename == 'TH1C') {
         JSROOT.Create("TH1", obj);
         JSROOT.extend(obj, { fArray: [] });
      } else
      if (typename == 'TH2') {
         JSROOT.Create("TH1", obj);
         JSROOT.extend(obj, { fScalefactor: 1., fTsumwy: 0.,  fTsumwy2: 0, fTsumwxy : 0});
      } else
      if (typename == 'TH2I' || typename == 'TH2F' || typename == 'TH2D' || typename == 'TH2S' || typename == 'TH2C') {
         JSROOT.Create("TH2", obj);
         JSROOT.extend(obj, { fArray: [] });
      } else
      if (typename == 'TGraph') {
         JSROOT.Create("TNamed", obj);
         JSROOT.Create("TAttLine", obj);
         JSROOT.Create("TAttFill", obj);
         JSROOT.Create("TAttMarker", obj);
         JSROOT.extend(obj, { fFunctions: JSROOT.Create("TList"), fHistogram: JSROOT.CreateTH1(),
                              fMaxSize: 0, fMaximum:0, fMinimum:0, fNpoints: 0, fX: [], fY: [] });
      }

      JSROOT.addMethods(obj, typename);
      return obj;
   }

   // obsolete functions, can be removed by next JSROOT release
   JSROOT.CreateTList = function() { return JSROOT.Create("TList"); }
   JSROOT.CreateTAxis = function() { return JSROOT.Create("TAxis"); }

   JSROOT.CreateTH1 = function(nbinsx) {
      var histo = JSROOT.Create("TH1I");
      JSROOT.extend(histo, { fName: "dummy_histo_" + this.id_counter++, fTitle: "dummytitle" });

      if (nbinsx!=null) {
         histo['fNcells'] = nbinsx+2;
         for (var i=0;i<histo['fNcells'];i++) histo['fArray'].push(0);
         JSROOT.extend(histo['fXaxis'], { fNbins: nbinsx, fXmin: 0,  fXmax: nbinsx });
      }
      return histo;
   }

   JSROOT.CreateTH2 = function(nbinsx, nbinsy) {
      var histo = JSROOT.Create("TH2I");
      JSROOT.extend(histo, { fName: "dummy_histo_" + this.id_counter++, fTitle: "dummytitle" });

      if ((nbinsx!=null) && (nbinsy!=null)) {
         histo['fNcells'] = (nbinsx+2) * (nbinsy+2);
         for (var i=0;i<histo['fNcells'];i++) histo['fArray'].push(0);
         JSROOT.extend(histo['fXaxis'], { fNbins: nbinsx, fXmin: 0, fXmax: nbinsx });
         JSROOT.extend(histo['fYaxis'], { fNbins: nbinsy, fXmin: 0, fXmax: nbinsy });
      }
      return histo;
   }

   JSROOT.CreateTGraph = function(npoints) {
      var graph = JSROOT.Create("TGraph");
      JSROOT.extend(graph, { fBits: 0x3000408, fName: "dummy_graph_" + this.id_counter++, fTitle: "dummytitle" });

      if (npoints>0) {
         graph['fMaxSize'] = graph['fNpoints'] = npoints;
         for (var i=0;i<npoints;i++) {
            graph['fX'].push(i);
            graph['fY'].push(i);
         }
         JSROOT.AdjustTGraphRanges(graph);
      }

      return graph;
   }

   // adjust histogram ranges with graph content
   // ygap is value like 0.1 or 0.01 to introduce gaps on Y range
   JSROOT.AdjustTGraphRanges = function(graph,ygap) {
      if (graph['fNpoints']==0) return;

      var minx = graph['fX'][0], maxx = minx;
      var miny = graph['fY'][0], maxy = miny;

      for (var i=1;i<graph['fNpoints'];i++) {
         if (graph['fX'][i] < minx) minx = graph['fX'][i];
         if (graph['fX'][i] > maxx) maxx = graph['fX'][i];
         if (graph['fY'][i] < miny) miny = graph['fY'][i];
         if (graph['fY'][i] > maxy) maxy = graph['fY'][i];
      }

      if (miny==maxy) maxy = miny + 1;

      if (graph['fHistogram'] == null) {
         graph['fHistogram'] = JSROOT.CreateTH1(graph['fNpoints']);
         graph['fHistogram'].fTitle = graph.fTitle;
      }

      graph['fHistogram']['fXaxis']['fXmin'] = minx;
      graph['fHistogram']['fXaxis']['fXmax'] = maxx;

      if ((ygap!=null) && (ygap!=0)) {
         if (miny>0) miny*= (1-2*ygap); else miny*=(1+ygap);
         if (maxy>0) maxy*= (1+ygap); else maxy*=(1-2*ygap);
      }

      graph['fHistogram']['fYaxis']['fXmin'] = miny;
      graph['fHistogram']['fYaxis']['fXmax'] = maxy;
   }

   JSROOT.addMethods = function(obj, obj_typename) {
      // check object type and add methods if needed
      if (('fBits' in obj) && !('TestBit' in obj)) {
         obj['TestBit'] = function (f) { return (this['fBits'] & f) != 0; };
         obj['InvertBit'] = function (f) { this['fBits'] = this['fBits'] ^ (f & 0xffffff); };
      }

      if (!obj_typename) {
         if (!('_typename' in obj)) return;
         obj_typename = obj['_typename'];
      }

      var EBinErrorOpt = {
          kNormal : 0,    // errors with Normal (Wald) approximation: errorUp=errorLow= sqrt(N)
          kPoisson : 1,   // errors from Poisson interval at 68.3% (1 sigma)
          kPoisson2 : 2   // errors from Poisson interval at 95% CL (~ 2 sigma)
       };

      var EErrorType = {
          kERRORMEAN : 0,
          kERRORSPREAD : 1,
          kERRORSPREADI : 2,
          kERRORSPREADG : 3
       };

      if (obj_typename.indexOf("TAxis") == 0) {
         obj['getFirst'] = function() {
            if (!this.TestBit(JSROOT.EAxisBits.kAxisRange)) return 1;
            return this['fFirst'];
         };
         obj['getLast'] = function() {
            if (!this.TestBit(JSROOT.EAxisBits.kAxisRange)) return this['fNbins'];
            return this['fLast'];
         };
         obj['getBinCenter'] = function(bin) {
            // Return center of bin
            var binwidth;
            if (!this['fNbins'] || bin < 1 || bin > this['fNbins']) {
               binwidth = (this['fXmax'] - this['fXmin']) / this['fNbins'];
               return this['fXmin'] + (bin-1) * binwidth + 0.5*binwidth;
            } else {
               binwidth = this['fXbins'][bin] - this['fXbins'][bin-1];
               return this['fXbins'][bin-1] + 0.5*binwidth;
            }
         };
      }

      if ((obj_typename == 'TList') || (obj_typename == 'THashList')) {
         obj['Clear'] = function() {
            this['arr'] = new Array;
            this['opt'] = new Array;
         }
         obj['Add'] = function(obj,opt) {
            this['arr'].push(obj);
            this['opt'].push((opt && typeof opt=='string') ? opt : "");
         }
         obj['AddFirst'] = function(obj,opt) {
            this['arr'].unshift(obj);
            this['opt'].unshift((opt && typeof opt=='string') ? opt : "");
         }
         obj['RemoveAt'] = function(indx) {
            this['arr'].splice(indx, 1);
            this['opt'].splice(indx, 1);
         }
      }

      if ((obj_typename == "TPaveText") || (obj_typename == "TPaveStats")) {
         obj['AddText'] = function(txt) {
            this['fLines'].Add({'fTitle' : txt, "fTextColor" : 1 });
         }
         obj['Clear'] = function() {
            this['fLines'].Clear();
         }
      }

      if ((obj_typename.indexOf("TFormula") != -1) ||
          (obj_typename.indexOf("TF1") == 0)) {
         obj['evalPar'] = function(x) {
            var _func = this['fTitle'];
            _func = _func.replace('TMath::Exp(', 'Math.exp(');
            _func = _func.replace('TMath::Abs(', 'Math.abs(');
            _func = _func.replace('gaus(', 'JSROOT.Math.gaus(this, ' + x + ', ');
            _func = _func.replace('gausn(', 'JSROOT.Math.gausn(this, ' + x + ', ');
            _func = _func.replace('expo(', 'JSROOT.Math.expo(this, ' + x + ', ');
            _func = _func.replace('landau(', 'JSROOT.Math.landau(this, ' + x + ', ');
            _func = _func.replace('landaun(', 'JSROOT.Math.landaun(this, ' + x + ', ');
            _func = _func.replace('pi', 'Math.PI');
            for (var i=0;i<this['fNpar'];++i) {
               while(_func.indexOf('['+i+']') != -1)
                  _func = _func.replace('['+i+']', this['fParams'][i]);
            }
            for (var i=0;i<JSROOT.function_list.length;++i) {
               var f = JSROOT.function_list[i].substring(0, JSROOT.function_list[i].indexOf('('));
               if (_func.indexOf(f) != -1) {
                  var fa = JSROOT.function_list[i].replace('(x)', '(' + x + ')');
                  _func = _func.replace(f, fa);
               }
            }
            // use regex to replace ONLY the x variable (i.e. not 'x' in Math.exp...)
            _func = _func.replace(/\b(x)\b/gi, x);
            _func = _func.replace(/\b(sin)\b/gi, 'Math.sin');
            _func = _func.replace(/\b(cos)\b/gi, 'Math.cos');
            _func = _func.replace(/\b(tan)\b/gi, 'Math.tan');
            _func = _func.replace(/\b(exp)\b/gi, 'Math.exp');
            return eval(_func);
         };
      }

      if (obj_typename=='TF1') {
         obj['GetParName'] = function(n) {
            if (('fFormula' in this) && ('fParams' in this.fFormula)) return this.fFormula.fParams[n].first;
            if ('fNames' in this) return this.fNames[n];
            return "Par"+n;
         }
         obj['GetParValue'] = function(n) {
            if (('fFormula' in this) && ('fClingParameters' in this.fFormula)) return this.fFormula.fClingParameters[n];
            if (('fParams' in this) && (this.fParams!=null))  return this.fParams[n];
            return null;
         }
      }

      if ((obj_typename.indexOf("TGraph") == 0) || (obj_typename == "TCutG")) {
         obj['ComputeRange'] = function() {
            // Compute the x/y range of the points in this graph
            var res = { xmin: 0, xmax: 0, ymin: 0, ymax: 0 };
            if (this['fNpoints'] > 0) {
               res.xmin = res.xmax = this['fX'][0];
               res.ymin = res.ymax = this['fY'][0];
               for (var i=1; i<this['fNpoints']; i++) {
                  if (this['fX'][i] < res.xmin) res.xmin = this['fX'][i];
                  if (this['fX'][i] > res.xmax) res.xmax = this['fX'][i];
                  if (this['fY'][i] < res.ymin) res.ymin = this['fY'][i];
                  if (this['fY'][i] > res.ymax) res.ymax = this['fY'][i];
               }
            }
            return res;
         };
         // check if point inside figure specified by the TGrpah
         obj['IsInside'] = function(xp,yp) {
            var j = this['fNpoints'] - 1 ;
            var x = this['fX'], y = this['fY'];
            var oddNodes = false;

            for (var i=0; i<this['fNpoints']; i++) {
               if ((y[i]<yp && y[j]>=yp) || (y[j]<yp && y[i]>=yp)) {
                  if (x[i]+(yp-y[i])/(y[j]-y[i])*(x[j]-x[i])<xp) {
                     oddNodes = !oddNodes;
                  }
               }
               j=i;
            }

            return oddNodes;
         };
      }
      if (obj_typename.indexOf("TH1") == 0 ||
          obj_typename.indexOf("TH2") == 0 ||
          obj_typename.indexOf("TH3") == 0) {
         obj['getBinError'] = function(bin) {
            //   -*-*-*-*-*Return value of error associated to bin number bin*-*-*-*-*
            //    if the sum of squares of weights has been defined (via Sumw2),
            //    this function returns the sqrt(sum of w2).
            //    otherwise it returns the sqrt(contents) for this bin.
            if (bin < 0) bin = 0;
            if (bin >= this['fNcells']) bin = this['fNcells'] - 1;
            if (this['fNcells'] && this['fSumw2'].length > 0) {
               var err2 = this['fSumw2'][bin];
               return Math.sqrt(err2);
            }
            var error2 = Math.abs(this['fArray'][bin]);
            return Math.sqrt(error2);
         };
         obj['getBinErrorLow'] = function(bin) {
            //   -*-*-*-*-*Return lower error associated to bin number bin*-*-*-*-*
            //    The error will depend on the statistic option used will return
            //     the binContent - lower interval value
            if (this['fBinStatErrOpt'] == EBinErrorOpt.kNormal) return this.getBinError(bin);
            if (bin < 0) bin = 0;
            if (bin >= this['fNcells']) bin = this['fNcells'] - 1;
            var alpha = 1.0 - 0.682689492;
            if (this['fBinStatErrOpt'] == EBinErrorOpt.kPoisson2) alpha = 0.05;
            var c = this['fArray'][bin];
            var n = Math.round(c);
            if (n < 0) {
               alert("GetBinErrorLow : Histogram has negative bin content-force usage to normal errors");
               this['fBinStatErrOpt'] = EBinErrorOpt.kNormal;
               return this.getBinError(bin);
            }
            if (n == 0) return 0;
            return c - JSROOT.Math.gamma_quantile( alpha/2, n, 1.);
         };
         obj['getBinErrorUp'] = function(bin) {
            //   -*-*-*-*-*Return lower error associated to bin number bin*-*-*-*-*
            //    The error will depend on the statistic option used will return
            //     the binContent - lower interval value
            if (this['fBinStatErrOpt'] == EBinErrorOpt.kNormal) return this.getBinError(bin);
            if (bin < 0) bin = 0;
            if (bin >= this['fNcells']) bin = this['fNcells'] - 1;
            var alpha = 1.0 - 0.682689492;
            if (this['fBinStatErrOpt'] == EBinErrorOpt.kPoisson2) alpha = 0.05;
            var c = this['fArray'][bin];
            var n = Math.round(c);
            if (n < 0) {
               alert("GetBinErrorLow : Histogram has negative bin content-force usage to normal errors");
               this['fBinStatErrOpt'] = EBinErrorOpt.kNormal;
               return this.getBinError(bin);
            }
            // for N==0 return an upper limit at 0.68 or (1-alpha)/2 ?
            // decide to return always (1-alpha)/2 upper interval
            //if (n == 0) return ROOT::Math::gamma_quantile_c(alpha,n+1,1);
            return JSROOT.Math.gamma_quantile_c( alpha/2, n+1, 1) - c;
         };
         obj['getBinLowEdge'] = function(bin) {
            // Return low edge of bin
            if (this['fXaxis']['fXbins'].length && bin > 0 && bin <= this['fXaxis']['fNbins'])
               return this['fXaxis']['fXbins']['fArray'][bin-1];
            var binwidth = (this['fXaxis']['fXmax'] - this['fXaxis']['fXmin']) / this['fXaxis']['fNbins'];
            return this['fXaxis']['fXmin'] + (bin-1) * binwidth;
         };
         obj['getBinUpEdge'] = function(bin) {
            // Return up edge of bin
            var binwidth;
            if (!this['fXaxis']['fXbins'].length || bin < 1 || bin > this['fXaxis']['fNbins']) {
               binwidth = (this['fXaxis']['fXmax'] - this['fXaxis']['fXmin']) / this['fXaxis']['fNbins'];
               return this['fXaxis']['fXmin'] + bin * binwidth;
            } else {
               binwidth = this['fArray'][bin] - this['fArray'][bin-1];
               return this['fArray'][bin-1] + binwidth;
            }
         };
         obj['getBinWidth'] = function(bin) {
            // Return bin width
            if (this['fXaxis']['fNbins'] <= 0) return 0;
            if (this['fXaxis']['fXbins'].length <= 0)
               return (this['fXaxis']['fXmax'] - this['fXaxis']['fXmin']) / this['fXaxis']['fNbins'];
            if (bin > this['fXaxis']['fNbins']) bin = this['fXaxis']['fNbins'];
            if (bin < 1) bin = 1;
            return this['fArray'][bin] - this['fArray'][bin-1];
         };
         obj['add'] = function(h1, c1) {
            // Performs the operation: this = this + c1*h1
            // if errors are defined (see TH1::Sumw2), errors are also recalculated.
            // Note that if h1 has Sumw2 set, Sumw2 is automatically called for this
            // if not already set.
            if (!h1 || typeof(h1) == 'undefined') {
               alert("Add : Attempt to add( a non-existing histogram");
               return false;
            }
            if (!c1 || typeof(c1) == 'undefined') c1 = 1;
            var nbinsx = this['fXaxis']['fNbins'],
                nbinsy = this['fYaxis']['fNbins'],
                nbinsz = this['fZaxis']['fNbins'];

            if (this['fDimension'] < 2) nbinsy = -1;
            if (this['fDimension'] < 3) nbinsz = -1;

            // Create Sumw2 if h1 has Sumw2 set
            if (this['fSumw2'].length == 0 && h1['fSumw2'].length != 0) this.sumw2();

            // - Add statistics
            if (isNaN(this['fEntries'])) this['fEntries'] = 0;
            var entries = Math.abs( this['fEntries'] + c1 * h1['fEntries'] );

            // statistics can be preserved only in case of positive coefficients
            // otherwise with negative c1 (histogram subtraction) one risks to get negative variances
            var resetStats = (c1 < 0);
            var s1, s2;
            if (!resetStats) {
               // need to initialize to zero s1 and s2 since
               // GetStats fills only used elements depending on dimension and type
               s1 = this.getStats();
               s2 = h1.getStats();
            }
            this['fMinimum'] = -1111;
            this['fMaximum'] = -1111;

            // - Loop on bins (including underflows/overflows)
            var bin, binx, biny, binz;
            var cu, factor = 1;
            if (Math.abs(h1['fNormFactor']) > Number.MIN_VALUE) factor = h1['fNormFactor'] / h1.getSumOfWeights();
            for (binz=0;binz<=nbinsz+1;binz++) {
               for (biny=0;biny<=nbinsy+1;biny++) {
                  for (binx=0;binx<=nbinsx+1;binx++) {
                     bin = binx +(nbinsx+2)*(biny + (nbinsy+2)*binz);
                     //special case where histograms have the kIsAverage bit set
                     if (this.TestBit(JSROOT.TH1StatusBits.kIsAverage)
                         && h1.TestBit(JSROOT.TH1StatusBits.kIsAverage)) {
                        var y1 = h1.getBinContent(bin),
                            y2 = this.getBinContent(bin),
                            e1 = h1.getBinError(bin),
                            e2 = this.getBinError(bin),
                            w1 = 1, w2 = 1;
                        // consider all special cases  when bin errors are zero
                        // see http://root.cern.ch/phpBB3//viewtopic.php?f=3&t=13299
                        if (e1 > 0)
                           w1 = 1.0 / (e1 * e1);
                        else if (h1['fSumw2'].length) {
                           w1 = 1.E200; // use an arbitrary huge value
                           if (y1 == 0) {
                              // use an estimated error from the global histogram scale
                              var sf = (s2[0] != 0) ? s2[1] / s2[0] : 1;
                              w1 = 1.0 / (sf * sf);
                           }
                        }
                        if (e2 > 0)
                           w2 = 1.0 / (e2 * e2);
                        else if (this['fSumw2'].length) {
                           w2 = 1.E200; // use an arbitrary huge value
                           if (y2 == 0) {
                              // use an estimated error from the global histogram scale
                              var sf = (s1[0] != 0) ? s1[1] / s1[0] : 1;
                              w2 = 1.0 / (sf * sf);
                           }
                        }
                        var y = (w1 * y1 + w2 * y2) / (w1 + w2);
                        this.setBinContent(bin, y);
                        if (this['fSumw2'].length) {
                           var err2 =  1.0 / (w1 + w2);
                           if (err2 < 1.E-200) err2 = 0;  // to remove arbitrary value when e1=0 AND e2=0
                           this['fSumw2'][bin] = err2;
                        }
                     }
                     //normal case of addition between histograms
                     else {
                        cu  = c1 * factor * h1.getBinContent(bin);
                        this['fArray'][bin] += cu;
                        if (this['fSumw2'].length) {
                           var e1 = factor * h1.getBinError(bin);
                           this['fSumw2'][bin] += c1 * c1 * e1 * e1;
                        }
                     }
                  }
               }
            }
            // update statistics (do here to avoid changes by SetBinContent)
            if (resetStats)  {
               // statistics need to be reset in case coefficient are negative
               this.resetStats();
            }
            else {
               var kNstat = 13;
               for (var i=0;i<kNstat;i++) {
                  if (i == 1) s1[i] += c1 * c1 * s2[i];
                  else        s1[i] += c1 * s2[i];
               }
               //this.putStats(s1);
               this['fTsumw']   = s1[0];
               this['fTsumw2']  = s1[1];
               this['fTsumwx']  = s1[2];
               this['fTsumwx2'] = s1[3];
               this['fEntries'] = entries;
            }
            return true;
         };
         obj['getBin'] = function(binx, biny, binz) {
            //   -*-*-*-*Return Global bin number corresponding to binx,y,z*-*-*-*-*-*-*
            var nx, ny, nz;
            if (this['fDimension'] < 2) {
               nx  = this['fXaxis']['fNbins']+2;
               if (binx < 0)   binx = 0;
               if (binx >= nx) binx = nx-1;
               return binx;
            }
            if (this['fDimension'] < 3) {
               nx  = this['fXaxis']['fNbins']+2;
               if (binx < 0)   binx = 0;
               if (binx >= nx) binx = nx-1;
               ny  = this['fYaxis']['fNbins']+2;
               if (biny < 0)   biny = 0;
               if (biny >= ny) biny = ny-1;
               return  binx + nx*biny;
            }
            if (this['fDimension'] < 4) {
               nx  = this['fXaxis']['fNbins']+2;
               if (binx < 0)   binx = 0;
               if (binx >= nx) binx = nx-1;
               ny  = this['fYaxis']['fNbins']+2;
               if (biny < 0)   biny = 0;
               if (biny >= ny) biny = ny-1;
               nz  = this['fZaxis']['fNbins']+2;
               if (binz < 0)   binz = 0;
               if (binz >= nz) binz = nz-1;
               return  binx + nx*(biny +ny*binz);
            }
            return -1;
         };
         obj['getBinXYZ'] = function(binglobal) {
            // return binx, biny, binz corresponding to the global bin number globalbin
            // see TH1::GetBin function above
            var binx, biny, binz;
            var nx  = this['fXaxis']['fNbins']+2;
            var ny  = this['fYaxis']['fNbins']+2;
            if (this['fDimension'] < 2) {
               binx = binglobal%nx;
               biny = -1;
               binz = -1;
            }
            if (this['fDimension'] < 3) {
               binx = binglobal%nx;
               biny = ((binglobal-binx)/nx)%ny;
               binz = -1;
            }
            if (this['fDimension'] < 4) {
               binx = binglobal%nx;
               biny = ((binglobal-binx)/nx)%ny;
               binz = ((binglobal-binx)/nx -biny)/ny;
            }
            return { binsx: binx, biny: biny, binz: binz };
         };
         obj['getSumOfWeights'] = function() {
            //   -*-*-*-*-*-*Return the sum of weights excluding under/overflows*-*-*-*-*
            var sum = 0;
            for (var binz=1; binz<=this['fZaxis']['fNbins']; binz++) {
               for (var biny=1; biny<=this['fYaxis']['fNbins']; biny++) {
                  for (var binx=1; binx<=this['fXaxis']['fNbins']; binx++) {
                     var bin = this.getBin(binx,biny,binz);
                     sum += this.getBinContent(bin);
                  }
               }
            }
            return sum;
         };
         obj['labelsInflate'] = function(ax) {
            // Double the number of bins for axis.
            // Refill histogram

            var axis = null;
            var achoice = ax[0].toUpperCase();
            if (achoice == 'X') axis = this['fXaxis'];
            if (achoice == 'Y') axis = this['fYaxis'];
            if (achoice == 'Z') axis = this['fZaxis'];
            if (axis == null) return;

            var hold = JSROOT.clone(this);

            var timedisp = axis['fTimeDisplay'];
            var nbxold = this['fXaxis']['fNbins'];
            var nbyold = this['fYaxis']['fNbins'];
            var nbzold = this['fZaxis']['fNbins'];
            var nbins  = axis['fNbins'];
            var xmin = axis['fXmin'];
            var xmax = axis['fXmax'];
            xmax = xmin + 2 * (xmax - xmin);
            axis['fFirst'] = 1;
            axis['fLast'] = axis['fNbins'];
            this['fBits'] &= ~(JSROOT.EAxisBits.kAxisRange & 0x00ffffff); // SetBit(kAxisRange, 0);
            // double the bins and recompute ncells
            axis['fNbins'] = 2*nbins;
            axis['fXmin']  = xmin;
            axis['fXmax']  = xmax;
            this['fNcells'] = -1;
            this['fArray'].length = -1;
            var errors = this['fSumw2'].length;
            if (errors) ['fSumw2'].length = this['fNcells'];
            axis['fTimeDisplay'] = timedisp;

            Reset("ICE");  // reset content and error
            this['fSumw2'].splice(0, this['fSumw2'].length);
            this['fMinimum'] = -1111;
            this['fMaximum'] = -1111;

            //now loop on all bins and refill
            var oldEntries = this['fEntries'];
            var bin, ibin, bins;
            for (ibin = 0; ibin < this['fNcells']; ibin++) {
               bins = this.getBinXYZ(ibin);
               bin = hold.getBin(bins['binx'],bins['biny'],bins['binz']);
               // NOTE that overflow in hold will be not considered
               if (bins['binx'] > nbxold  || bins['biny'] > nbyold || bins['binz'] > nbzold) bin = -1;
               if (bin > 0)  {
                  var cu = hold.getBinContent(bin);
                  this['fArray'][bin] += cu;
                  if (errors) this['fSumw2'][ibin] += hold['fSumw2'][bin];
               }
            }
            this['fEntries'] = oldEntries;
            delete hold;
         };
         obj['resetStats'] = function() {
            // Reset the statistics including the number of entries
            // and replace with values calculates from bin content
            // The number of entries is set to the total bin content or (in case of weighted histogram)
            // to number of effective entries
            this['fTsumw'] = 0;
            this['fEntries'] = 1; // to force re-calculation of the statistics in TH1::GetStats
            var stats = this.getStats();
            this['fTsumw']   = stats[0];
            this['fTsumw2']  = stats[1];
            this['fTsumwx']  = stats[2];
            this['fTsumwx2'] = stats[3];
            this['fEntries'] = Math.abs(this['fTsumw']);
            // use effective entries for weighted histograms:  (sum_w) ^2 / sum_w2
            if (this['fSumw2'].length > 0 && this['fTsumw'] > 0 && stats[1] > 0 )
               this['fEntries'] = stats[0] * stats[0] / stats[1];
         }
         obj['setBinContent'] = function(bin, content) {
            // Set bin content
            // see convention for numbering bins in TH1::GetBin
            // In case the bin number is greater than the number of bins and
            // the timedisplay option is set or the kCanRebin bit is set,
            // the number of bins is automatically doubled to accommodate the new bin

            this['fEntries']++;
            this['fTsumw'] = 0;
            if (bin < 0) return;
            if (bin >= this['fNcells']-1) {
               if (this['fXaxis']['fTimeDisplay'] || this.TestBit(JSROOT.TH1StatusBits.kCanRebin) ) {
                  while (bin >= this['fNcells']-1) this.labelsInflate();
               } else {
                  if (bin == this['fNcells']-1) this['fArray'][bin] = content;
                  return;
               }
            }
            this['fArray'][bin] = content;
         };
         obj['sumw2'] = function() {
            // Create structure to store sum of squares of weights*-*-*-*-*-*-*-*
            //
            //     if histogram is already filled, the sum of squares of weights
            //     is filled with the existing bin contents
            //
            //     The error per bin will be computed as sqrt(sum of squares of weight)
            //     for each bin.
            //
            //  This function is automatically called when the histogram is created
            //  if the static function TH1::SetDefaultSumw2 has been called before.

            if (this['fSumw2'].length == this['fNcells']) return;
            this['fSumw2'].length = this['fNcells'];
            if ( this['fEntries'] > 0 ) {
               for (var bin=0; bin<this['fNcells']; bin++) {
                  this['fSumw2'][bin] = Math.abs(this.getBinContent(bin));
               }
            }
         };
      }
      if (obj_typename.indexOf("TH1") == 0) {
         obj['fDimension'] = 1;
         obj['getBinContent'] = function(bin) {
            if (bin < 0) bin = 0;
            if (bin >= this['fNcells']) bin = this['fNcells']-1;
            return this['fArray'][bin];
         };
         obj['getStats'] = function() {
            // fill the array stats from the contents of this histogram
            // The array stats must be correctly dimensioned in the calling program.
            // stats[0] = sumw
            // stats[1] = sumw2
            // stats[2] = sumwx
            // stats[3] = sumwx2
            // Loop on bins (possibly including underflows/overflows)
            var bin, binx, w, err, x, stats = new Array(0,0,0,0,0);
            // case of labels with rebin of axis set
            // statistics in x does not make any sense - set to zero
            if (this['fXaxis']['fLabels'] && this.TestBit(JSROOT.TH1StatusBits.kCanRebin) ) {
               stats[0] = this['fTsumw'];
               stats[1] = this['fTsumw2'];
               stats[2] = 0;
               stats[3] = 0;
            }
            else if ((this['fTsumw'] == 0 && this['fEntries'] > 0) ||
                     this['fXaxis'].TestBit(JSROOT.EAxisBits.kAxisRange)) {
               for (bin=0;bin<4;bin++) stats[bin] = 0;

               var firstBinX = this['fXaxis'].getFirst();
               var lastBinX  = this['fXaxis'].getLast();
               for (binx = firstBinX; binx <= lastBinX; binx++) {
                  x   = this['fXaxis'].getBinCenter(binx);
                  w   = this.getBinContent(binx);
                  err = Math.abs(this.getBinError(binx));
                  stats[0] += w;
                  stats[1] += err*err;
                  stats[2] += w*x;
                  stats[3] += w*x*x;
               }
            } else {
               stats[0] = this['fTsumw'];
               stats[1] = this['fTsumw2'];
               stats[2] = this['fTsumwx'];
               stats[3] = this['fTsumwx2'];
            }
            return stats;
         };
      }
      if (obj_typename.indexOf("TH2") == 0) {
         obj['fDimension'] = 2;
         obj['getBin'] = function(x, y) {
            var nx = this['fXaxis']['fNbins']+2;
            return (x + nx * y);
         };
         obj['getBinContent'] = function(x, y) {
            return this['fArray'][this.getBin(x, y)];
         };
         obj['getStats'] = function() {
            var bin, binx, biny, stats = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0);
            if ((this['fTsumw'] == 0 && this['fEntries'] > 0) || this['fXaxis'].TestBit(JSROOT.EAxisBits.kAxisRange) || this['fYaxis'].TestBit(JSROOT.EAxisBits.kAxisRange)) {
               var firstBinX = this['fXaxis'].getFirst();
               var lastBinX  = this['fXaxis'].getLast();
               var firstBinY = this['fYaxis'].getFirst();
               var lastBinY  = this['fYaxis'].getLast();
               // include underflow/overflow if TH1::StatOverflows(kTRUE) in case no range is set on the axis
               if (this['fgStatOverflows']) {
                 if ( !this['fXaxis'].TestBit(JSROOT.EAxisBits.kAxisRange) ) {
                     if (firstBinX == 1) firstBinX = 0;
                     if (lastBinX ==  this['fXaxis']['fNbins'] ) lastBinX += 1;
                  }
                  if ( !this['fYaxis'].TestBit(JSROOT.EAxisBits.kAxisRange) ) {
                     if (firstBinY == 1) firstBinY = 0;
                     if (lastBinY ==  this['fYaxis']['fNbins'] ) lastBinY += 1;
                  }
               }
               for (biny = firstBinY; biny <= lastBinY; biny++) {
                  y = this['fYaxis'].getBinCenter(biny);
                  for (binx = firstBinX; binx <= lastBinX; binx++) {
                     bin = this.getBin(binx,biny);
                     x   = this['fXaxis'].getBinCenter(binx);
                     w   = this.GetBinContent(bin);
                     err = Math.abs(this.getBinError(bin));
                     stats[0] += w;
                     stats[1] += err*err;
                     stats[2] += w*x;
                     stats[3] += w*x*x;
                     stats[4] += w*y;
                     stats[5] += w*y*y;
                     stats[6] += w*x*y;
                  }
               }
            } else {
               stats[0] = this['fTsumw'];
               stats[1] = this['fTsumw2'];
               stats[2] = this['fTsumwx'];
               stats[3] = this['fTsumwx2'];
               stats[4] = this['fTsumwy'];
               stats[5] = this['fTsumwy2'];
               stats[6] = this['fTsumwxy'];
            }
            return stats;
         };
      }
      if (obj_typename.indexOf("TH3") == 0) {
         obj['fDimension'] = 3;
         obj['getBin'] = function(x, y, z) {
            var nx = this['fXaxis']['fNbins']+2;
            if (x < 0) x = 0;
            if (x >= nx) x = nx-1;
            var ny = this['fYaxis']['fNbins']+2;
            if (y < 0) y = 0;
            if (y >= ny) y = ny-1;
            return (x + nx * (y + ny * z));
         };
         obj['getBinContent'] = function(x, y, z) {
            return this['fArray'][this.getBin(x, y, z)];
         };
         obj['getStats'] = function() {
            var bin, binx, biny, binz, stats = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0);
            if ((obj['fTsumw'] == 0 && obj['fEntries'] > 0) || obj['fXaxis'].TestBit(JSROOT.EAxisBits.kAxisRange) || obj['fYaxis'].TestBit(JSROOT.EAxisBits.kAxisRange) || obj['fZaxis'].TestBit(JSROOT.EAxisBits.kAxisRange)) {
               var firstBinX = obj['fXaxis'].getFirst();
               var lastBinX  = obj['fXaxis'].getLast();
               var firstBinY = obj['fYaxis'].getFirst();
               var lastBinY  = obj['fYaxis'].getLast();
               var firstBinZ = obj['fZaxis'].getFirst();
               var lastBinZ  = obj['fZaxis'].getLast();
               // include underflow/overflow if TH1::StatOverflows(kTRUE) in case no range is set on the axis
               if (obj['fgStatOverflows']) {
                 if ( !obj['fXaxis'].TestBit(JSROOT.EAxisBits.kAxisRange) ) {
                     if (firstBinX == 1) firstBinX = 0;
                     if (lastBinX ==  obj['fXaxis']['fNbins'] ) lastBinX += 1;
                  }
                  if ( !obj['fYaxis'].TestBit(JSROOT.EAxisBits.kAxisRange) ) {
                     if (firstBinY == 1) firstBinY = 0;
                     if (lastBinY ==  obj['fYaxis']['fNbins'] ) lastBinY += 1;
                  }
                  if ( !obj['fZaxis'].TestBit(JSROOT.EAxisBits.kAxisRange) ) {
                     if (firstBinZ == 1) firstBinZ = 0;
                     if (lastBinZ ==  obj['fZaxis']['fNbins'] ) lastBinZ += 1;
                  }
               }
               for (binz = firstBinZ; binz <= lastBinZ; binz++) {
                  z = obj['fZaxis'].getBinCenter(binz);
                  for (biny = firstBinY; biny <= lastBinY; biny++) {
                     y = obj['fYaxis'].getBinCenter(biny);
                     for (binx = firstBinX; binx <= lastBinX; binx++) {
                        bin = obj.getBin(binx,biny,binz);
                        x   = obj['fXaxis'].getBinCenter(binx);
                        w   = obj.GetBinContent(bin);
                        err = Math.abs(obj.getBinError(bin));
                        stats[0] += w;
                        stats[1] += err*err;
                        stats[2] += w*x;
                        stats[3] += w*x*x;
                        stats[4] += w*y;
                        stats[5] += w*y*y;
                        stats[6] += w*x*y;
                        stats[7] += w*z;
                        stats[8] += w*z*z;
                        stats[9] += w*x*z;
                        stats[10] += w*y*z;
                     }
                  }
               }
            } else {
               stats[0] = obj['fTsumw'];
               stats[1] = obj['fTsumw2'];
               stats[2] = obj['fTsumwx'];
               stats[3] = obj['fTsumwx2'];
               stats[4] = obj['fTsumwy'];
               stats[5] = obj['fTsumwy2'];
               stats[6] = obj['fTsumwxy'];
               stats[7] = obj['fTsumwz'];
               stats[8] = obj['fTsumwz2'];
               stats[9] = obj['fTsumwxz'];
               stats[10] =obj['fTsumwyz'];
            }
            return stats;
         };
      }
      if ((obj_typename.indexOf("TH1") == 0) ||
          (obj_typename.indexOf("TH2") == 0) ||
          (obj_typename.indexOf("TH3") == 0) ||
          (obj_typename.indexOf("TProfile") == 0)) {
         obj['getMean'] = function(axis) {
            if (axis < 1 || (axis > 3 && axis < 11) || axis > 13) return 0;
            var stats = this.getStats();
            if (stats[0] == 0) return 0;
            var ax = new Array(2,4,7);
            return stats[ax[axis-1]]/stats[0];
         };
         obj['getRMS'] = function(axis) {
            if (axis < 1 || (axis > 3 && axis < 11) || axis > 13) return 0;
            var stats = this.getStats();
            if (stats[0] == 0) return 0;
            var ax = new Array(2,4,7);
            var axm = ax[axis%10 - 1];
            var x = stats[axm]/stats[0];
            var rms2 = Math.abs(stats[axm+1]/stats[0] -x*x);
            return Math.sqrt(rms2);
         };
      }
      if (obj_typename.indexOf("TProfile") == 0) {
         obj['getBinContent'] = function(bin) {
            if (bin < 0 || bin >= this['fNcells']) return 0;
            if (this['fBinEntries'][bin] < 1e-300) return 0;
            if (!this['fArray']) return 0;
            return this['fArray'][bin]/this['fBinEntries'][bin];
         };
         obj['getBinEffectiveEntries'] = function(bin) {
            if (bin < 0 || bin >= this['fNcells']) return 0;
            var sumOfWeights = this['fBinEntries'][bin];
            if ( this['fBinSumw2'] == null || this['fBinSumw2'].length != this['fNcells']) {
               // this can happen  when reading an old file
               return sumOfWeights;
            }
            var sumOfWeightsSquare = this['fSumw2'][bin];
            return ( sumOfWeightsSquare > 0 ? sumOfWeights * sumOfWeights / sumOfWeightsSquare : 0 );
         };
         obj['getStats'] = function() {
            var bin, binx, stats = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0);
            if (this['fTsumw'] < 1e-300 || this['fXaxis'].TestBit(JSROOT.EAxisBits.kAxisRange)) {
               var firstBinX = this['fXaxis'].getFirst();
               var lastBinX  = this['fXaxis'].getLast();
               for (binx = this['firstBinX']; binx <= lastBinX; binx++) {
                  var w   = onj['fBinEntries'][binx];
                  var w2  = (this['fBinSumw2'] ? this['fBinSumw2'][binx] : w);
                  var x   = fXaxis.GetBinCenter(binx);
                  stats[0] += w;
                  stats[1] += w2;
                  stats[2] += w*x;
                  stats[3] += w*x*x;
                  stats[4] += this['fArray'][binx];
                  stats[5] += this['fSumw2'][binx];
               }
            } else {
               if (this['fTsumwy'] < 1e-300 && this['fTsumwy2'] < 1e-300) {
                  //this case may happen when processing TProfiles with version <=3
                  for (binx=this['fXaxis'].getFirst();binx<=this['fXaxis'].getLast();binx++) {
                     this['fTsumwy'] += this['fArray'][binx];
                     this['fTsumwy2'] += this['fSumw2'][binx];
                  }
               }
               stats[0] = this['fTsumw'];
               stats[1] = this['fTsumw2'];
               stats[2] = this['fTsumwx'];
               stats[3] = this['fTsumwx2'];
               stats[4] = this['fTsumwy'];
               stats[5] = this['fTsumwy2'];
            }
            return stats;
         };
         obj['getBinError'] = function(bin) {
            if (bin < 0 || bin >= this['fNcells']) return 0;
            var cont = this['fArray'][bin];               // sum of bin w *y
            var sum  = this['fBinEntries'][bin];          // sum of bin weights
            var err2 = this['fSumw2'][bin];               // sum of bin w * y^2
            var neff = this.getBinEffectiveEntries(bin);  // (sum of w)^2 / (sum of w^2)
            if (sum < 1e-300) return 0;                  // for empty bins
            // case the values y are gaussian distributed y +/- sigma and w = 1/sigma^2
            if (this['fErrorMode'] == EErrorType.kERRORSPREADG) {
               return (1.0/Math.sqrt(sum));
            }
            // compute variance in y (eprim2) and standard deviation in y (eprim)
            var contsum = cont/sum;
            var eprim2  = Math.abs(err2/sum - contsum*contsum);
            var eprim   = Math.sqrt(eprim2);
            if (this['fErrorMode'] == EErrorType.kERRORSPREADI) {
               if (eprim != 0) return eprim/Math.sqrt(neff);
               // in case content y is an integer (so each my has an error +/- 1/sqrt(12)
               // when the std(y) is zero
               return (1.0/Math.sqrt(12*neff));
            }
            // if approximate compute the sums (of w, wy and wy2) using all the bins
            //  when the variance in y is zero
            var testing = 1;
            if (err2 != 0 && neff < 5) testing = eprim2*sum/err2;
            if (this['fgApproximate'] && (testing < 1.e-4 || eprim2 < 1e-6)) { //3.04
               var stats = this.getStats();
               var ssum = stats[0];
               // for 1D profile
               var idx = 4;  // index in the stats array for 1D
               var scont = stats[idx];
               var serr2 = stats[idx+1];
               // compute mean and variance in y
               var scontsum = scont/ssum; // global mean
               var seprim2  = Math.abs(serr2/ssum - scontsum*scontsum); // global variance
               eprim = 2*Math.sqrt(seprim2); // global std (why factor of 2 ??)
               sum = ssum;
            }
            sum = Math.abs(sum);
            // case option "S" return standard deviation in y
            if (this['fErrorMode'] == EErrorType.kERRORSPREAD) return eprim;
            // default case : fErrorMode = kERRORMEAN
            // return standard error on the mean of y
            return (eprim/Math.sqrt(neff));
         };
      }
   };

   JSROOT.lastFFormat = "";

   JSROOT.FFormat = function(value, fmt) {
      // method used to convert numeric value to string according specified format
      // format can be like 5.4g or 4.2e or 6.4f
      // function saves actual format in JSROOT.lastFFormat variable
      if (!fmt) fmt = "6.4g";

      JSROOT.lastFFormat = "";

      if (!fmt) fmt = "6.4g";
      fmt = fmt.trim();
      var len = fmt.length;
      if (len<2) return value.toFixed(4);
      var last = fmt.charAt(len-1);
      fmt = fmt.slice(0,len-1);
      var isexp = null;
      var prec = fmt.indexOf(".");
      if (prec<0) prec = 4; else prec = Number(fmt.slice(prec+1));
      if (isNaN(prec) || (prec<0) || (prec==null)) prec = 4;
      var significance = false;
      if ((last=='e') || (last=='E')) { isexp = true; } else
      if (last=='Q') { isexp = true; significance = true; } else
      if ((last=='f') || (last=='F')) { isexp = false; } else
      if (last=='W') { isexp = false; significance = true; } else
      if ((last=='g') || (last=='G')) {
         var se = JSROOT.FFormat(value, fmt+'Q');
         var _fmt = JSROOT.lastFFormat;
         var sg = JSROOT.FFormat(value, fmt+'W');

         if (se.length < sg.length) {
            JSROOT.lastFFormat = _fmt;
            return se;
         }
         return sg;
      } else {
         isexp = false;
         prec = 4;
      }

      if (isexp) {
         // for exponential representation only one significant digit befor point
         if (significance) prec--;
         if (prec<0) prec = 0;

         JSROOT.lastFFormat = '5.'+prec+'e';

         return value.toExponential(prec);
      }

      var sg = value.toFixed(prec);

      if (significance) {

         // when using fixed representation, one could get 0.0
         if ((value!=0) && (Number(sg)==0.) && (prec>0)) {
            prec = 40; sg = value.toFixed(prec);
         }

         var l = 0;
         while ((l<sg.length) && (sg.charAt(l) == '0' || sg.charAt(l) == '-' || sg.charAt(l) == '.')) l++;

         var diff = sg.length - l - prec;
         if (sg.indexOf(".")>l) diff--;

         if (diff != 0) {
            prec-=diff; if (prec<0) prec = 0;
            sg = value.toFixed(prec);
         }
      }

      JSROOT.lastFFormat = '5.'+prec+'f';

      return sg;
   }

   JSROOT.log10 = function(n) {
      return Math.log(n) / Math.log(10);
   }

   // it is important to run this function at the end when all other
   // functions are available
   JSROOT.Init = function() {
      function window_on_load(func) {
         if (func!=null) {
            if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading')
               func();
            else
               window.onload = func;
         }
         return JSROOT;
      }

      var scripts = document.getElementsByTagName('script');

      for (var n in scripts) {
         if (scripts[n]['type'] != 'text/javascript') continue;

         var src = scripts[n]['src'];
         if ((src == null) || (src.length == 0)) continue;

         var pos = src.indexOf("scripts/JSRootCore.");
         if (pos<0) continue;

         JSROOT.source_dir = src.substr(0, pos);
         JSROOT.source_min = src.indexOf("scripts/JSRootCore.min.js")>=0;

         JSROOT.console("Set JSROOT.source_dir to " + JSROOT.source_dir);

         if (JSROOT.GetUrlOption('gui', src)!=null)
            return window_on_load(function() { JSROOT.BuildSimpleGUI(); });

         if ( typeof define === "function" && define.amd )
            return window_on_load(function() { JSROOT.BuildSimpleGUI('check_existing_elements'); });

         var prereq = "";
         if (JSROOT.GetUrlOption('io', src)!=null) prereq += "io;";
         if (JSROOT.GetUrlOption('2d', src)!=null) prereq += "2d;";
         if (JSROOT.GetUrlOption('jq2d', src)!=null) prereq += "jq2d;";
         if (JSROOT.GetUrlOption('3d', src)!=null) prereq += "3d;";
         if (JSROOT.GetUrlOption('math', src)!=null) prereq += "math;";
         if (JSROOT.GetUrlOption('mathjax', src)!=null) prereq += "mathjax;";
         var user = JSROOT.GetUrlOption('load', src);
         if ((user!=null) && (user.length>0)) prereq += "load:" + user;
         var onload = JSROOT.GetUrlOption('onload', src);

         if ((prereq.length>0) || (onload!=null))
            window_on_load(function() {
              if (prereq.length>0) JSROOT.AssertPrerequisites(prereq, onload); else
              if (onload!=null) {
                 onload = JSROOT.findFunction(onload);
                 if (typeof onload == 'function') onload();
              }
            });

         return this;
      }
      return this;
   }

   return JSROOT.Init();

}));

/// JSRootCore.js ends

