var requestPkg = require("request");
var mongodb = require("mongodb");

var db;
var databaseURL = "mongodb://studentmrcode:mrcode123@ds163769.mlab.com:63769/hangouts";
mongodb.MongoClient.connect(databaseURL, function(error, database) {
    db = database;
});

var allStudents = {};

setInterval(function() {
    requestPkg.get("https://www.mrcodeswildride.com/students", {}, function(error, response, body) {
        body = JSON.parse(body);
        for (var i = 0; i < body.length; i++) {
            if (!allStudents[body[i]._id]) {
                // make info to insert into database
                var userPostInfo = {
                    _id: body[i]._id,
                    password: "",
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
                    student: true
                };

                // contact database
                db.collection("users").insertOne(userPostInfo, function(error, result) {});
                // add 'all students to local array'
                allStudents[body[i]._id] = true;
            }
        }
    });
}, 60000);
