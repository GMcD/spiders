
var exercise = {};

/* This returns a Date object, if from ServiceStack, otherwise the input */
function contractDate(s) { return s && s.substring(0, 5) == "/Date" ? new Date(parseFloat(/Date\(([^)]+)\)/.exec(s)[1])) : s ; }

(function($){

    ///////////////////////////////////////////////////////////////////
    // Model
    //////////////////////////////////////////////////////////////////
    exercise.Activity = Backbone.Model.extend({
       defaults: {
            id: null,
            date: new Date(),
            type: '',
            distance: '',
            duration: '',
            comments: ''
        },
        parse: function (data) {
            if (data) data.date = contractDate(data.date);
            return data;
        },
        
        set: function(attributes, options) {
            var aDate;
            if (attributes.date){
                //TODO future version - make sure date is valid format during input
                console.log(attributes.date);
                aDate = new Date(attributes.date);
                if ( Object.prototype.toString.call(aDate) === "[object Date]" && !isNaN(aDate.getTime()) ){
                    attributes.date = aDate;
                }
            }
            Backbone.Model.prototype.set.call(this, attributes, options);
        },
                
        isoDate: function(){
            var d = this.get('date'); 
            if ( Object.prototype.toString.call(d) === "[object Date]" ) 
                return d.toISOString().substring(0,10);
            else {
                var m = JSON.stringify(d);
                console.log(m);
                return d;
            }
        },
        
        // Add isoDate value for HTML5 date picker and display
        toJSON: function(){
            var json = Backbone.Model.prototype.toJSON.call(this);
            return _.extend(json, {isoDate: this.isoDate()});
        }
    });
 
    ///////////////////////////////////////////////////////////////////
    // Collection
    //////////////////////////////////////////////////////////////////
    exercise.Activities = Backbone.Collection.extend({
        model: exercise.Activity,
        url: 'http://socialandviral.dyndns.info/egg/exercise',
        comparator: function(activity){
            var date = new Date(activity.get('date'));
            return date.getTime();
        },
	    handleProgress: function(evt){
	        $.mobile.hidePageLoadingMsg();
	    } 
    });
    
    ///////////////////////////////////////////////////////////////////
    // Views
    //////////////////////////////////////////////////////////////////
    exercise.ActivityListView = Backbone.View.extend({
        tagName: 'ul',
        id: 'activities-list',
        attributes: {"data-role": 'listview'},
        
        initialize: function() {
            this.collection.bind('add', this.render, this);
            this.collection.bind('change', this.changeItem, this);
            this.collection.bind('reset', this.render, this);
            this.collection.bind('destroy', this.render, this);
            this.template = _.template($('#activity-list-item-template').html());
        },
        
        render: function() {
            var container = this.options.viewContainer,
                activities = this.collection,
                template = this.template,
                listView = $(this.el);
                
            container.empty();
            $(this.el).empty();
            activities.each(function(activity){
                this.renderItem(activity);
            }, this);
            container.html($(this.el));
            container.trigger('create');
            return this;
        },
        
        renderItem: function(item) {
            var template = this.template,
                listView = $(this.el),
                renderedItem = template(item.toJSON()),
                $renderedItem = $(renderedItem);
                
            $renderedItem.jqmData('activityId', item.id);
            $renderedItem.bind('click', function(){
                // set the activity id on the page element for use in the details pagebeforeshow event
                $('#activity-details').jqmData('activityId', $(this).jqmData('activityId'));  //'this' represents the element being clicked
            });
            
            listView.append($renderedItem);
        },
        
        changeItem: function(item){
            this.collection.sort();
        }
    });
    
    //////////////////////////////////////////////////////////////////////////////////////
    exercise.ActivityDetailsView = Backbone.View.extend({
        // since this template will render inside a div, we don't need to specify a tagname
        initialize: function() {
            this.template = _.template($('#activity-details-template').html());
        },
        
        render: function() {
            var container = this.options.viewContainer;
            var renderedContent = this.template(this.model.toJSON());
                
            container.html(renderedContent);
            container.trigger('create');
            return this;
        }
    });
    
    //////////////////////////////////////////////////////////////////////////////////////
    exercise.ActivityFormView = Backbone.View.extend({
        // since this template will render inside a div, we don't need to specify a tagname, but we do want the fieldcontain
        attributes: {"data-role": 'fieldcontain'},
        
        initialize: function() {
            this.template = _.template($('#activity-form-template').html());
        },
        
        render: function() {
            var container = this.options.viewContainer,
                renderedContent = this.template(this.model.toJSON());
                
            container.html(renderedContent);
            container.trigger('create');
            return this;
        }
    });
    
    exercise.initData = function(){
        exercise.activities = new exercise.Activities();
        // Don't use async false to have the app wait for data before rendering the list
        // exercise.activities.fetch({async: true});
        self = exercise.activities;
        exercise.activities.fetch({
        	async: true,
            xhr: function() {
                var xhr = $.ajaxSettings.xhr();
                xhr.onprogress = self.handleProgress;
                return xhr;
            }
        });
    };
    
}(jQuery));

	$('#activities').live('pageinit', function(event){
		var activitiesListContainer = $('#activities').find(":jqmData(role='content')"),
	        activitiesListView;
	    exercise.initData();
	    activitiesListView = new exercise.ActivityListView({collection: exercise.activities, viewContainer: activitiesListContainer});
	    activitiesListView.render();
	});
	
	$('#welcome').live('pageshow', function(event){
		console.log("jQM : Welcome pageshow event...");
	});
	
    $('#add-button').live('click', function(){
        var activity = new exercise.Activity(),
	        activityForm = $('#activity-form-form'),
            activityFormView;
    
        //clear any existing id attribute from the form page
        $('#activity-details').jqmRemoveData('activityId');
        activityFormView = new exercise.ActivityFormView({model: activity, viewContainer: activityForm});
        activityFormView.render();
    });
    
	var firstTime = true;
    $('#activities').live('pageshow', function(){
    	if (firstTime){
	    	$.mobile.hidePageLoadingMsg();
	    	$.mobile.showPageLoadingMsg("a", "Loading...");
	    	firstTime = false;
	    }
	});

    $('#refresh-button').live('click', function() {
		// firstTime = true;
        //$.mobile.changePage( $('#welcome'), { transition : 'pop', reloadPage : true } );
        navigator.notification.alert('Refreshing Soon!');
    });
	
    $('#activity-form').live('pagebeforeshow', function(){
    	$( "input[type='date'], input:jqmData(type='date')", this ).each(function(){
	    	$(this).after( $( "<div />" ).datepicker({ 
												altField: "#" + $(this).attr( "id" ), 
												showOtherMonths: true,
												dateFormat: 'yy-mm-dd',
												defaultDate: $(this).attr( "value"),
												minDate: "+0d",
												onSelect: function(val, inst) {
												} 
										})
						);
		});	
	});
	
    $('#activity-details').live('pagebeforeshow', function(){
        var activitiesDetailsContainer = $('#activity-details').find(":jqmData(role='content')");
		var activityId = $('#activity-details').jqmData('activityId');

        console.log('activityId: ' + activityId);
        if (activityId){
	        activityModel = exercise.activities.get(activityId);
	        activityModel.fetch({async: false});
	    } else {
	        console.log('Error getting activityId : ' + activityId);
		}    	
    		
        var activityDetailsView = new exercise.ActivityDetailsView({model: activityModel, viewContainer: activitiesDetailsContainer});
        activityDetailsView.render();
    });
	
    $('#del-activity-button').live('click', function() {
        var activityId = $('#activity-details').jqmData('activityId');
        var activityModel = exercise.activities.get(activityId); 
        var msg = "Delete '" + activityModel.get('comments') + "' ?";
        navigator.notification.confirm('', function(button){ if (button == 1) activityModel.destroy(); }, msg, 'Confirm,Cancel' );
    });
    
    $('#edit-activity-button').live('click', function() {
        var activityId = $('#activity-details').jqmData('activityId'),
            activityModel = exercise.activities.get(activityId),
            activityForm = $('#activity-form-form'),
            activityFormView;
        
        activityFormView = new exercise.ActivityFormView({model: activityModel, viewContainer: activityForm});
        activityFormView.render();
    });
    
    $('#save-activity-button').live('click', function(){
        var activityId = $('#activity-details').jqmData('activityId'),
            activity,
            dateComponents,
            formJSON = $('#activity-form-form').formParams();
        
        //if we are on iOS and we have a date...convert it from yyyy-mm-dd back to mm/dd/yyyy
        //TODO future version - for non-iOS, we would need to validate the date is in the expected format (mm/dd/yyyy)
        if (formJSON.date && ((navigator.userAgent.indexOf('iPhone') >= 0 || navigator.userAgent.indexOf('iPad') >= 0)) ){
            dateComponents = formJSON.date.split("-");
            formJSON.date = dateComponents[1] + "/" + dateComponents[2] + "/" + dateComponents[0];
        }
        
        if (activityId){
            // editing
            activity = exercise.activities.get(activityId);
            activity.set(formJSON);
            activity.save(null, {
                    wait: true,
                    success: function (model, response, options) {
                        var m = JSON.stringify(model);
                        alert('Exercise saved successfully : ' + m);
                    },
                    error: function (model, xhr, options) {
                        var m = JSON.stringify(xhr);
                        alert(m);
                        var resp = JSON.parse(xhr.responseText);
                        if (resp.ResponseMessage) alert(resp.ResponseStatus.Message);
                        else alert(xhr.responseText);
                    }
                });
        } else {
            // new 
            activity = new exercise.Activity(formJSON);
            exercise.activities.add(activity);
            activity.save(null, {
                    wait: true,
                    success: function (model, response, options) {
                        var m = JSON.stringify(model);
                        alert('Exercise saved successfully : ' + m);
                        activityId = model.id;
                    },
                    error: function (model, xhr, options) {
                        var resp = JSON.parse(xhr.responseText);
                        if (resp.ResponseMessage) alert(resp.ResponseStatus.Message);
                        else alert(xhr.responseText);
                    }
                });
        }
    });
