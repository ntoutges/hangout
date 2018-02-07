document.getElementById("signInButton").addEventListener("click", signIn);
document.getElementById("username").addEventListener("keydown", checkKey);
document.getElementById("password").addEventListener("keydown", checkKey);

function checkKey(event) {
    if (event.keyCode == 13) {
        signIn();
    }
}

function signIn() {
    document.getElementById("warning").innerHTML = "";
    document.getElementById("signInBox").style.height = "465px";
    var password = document.getElementById("password").value;
    var username = document.getElementById("username").value;

    if (password != "" && username != "") {
        sendMessage(password, username);
    }
    else if (username == "") {
        document.getElementById("warning").innerHTML = "Please insert a username";
        document.getElementById("signInBox").style.height = "515px";
    }
    else {
        document.getElementById("warning").innerHTML = "Please insert a password";
        document.getElementById("signInBox").style.height = "515px";
    }
}

document.getElementById("password").addEventListener("input", function() {
    var password = document.getElementById("password").value;
    if (password) {
        document.getElementById("seePassword").style.display = "block";
    }
    else {
        document.getElementById("seePassword").style.display = "none";
    }
});

document.getElementById("seePassword").addEventListener("mousedown", function() {
    document.getElementById("password").setAttribute("type", "text");
});
document.getElementById("seePassword").addEventListener("mouseup", function() {
    document.getElementById("password").setAttribute("type", "password");
});

function sendMessage(password, username) {
    // send message to server
    var request = new XMLHttpRequest();
    request.addEventListener("load", getInfo);
    request.open("POST", "/info");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send("username=" + username + "&password=" + password);
}

// get response from the server
function getInfo() {
    var response = this.response;
    var warning = document.getElementById("warning");

    if (response != "Off") {
        if (response == "incorrect username") {
            warning.innerHTML = "Incorrect Username";
            document.getElementById("signInBox").style.height = "515px";
        }
        else if (response == "incorrect password") {
            document.getElementById("signInBox").style.height = "515px";
            warning.innerHTML = "Incorrect Password";
        }
        else if (response == "correct") {
            window.location.href = "home";
        }
    }
    else {
        warning.innerHTML = "You Have Been Blocked";
        document.getElementById("signInBox").style.height = "515px";
    }
}
