var $ = window.$;

// set profile height
var profile = $("#profilePicture");
profile.on("load", function() {
    changeHeight(this.clientHeight, this.clientWidth);
});

if (profile && profile.clientHeight) {
    changeHeight(profile.clientHeight, profile.clientWidth);
}

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
}

getInformation();

// get info about person
function getInformation() {
    $.get("information", {},
        function(data, success) {
            getInfo(data, success);
        });
}

// display information on the screen
function getInfo() {
    var array = "";
    var friends = "";
    var groups = "";
    var preference = "";
    var misc = "";
    var response = this.response;
    if (response) {
        array = JSON.parse(response);
        friends = array[0];
        groups = array[1];
        preference = array[2];
        misc = array[3];
    }

    // create elements to add values to
    for (var i = 1; friends.length >= i; i++) {
        var parent = $("#section1");
        var child = $("<div></div>");
        child.addClass("friends");
        child.attr("id", "friend" + i);
        child.text(i + ". " + friends[i - 1]);
        parent.append(child);
    }

    // tell user they currently have no friends
    if (friends.length == 0) {
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
        child1.addClass("group" + i);
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
