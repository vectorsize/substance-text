# Proper — Semantic Rich Text Editor

Proper 0.5.0 will be a complete rewrite, using CodeMirror instead of `contenteditable`. Thanks to Victor Saiz (vectorsize) for working on this!

Proper is intended to be an extensible low-level interface for rich text editing. It doesn't introduce any UI components, but an API for managing arbitrary text annotations. However, there will be examples for basic semantic rich text editing and comments.

## API (in-progress)

### Initialization

    var proper = new Proper();
    
    proper.activate('#content');
    
### Annotations

  // Add annotation
	proper.annotate({
      id: "/comment/x", // optional
      type: "comment",
      ranges: [[5,14]],
      data: {
      	author: "John Doe",
        content: "You might want to spell that right. Right? :)"
      }
	});
    
    // Accesss annotations
    proper.annotations(); 
    // => {
            "/comment/x": {...}
            "/em/foo": {...}
          }
    // 
    [{"from":{"line":0,"ch":176},"to":{"line":0,"ch":183},"type":"em","combined":"17601830"}]


### Selections

Hooking into selection events is easy. `el` is a container html element sitting below the selection. You can populate it with some UI stuff.

A selection object looks like so:

    {
      "start": 5,
      "end": 10
    }

Get the current selection like so:

	proper.selection();

proper.on('selection', function(selection, el) {
  $(el).html('<a href="#" class="em">Emphasize</a>');
});

// Your very own event handler triggering em annotations
$('a.em').click(function() {
  
});

## Changelog

**0.5.0**

In progress. Rewrite using CodeMirror.
Ranges management and basic functionality implemented.

**0.3.1**

Solves various issues and produces cleaner and more semantically correct html.

**0.3.0**

Solves a number of Firefox related issues and adds native support for `code` annotations.

**0.2.1**

Mozilla compatibility.

**0.2.0**

Recognition of command states. Support for keybindings.

**0.1.0**

Initial Version.


## Contributors

- Victor Saiz ([vectorsize](http://github.com/vectorsize)) working on 0.5.0
- Tim Baumann ([timjb](http://github.com/timjb)) implementation of 0.3.0
- Michael Aufreiter ([michael](http://github.com/michael)) initial version