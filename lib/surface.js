//     (c) 2012 Victor Saiz, Michael Aufreiter
//     surface is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/surface/surface

// TODO: Implement updating the range within an annotation
// TODO: create tests

(function() {

  // Backbone.Events
  // -----------------

  // Regular expression used to split event strings
  var eventSplitter = /\s+/;
  // Create a local reference to slice/splice.
  var slice = Array.prototype.slice;
  var splice = Array.prototype.splice;

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback functions
  // to an event; trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
    _.Events = window.Backbone ? Backbone.Events : {

    // Bind one or more space separated events, `events`, to a `callback`
    // function. Passing `"all"` will bind the callback to all events fired.
    on: function(events, callback, context) {

      var calls, event, node, tail, list;
      if (!callback) return this;
      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      // Create an immutable callback list, allowing traversal during
      // modification.  The tail is an empty object that will always be used
      // as the next node.
      while (event = events.shift()) {
        list = calls[event];
        node = list ? list.tail : {};
        node.next = tail = {};
        node.context = context;
        node.callback = callback;
        calls[event] = {tail: tail, next: list ? list.next : node};
      }

      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all callbacks
    // with that function. If `callback` is null, removes all callbacks for the
    // event. If `events` is null, removes all bound callbacks for all events.
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) return;
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      // Loop through the listed events and contexts, splicing them out of the
      // linked list of callbacks if appropriate.
      events = events ? events.split(eventSplitter) : _.keys(calls);
      while (event = events.shift()) {
        node = calls[event];
        delete calls[event];
        if (!node || !(callback || context)) continue;
        // Create a new list, omitting the indicated callbacks.
        tail = node.tail;
        while ((node = node.next) !== tail) {
          cb = node.callback;
          ctx = node.context;
          if ((callback && cb !== callback) || (context && ctx !== context)) {
            this.on(event, cb, ctx);
          }
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) return this;
      all = calls.all;
      events = events.split(eventSplitter);
      rest = slice.call(arguments, 1);

      // For each event, walk through the linked list of callbacks twice,
      // first to trigger the event, then to trigger any `"all"` callbacks.
      while (event = events.shift()) {
        if (node = calls[event]) {
          tail = node.tail;
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, rest);
          }
        }
        if (node = all) {
          tail = node.tail;
          args = [event].concat(rest);
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, args);
          }
        }
      }

      return this;
    }

  };

  // Substance
  // ---------

  if (!window.Substance) { var Substance = window.Substance = {}; }

  // Surface
  // ---------

  Substance.Surface = function(options) {

    var range
    ,   $el = $(options.el)
    ,   annotationList = []
    ,   events = _.extend({}, _.Events);

    // Modes
    // -------
    var modes = {
          INSERT: 'insertMode',
          SELECT: 'selectMode',
          IDLE: 'idleMode',
          OFF: 'offMode'
    },
    mode = modes.IDLE;

    // manage modes
    // ------
    function setMode(m){
      console.log('currently in:', mode);
      console.log('changing to:', m);
      if(mode !== m){
        switch(m){

          case modes.INSERT:
            cm.focus();
            cm.setOption('readOnly', false);
            $el.addClass('active');
            applyMode(m);
            break;

          case modes.IDLE:
            if(mode !== modes.SELECT && mode !== modes.OFF){
              cm.setOption('readOnly', true);
              $el.removeClass('active');
              applyMode(m);
            }
            break;

          case modes.OFF:
            cm.setOption('readOnly', 'nocursor');
            $el.removeClass('active');
            applyMode(m);
            break;
        }


      }
    }

    function applyMode(m){
        events.trigger('mode:change', m);
        mode = m;
    }

    // Force linewrapping before init
    options.lineWrapping = true;
    // options.autofocus = true;
    options.readOnly = true;

    // Init CodeMirror
    var cm = CodeMirror($el[0], options);
    

    // CodeMirror events
    // -----------------

    cm.setOption('onUpdate', function(){
      // console.log('update');
      // console.log(cm.getHistory());
    });

    cm.setOption('onCursorActivity', function(cm){
      console.log('cursor');
      // Make sure we at least have 1 character selected
      if (cm.getSelection().length > 0){
        // Set the selection range
        var from = cm.getCursor(true)
        ,   to = cm.getCursor(false)
        , str = cm.getSelection();

        range = {'from':from, 'to':to, 'str': str};
        findMatch();
        setMode(modes.SELECT);
        events.trigger('selection:change', selection());
      }
    });

    $el.dblclick(function(){
      if (cm.getSelection().length > 0) {
        setMode(modes.SELECT);
      }else {
        events.trigger('selection:clear');
      }
    });

    // CodeMirror Blurred/Focus events
    // TODO: decide what part of this code is done in Text
    // ..... and what is in CM as in involves the tools

    $(document).mousedown(function(el){
      var $cl = $(el.toElement);
      var clickedClass = $cl.attr('class');
      var classRegex = /.*(CodeMirror|cm|tool).*/;
      var matched = classRegex.exec(clickedClass);
      
      if(!matched && cm.getSelection().length < 1 ){
        onBlur(clickedClass);
      }else{
        onFocus(clickedClass);
      }
      // console.log('matched', typeof matched !== 'undefined');
    });

    // Focussed
    function onFocus(clss){
      if(mode !== modes.OFF 
        // make sure we're not clicking on the tools
        && !clss.match(/tool/g)) {
        setMode(modes.INSERT);
        events.trigger('selection:clear');
      }
    }

    // Blurred
    function onBlur($cl){
        setMode(modes.IDLE);
    }
    // //////////////////////////////////////////////////
    // //////////////////////////////////////////////////


    // Resets the cursor selection to the actual range
    function resetCursor(range) {
      // Reselect trimmed range and string value
      cm.setSelection(range.from, range.to);
    }

    // Unselects left or right blank characters
    function trim(sel) {
      var first = sel.str.charCodeAt(0);
      var last = sel.str.charCodeAt(sel.str.length-1);
      // Check if first character is blank and adjusts the annotation range if it is
      if (first === 32){
        sel.from.ch = sel.from.ch + 1;
      }

      // Check if last character is blank and adjusts the annotation range if it is
      if (last === 32){
        sel.to.ch = sel.to.ch - 1;
      }

      // Get selection string
      sel.str = cm.getRange(sel.from, sel.to);
      return sel;
    }

    // Turns position line objects into a single value representing the offset from character 0
    function toOffset(pos) {
      var offset = 0;
      if (pos.line > 0) {
        var i = 0;
        for(; i < pos.line; i++ ){
          offset += cm.lineInfo(i).text.length + 1;//count the newline character as 1?
        }
      }
      return pos.ch + offset;
    }
    
    // Returns the current selection
    function selection() {
      if (undefined != range) {
        range = trim(range);
        var start = toOffset(range.from);
        var end = toOffset(range.to);
        return { 'start': start, 'end': end, 'range': range} ;
      }
    }

    // Adds annotation (uses the current selection)
    function annotate(note) {
      if (cm.getSelection().length > 0) {
        note.pos = selection();
        //autogenerated id based on the type and the ofsset position string
        note.id = note.type + '-' + note.pos.start + '' + note.pos.end;

        annotationList.push(note);
        resetCursor(range);
        cm.markText(range.from, range.to, 'surface-' + note.type);
        events.trigger('annotation:change', note);
      }
    }

    // Finds matching annotations for the selected range
    function findMatch(){
      var start = toOffset(range.from);
      var end = toOffset(range.to);
      var found = _.find(annotationList, function(ann){ return ann.pos.start === start && ann.pos.end === end; });
      if(typeof found !== 'undefined'){
        found.match = true;
        events.trigger('annotation:match', found);
      }else{
        events.trigger('annotation:nomatch');
      }
    }

    function remove(item){
      cm.replaceSelection(item.pos.range.str);
      annotationList =  _.without(annotationList, item);
    }

    // Returns mathcing annotations if there are
    function annotations(sel){
      if (undefined != sel){
        return _.filter(annotationList , function(ann) {
          return ann.pos.start == sel.start && ann.pos.end == sel.end;
        });
      } else {
        return annotationList;
      }
    }

    // mode getter
    function getMode(){
      return mode;
    }

    function enable(){
      setMode(modes.INSERT);
    }

    function cancel(){
      // TODO: needs to take the already saved surface if there is one before resetting!!
      var content = cm.getValue();
      cm.setValue(content);
      setMode(modes.OFF);
    }

    function disable(){
      setMode(modes.OFF);
    }

    function getModes(){
      return modes;
    }

    // Expose public API
    // -----------------
    
    return {
      on:          function () { events.on.apply(events, arguments); },
      off:         function () { events.off.apply(events, arguments); },
      trigger:     function () { events.trigger.apply(events, arguments); },
      setValue:    function(value){ cm.setValue(value); },

      annotations:  annotations,
      selection:    selection,
      annotate:     annotate,
      remove:       remove,
      enable:       enable,
      disable:      disable,
      cancel:       cancel,
      getModes:     getModes,

      // just testing what we have so far to render html from the Surface
      compile:      function compile(){
                      var content = cm.getValue();
                      var off = 0;

                      _.each( annotationList, function(annot){
                        var pre = content.substr(0, annot.pos.start + off);
                        var post = content.substr(annot.pos.end + off, content.length +  off);
                        
                        var sub = annot.pos.range.str;

                        var preStyling = '<span class="surface-' + annot.type + '">';
                        var postStyling = '</span>';
                        var styling = preStyling + postStyling;
                        content = pre +  preStyling  + sub + postStyling + post;
                        off = styling.length;
                      });
                      // content = content.replace(/\r\n|\r|\n/g,"<br />");
                      content = content.replace(/\n/g,"<br />");
                      return content;
                    }
    };
  };
})(window);