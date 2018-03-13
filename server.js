var express = require("express");
var mongodb = require("mongodb");
var app = express();
var bodyParser = require("body-parser");
var expressLayouts = require("express-ejs-layouts");
var session = require("express-session");
var formidable = require("formidable");
var fs = require("fs");
var Filter = require('bad-words'),
    filter = new Filter();

var staticFiles = express.static(__dirname + "/public");
app.use(staticFiles);
app.set("view engine", "ejs");
app.use(expressLayouts);

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
        response.render("pages/signIn", {
            href: "signInStyle.css",
            title: "Sign In",
            username: request.session.username,
            signedIn: false
        });
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
    response.render("pages/signUp.ejs", {
        href: "signUp.css",
        title: "Sign Up",
        signedIn: false
    });
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
                friends: {},
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
                response.render("pages/home", {
                    likes: likes,
                    dislikes: dislikes,
                    lastUpdate: lastUpdate,
                    profilePicture: "/profileUploads/" + profilePicture,
                    title: "Home",
                    href: "home.css",
                    username: request.session.username,
                    signedIn: true

                });
            }
            else {
                response.render("pages/adminHome", {
                    likes: likes,
                    dislikes: dislikes,
                    lastUpdate: lastUpdate,
                    profilePicture: "/profileUploads/" + profilePicture,
                    title: "Admin Home",
                    href: "home.css",
                    username: request.session.username,
                    signedIn: true
                });
            }
        });
    }
});

