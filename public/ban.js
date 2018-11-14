var $ = window.$;
$("#submit").on("click", function() {
        var reason = $("#reason").val();
        var time = $("#select").val();
        if (reason == "") {
            $("#warning").text("Please insert a reason");
        }
        else if (time == "none") {
            $("#warning").text("Please define the time banned");
        }
        else {
            var queryString = window.location.href.split("?")[1];
            var keyValue = queryString.split("=");
            $.post("/banPerson", {
                reason: reason,
                time: time,
                username: keyValue[1]
            }, function(data, success) {
                if (data == "home") {
                    window.location.replace("/home");
                }
            });
        }
});
