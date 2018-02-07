document.getElementById("seePassword").addEventListener("mousedown", function() {
    document.getElementById("password").setAttribute("type", "text");
});
document.getElementById("seePassword").addEventListener("mouseup", function() {
    document.getElementById("password").setAttribute("type", "password");
});
document.getElementById("seeConfirm").addEventListener("mousedown", function() {
    document.getElementById("confirm").setAttribute("type", "text");
});
document.getElementById("seeConfirm").addEventListener("mouseup", function() {
    document.getElementById("confirm").setAttribute("type", "password");
});

var noCoppies = false;

document.getElementById("signUpButton").addEventListener("click", signUp);
document.getElementById("username").addEventListener("keydown", checkKey);
document.getElementById("password").addEventListener("keydown", checkKey);
document.getElementById("confirm").addEventListener("keydown", checkKey);

function checkKey(event) {
    if (event.keyCode == 13) {
        signUp();
    }
}

function signUp() {
    var password = document.getElementById("password").value;
    var confirm = document.getElementById("confirm").value;
    var username = document.getElementById("username").value;
    document.getElementById("warning").innerHTML = "";
    document.getElementById("signUpBox").style.height = "454px";
    document.getElementById("signUpBox").style.top = "150px";

    if (!password || !confirm) {
        document.getElementById("warning").innerHTML = "Please confirm your password";
        document.getElementById("signUpBox").style.height = "570px";
        document.getElementById("signUpBox").style.top = "50px";
    }
    else if (!username) {
        document.getElementById("warning").innerHTML = "Please confirm your username";
        document.getElementById("signUpBox").style.height = "570px";
        document.getElementById("signUpBox").style.top = "50px";
    }
    else if (password != confirm) {
        document.getElementById("warning").innerHTML = "The two passwords do not match";
        document.getElementById("signUpBox").style.height = "570px";
        document.getElementById("signUpBox").style.top = "50px";
    }
    else {
        createAccount(username, password);
        noCoppies = true;
    }
}

document.getElementById("password").addEventListener("input", function() {
    var showPassword = document.getElementById("seePassword");
    if (this.value) {
        showPassword.style.display = "block";
    }
    else if (!this.value) {
        showPassword.style.display = "none";
    }
});
document.getElementById("confirm").addEventListener("input", function() {
    var showConfirm = document.getElementById("seeConfirm");
    if (this.value) {
        showConfirm.style.display = "block";
    }
    else if (!this.value) {
        showConfirm.style.display = "none";
    }
});

function createAccount(username, password) {
    var request = new XMLHttpRequest();
    request.open("POST", "/create");
    request.addEventListener("load", getInfo);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send("username=" + username + "&password=" + password);
}

function getInfo() {
    var response = this.response;
    if (noCoppies) {
        if (response == "false") {
            document.getElementById("warning").innerHTML = "That username has been taken";
            document.getElementById("signUpBox").style.height = "570px";
            document.getElementById("signUpBox").style.top = "50px";
        }
        else {
            document.getElementById("warning").innerHTML = "Account Created";
            document.getElementById("signUpBox").style.top = "93px";
            document.getElementById("signUpBox").style.height = "512px";
            setTimeout(function () {
                window.location.href = "/";
            }, 3000);
        }
    }
}
