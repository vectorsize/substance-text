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
// -------------

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
  },


  // Update Controls
  // -------------

  updateControls: function(sel) {
    // Returns all annotations matching that selection
    var annotations = this.surface.annotations(sel);

    // Update the UI
    $('.command').removeClass('active');
    $('.log').removeClass('active');
    
    _.each(annotations, function(annotation) {
      $('#' + annotation.type).addClass('active');
      $('#' + annotation.id).addClass('active');
    });
  },

  // Listen for Surface Events
  // -------------

  registerEvents: function() {
    this.surface.on('selection:change', this.updateControls);

    // Victor, what's going on here? :)
    this.surface.on('selection:click', function() {
      $('.command').removeClass('active');
      $('.log').removeClass('active');
    });
  },

  render: function() {
    $(this.el).html(_.tpl('text', {}));

    this.surface = new Substance.Surface(_.extend(this.options, {el: '#content'}));
    // TODO: smart partial rerenders based on state changes?
    // To be discussed.
    return this;
  }
});