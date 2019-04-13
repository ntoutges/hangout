var express = require("express");
var mongodb = require("mongodb");
var app = express();
var bodyParser = require("body-parser");
var expressLayouts = require("express-ejs-layouts");
var session = require("express-session");
var formidable = require("formidable");
var fs = require("fs");
var imageMagick = require("node-imagemagick");
var profanity = require("profanity-middleware");
var socketio = require("socket.io");

var filter = profanity.filter;

var staticFiles = express.static(__dirname + "/public");
app.use(staticFiles);
app.set("view engine", "ejs");
app.use(expressLayouts);

var urlencoded = bodyParser.urlencoded({
    extended: true
});
app.use(urlencoded);
app.use(session({
    secret: "nothingToSeeHereBecauseNoReasonAndIWillContinueToMakeThisStringLongerSoNoOneCanSomehowGetIntoMySystemAndSoItIsLongerThanMelaniesAndSheWillNeverKnowThatBecauseSheCannotSeeThisSecretMessage",
    resave: false,
    saveUninitialized: false
}));

var db;
var io;
var databaseURL = "mongodb://studentmrcode:mrcode123@ds163769.mlab.com:63769/hangouts";
mongodb.MongoClient.connect(databaseURL, function(error, database) {
    db = database;

    var server = app.listen(process.env.PORT || 3006, function() {
        console.log("app started");
    });
    io = socketio.listen(server);
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
        db.collection("users").findOne({
            "_id": request.session.username
        }, function(error, data) {
            var admin = data.admin;
            if ((admin && request.session.admin) || (!admin && !request.session.admin)) {
                response.redirect("/home");
            }
            else {
                request.session.username = false;
                response.redirect("/");
            }
        });
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
            var activity = user.activity.active;
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
    if (request.session.admin && request.session.username) {
        var username = request.body.username;
        db.collection("users").findOne({
            "_id": username
        }, function(error, user) {
            if (!user) {
                var password = request.body.password;
                // Dave: my suggestion is don't set all of the default values when creating new user, just omit them
                // the reason is that if you do this, every time you add or modify a property, you need to remember to
                // come here and update this accordinngly, which is just asking for trouble
                // instead, if your code where you access various properties, have a check for an omitted value and
                // treat it like the default value
                var information = {
                    "_id": username,
                    password: password,
                    activity: { active: true, reason: "", until: null, times: 0 },
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
    }
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
            else if (request.session.admin) {
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
            else {
                request.session.username = "";
                response.redirect("/");
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
                response.redirect("/home");
            }
        });
    });
});

app.post("/information", function(request, response) {
    var user = request.session.username;
    var secondUser = request.body.user;
    if (secondUser) {
        user = request.body.user;
    }
    db.collection("users").findOne({
        "_id": user
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
    var initializers = userTags.split("*");
    if (initializers[0] == "/" && initializers[2] == "/") {
        // run special commands from user
        if (initializers[1] == "friends") {
            db.collection("users").findOne({
                "_id": request.session.username
            }, function(error, user) {
                var counter = 0;
                var allPosts2 = [];
                if (Object.keys(user.friends).length > 0) {
                    for (var key in user.friends) {
                        db.collection("users").findOne({
                            _id: key
                        }, function(error, user2) {
                            db.collection("Posts").find({
                                "creater": user2._id
                            }).sort({
                                _id: 1
                            }).toArray(function(error, allPosts) {
                                counter++;
                                for (var i = 0; i < allPosts.length; i++) {
                                    allPosts2.push(allPosts[i]);
                                }
                                if (counter >= Object.keys(user.friends).length) {
                                    allPosts2 = sortAllPosts(allPosts2);
                                    sendPost(request, response, allPosts2);
                                }
                                // the magic number is right here do not move this line at all and if you do you will face the wrath of pi because logic
                            });
                        });
                    }
                }
                else {
                    sendPost(request, response, []);
                }
            });
        }
    }
    else if (userTags != "") {
        db.collection("Posts").find({
            "tag": new RegExp(".*" + userTags + ".*", "i")
        }).sort({
            _id: 1
        }).toArray(function(error, allPosts) {
            sendPost(request, response, allPosts);
        });
    }
    else {
        db.collection("Posts").find().sort({
            _id: 1
        }).toArray(function(error, allPosts) {
            sendPost(request, response, allPosts);
        });
    }
});

function sortAllPosts(allPosts) {
    var repeatFor = allPosts.length;
    var allPosts2 = [];
    for (var i = 0; i < repeatFor; i++) {
        var highestId = { post: { _id: -1 } };
        for (var j = 0; j < allPosts.length; j++) {
            if (parseInt(allPosts[j]._id, 10) > parseInt(highestId.post._id, 10)) {
                highestId = { post: allPosts[j], num: j };
            }
        }
        allPosts.splice(highestId.num, 1);
        allPosts2.push(highestId.post);
    }
    return allPosts2;
}

function sendPost(request, response, allPosts) {
    var user = {};
    var placeholder = [];
    var counter = 0;
    for (var i = 0; i < allPosts.length; i++) {
        db.collection("users").findOne({
            "_id": allPosts[i].creater
        }, function(error, database) {
            placeholder.push(database);
            counter++;
            // Dave: I haven't looked at this code in detail, but it looks a bit "pyramidy",
            // which is a recipe for hard-to-track bugs, perhaps break this up into functions
            if (counter == allPosts.length) {
                for (var j = 0; j < placeholder.length; j++) {
                    if (placeholder[j]._id == allPosts[j].creater) {
                        user[j] = placeholder[j].profilePicture;
                    }
                    else {
                        for (var k = 0; k < placeholder.length; k++) {
                            if (placeholder[k]._id == allPosts[j].creater) {
                                user[j] = placeholder[k].profilePicture;
                            }
                        }
                    }
                }
                var totalPosts = [allPosts, user, request.session.admin];
                response.send(totalPosts);
            }
        });
    }
    if (allPosts.length == 0) {
        var totalPosts = [allPosts, user, request.session.admin];
        response.send(totalPosts);
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
        db.collection("users").findOne({
            "_id": request.session.username
        }, function(error, database) {
            postInfoPicture(request, response);
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
    if (request.body.person == request.session.username || !request.body.person) {
        request.session.destroy();
        response.send("response");
    }
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
        // Dave: don't use arrays for things like this, use objects
        // objects have the benefit of being easily extendable, and properties
        // have names, which makes it easier to read and less error prone
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
        });
    });
});

// search for people to friend
app.get("/search", function(request, response) {
    // ERROR IS HERE NOW PLEASE REMEMBER THIS ERROR ERROR ERROR ERROR ERROR
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
                var banned = "Ban";
                if (!database.activity.active) {
                    banned = "Unban";
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
                    signedIn: true,
                    biography: database.biography,
                    level: level,
                    viewingAdmin: request.session.admin,
                    personBanned: banned
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
        db.collection("Posts").find({}).sort({
            "_id": 1
        }).toArray(function(error, result) {
            // determine ID
            var date = new Date();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            var year = date.getFullYear();
            var fullDate = month + "/" + day + "/" + year;
            var postCounter = result.length - 1;
            if (result.length == 0) {
                postCounter = 0;
            }
            else {
                postCounter = result[postCounter]._id + 1;
            }
            form.parse(request, function(error, fields, files) {
                // set max file size for images in bytes (25 x 1024 x 1024)
                form.maxFileSize = 26214400;
                var post = fields.post;
                post = filter(post);
                var tags = findTags(post);
                var newPost = combineIntoArray(post, tags);
                files.file.name = files.file.name.replace(" ", "");

                // set tags in collection
                for (var i = 0; i < tags.length; i++) {
                    if (post.length > 1 || files.file.name)
                        setTags(tags[i], postCounter);
                }

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
                        body: newPost,
                        picture: img,
                        showImg: true,
                        tag: tags,
                        date: fullDate,
                        show: true,
                        likes: 0,
                        dislikes: 0,
                        blacklist: {}
                    };
                }
                else {
                    postInfo = {
                        _id: postCounter,
                        creater: request.session.username,
                        body: newPost,
                        picture: img,
                        showImg: false,
                        tag: tags,
                        date: fullDate,
                        show: true,
                        likes: 0,
                        dislikes: 0,
                        blacklist: {}
                    };
                }
                if (post.length >= 1 || files.file.name) {
                    db.collection("Posts").insertOne(postInfo, function(error, res) {
                        response.redirect("/posts");
                    });
                }
                else {
                    response.redirect("/posts");
                }
            });
        });
    });
}

