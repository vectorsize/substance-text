// Substance
// -------------

if (!window.Substance) { var Substance = window.Substance = {}; }


// Helpers
// -------------

_.tpl = function(tpl, ctx) {
  source = $("script[name="+tpl+"]").html();
  return _.template(source, ctx);
};


// Substance.Text
// --------------

Substance.Text = Dance.Performer.extend({

  events: {
    'click .command.em a': '_annotateEm',
    'click .command.strong a': '_annotateStrong',
    'click .command.link a': '_annotateLink'
  },

  _annotateLink: function(e) {
    e.preventDefault();
    this.surface.annotate({
      type: "link",
      data: {
        author: "John Doe",
        url: "http://substance.io/"
      }
    });
  },

  _annotateEm: function(e) {
    e.preventDefault();
    this.surface.annotate({
      type: "em"
    });
  },

  _annotateStrong: function(e) {
    e.preventDefault();
    this.surface.annotate({
      type: "str"
    });
  },

  initialize: function(options) {
    _.bindAll(this, 'updateControls');
    _.bindAll(this, 'clearStatus');
  },

  // Update Controls
  // ---------------

  updateControls: function(sel) {

    if(typeof sel.type !== 'undefined') {
      // We have a type, annotation has just been added
      // Returns all annotations
      var annotations = this.surface.annotations();
      
      $('li.command.' + sel.type).addClass('active');
      // debug
      // $log.empty();
    } else{
      // We don't have a type, we are just doing a selection
      // Returns all annotations matching the current selection
      var annotations = this.surface.annotations(sel);
    }

    // Debug
    // -----

    var $log = $('#annotationLog');

    // if it's not from a match event we add one item to the log
    if(!sel.match){
      _.each(annotations, function(annotation) {
        var $current = $('li#' + annotation.id);
        if($current.length === 0){

          var tplVars = {
            'id': annotation.id ,
            'type': annotation.type,
            'start': annotation.pos.start,
            'end': annotation.pos.end
          };

          $log.append(_.tpl('log', tplVars));
        }
      });
    }else{
    // if it's from a match event we select the matching one
      $('li#' + sel.id).addClass('active');
    }
  },

  // Clear all the UI selections
  // ----------------------------

  clearStatus: function(){
    // When the selection doesnt match we deselect everything
    $('.command').removeClass('active');
    $('.log').removeClass('active');
  },

  // Listen for Surface Events
  // -------------------------

  registerEvents: function() {
    this.surface.on('selection:change', this.updateControls);
    this.surface.on('annotation:change', this.updateControls);
    this.surface.on('annotation:match', this.updateControls);
    this.surface.on('annotation:nomatch', this.clearStatus);

    // Victor, what's going on here? :)
    // When we deselect a range i.e by clicking anywhere in surface,
    // we clear the active states from the UI
    this.surface.on('selection:click', this.clearStatus);
  },

  render: function() {
    $(this.el).html(_.tpl('text', {}));

    this.surface = new Substance.Surface(_.extend(this.options, {el: '#content'}));
    this.registerEvents();
    // TODO: smart partial rerenders based on state changes?
    // To be discussed.
    return this;
  }
});