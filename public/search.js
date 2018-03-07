var $ = window.$;

$(".name").click(function() {
    var friend = $(this).text();
    window.location.href = "/status?user=" + friend;
});

$("#searchLink").click(function() {
    var searchFor = $("#search").val();
    window.location.href = "/search?user=" + searchFor;
});

$("#signOutButton").click(function() {
    $.post("signOut", {},
        function(data, success) {
            reload();
        });
});

function reload() {
    window.location.href = "/";
}
