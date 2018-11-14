var $ = window.$;

// set profile height
var profile = $("#profilePicture");
profile.on("load", function() {
    changeHeight(this.clientHeight, this.clientWidth);
});

if (profile && profile.clientHeight) {
    changeHeight(profile.clientHeight, profile.clientWidth);
}
// in the case image is already loaded
changeHeight(profile.clientHeight, profile.clientWidth);

function changeHeight(height, width) {
    if (height > width) {
        profile.css("height", "250px");
    }
    else {
        profile.css("width", "250px");
    }
    var newHeight = profile.clientHeight;
    var top = (250 - newHeight) / 2;

    profile.css("marginTop", top + "px");
    setImageWidth();
}

function setImageWidth() {
    var children = $("#friendHolder").children();
    children.css("width", (100 / children.length - 1) + "%");
}

// set section width
var width = $("#info").width();
width -= 11;
var sectionWidth = (width / 4) - 7;
$(".sections").css("width", sectionWidth + "px");

$("#signOutButton").click(function() {
    $.post("signOut", {},
        function(data, success) {
            reload();
        });
});

function reload() {
    window.location.href = "/";
}

$("#searchLink").click(function() {
    var searchFor = $("#search").val();
    window.location.href = "/search?user=" + searchFor;
});

$("#leaveButton").click(function() {
    window.location.href = "/home";
});

$("#friend").click(function() {
    var friend = $("#username").text();
    $.post("/friend", {
            friend: friend
        },
        function(success, data) {
            console.log(success);
        });
});

$("#signOutButton").click(function() {
    $.post("signOut", {},
        function(error, success) {
            reloadPage();
        });
});

function reloadPage() {
    window.location.href = "/";
}
getInformation();

function getInformation() {
    $.post("information", {
            user: $("#username").text()
        },
        function(data, success) {
            getInfo(data, success);
        });
}

function getInfo(data, success) {
    var friends = "";
    var groups = "";
    var preference = "";
    var misc = "";
    var response = data;
    if (response) {
        friends = response.friends;
        groups = response.groups;
        misc = response.misc;
    }

    // create elements to add values to
    var friendLength = 0;
    for (var key in friends) {
        friendLength++;
        var parent = $("#section1");
        var child = $("<div></div>");
        child.addClass("friends");
        child.attr("id", "friend" + friendLength);
        child.text(friendLength + ". " + key);
        parent.append(child);
        if ((!friends[key][1] && friends[key][2]) || (friends[key][1] && !friends[key][2])) {
            child.attr("class", "almost");
        }
        child.attr("id", key);
        child.text(friendLength + ". " + key);
        parent.append(child);
    }
    // tell user they currently have no friends
    if (friendLength == 0) {
        var parentBackUp = $("#section1");
        var childBackUp = $("<div></div>");
        childBackUp.addClass("none");
        childBackUp.text("You currently have no friends");
        parentBackUp.append(childBackUp);
    }

    for (var i = 1; groups.length >= i; i++) {
        var parent1 = $("#section2");
        var child1 = $("<div></div>");
        child1.addClass("groups");
        child1.attr("id", "group" + i);
        child1.text(i + ". " + groups[i - 1]);
        parent1.append(child1);
    }

    // tell user they are currently not part of any groups
    if (groups.length == 0) {
        var parentBackUp1 = $("#section2");
        var childBackUp1 = $("<div></div>");
        childBackUp1.addClass("none");
        childBackUp1.text("You are currently part of no groups");
        parentBackUp1.append(childBackUp1);
    }
}

$("#ban").on("click", function() {
    if ($(this).text() == "Ban") {
        window.location.replace("https://forums-nicholastmrcode.c9users.io/ban?user=" + $("#username").text());
    }
    else {
        var alertBox = $("#alert");
        alertBox.css("display", "block");
        $("#message").text("Are you sure you would like to unban this person?");
        $("#b1").text("Yes");
        $("#b2").text("No");
        var pageWidth = $("#body").width();
        $("#alert").css("left", ((pageWidth / 2)) + "px");
        $("#alert").css("top", "100px");
        $("#b1").on("click", unBan(true));
        $("#b2").on("click", unBan(false));
    }
});

function unBan(sure) {
    $("#alert").css("display", "none");
    if (sure) {
        $.post("/unban", {
            username: $("#username").text()
        });
    }
}