function findTags(txt) {
    var sectors = txt.split("#");
    // make sure first word is not a tag
    if (txt[0] != "#") {
        sectors.splice(0, 1);
    }
    let repeatFor = sectors.length;
    for (var i = 0; i < repeatFor; i++) {
        sectors[i] = sectors[i].split(" ")[0]; // filter out any part that is not connected and take only first part
        if (sectors[i].trim() == "#") {
            sectors.splice(i, 1);
        }
    }
    return sectors;
}

function combineIntoArray(evens, odds) {
    var evensSplit = evens.split("#");
    var post = [];
    for (var i = 0; i < evensSplit.length; i++) {
        if (odds[i]) {
            if (evens[0] == "#") {
                let obj = { type: "tag", text: "#" + odds[i] };
                post.push(obj);
                let element = evensSplit[i].replace(odds[i], "");
                let obj2 = { type: "text", text: element };
                post.push(obj2);
            }
            else {
                var i2 = i;
                if (i >= 1) {
                    i2--;
                }
                post.tagFirst = false;
                let element = evensSplit[i].replace(odds[i2], "");
                let obj = { type: "text", text: element };
                post.push(obj);
                let obj2 = { type: "tag", text: "#" + odds[i] };
                post.push(obj2);
            }
        }
    }
    return post;
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
        if (allPeople[friends[i]].checked) {
            continue;
        }
        if (person == friends[i]) {
            return level;
        }
        for (var key in allPeople[friends[i]].friends) {
            nextLevelFriends.push(key);
        }
        allPeople[friends[i]].checked = true;
    }
    if (nextLevelFriends.length == 0) {
        return Infinity;
    }
    else {
        return findDegrees(person, nextLevelFriends, level + 1, allPeople);
    }
}

