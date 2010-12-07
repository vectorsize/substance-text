//     (c) 2010 Michael Aufreiter
//     Proper is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/michael/proper

(function(){

  // Initial Setup
  // -------------

  controlsTpl = ' \
    <div class="proper-commands"> \
      <a href="/" class="command strong" command="strong"><div>Bold</div></a> \
      <a href="/" class="command em" command="em"><div>Emphasis</div></a> \
      <div class="separator">|</div> \
      <a href="/" class="command ul" command="ul"><div>Bullets List</div></a> \
      <a href="/" class="command ol" command="ol"><div>Numbered List</div></a> \
      <a href="/" class="command indent" command="indent"><div>Indent</div></a> \
      <a href="/" class="command outdent" command="outdent"><div>Outdent</div></a> \
      <div class="separator">|</div> \
      <a href="/" class="command link" command="link"><div>Link</div></a> \
    </div> \
  ';
  
  // Proper
  // -----------
  
  this.Proper = function(options) {
    var elements = $(options.elements),  // all watched elements
        activeElement = null,            // element that is being edited
        $controls = $(controlsTpl),      // the controls panel
        self = {};
    
    
    // Commands
    // -----------
    
    var commands = {
      execEM: function() {
        document.execCommand('italic', false, true);
        return false;
      },

      execSTRONG: function() {
        document.execCommand('bold', false, true);
        return false;
      },

      execUL: function() {
        document.execCommand('insertUnorderedList', false, null);
        return false;
      },

      execOL: function() {
        document.execCommand('insertOrderedList', false, null);
        return false;
      },

      execINDENT: function() {
        document.execCommand('indent', false, null);
        return false;
      },

      execOUTDENT: function() {
        document.execCommand('outdent', false, null);
        return false;
      },
      
      execLINK: function() {
        document.execCommand('CreateLink', false, prompt('URL:'));
        return false;
      },

      showHTML: function() {
        alert($(this.el).html());
      }
    };

    // Activate editor for a given element
    
    function deactivate() {
      $(activeElement).attr('contenteditable', 'false');
      $controls.hide();
    }
    
    function activate(el) {
      
      if (el !== activeElement) {
        // Deactivate previously active element
        deactivate();
        
        // Make editable
        $(el).attr('contenteditable', true);
        activeElement = el;
        
        // Show and reposition controls
        $controls.show();
        var offset = $(el).offset();
        $controls.css('left', offset.left)
                 .css('top', offset.top-$controls.height()-10);
      }
    }
    
    // Instance methods
    // -----------

    
    
    // Initialize
    // -----------
    
    // Activate editor on click
    elements.each(function(index, el) {
      $(el).click(function() {
        activate(el);
      });
    });
    
    // Set up the controls
    $controls.prependTo($('body')).hide();
    
    // Bind events for controls
    $('.proper-commands a.command').click(function(e) {
      commands['exec'+ $(e.currentTarget).attr('command').toUpperCase()]();
      return false;
    });
    
    
    // Expose public API
    // -----------
    
    return self;
  };
  
})();