// home page: profile picture
app.post("/profile", function(request, response) {
    db.collection("users").find({}).toArray(function(error, allUsers) {
        var number = allUsers.length;
        var form = new formidable.IncomingForm();
        form.parse(request, function(error, fields, files) {
            files.file.name = files.file.name.replace(" ", "");
            var oldpath = files.file.path;
            var name = number + files.file.name;
            var newpath = __dirname + "/public/profileUploads/" + name;
            db.collection("users").updateOne({
                "_id": request.session.username
            }, {
                $set: {
                    "profilePicture": name
                }
            });
            fs.rename(oldpath, newpath, function(error) {
                response.redirect("/home");
            });
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
        var sendInfo = {
            friends: friends,
            groups: groups,
            misc: misc
        };
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
        }).toArray(function(error, allPosts, user) {
            sendPost(response, allPosts);
        });
    }
    else {
        db.collection("Posts").find({}).toArray(function(error, allPosts) {
            sendPost(response, allPosts);
        });
    }
});

function sendPost(response, allPosts) {
    var user = [];
    var counter = 0;
    for (var i = 0; i < allPosts.length; i++) {
        db.collection("users").findOne({
            "_id": allPosts[i].creater
        }, function(error, database) {
            user.push(database);
            counter++;

            if (counter == allPosts.length) {
                var totalPosts = [allPosts, user];
                response.send(totalPosts);
            }
        });
    }
}

app.get("/posts", function(request, response) {
    db.collection("Posts").find({}).sort({
        "_id": 1
    }).toArray(function(error, result) {
        postSendInfo(request, response, result);
    });
});
app.post("/post", function(request, response) {
    if (request.session.username) {
        postInfoPicture(request, response);
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
        var pictures = {};
        var counter = 0;
        if (posts.length > 0) {
            for (var i = 0; i < posts.length; i++) {
                db.collection("users").findOne({
                    "_id": posts[i].creater
                }, function(error, database) {
                    pictures[database._id] = database.profilePicture;
                    counter++;
                    sendPosts(request, response, posts, pictures, counter);
                });
            }
        }
        else {
            sendPosts(request, response, posts, pictures, counter);
        }
    }
}


app.post("/signOut", function(request, response) {
    request.session.destroy();
    response.send("response");
});

function sendPosts(request, response, posts, pictures, counter) {
    if (counter == posts.length) {
        response.render("pages/posts", {
            posts: posts,
            pictures: pictures,
            title: "Posts",
            href: "posts.css",
            username: request.session.username,
            signedIn: true
        });
        // the magic number is right here do not move this line at all and if you do you will face the wrath of pi because logic
    }
}

// add friends
app.post("/friend", function(request, response) {
    var friend = request.body.friend;

    db.collection("users").findOne({
        "_id": friend
    }, function(error, database) {
        var allFriends = database.friends;
        allFriends[request.session.username] = [request.session.username, true, false];

        db.collection("users").updateOne({
            "_id": friend
        }, {
            $set: {
                "friends": allFriends
            }
        });
    });
    db.collection("users").findOne({
        "_id": request.session.username
    }, function(error, database) {
        var allFriends = database.friends;
        allFriends[friend] = [request.session.username, true, false];
        db.collection("users").updateOne({
            "_id": request.session.username
        }, {
            $set: {
                "friends": allFriends
            }
        })
    })
});

// search for people to friend
app.get("/search", function(request, response) {
    if (request.session.username) {
        var user = request.query.user;
        var value = ".*" + user + ".*";
        db.collection("users").find({ "_id": new RegExp(value, "i") }).sort({
            "_id": 1
        }).toArray(function(error, users) {
            for (var i = 0; i < users.length; i++) {
                if (users[i]._id == request.session.username) {
                    users.splice(i, 1);
                }
            }
            response.render("pages/search", {
                users: users,
                title: "Search",
                href: "search.css",
                username: request.session.username,
                signedIn: true
            });
        });
    }
    else {
        response.redirect("/");
    }
});

// status on possible friend

app.get("/status", function(request, response) {
    if (request.session.username) {
        var friend = request.query.user;
        db.collection("users").findOne({
            "_id": friend
        }, function(error, database) {
            var adminTell = "";
            if (database.admin) {
                adminTell = "Admin";
            }
            response.render("pages/status", {
                friend: friend,
                profilePicture: database.profilePicture,
                lastUpdate: database.lastUpdate,
                likes: database.likes,
                dislikes: database.dislikes,
                admin: adminTell,
                title: "Status",
                href: "status.css",
                username: friend,
                signedIn: true
            });
        });
    }
    else {
        response.redirect("/");
    }
});

// home: confirm friend
app.post("/confirmFriend", function(request, response) {
    var friend = request.body.friend;
    var updateFriends = "";
    var updateFriendsFriend = "";

    db.collection("users").findOne({
        "_id": request.session.username
    }, function(personError, personDatabase) {

        db.collection("users").findOne({
            "_id": friend
        }, function(friendError, friendDatabase) {
            updateFriendsFriend = friendDatabase.friends;
            updateFriends = personDatabase.friends;
            var friender = personDatabase.friends[friend][0];
            if (friender == request.session.username) {
                updateFriends[friend][1] = true;
                updateFriendsFriend[request.session.username][1] = true;
            }
            else {
                updateFriends[friend][2] = true;
                updateFriendsFriend[request.session.username][2] = true;
            }

            db.collection("users").updateOne({
                "_id": request.session.username
            }, {
                $set: {
                    friends: updateFriends
                }
            });
            db.collection("users").updateOne({
                "_id": friend
            }, {
                $set: {
                    friends: updateFriendsFriend
                }
            });
            response.send("reload");
        });
    });
});

// delete friend
app.post("/deleteFriend", function(request, response) {
    var friend = request.body.friend;
    var updateFriends = "";
    var updateFriendsFriend = "";

    db.collection("users").findOne({
        "_id": request.session.username
    }, function(personError, personDatabase) {

        db.collection("users").findOne({
            "_id": friend
        }, function(friendError, friendDatabase) {
            updateFriendsFriend = friendDatabase.friends;
            updateFriends = personDatabase.friends;

            console.log(updateFriends)
            // delete non-friends
            delete updateFriends[friend];
            delete updateFriendsFriend[request.session.username];

            db.collection("users").updateOne({
                "_id": request.session.username
            }, {
                $set: {
                    friends: updateFriends
                }
            });
            db.collection("users").updateOne({
                "_id": friend
            }, {
                $set: {
                    friends: updateFriendsFriend
                }
            });
            response.send("reload");
        });
    });
});

app.post("/postImage", function(request, response) {
    // find what image # to use
    var imgCounter = 0;
    db.collection("Posts").find({}).toArray(function(error, allPosts) {
        imgCounter = allPosts.length;

        var subCounter = imgCounter;
        var form = new formidable.IncomingForm();
        form.parse(request, function(error, fields, files) {
            files.file.name = files.file.name.replace(" ", "");
            var oldpath = files.file.path;
            var name = subCounter + files.file.name;
            var newpath = __dirname + "/public/postUploads/" + name;
            fs.rename(oldpath, newpath, function(error) {
                response.redirect("/posts");
            });
        });
    });
});

function postInfoPicture(request, response) {
    // find what image # to use
    var imgCounter = 0;
    db.collection("Posts").find({}).toArray(function(error, allPosts) {
        imgCounter = allPosts.length;

        var tag = "";
        var subCounter = imgCounter;
        db.collection("Posts").find({}).toArray(function(error, result) {
            var postCounter = result.length;
            // determine ID
            var date = new Date();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            var year = date.getFullYear();
            var fullDate = month + "/" + day + "/" + year;
            var img = subCounter + request.body.img;

            var post = request.body.post;
            post = filter.clean(post);
            tag = request.body.tags;

            var postInfo = {
                _id: postCounter,
                creater: request.session.username,
                body: post,
                picture: img,
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
                setTags(tag[i], postCounter);
            }
        });
    });
}
