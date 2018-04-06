var express = require("express");
var mongodb = require("mongodb");
var app = express();
var bodyParser = require("body-parser");
var expressLayouts = require("express-ejs-layouts");
var session = require("express-session");
var formidable = require("formidable");
var fs = require("fs");
var imageMagick = require("node-imagemagick");
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
            signedIn: false
        });
    }
    else {
        response.redirect("/home");
    }
});

// sign in (admin)
app.get("/password", function(request, response) {
    response.render("pages/password", {
        signedIn: false,
        title: "Password",
        href: "signInStyle.css"
    });
});
app.post("/info", function(request, response) {
    var username = request.body.username;
    var password = request.body.password;

    db.collection("users").findOne({
        "_id": username
    }, function(error, user) {
        //if (user && password == user.password) {
        if (user) {
            request.session.username = request.body.username;
            var activity = user.activity;
            if (!activity) {
                response.send("Off");
            }
            else {
                if (user.admin) {
                    response.send("password");
                }
                else if (username == user._id) {
                    response.send("correct")
                }
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
    if (request.session.admin) {
        response.render("pages/signUp.ejs", {
            href: "signUp.css",
            title: "Sign Up",
            signedIn: false,
            admin: request.session.admin

        });
    }
    else {
        response.redirect("/");
    }
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
                misc: [],
                biography: "",
                student: false
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
            var biography = database.biography;
            if (!admin) {
                response.render("pages/home", {
                    likes: likes,
                    dislikes: dislikes,
                    lastUpdate: lastUpdate,
                    profilePicture: "/profileUploads/" + profilePicture,
                    title: "Home",
                    href: "home.css",
                    username: request.session.username,
                    signedIn: true,
                    biography: biography,
                    admin: request.session.admin

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
                    signedIn: true,
                    biography: biography,
                    admin: request.session.admin
                });
            }
        });
    }
});

// home page: profile picture
app.post("/profile", function(request, response) {
    db.collection("users").find({}).toArray(function(error, allUsers) {
        var date = new Date();
        var number = date.getTime();

        var form = new formidable.IncomingForm();
        // set max file size for images in bytes (25 x 1024 x 1024)
        form.maxFileSize = 26214400;

        form.parse(request, function(error, fields, files) {
            files.file.name = files.file.name.replace(" ", "");
            // make sure name is not null
            if (files.file.name) {
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

                var options = {
                    srcPath: oldpath,
                    dstPath: newpath,
                    width: 250
                };

                imageMagick.resize(options, function(error) {
                    response.redirect("/home");
                });
            }
            else {
                db.collection("users").updateOne({
                    "_id": request.session.username
                }, {
                    $set: {
                        "profilePicture": "blank-profile-icon.png"
                    }
                });
                response.redirect("/home")
            }
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
        // the magic number is right here do not move this line at all and if you do you will face the wrath of pi because logic
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
            signedIn: true,
            admin: request.session.admin
        });
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
                signedIn: true,
                admin: request.session.admin
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
            var allPeople = {};
            db.collection("users").find().toArray(function(error, users) {
                for (var i = 0; i < users.length; i++) {
                    allPeople[users[i]._id] = users[i];
                }
                var level = findDegrees(request.session.username, [friend], 0, allPeople);
                console.log("Level: " + level);

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
                    signedIn: true,
                    biography: database.biography,
                    level: level,
                    admin: request.session.admin
                });
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

function postInfoPicture(request, response) {
    db.collection("Posts").find({}).toArray(function(error, allPosts) {
        var form = new formidable.IncomingForm();
        var tag = "";
        db.collection("Posts").find({}).toArray(function(error, result) {
            // determine ID
            var date = new Date();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            var year = date.getFullYear();
            var fullDate = month + "/" + day + "/" + year;
            var postCounter = result.length;

            form.parse(request, function(error, fields, files) {
                // set max file size for images in bytes (25 x 1024 x 1024)
                form.maxFileSize = 26214400;
                var post = fields.post;
                post = filter.clean(post);
                var tag = fields.tag;
                tag = tag.split(",");
                for (var i = 0; i < tag.length; i++) {
                    tag[i] = tag[i].trim(" ");
                    setTags(tag[i], postCounter);
                }


                files.file.name = files.file.name.replace(" ", "");
                // make sure name is not null
                var postInfo = {};
                if (files.file.name) {
                    var oldpath = files.file.path;
                    var name = date.getTime() + files.file.name;
                    var newpath = __dirname + "/public/postUploads/" + name;

                    var options = {
                        srcPath: oldpath,
                        dstPath: newpath,
                        width: 250
                    };

                    imageMagick.resize(options, function(error) {});

                    var img = name;
                    postInfo = {
                        _id: postCounter,
                        creater: request.session.username,
                        body: post,
                        picture: img,
                        showImg: true,
                        date: fullDate,
                        tag: tag,
                        show: true
                    };
                }
                else {
                    postInfo = {
                        _id: postCounter,
                        creater: request.session.username,
                        body: post,
                        picture: img,
                        showImg: false,
                        date: fullDate,
                        tag: tag,
                        show: true
                    };
                }
                db.collection("Posts").insertOne(postInfo, function(error, res) {
                    response.redirect("/posts");
                });
            });
        });
    });
}

app.post("/biography", function(request, response) {
    var biography = request.body.biography;

    db.collection("users").updateOne({
        "_id": request.session.username
    }, {
        $set: {
            biography: biography
        }
    });
    response.send("saved");
});

function findDegrees(person, friends, level, allPeople) {
    var nextLevelFriends = [];
    for (var i = 0; i < friends.length; i++) {
        console.log(i)
        console.log("something " + friends[i])
        if (allPeople[friends[i]].checked) {
            continue;
        }
        
        console.log("person " + person)
        if (person == friends[i]) {
            console.log(level)
            return level;
        }
        
        for (var key in allPeople[friends[i]].friends) {
            nextLevelFriends.push(key);
        }
        allPeople[friends[i]].checked = true;
    }
    if (nextLevelFriends.length == 0) {
        return Infinity
    }
    else {
        return findDegrees(person, nextLevelFriends, level + 1, allPeople)
    }
}

app.post("/adminPassword", function(request, response) {
    if (request.session.username) {
        // set request session username admin to admin or not
        db.collection("users").findOne({
            "_id": request.session.username
        }, function(error, info) {
            var admin = info.admin;
            request.session.admin = admin;
        });
        var password = request.body.password;
        db.collection("users").findOne({
            _id: request.session.username
        }, function(error, result) {
            if (password == result.password) {
                response.send("correct");
            }
            else {
                response.send("incorrect");
            }
        });
    }
});
