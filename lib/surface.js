//     (c) 2012 Victor Saiz, Michael Aufreiter
//     surface is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/surface/surface

// Goals:

// TODO: delete annotations
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
    ,   annotationList = []
    ,   events = _.extend({}, _.Events);

    // Init CodeMirror
    var cm = CodeMirror($(options.el)[0], options);

    // Override options
    cm.setOption('lineWrapping', true);
    
    // CodeMirror events
    // -----------------

    cm.setOption('onCursorActivity', function(cm){
      // Make sure we at least have 1 character selected
      if (cm.getSelection().length !== 0){
        // Set the selection range
        var from = cm.getCursor(true)
        ,   to = cm.getCursor(false)
        , str = cm.getSelection();

        range = {'from':from, 'to':to, 'str': str};
        findMatch();

        events.trigger('selection:change', selection());
      } else{
        events.trigger('selection:click');
      }
    });

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
        return { 'start': start, 'end': end} ;
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
        // Fast marking techinque
        found.match = true;
        events.trigger('annotation:match', found);
      }else{
        events.trigger('annotation:nomatch');
      }
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

    // Expose public API
    // -----------------
    
    return {
      on:          function () { events.on.apply(events, arguments); },
      off:         function () { events.off.apply(events, arguments); },
      trigger:     function () { events.trigger.apply(events, arguments); },
      annotations: annotations,
      selection:   selection,
      annotate:    annotate
    };
  };
})(window);