Times = new Meteor.Collection("times")
Status = new Meteor.Collection("status");

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
				
				Times.remove({});
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
				Times.remove({});
			}
		});
	});
}

if (Meteor.isClient) {
	
	Meteor.startup(function () {
		Session.set("step", "enterName");
	});
	
	Template.ChooseTemplate.helpers({
		renderAdmin: function() {
			return Session.get("step") == "admin";
		},
		
		renderEnterName: function() {
			return Session.get("step") == "enterName";
		},
		
		renderManualMonitor: function() {
			return Session.get("step") == "manualMonitor";
		},
		
		renderRank: function() {
			return Session.get("step") == "rank";
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
				Session.set("step", "manualMonitor");
			}
		}
	});
	
	Template.ManualMonitor.events({
		"click .manualMonitor": function (event, template) {
			var status = Status.findOne({ code: 1});
			if (status.isUp) {
				alert("Service is up");
			}
			else {
				Times.insert({
					name: Session.get("name"),
					time: (Date.now() - status.downTime) / 1000 + "sec",
				});
				Session.set("step", "rank");
			}
		}
	});
  
	Template.Rank.helpers({
		people: function() {
			var people = Times.find().fetch();
			var status = Status.findOne({ code: 1});
			if(status && status.isMonitor)
				people.unshift({ name: "Service Monitor", time: "0.010 sec" });
			
			return people;
		}
	});
	
	Deps.autorun(function () {
		var status = Status.findOne({ code: 1});
		if(status && status.isUp && Session.get("step") == "rank" ){
			if(status && status.isMonitor)
				alert("Resetting. Except this time there's a monitor. Muhahaha!!!");
			
			Session.set("step", "manualMonitor");
		}
	});
}