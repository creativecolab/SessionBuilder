Papers = new Meteor.Collection("papers");
Sessions = new Meteor. Collection("sessions");

Paper = function(id, title){
	this._id = id;
	this.title = title;
	this.inSession = false;
	this.sessions = [];
}

ConfSession = function(papers){
	this.papers = papers;
	this.name = "Not named yet";
	this.position;
	this.isCollapsed = false;
}