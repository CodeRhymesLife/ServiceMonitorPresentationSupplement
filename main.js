Errors = new Meteor.Collection("errors")
Status = new Meteor.Collection("status");
Posts = new Meteor.Collection("posts");

if (Meteor.isServer) {
	Meteor.startup(function () {
		Status.insert({
			code: 1,
			isUp: true,
			isMonitor: false,
		});
		
		return Meteor.methods({
			addMonitor: function() {
				Status.update(
					{ code: 1 },
					{ $set: { isUp: true, isMonitor: true }}
				);
				
				Errors.remove({});
				Posts.remove({});
			},
			
			toggleIsUp: function (downTime) {
				var isUp = Status.findOne({ code: 1}).isUp;
				Status.update(
					{ code: 1 },
					{ $set: { isUp: !isUp, downTime: downTime }}
				);
			},
			
			startOver: function () {
				Status.update(
					{ code: 1 },
					{ $set: { isUp: true, isMonitor: false }}
				);
				Errors.remove({});
				Posts.remove({});
			}
		});
	});
}

if (Meteor.isClient) {
	
	Meteor.startup(function () {
		if(Session.get("step") == null)
			Session.set("step", "enterName");
	});
	
	Template.ChooseTemplate.helpers({
		renderAdmin: function() {
			return Session.get("step") == "admin";
		},
		
		renderEnterName: function() {
			return Session.get("step") == "enterName";
		},
		
		renderWall: function() {
			return Session.get("step") == "wall";
		},
		
		renderRank: function() {
			return Session.get("step") == "rank";
		},
		
		renderReportError: function() {
			return Session.get("step") == "reportError";
		},
	});

	Template.Admin.helpers({
		isUp: function() {
			return Status.findOne({ code: 1}).isUp ? "Up" : "Down";
		},
		isMonitor: function() {
			return Status.findOne({ code: 1}).isMonitor ? "Yes" : "No";
		}
	});
	
	Template.Admin.events({
		"click .toggleIsUp": function(event, template) {
			Meteor.call("toggleIsUp", Date.now());
		},
		"click .addMonitor": function(event, template) {
			Meteor.call("addMonitor");
		},
		"click .startOver": function(event, template) {
			Meteor.call("startOver");
		},
	});
	
	Template.EnterName.events({
		"click button": function (event, template) {
			Session.set("name", $(".enterName").val());
			
			if($(".enterName").val() == "admin") {
				Session.set("step", "admin");
				return;
			}
			
			if(Session.get("name") != null &&
				Session.get("name").length > 0) {
				Session.set("step", "wall");
			}
		}
	});
	
	Template.Wall.events({
		"click button": function (event, template) {
			var status = Status.findOne({ code: 1});
			if (status.isUp) {
				Posts.insert({
					name: Session.get("name"),
					message: $(".submitPost").val(),
				});
			}
			else {
				alert("Bee boop. Bee boop. Error! Please report.");
			}
			
		}
	});
	
	Template.Wall.helpers({
		posts: function() {
			return Posts.find();
		}
	});
	
	Template.ReportError.events({
		
		"click button": function (event, template) {
			var status = Status.findOne({ code: 1});
			if (status.isUp) {
				alert("Nothing is wrong...don't cheat!");
			}
			else {
				Errors.insert({
					person: Session.get("name"),
					time: (Date.now() - status.downTime) / 1000 + " sec",
					message: $(".submitError").val(),
				});
				alert("Thank you for submitting your error report.");
				Session.set("step", "rank");
			}
			
		}
	});
  
	Template.Rank.helpers({
		errors: function() {
			var errors = Errors.find().fetch();
			var status = Status.findOne({ code: 1});
			if(status && status.isMonitor)
				errors.unshift({
					person: "Internal Monitor",
					time: "0.010 sec",
					message: "The primary database went down around " + new Date(0.01 + status.downTime).toString() + ". John Doe (the code owner) and Ryan James (the on call engineer) have been alerted." });
			
			return errors;
		}
	});
	
	Deps.autorun(function () {
		var status = Status.findOne({ code: 1});
		if(status && status.isUp && Session.get("step") == "rank" ){
			if(status && status.isMonitor)
				alert("Resetting. This time there's a monitor. Good luck!");
			
			Session.set("step", "wall");
		}
	});
}