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
    console.log(height + "        " + width)
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
    console.log(friend)
    $.post("/friend", {
            friend: friend
        },
        function(success, data) {
            console.log(success)
        });
});

$("#signOutButton").click(function() {
    $.post("signOut", {},
        function(data, success) {
            reloadPage();
        });
});

function reloadPage() {
    window.location.href = "/";
}
