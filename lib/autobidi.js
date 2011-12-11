/**
    (c) 2011 Hasen el Judy
    bidiweb is freedly distributed under the MIT license
  
    Basic usage:
    Call `bidiweb.process(element)` to automatically detect RTL
    paragraphs/segments inside element and apply `direction:rtl` to them.
    `element` can be anything that is passed to `jQuery()`
*/


// Fill in missing functions (for IE)
// This code was taken from the mozilla (MDN) wiki
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }

    return res;
  };
}

if (!Array.prototype.map)
{
  Array.prototype.map = function(fun /*, thisp*/)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        res[i] = fun.call(thisp, this[i], i, this);
    }

    return res;
  };
}
// end of mozilla's MDN wiki code

if (typeof console === 'undefined') {
  console = { 'log': function() {} };
}
// namespace
bidiweb = (function(){
var module = {};

/**
    bidiweb.get_direction(text[, use_guesstimate])

    Input: raw text
    Output: The base direction of the paragraph

    @returns: a string, one of: ('R', 'L', 'N')

    If guesstimate is false, returns the direction of the first character.
    If guesstimate is true, it uses the following heuristic:

    - Read the first X words (use 15 for X) of the first line.
    - Use the direction of the first words as the first candidate, call it D,
      and let the other direction be T.
    - If the first line has less than X words, return D as the base.
    - Determine the ratio of T words to D words in the first X words
    - If the T direction occupies more than P% of the words (use 60 for P),
      return it as the base paragraph direction
    - Else, return D as the base paragraph direction

    Notes: 
       - An explicit unicode mark as the first character can be used to override
       this heuristic [NOT-YET]
       - We only return N if the paragraph doesn't seem to have any real words
 */
module.get_direction = function(text, guesstimate)
{
    if (guesstimate == null) guesstimate = false;

    // TODO: check first character is a unicode dir character!
    var is_word = function(word) {
        return word.length > 0; // && word.match(/\w+/) 
        // wops! \w only matches ascii characters :(
    }
    var words = text.split(' ').filter(is_word);

    var dirs = words.map(module.get_word_dir);

    var func_same_direction = function(dir) { 
        return function(d) { return d == dir; }; 
    }
    var is_non_neutral_dir = function(d) { return d != 'N'; };
    var other_direction = function(dir) { return {'L':'R', 'R':'L'}[dir]; };

    // should be really the same as dirs because we already filtered out
    // things that are not words!
    var X = 100;
    var hard_dirs = dirs.filter(is_non_neutral_dir).slice(0, X);

    if (hard_dirs.length == 0) { return 'N'; }
    var candidate = hard_dirs[0];

    if(guesstimate === false) {
        return candidate;
    }

    var DIR_COUNT_THRESHOLD = 10;
    if (hard_dirs.length < DIR_COUNT_THRESHOLD) return candidate;

    var cand_words = hard_dirs.filter(func_same_direction(candidate));
    var other_words = hard_dirs.filter(func_same_direction(other_direction(candidate)));

    if (other_words.length == 0) return candidate;
    var other_dir = other_words[0];

    var MIN_RATIO = 0.4; // P
    var ratio = cand_words.length / other_words.length;
    if (ratio >= MIN_RATIO) {
        return candidate;
    } else {
        return other_dir;
    }
}

module.get_word_dir = function(word) {
    // regexes to identify ltr and rtl characters
    // stolen from google's i18n.bidi
    var ltr_re_ =
        'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
        '\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF';

    var rtl_re_ = '\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC';
    // end of google steal

    var ltr_re = RegExp('[' + ltr_re_ + ']+');
    var rtl_re = RegExp('[' + rtl_re_ + ']+');

    if(ltr_re.exec(word)) {
        return 'L';
    } else if (rtl_re.exec(word)) {
        return 'R';
    } else {
        return 'N';
    }
}

function process_inline(e, settings) {
    var dir = module.get_direction(e.text(), settings.use_guesstimate);
    var map = { 
        'L': 'ltr',
        'R': 'rtl'
        }
    if(!(dir in map)) return;
    e.css('direction', map[dir]);
    if(settings.set_align) {
        // we might have problems with cleaning after-wards ..
        // so by default, set_aligh is set to false
        e.css('text-align', 'start');
    }

}

function process_to_class(e, settings) {
    var dir = module.get_direction(e.text(), settings.use_guesstimate);
    var map = {'L': settings.ltr_class, 'R': settings.rtl_class};
    if(!(dir in map)) return;
    e.addClass(map[dir]);
}

var clean_css = function(element) {
    // element should be a single element, not many elements ..
    element = jQuery(element);
    var clean_prop = function(e, prop) {
        if(e.css(prop) == e.parent().css(prop)) {
            e.css(prop, '');
        }
    }
    clean_prop(element, 'direction');
    clean_prop(element, 'text-align');
    if(element.attr('style') == '') {
        element.removeAttr('style');
    }
}

/**
    High Level API 

    Fix the direction for a given set of elements

    Requires jQuery
    
    Usage:

    bidiweb.process(node)
    bidiweb.process(node, settings)

    `node` can be a text query like '.content', an dom-node object, or a jquery object. Generally, any object that can be passed to jQuery.

    `settings` is optional, if supplied, it must be a dictionary. The following keys are recognized, all of which are optional:

        elements: a query to find elements that we want to fix.
            The default is: 'h1, h2, h3, p, ul, ol, blockquote, div, span'
        extra_elements: if you don't want to replace the default
            elements, you can specify extra elements that you want to process
        method: one of 'inline' or 'class' (defaults to inline)
        ltr_class: if you choose 'class' for the method, this is the class
            name that will be added to elements which are detected to be LTR;
            defaults to 'ltr'
        rtl_class: if you choose 'class' for the method, this is the class
            name that will be added to elements which are detected to be RTL;
            defaults to 'rtl'
        set_align: When using the inline method, should we also
            set the text-align attribute? off by default.
        clean: don't put extra attributes that are not needed. on by default.
            For example, if the parent element is already LTR, there's no need to clutter the html/dom with extra css properties
 */
module.process = function (node, settings) {
    if (settings == null) settings = {};

    var default_settings = {
        'elements': 'h1, h2, h3, p, ul, ol, blockquote, div, span',
        'extra_elements': null,
        'rtl_class': 'rtl',
        'ltr_class': 'ltr',
        'method': 'inline',
        'clean': true,
        'use_guesstimate': false,
        'set_align': false,
        }

    // use default settings
    for(key in default_settings) {
        if (!(key in settings)) settings[key] = default_settings[key];
    }

    var container = jQuery(node);
    var elements = container.add(container.find(settings.elements)); // add creates a new object; doesn't mutate container
    if(settings.extra_elements) {
        elements = elements.add(container.find(settings.extra_elements));
    }

    var method_map = {'inline': process_inline, 'class': process_to_class};
    if (!(settings.method in method_map)) {
        console.log("Warning: autobidi: the specified method is invalid: " + method);
        settings.method = default_settings.method;
    }
    var process_fn = method_map[settings.method];

    elements.each(function() {
        var e = jQuery(this); // element
        process_fn(e, settings);
    });

    if(settings.clean) {
        elements.each(function(index, element){
            clean_css(element);
        });
    }
}

return module;
})();
