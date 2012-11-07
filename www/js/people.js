jQuery(function ($) {

    var Person = Backbone.Model.extend({
        idAttribute: 'Id',
        url: function () {
            return 'http://socialandviral.dyndns.info/egg/person/' + this.get("Id");
        }
    });

    var Persons = Backbone.Collection.extend({
        model: Person,
        url: 'http://socialandviral.dyndns.info/egg/person',
        parse: function (data) {
            return data.Persons;
        }
    });

    // Views
    var PersonDetailsView = Backbone.View.extend({
        tagName: 'ul',
        template: _.template($('#page4').html()),
        initialize: function () {
            this.model.bind("change", this.render, this);
        },
        render: function (eventName) {
            var person = this.model.toJSON();
            var html = this.template(person);
            $(this.el).html(html);
            return this;
        },
        events: {
            "change input": "change",
            "click span#save": "savePerson"
        },
        change: function (event) {
            var target = event.target;
            alert('changing ' + target.id + ' from: ' + target.defaultValue + ' to: ' + target.value);
        },
        savePerson: function () {
            alert($('#FirstName').val());
            this.model.set({
                FirstName: $('#FirstName').val(),
                LastName: $('#LastName').val(),
                DateOfBirth: $('#DateOfBirth').val()
            });
            if (this.model.isNew()) {
                app.personsList.create(this.model);
            } else {
                this.model.save();
            }
            return false;
        }, /*
        deletePerson: function () {
            this.model.destroy({
                success: function () {
                    alert('Person deleted successfully');
                    window.history.back();
                }
            });
            return false;
        }, */
        close: function () {
            $(this.el).unbind();
            $(this.el).empty();
        }
    });

    var PersonView = Backbone.View.extend({
        tagName: "li",
        template: _.template($('#page3').html()),
        initialize: function () {
            this.model.bind("change", this.render, this);
            this.model.bind("destroy", this.close, this);
        },
        events: {
            "click span#delete": "deletePerson",
            "click span#edit": "editPerson",
            "click span#save": "savePerson",
            "click span#up": "close"
        },
        render: function (eventName) {
            var person = this.model.toJSON();
            var html = this.template(person);
            $(this.el).html(html);
            return this;
        },
        editPerson: function () {
            if (this.detailsView == null) {
                this.detailsView = new PersonDetailsView({ model: this.model });
                $(this.el).append(this.detailsView.render().el);
            }
            return false;
        },
        savePerson: function () {
            alert('Saving person...');
            if (this.detailsView != null) {
                this.model.save({
                    success: function () {
                        alert('Person saved successfully');
                    },
                    error: function () {
                        alert('Person not saved...');
                    }
                });
                this.detailsView.close();
                this.detailsView = null;
            }
            return false;
        },
        deletePerson: function () {
            this.model.destroy({
                success: function () {
                    alert('Person deleted successfully');
                    window.history.back();
                }
            });
            return false;
        },
        close: function () {
            $(this.el).unbind();
            $(this.el).remove();
            window.history.back();
            app.personView = null;
        }
    });

    var PersonsView = Backbone.View.extend({
        tagName: 'ul',
        initialize: function () {
            this.model.bind("reset", this.render, this);
            var self = this;
            this.model.bind("add", function (person) {
                $(self.el).append(new PersonView({ model: person }).render().el);
            });
        },
        render: function (eventName) {
            _.each(this.model.models, function (person) {
                $(this.el).append(new PersonView({ model: person }).render().el);
            }, this);
            return this;
        }
    });

});
