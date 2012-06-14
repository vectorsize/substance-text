//     (c) 2012 Victor Saiz, Michael Aufreiter
//     Proper is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/substance/proper

// Goals:
//
// * Annotations (strong, em, code, link) are exclusive. No text can be both
//   emphasized and strong.
// * The output is plain.
// * Cross-browser compatibility: Support the most recent versions of Chrome,
//   Safari, Firefox and Internet Explorer. Proper should behave the same on
//   all these platforms (if possible).

(function(){

  var Range = Backbone.Model.extend({});
  var Doc = Backbone.Collection.extend({
        model: Range
  });

  this.Proper = function(options) {

    var doc = new Doc()
    ,   from
    ,   to
    ,   combined
    ,   fit
    ,   commands = {
          em: {
            name: 'Emphasis',
            command: 'em',
            key: '(CTRL+SHIFT+E)',
            isActive: false,
            exec: function() {
              exec('em');
            }
          },
          strong: {
            name: 'Strong',
            command: 'strong',
            key: '(CTRL+SHIFT+S)',
            isActive: false,
            exec: function() {
              exec('strong');
            }
          },
          underline: {
            name: 'Underline',
            command: 'underline',
            key: '(CTRL+SHIFT+U)',
            isActive: false,
            exec: function() {
              exec('underline');
            }
          }
    };

    // initialize CodeMirror
    var editor = CodeMirror.fromTextArea($(".editable")[0], {
      lineNumbers: false,
      lineWrapping: true,
      onCursorActivity: function() {
        from = editor.getCursor(true);
        to = editor.getCursor(false);
        combined = '' + from.ch + '' + from.line + '' + to.ch + '' + to.line + '';
        matchRanges();
      }
    });

    // initialize Tools
    var initToolbar = function(){
      
      var toolBTN = _.template(
        '<li>\
            <a href="#<%= command %>" title="<%= name %> <%= key %>" class="command <%= command %>" id="<%= command %>" command="<%= command %>">\
              <div><%= name %></div>\
            </a>\
          </li>'
        );
      
      _.each(commands, function(com){
        var tool = $(toolBTN({'command':com.command, 'name':com.name, 'key':com.key}));

        tool.click(function(event) {
          event.preventDefault();
          commands[com.command].exec(com.command);
        });

        $('#tools').append(tool);
      });
    };

    // Adds a new range to the document and applies the visual styles to the html
    var exec = function(type){
      
      if(editor.getSelection().length > 0){
        trim();
        var current = new Range({'from':from, 'to':to, 'type':type, 'combined': combined});

        //a range matches
        if(typeof fit !== 'undefined'){
          // it's not of the same type we take away the xisting one to replace it
          if(fit.get('type') !== type){
            doc.remove(fit);
            doc.add(current);
          }else{
            // it's of the same type we deactivate/take away the xisting one
            doc.remove(fit);
          }
          
        }else{
        //no matching ranges we just add it
          doc.add(current);
        }

        editor.replaceRange(editor.getValue() , {line:0, ch:0}, {line:editor.lineCount(), ch:'0'});
        
        _.each(doc.models, function(model){
          var from = model.get('from')
          ,   to = model.get('to')
          ,   type = model.get('type');

          editor.markText(from, to, type);
        });

        $('#source').html(JSON.stringify(doc.toJSON()));
        editor.setSelection(current.get('from'), current.get('to'));
      }
    };

    //quantize the selection to the nearest non-blank character
    var trim = function(){

      var head = editor.getRange(from, {'ch':from.ch + 1, 'line':from.line});
      var tail = editor.getRange({'ch':to.ch - 1, 'line':to.line}, to);

      if(head.charCodeAt(0) === 32){
        from.ch = from.ch + 1;
      }
      
      if(tail.charCodeAt(0) === 32){
        to.ch = to.ch - 1;
      }
      
      editor.setSelection(from, to);
    };

    //checks if the selection is already marked and activates the corresponding tool
    var matchRanges = function(){
      var match = doc.where({'combined':combined});
      fit = match[0];

      if(match.length > 0){
          commands[fit.get('type')].isActive = true;
          $('#' + fit.get('type')).addClass('selected');
      }else{
        _.each(commands, function(com, key){
          commands[key].isActive = false;
        });
        $('ul#tools li a').removeClass('selected'); 
      }

    };

    initToolbar();

    // Expose public API
    // -----------------
    //return {};
  };
})();