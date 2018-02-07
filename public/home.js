// set profile height
var profile = document.getElementById("profilePicture");
profile.addEventListener("load", function() {
    changeHeight(this.clientHeight, this.clientWidth);
});

if (profile && profile.clientHeight) {
    changeHeight(profile.clientHeight, profile.clientWidth);
}

function changeHeight(height, width) {
    if (height > width) {
        profile.style.height = "250px";
    }
    else {
        profile.style.width = "250px";
    }
    var newHeight = profile.clientHeight;
    var top = (250 - newHeight) / 2;

    profile.style.marginTop = top + "px";
}

getInformation();

// get info about person
function getInformation() {
    var request = new XMLHttpRequest();
    request.open("GET", "information");
    request.addEventListener("load", getInfo);
    request.send();
}

// display information on the screen
function getInfo() {
    var response = this.response;
    var array = JSON.parse(response);
    var friends = array[0];
    var groups = array[1];
    var preference = array[2];
    var misc = array[3];

    // create elements to add values to
    for (var i = 1; friends.length >= i; i++) {
        var parent = document.getElementById("section1");
        var child = document.createElement("div");
        child.setAttribute("class", "friends");
        child.setAttribute("id", "friend" + i);
        child.innerHTML = i + ". " + friends[i - 1];
        parent.appendChild(child);
    }

    // tell user they currently have no friends
    if (friends.length == 0) {
        var parentBackUp = document.getElementById("section1");
        var childBackUp = document.createElement("div");
        childBackUp.setAttribute("class", "none")
        childBackUp.innerHTML = "You currently have no friends";
        parentBackUp.appendChild(childBackUp);
    }

    for (var i = 1; groups.length >= i; i++) {
        var parent1 = document.getElementById("section2");
        var child1 = document.createElement("div");
        child1.setAttribute("class", "groups");
        child1.setAttribute("id", "group" + i)
        child1.innerHTML = i + ". " + groups[i - 1];
        parent1.appendChild(child1);
    }

    // tell user they are currently not part of any groups
    if (groups.length == 0) {
        var parentBackUp1 = document.getElementById("section2");
        var childBackUp1 = document.createElement("div");
        childBackUp1.setAttribute("class", "none");
        childBackUp1.innerHTML = "You are currently part of no groups";
        parentBackUp1.appendChild(childBackUp1);
    }
}

// set section width
var width = document.getElementById("info").clientWidth;
width -= 11;
var sectionWidth = (width / 4) - 7;
var sections = document.getElementsByClassName("sections");
for (var i = 0; i < sections.length; i++) {
    sections[i].style.width = sectionWidth + "px";
}
// 
document.getElementById("signOutButton").addEventListener("click", function() {
    var request = new XMLHttpRequest();
    request.open("POST", "signOut");
    request.addEventListener("load", reload);
    request.send();
});

function reload() {
    window.location.href = "/";
}