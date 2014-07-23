Session.set("sort", {sort: {title: -1}});

/********************************************************************
* Attaches sortable to idea and cluster lists, new cluster area.
********************************************************************/
Template.SessionBuilder.rendered = function(){
  //$('.menu-link').bigSlide();
  $('#directions').hide();
  //Attach sortable to the new session creation drop area
  $('#new-session').sortable({
    items : '',
    receive : function(event, ui){
      var myPaper;
      if(ui.sender.parent().hasClass('session')){
        // console.log(ui.sender);
        var myPaperID = $(ui.item).attr('id');
        processSender(ui, myPaperID);
      }
      createSession(ui.item);
      ui.item.remove();
    }
  });

  //Attach sortable to the paper list
  $('#paper-deck').sortable({
    items: ">*:not(.sort-disabled)",
    stop: function(event, ui) {
      $(this).sortable('cancel');
    }, //places the paper back in paper list after being dropped somewhere else *******
    connectWith : '#new-session, .session-papers',
    //re-insert paper back into Papers collection if dragged to deck
    receive: function(event, ui){
      var myPaperID = $(ui.item).attr('id');
      if(ui.sender.hasClass('session-papers')){
        myPaper = processSender(ui, myPaperID); 
      } else {
        alert("unknown sender"); //no way for this to happen
        return false;
      }
      updatePaper(myPaperID, false);
    }, 
  });
}

Template.session.rendered = function(){
    // apply sortable to new session
  $('.session-papers').sortable({
    items: ":not(.sort-disabled)",
    connectWith : '#paper-deck, #new-session, .session-papers',
    receive : function(event, ui){
      var myPaperID = $(ui.item).attr('id');
      var mySessionID = $(this).attr('id'); //get session being modified

      if ($(ui.sender).hasClass('deck')){
        Papers.findOne({_id: myPaperID});
        updatePaper(myPaperID, true);

      //if item is paper coming from another session
      } else if ($(ui.sender).hasClass('session-papers') && 
        $(ui.item).hasClass('paper')){
        processSender(ui, myPaperID);
      }

      //update session by pushing paper onto papers field
      Sessions.update({_id: mySessionID}, 
        {$addToSet: 
          {papers: myPaperID}
      });

      Papers.update({_id: myPaperID},
        {$addToSet: 
          {sessions: mySessionID}
        })
      ui.item.remove();
    }
  });

  $('.session').draggable({
    stop: function() {
      var id = $(this).attr('id');
      var pos = $(this).position();
      Sessions.update({_id: id},
        {$set: {position: pos}
      });
    },
    grid: [5, 5] 
  });
}

/********************************************************************
* Session Builder Interface Template Helpers
********************************************************************/
Template.SessionBuilder.helpers({
  papers : function(){
    var sort = Session.get("sort");
    return Papers.find({inSession: {$in: [true, false]}});
  },

  sessions : function(){
    return Sessions.find();
  },

  sessionName : function(){
    var session = Sessions.findOne({_id: this.toString()});
    if(session === undefined) 
      return false;
    return session.name;
  },

  numSessions : function(){
    return Template.SessionBuilder.sessions().count()
  },

  numUnnamed : function(){
    var nullNames = ["Not named yet", "", " ", "  ", "   ", undefined];
    return Sessions.find({name: {$in: nullNames}}).count();
  }
});

/********************************************************************
* Session Template Helpers
********************************************************************/
Template.session.helpers({
  sessionPapers : function(){
    var paperIDs = this.papers;
    return Papers.find({_id: {$in: paperIDs}})
  },

  named : function(){
    if ($(this)[0].name == "Not named yet")
      return 'text-danger';
    else return false
  },

  isCollapsed : function(){
    return $(this)[0].isCollapsed;
  }
});

/********************************************************************
* Session Builder Event Mappings
********************************************************************/
Template.SessionBuilder.events({
  'click #directions-icon': function(){
    $('#directions').slideToggle();
    if($('#directions-icon').hasClass("fa-question-circle")){
      $('#directions-icon').switchClass("fa-question-circle", "fa-chevron-circle-up");
    } else {
      $('#directions-icon').switchClass("fa-chevron-circle-up", "fa-question-circle");
    }
  },
  //updates name field in session as user types
  'keyup .name-session' : function(event, template){
    var $mySession = $(event.target).parent();

    Sessions.update({_id: $mySession.attr('id')},
      {$set: {name: $(event.target).val()}
    });
  },

  //Collapse Session and makes them unsortable until expanded
  'click .collapser' : function(){
    var id = $(event.target).parent().parent().attr('id');
    var session = Sessions.findOne({_id: id});

    Sessions.update({_id: id}, {$set: {isCollapsed: !session.isCollapsed}});
  },

  'click .session-item': function(){
    //console.log(event.target);
    var id = $(event.target).attr("id");
    id = id.split("-")[1];
    var session = Sessions.findOne({_id: id});
    var top = session.position.top;
    window.scrollTo(0, top-10);
  },

  'click #sortAZ' : function(){
    Session.set("sort", {sort: {title: 1}});
  },

  'click #sortZA' : function(){
    Session.set("sort", {sort: {title: -1}});
  },

  // 'click #sortShortest' : function(){
  //   Session.set("sort", {sort: {$size: {title: -1}}});
  // },

  // 'click #sortLongest' : function(){
  //   Session.set("sort", {sort: {$size: {title: 1}}});
  // }
});


/********************************************************************
* Creates new session, adds it to collection, and updates Papers    *
********************************************************************/
function createSession(item) {
  var paperID = item.attr('id');
  var papers = [paperID];
  var session = new ConfSession(papers);
  session.position = {top: 55, left:15};
  Sessions.insert(session);
  updatePaper(paperID, true);
}

/********************************************************************
* Takes a ui and id of paper being moved, updating the sender.
********************************************************************/
function processSender(ui, paperID){
  var senderID = $(ui.sender).attr('id');
  var sender = Sessions.findOne({_id: senderID});
    
  //find all ideas in clusters idea list with matching id (should be one)>need error check here
  // myIdea = $.grep(sender.papers, function(paper){
  //   return paper === ideaID;
  // })[0];

  Sessions.update({_id: senderID},
    {$pull:
      {papers: paperID}
  });

  //if sending session now has no papers, get rid of it
  var numPapers = Sessions.findOne({_id: senderID}).papers.length;
  if(numPapers === 0){
    Sessions.remove(senderID);
  }
}

/********************************************************************
* Convenience function used to update items in the Papers Collection*
********************************************************************/
function updatePaper(paperID, inSession){
  Papers.update({_id: paperID}, 
    {$set:
      {inSession: inSession}
  });
}


