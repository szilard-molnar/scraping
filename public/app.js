$(function() {

// Grab the articles as a json
$.getJSON("/articles", function(data) {
    // For each one
    for (var i = 0; i < data.length; i++) {
      // Display the apropos information on the page
      $("#articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
    }
  });

  $(".saveArticle").on("click", function() {
    event.preventDefault();
    alert("Article saved.");
    var thisId = $(this).data("id");
    console.log(thisId);
    $.ajax({
      method: "POST",
      url: "/articles/"+ thisId,
      data: {
        isSaved: true
      }
    })
    .then(function(data){
      console.log(data)
    })
  })

  $(".addNote").on("click", function() {
    $("#myModal").css("display", "block");
    var thisId = $(this).data("id");
    //console.log("is this the right?", thisId);

    $.ajax({
      method: "GET",
      url: "/notes/" + thisId,  
    }).then(function(data) {
      //$("#allTheNotes").append("I suck");
      for(let i = 0; i < data.length; i++)
      {
        $("#allTheNotes").append('<p data-id="' + data[i]._id + '">' + data[i].body + '<button type="button" class="close deleteNoteButton" data-id="' + data[i]._id + '">x</button>' + '</p>');
      }
      $(".deleteNoteButton").on("click", function(event) {
        event.preventDefault();
        //alert("x pressed");
        let deleteId = $(this).data("id");
        console.log("this is deleteId" + deleteId);
        $.ajax("/notes/" + deleteId, {
          method: "DELETE",
        }).then(function (data) {
          console.log("post delete", data)
          $('p[data-id="'+deleteId+'"]').remove();
          
      })
        })
        //$("#myModal").css("display", "none");
      })
  
    
  

  $(".close").on("click", function() {
    $("#myModal").css("display", "none");
    $("#allTheNotes").empty();
  });

  $(".closeButton").on("click", function() {
    $("#myModal").css("display", "none");
    $("#allTheNotes").empty();
  });


  $(".saveChanges").on("click", function() {
    //alert("clicked");
    
    console.log(thisId);
    var inputNote = $(".inputNoteArea").val();
    console.log(inputNote);
    var data = {};
    data.body = inputNote;
    data.article = thisId;
    //console.log("this is the new note", data);
    $.ajax({
      method: "POST",
      url: "/notes/" + thisId,
      data: data
    }).then(function(data) {
      console.log("success", data);
    })
    $("#myModal").css("display", "none");
  })
})
});
  