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
        child.mousedown(function(event) {
            deleteFriend($(this).text(), event);
        });
        if ((!friends[key][1] && friends[key][2]) || (friends[key][1] && !friends[key][2])) {
            child.attr("class", "almost");
            child.click(function() {
                confirmFriend($(this).text());
            });
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

$("#search").keydown(function() {
    if (event.keyCode == 13) {
        findFriend();
    }
});

$("#searchLink").click(findFriend);

function findFriend() {
    var searchFor = $("#search").val();
    window.location.href = "/search?user=" + searchFor;
}

function confirmFriend(friend) {
    friend = friend.split(". ", "2");
    $.post("/confirmFriend", {
        friend: friend[1]
    }, function(data, error) {
        window.location.reload();
    });
}

function deleteFriend(friend, event) {
    if (event.buttons == 2) {
        friend = friend.split(". ", "2");
        $.post("/deleteFriend", {
            friend: friend[1]
        }, function(data, error) {
            window.location.reload();
        });
    }
}

$("#submitText").click(function() {
    var biography = $("#biographyText").val();

    $.post("/biography", {
        biography: biography
    }, function(response, error) {
        if (response) {
            $("#savedHolder").css("display", "inline-block");
            $("#biographyText").css("height", "400px");
            setTimeout(function() {
                $("#savedHolder").css("display", "none");
            $("#biographyText").css("height", "420px");
            }, 5000);
        }
    });
});
