var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT||3000;

// Initialize Express
var app = express();

// Configure middleware

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);


//Define handlebars
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Routes

// html routes for handlebars

app.get("/", (req,res) => {
    db.Article
      .find({})
      .then(articles => res.render("index", {articles}))
      .catch(err=> res.json(err));
  });

    // A GET route for scraping the echoJS website
    app.get("/scrape", function (req, res) {
        // First, we grab the body of the html with axios
        axios.get("http://www.index.hu/").then(function (response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(response.data);

            let ps = [];
            $("div h1").first().siblings("span p").each(function(i, element) {
                ps.push($(element).text())
            })
            //console.log(ps);
            // Now, we grab every h2 within an article tag, and do the following:
            $("div h1").each(function (i, element) {
                // Save an empty result object
                var result = {};

                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(this)
                    .children("a")
                    .text();
                result.link = $(this)
                    .children("a")
                    .attr("href");
                result.isSaved = false;
                //console.log(result);
                // Create a new Article using the `result` object built from scraping
                db.Article.create(result)
                    .then(function (dbArticle) {
                        // View the added result in the console
                        console.log(dbArticle);
                    })
                    .catch(function (err) {
                        // If an error occurred, log it
                        console.log(err);
                    });
            });

            // Send a message to the client
            res.send("Scrape Complete");
        });
    });

    // Route for getting all Articles from the db
    app.get("/articles", (req, res) => {
        // Grab every document in the Articles collection
        db.Article.find({})
            .then(function (dbArticle) {
                // If we were able to successfully find Articles, send them back to the client
                res.json(dbArticle);
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });

    //Route to save an article
  app.post("/articles/:id", (req,res) => {
    db.Article.update(req.body)
    .then(function(dbArticle) {
        return db.Article.update({ _id: req.params.id }, { isSaved: true });
    })
    .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  //render saved articles on saved.handlebars page
  app.get("/saved", (req,res) => {
    db.Article
      .find({"isSaved": true})
      .then(articles => res.render('saved', {articles}))
      .catch(err=> res.json(err));
  });

    // Route for grabbing a specific Article by id, populate it with it's note
    app.get("/articles/:id", function (req, res) {
        // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
        db.Article.findOne({ _id: req.params.id })
            // ..and populate all of the notes associated with it
            .populate("note")
            .then(function (dbArticle) {
                // If we were able to successfully find an Article with the given id, send it back to the client
                res.json(dbArticle);
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });

    // Route for saving/updating an Article's associated Note
    app.post("/articles/:id", function (req, res) {
        console.log("route hit");
        // Create a new note and pass the req.body to the entry
        db.Note.create(req.body)
            .then(function (dbNote) {
                // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
                // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
                // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
                return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
            })
            .then(function (dbArticle) {
                // If we were able to successfully update an Article, send it back to the client
                res.json(dbArticle);
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });
   
    app.post("/notes/:id", function(req, res){
        //console.log("api route hit");
        db.Note.create(req.body)
        .then(function(dbNote){
             db.Article.findOneAndUpdate({"_id": req.params.id},{$push:{"notes": dbNote}}) 
             console.log(dbNote);
        }).catch(function(error) {
            // log error
            console.log(error);
        })
    });

    app.get("/notes/:id", function(req,res) {
        db.Note.find({"article": req.params.id})
    .then(function(data) {
        res.json(data);
    }).catch(function(error) {
        res.json(error);
    });
});

//====================================================================
    // Delete a selected note

    app.delete("/notes/:id", function(req, res) {
        console.log("I'm about to delete this note");
        db.Note.findByIdAndDelete({ _id: req.params.id })
            .then(function (dbNote) {
                res.json(dbNote);
            })
            .catch(function (error) {
                // if an error happened
                res.json(error);
            })
    });


//==================================================================== 

// Clear the article collection

app.delete("/articles", function(req,res) {
    console.log("I will delete ALL the articles!!!");
    db.Article.remove({ })
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(error) {
        res.json(error);
    })
})

//====================================================================

// Start the server
    app.listen(PORT, function () {
        console.log("App running on port " + PORT + "!");
    });

