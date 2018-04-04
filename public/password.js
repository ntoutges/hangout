var $ = window.$;
$("#signInButton").click(password);
$("#password").keydown(check);

function check(event) {
    if (event.keyCode == 13) {
        password();
    }
}

function password() {
    var password = $("#password").val();
    $.post("/adminPassword", {
        password: password
    }, function (data, success) {
        $("#warning").text("");
        if (data == "incorrect") {
            $("#warning").text("Incorrect Password");
        }
        else if (data == "correct") {
            window.location.href = "/home";
        }
    });
}