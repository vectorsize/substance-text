// Substance
// -------------

if (!window.Substance) { var Substance = window.Substance = {}; }

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
        url: "http://surface.io/"
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
    this.surface = new Substance.Surface(options);
    _.bindAll(this, 'updateAnnotations', 'updateControls');
  },

  // Display the stored annotations
  // -------------

  updateAnnotations: function(sel) {
    // Victor, why does the annotation:change event yield a selection?
    // Shouldn't it be just the annotations? Or nothing? :)
    $('li#' + sel).addClass('active');

    var annotations = this.surface.annotations();
    var $log = $('#annotationLog');
    $log.empty();
    _.each(annotations, function(annotation) {
      // TODO: use EJS templating
      var $li = '<li class="log active" id="' + annotation.id + '">\
              <em>Type: </em>' + annotation.type + '<br>\
              <em>Position: </em> {start:' + annotation.pos.start + ', end' + annotation.pos.end + '}<br>\
              <em>Id: </em> ' + annotation.id + '\
            </li>';
      $log.append($li);
    });
  },

  // updateControls
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

  // // Listen for Surface Events
  // // -------------

  registerEvents: function() {
    this.surface.on('annotation:change', this.updateAnnotations)
    this.surface.on('selection:change', this.updateControls);

    // Victor, what's going on here? :)
    this.surface.on('selection:click', function() {
      $('.command').removeClass('active');
      $('.log').removeClass('active');
    });    
  },

  render: function() {
    // TODO: smart partial rerenders based on state changes?
    // To be discussed.
    return this;
  }
});