var $ = window.$;
$("#signInButton").click(signIn);
$("#username").keydown(checkKey);
$("#password").keydown(checkKey);

function checkKey(event) {
    if (event.keyCode == 13) {
        signIn();
    }
}

function signIn() {
    $("#warning").text("");
    $("#signInBox").css("height", "465px");
    var password = $("#password").val();
    var username = $("#username").val();

    if (password != "" && username != "") {
        sendMessage(password, username);
    }
    else if (username == "") {
        $("#warning").text("Please insert a username");
        $("#signInBox").css("height", "515px");
    }
    else {
        $("#warning").text("Please insert a password");
        $("#signInBox").css("height", "515px");
    }
}

$("#password").on("input", function() {
    var password = $("#password").val();
    if (password) {
        $("#seePassword").css("display", "block");
    }
    else {
        $("#seePassword").css("display", "none");
    }
});

$("#seePassword").mousedown(function() {
    $("#password").clone().prop('type', 'text').insertAfter('#password').prev().remove();
});
$("#seePassword").mouseup(function() {
    $("#password").clone().prop('type', 'password').insertAfter('#password').prev().remove();
});

function sendMessage(password, username) {
    // send message to server
    $.post("/info", {
        username: username,
        password: password
    }, function(data, success) {
        getInfo(data, success);
    });
}

// get response from the server
function getInfo(response, success) {
    var warning = $("#warning");

    if (response != "Off") {
        if (response == "incorrect username") {
            warning.text("Incorrect Username");
            $("#signInBox").css("height", "515px");
        }
        else if (response == "incorrect password") {
            $("#signInBox").css("height", "515px");
            warning.text("Incorrect Password");
        }
        else if (response == "correct") {
            window.location.href = "home";
        }
    }
    else {
        warning.text("You Have Been Blocked");
        $("#signInBox").css("height", "515px");
    }
}
