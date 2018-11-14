var $ = window.$;
var socket = io();

// Dave: test code to test socket
socket.on("ban", sendToSignIn);

function sendToSignIn(data) {
    var message = data.message;
    var person = data.person;
    // use message to display reason for ban in future
    $.post("signOut", {
        person: person
    },
        function(data, success) {
            window.location.reload();
        });
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