app.post("/adminPassword", function(request, response) {
    if (request.session.username) {
        // set request session username admin to admin or not
        db.collection("users").findOne({
            "_id": request.session.username
        }, function(error, info) {
            var admin = info.admin;
            var password = request.body.password;
            db.collection("users").findOne({
                _id: request.session.username
            }, function(error, result) {
                if (password == result.password) {
                    request.session.admin = admin;
                    response.send("correct");
                }
                else {
                    response.send("incorrect");
                }
            });
        });
    }
});

// like or dislike someone's post
app.post("/like", function(request, response) {
    var like = request.body.like;
    var number = request.body.number;
    db.collection("Posts").find().sort({
        _id: 1
    }).toArray(function(error, databaseArray) {
        var database = databaseArray[number];
        var notInBlacklist = true;
        for (var i = 0; i < Object.keys(database.blacklist).length; i++) {
            if (Object.keys(database.blacklist)[i] == request.session.username) {
                notInBlacklist = false;
            }
        }
        var likes = database.likes;
        var dislikes = database.dislikes;
        if (like == "true") {
            likes++;
            if (!notInBlacklist) {
                dislikes--;
            }
        }
        else {
            dislikes++;
            if (!notInBlacklist) {
                likes--;
            }
        }
        if (database.blacklist[request.session.username] != like || notInBlacklist) {
            var blackList = database.blacklist;
            blackList[request.session.username] = like;
            db.collection("Posts").updateOne({
                "_id": database._id
            }, {
                $set: {
                    "blacklist": blackList,
                    "likes": likes,
                    "dislikes": dislikes
                }
            });
        }
    });
});

app.post("/delete", function(request, response) {
    var id = parseInt(request.body.postNum, 10);
    db.collection("Posts").find().sort({ "_id": 1 }).toArray(function(error, database) {
        db.collection("Posts").deleteOne({ _id: database[id]._id }, function(error, data) {});
    });
});

// banning people
app.get("/ban", function(request, response) {
    if (request.session.username && request.session.admin) {
        var user = request.query.user;
        response.render("pages/ban", {
            href: "ban.css",
            title: "Ban " + user,
            signedIn: false,
            banning: user
        });
    }
    else {
        response.redirect("/");
    }
});

// return here
app.post("/banPerson", function(request, response) {
    if (request.session.username && request.session.admin) {
        var reason = request.body.reason;
        var time = request.body.time;
        // calculate time until ban removed
        var today = incrimentTime(time);
        // find person to be banned
        var person = request.body.username;
        db.collection("users").findOne({
            _id: person
        }, function(error, data) {
            if (error) {
                console.log(error);
            }
            else {
                var amountOfTimesBanned = data.activity.times;
                db.collection("users").updateOne({
                    "_id": person
                }, {
                    $set: {
                        activity: { active: false, reason: reason, until: today, times: amountOfTimesBanned + 1 }
                    }
                });
                io.emit("ban", { person: person, reason: reason });
                response.send("home");
            }
        });
    }
});

function incrimentTime(time) {
    var today = new Date();
    time = time.split(" ");
    // multiplier is time in hours
    if (time[1] == "h") {
        today.setHours(today.getHours() + time[0]);
    }
    else if (time[1] == "d") {
        today.setDate(today.getDate() + time[0]);
    }
    else if (time[1] == "m") {
        today.setMonth(today.getMonth() + time[0]);
    }
    else if (time[1] == "i") {
        today.setFullYear(Infinity);
    }
    today = today.getTime();
    return today;
}

app.post("/unban", function(request, response) {
    if (request.session.admin && request.session.username) {
        db.collection("users").findOne({
            _id: request.body.username
        }, function(error, user) {
            var times = user.activity.times;
            unban(request, times);
            response.send("reload");
        });
    }
});

app.post("/banQuery", function(request, response) {
    db.collection("users").findOne({
        _id: request.body.username
    }, function(error, user) {
        if (error) { console.log(error) }
        else {
            var times = user.activity.times;

            var date = new Date();
            var until = user.activity.until;
            date = date.getTime();
            if (date >= until) {
                unban(request, times);
                response.send(false);
            }
            else {
                response.send(true);
            }
        }
    });
});

function unban(request, times) {
    db.collection("users").updateOne({
        "_id": request.body.username
    }, {
        $set: {
            activity: { active: true, reason: "", until: null, times: times }
        }
    });
}
