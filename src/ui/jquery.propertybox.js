(function ($) {

  var PropertyBox = function(elem, options) {
    var self = this;

    self.options = $.extend({}, PropertyBox.defaults, options);
    self.options.ontoManager = self.options.ontoManager || new RDFE.OntologyManager();

    self.mainElem = elem;

    $(self.options.ontoManager).on('changed', function(e, om, onto) {
      self.updateOptions();
    });

    $(self.mainElem).selectize({
      valueField: "URI",
      searchField: [ "title", "label", "prefix", "curi", "URI" ],
      sortField: [ "prefix", "URI" ],
      options: self.propertyList(),
      onChange: function(value) {
        $(self).trigger('changed', self.sel.options[value]);
      },
      createProperty: function(input, create) {
        return self.options.ontoManager.ontologyPropertyByURI(self.options.ontoManager.uriDenormalize(input), create);
      },
      create: function(input, cb) {
        // search for and optionally create a new property
        var that = this;

        input = RDFE.Utils.trim(RDFE.Utils.trim(input, '<'), '>');
        if (input === 'a') {
          input = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
        }
        var property = this.settings.createProperty(input);
        if (property) {
          cb(property);
        }
        else {
          var url = self.options.ontoManager.ontologyDetermine(input);
          if (!url) {
            url = self.options.ontoManager.prefixes[input] || input;
          }
          self.options.ontoManager.parseOntologyFile(url, {
            "success": function() {
              cb(that.settings.createProperty(input, true));
            },
            "error": function(state) {
              var message = (state && state.message)? state.message: 'Error loading ontology';

              console.log(message);
              bootbox.confirm(message + '. Do you want to create new property?', function(result) {
                if (result) {
                  var ontology = self.options.ontoManager.ontologyByURI(url);
                  if (!ontology) {
                    var ontology = self.options.ontoManager.ontologyByURI(url);
                    if (!ontology) {
                      ontology = new RDFE.Ontology(self.options.ontoManager, url);
                    }
                    cb(that.settings.createProperty(input, true));
                  }
                }
                else {
                  that.unlock()
                }
              });
            }
          });
        }
      },
      render: {
        item: function(item, escape) {
          var x = item.title || item.label || item.curi || item.name;
          if(item.curi && item.curi != x) {
            x = escape(x) + ' <small>(' + escape(item.curi) + ')</small>';
          }
          else {
            x = escape(x);
          }
          return '<div>' + x + '</div>';
        },
        option: function(item, escape) {
          return '<div>' + escape(item.title || item.label || item.curi || item.name) + '<br/><small>(' + escape(item.URI) + ')</small></div>';
        },
        'option_create': function(data, escape) {
          var url = data.input;
          url = RDFE.Utils.trim(RDFE.Utils.trim(url, '<'), '>');
          url = self.options.ontoManager.uriDenormalize(url);
          if (url != data.input)
            return '<div class="create">Add <strong>' + escape(data.input) + '</strong> <small>(' + escape(url) + ')</small>&hellip;</div>';
          else
            return '<div class="create">Add <strong>' + escape(url) + '</strong>&hellip;</div>';
        }
      }
    });

    self.sel = $(self.mainElem)[0].selectize;
  };

  PropertyBox.defaults = {
    'ontoManager': null,
    'ontology': null
  };

  PropertyBox.prototype.setOntology = function(onto) {
    // console.log('setOntology', onto);
    this.options.ontology = onto;
    this.updateOptions();
  };

  PropertyBox.prototype.propertyList = function() {
    // console.log('propertyList', this.options);
    var list;
    if (this.options.ontology) {
      list = this.options.ontology.allProperties();
    }
    else {
      list = this.options.ontoManager.allProperties();
    }
    return list;
  };

  PropertyBox.prototype.updateOptions = function() {
    var pl = this.propertyList();
    this.sel.clearOptions()
    this.sel.addOption(pl); // FIXME: check if we also need to add the current value
  };

  PropertyBox.prototype.setPropertyURI = function(uri) {
    // console.log('PropertyBox.setPropertyURI', uri);
    if (uri) {
      var u = this.options.ontoManager.uriDenormalize(uri);
      u = RDFE.Utils.trim(RDFE.Utils.trim(u, '<'), '>');
      if (!this.sel.options[u]) {
        this.sel.addOption(this.options.ontoManager.ontologyPropertyByURI(u, true));
      }
      this.sel.setValue(u);
    }
    else {
      this.sel.setValue(null);
    }
  };

  PropertyBox.prototype.selectedURI = function() {
    return this.sel.getValue();
  };

  PropertyBox.prototype.selectedProperty = function() {
    return this.sel.options[this.selectedURI()];
  };

  PropertyBox.prototype.on = function(e, cb) {
    $(this).on(e, cb);
    return this;
  };

  $.fn.propertyBox = function(methodOrOptions) {
    var le = this.data('propertyBox');
    if(!le) {
      le = new PropertyBox(this, methodOrOptions);
      this.data('propertyBox', le);
    }
    return le;
  };
})(jQuery);
