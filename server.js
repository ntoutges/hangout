var express = require("express");
var mongodb = require("mongodb");
var app = express();
var bodyParser = require("body-parser");
var session = require("express-session");
var formidable = require("formidable");
var fs = require("fs");

var staticFiles = express.static(__dirname + "/public");
app.use(staticFiles);
app.set("view engine", "ejs");

var urlencoded = bodyParser.urlencoded({
    extended: true
});
app.use(urlencoded);
app.use(session({
    secret: "nothingToSeeHereBecauseNoReason",
    resave: false,
    saveUninitialized: false
}));

var db;
var databaseURL = "mongodb://studentmrcode:mrcode123@ds159776.mlab.com:59776/forums";
mongodb.MongoClient.connect(databaseURL, function(error, database) {
    db = database;

    app.listen(process.env.PORT || 3006, function() {
        console.log("app started");
    });
});

// sign in
app.get("/", function(request, response) {
    if (!request.session.username) {
        response.sendFile(__dirname + "/index.html");
    }
    else {
        response.redirect("/home");
    }
});
app.post("/info", function(request, response) {
    var username = request.body.username;
    var password = request.body.password;

    db.collection("users").findOne({
        "_id": username
    }, function(error, user) {
        if (user && password == user.password) {
            var activity = user.activity;
            if (!activity) {
                response.send("Off");
            }
            else {
                request.session.username = request.body.username;
                response.send("correct");
            }
        }
        else if (!user) {
            response.send("incorrect username");
        }
        else {
            response.send("incorrect password");
        }
    });
});

// sign up
app.get("/signUp", function(request, response) {
    response.sendFile(__dirname + "/signUp.html");
});

app.post("/create", function(request, response) {
    var username = request.body.username;
    db.collection("users").findOne({
        "_id": username
    }, function(error, user) {
        if (!user) {
            var password = request.body.password;
            var information = {
                "_id": username,
                password: password,
                activity: true,
                likes: 0,
                dislikes: 0,
                lastUpdate: "Never",
                admin: false,
                profilePicture: "blank-profile-icon.png",
                friends: [],
                groups: [],
                misc: []
            };
            db.collection("users").insertOne(information, function(error, result) {});
            response.send(true);
        }
        else {
            response.send(false);
        }
    });
});

// home page
app.get("/home", function(request, response) {
    if (!request.session.username) {
        response.redirect("/");
    }
    else {
        db.collection("users").findOne({
            "_id": request.session.username
        }, function(error, database) {
            var likes = database.likes;
            var dislikes = database.dislikes;
            var lastUpdate = database.lastUpdate;
            var profilePicture = database.profilePicture;
            var admin = database.admin;
            if (!admin) {
                response.render("home", {
                    likes: likes,
                    dislikes: dislikes,
                    lastUpdate: lastUpdate,
                    profilePicture: "/uploads/" + profilePicture
                });
            }
            else {
                response.render("adminHome", {
                    likes: likes,
                    dislikes: dislikes,
                    lastUpdate: lastUpdate,
                    profilePicture: "/uploads/" + profilePicture
                });
            }
        });
    }
});

// home page: profile picture
app.post("/profile", function(request, response) {
    var form = new formidable.IncomingForm();
    form.parse(request, function(error, fields, files) {
        var oldpath = files.file.path;
        var newpath = __dirname + "/public/uploads/" + files.file.name;
        db.collection("users").updateOne({
            "_id": request.session.username
        }, {
            $set: {
                "profilePicture": files.file.name
            }
        });
        fs.rename(oldpath, newpath, function(error) {
            response.redirect("/home");
        });
    });
});

app.get("/information", function(request, response) {
    db.collection("users").findOne({
        "_id": request.session.username
    }, function(error, database) {
        var friends = database.friends;
        var groups = database.groups;
        var misc = database.misc;

        var sendInfo = [friends, groups, misc];
        response.send(sendInfo);
    });
});
var userTags;
app.get("/tag", function(request, response) {
    userTags = request.query.tags;
    userTags = userTags.split(",");

    if (userTags[0] != "") {
        db.collection("Posts").find({
            tag: { $in: userTags }
        }).toArray(function(error, allPosts) {
            response.send(allPosts);
        });
    }
    else {
        db.collection("Posts").find({}).toArray(function(error, allPosts) {
            response.send(allPosts);
        });
    }
});

app.get("/posts", function(request, response) {
    db.collection("Posts").find({}).toArray(function(error, result) {
        postSendInfo(request, response, result);
    });
});
app.post("/post", function(request, response) {
    if (request.session.username) {
        var tag = "";
        db.collection("Posts").find({}).toArray(function(error, result) {
            // determine ID
            var counter = result.length;
            var date = new Date();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            var year = date.getFullYear();
            var fullDate = month + "/" + day + "/" + year;

            var post = request.body.post;
            tag = request.body.tags;
            tag = tag.split(",");

            var postInfo = {
                _id: counter,
                creater: request.session.username,
                body: post,
                date: fullDate,
                tag: tag,
                show: true
            };
            db.collection("Posts").insertOne(postInfo, function(error, res) {
                if (!error) {
                    response.send(true);
                }
                else {
                    response.send(false);
                }
            });
            for (var i = 0; i < tag.length; i++) {
                setTags(tag[i], counter);
            }
        });
    }
    else {
        response.send("reload");
    }
});

function setTags(tag, counter) {
    db.collection("tags").findOne({
        "_id": tag
    }, function(error, tagResult) {

        if (tagResult) {
            var postTags = tagResult.posts;
            postTags[counter] = true;

            db.collection("tags").updateOne({
                "_id": tag
            }, {
                $set: {
                    "posts": postTags
                }
            });
        }
        else {
            var information = {
                "_id": tag,
                posts: {}
            };
            information.posts[counter] = true;
            db.collection("tags").insertOne(information, function(error, database) { if (error) { console.log(error) } });
        }
    });
}

function postSendInfo(request, response, posts) {
    if (!request.session.username) {
        response.redirect("/");
    }
    else {
        response.render("posts", {
            posts: posts
        });
    }
}

app.post("/signOut", function(request, response) {
    request.session.destroy();
    response.send("response");
});
