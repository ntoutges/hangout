var $ = window.$;

// $("#seePassword").mousedown(function() {
//     $("#password").clone().prop('type', 'text').insertAfter('#password').prev().remove();
// });
// $("#seePassword").mouseup(function() {
//     $("#password").clone().prop('type', 'password').insertAfter('#password').prev().remove();
// });
// $("#seeConfirm").mousedown("mousedown", function() {
//     $("#confirm").clone().prop('type', 'text').insertAfter('#confirm').prev().remove();
// });
// $("#seeConfirm").mouseup(function() {
//     $("#confirm").clone().prop('type', 'password').insertAfter('#confirm').prev().remove();
// });

var noCoppies = false;

$("#signUpButton").click(signUp);
$("#username").keydown(checkKey);
$("#password").keydown(checkKey);
$("#confirm").keydown(checkKey);

function checkKey(event) {
    if (event.keyCode == 13) {
        signUp();
    }
}

function signUp() {
    // var password = $("#password").val();
    var confirm = $("#confirm").val();
    var username = $("#username").val();
    $("#warning").text = "";
    $("#signUpBox").css("height", "454px");
    $("#signUpBox").css("top", "150px");

    //if (!password || !confirm) {
    // $("#warning").text("Please confirm your password");
    // $("#signUpBox").css("height", "570px");
    // $("#signUpBox").css("top", "50px");
    //}
    //else if (!username) {
    if (!username)
        $("#warning").text("Please confirm your username");
    $("#signUpBox").css("height", "570px");
    $("#signUpBox").css("top", "50px");
    //}
    // else if (password != confirm) {
    //     $("#warning").text("The two passwords do not match");
    //     $("#signUpBox").css("height", "570px");
    //     $("#signUpBox").css("top", "50px");
    // }
    // else {
    //createAccount(username, password);
    createAccount(username, "");
    noCoppies = true;
    // }
}

$("#password").on("input", function() {
    var showPassword = $("#seePassword");
    if (this.value) {
        showPassword.css("display", "block");
    }
    else if (!this.value) {
        showPassword.css("display", "none");
    }
});
$("#confirm").on("input", function() {
    var showConfirm = $("#seeConfirm");
    if (this.value) {
        showConfirm.css("display", "block");
    }
    else if (!this.value) {
        showConfirm.css("display", "none");
    }
});

function createAccount(username, password) {
    // send message to server
    $.post("/create", {
        username: username,
        password: password
    }, function(data, success) {
        getInfo(data, success);
    });
}

function getInfo() {
    var response = this.response;
    if (noCoppies) {
        if (response == "false") {
            $("#warning").text("That username has been taken");
            $("#signUpBox").css("height", "570px");
            $("#signUpBox").css("top", "50px");
        }
        else {
            $("#warning").text("Account Created");
            $("#signUpBox").css("top", "93px");
            $("#signUpBox").css("height", "512px");
            setTimeout(function() {
                window.location.href = "/";
            }, 3000);
        }
    }
}
