var $ = window.$;
$("#signInButton").click(signIn);
$("#username").keydown(checkKey);
//$("#password").keydown(checkKey);

function checkKey(event) {
    if (event.keyCode == 13) {
        signIn();
    }
}

function signIn() {
    $("#warning").text("");
    //var password = $("#password").val();
    var username = $("#username").val();

    if (username != "") {
        //sendMessage(password, username);
        sendMessage("", username);
    }
    else if (username == "") {
        $("#warning").text("Please insert a username");
    }
}

$("#password").on("input", function() {
    //var password = $("#password").val();
    //if (password) {
    $("#seePassword").css("display", "block");
    //}
    //else {
    $("#seePassword").css("display", "none");
    //}
});

// $("#seePassword").mousedown(function() {
//     $("#password").clone().prop('type', 'text').insertAfter('#password').prev().remove();
// });
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
        }
        else if (response == "incorrect password") {
            warning.text("Incorrect Password");
        }
        else if (response == "correct") {
            window.location.href = "/home";
        }
        else if (response == "password") {
            window.location.href = "password";
        }
    }
    else {
        $.post("/unban", {
            timedOut: false,
            username: $("#username").val()
        }, function(ban, success) {
            if (ban == true) {
                warning.text("You Have Been Blocked");
            }
            else {
                window.location.href = "/home";
            }
        });
    }
}
