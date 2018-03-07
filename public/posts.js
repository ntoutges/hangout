var $ = window.$;

$("#submit").click(submit);

function submit() {
    var post = $("#post").val();
    var allTags = $("#tag").val();
    var tags = allTags.split(",");
    for (var i = 0; i < tags.length; i++) {
        tags[i] = tags[i].trim();
    }
    if (post) {
        sendPost(post, tags);
    }
}

function sendPost(post, tag) {
    $.post("/post", {
        post: post,
        tags: tag
    }, function(data, success) {
        addPost(data, success);
    });
}

function addPost(data, success) {
    var response = data;
    if (response) {
        $("#post").val("");
        $("#error").text("");
        window.location.reload();
    }
    else if (!response) {
        $("#error").text("Sorry, there was an error, please try again");
    }
    else {
        window.location.href = "/";
    }
}

var allPosts = document.getElementsByClassName("posts");
var post = document.getElementsByClassName("post");
for (var i = 0; i < allPosts.length; i++) {
    var width = allPosts[i].clientWidth - 20;
    post[i].style.width = width + "px";
}

// add searching tags
var tags = [];
$("#submitTag").click(searchTags);

function searchTags() {
    $("#postHolder").text("");
    var tag = $("#searchTag").val();
    $("#searchTag").val("");
    tags.push(tag);
    writeTags();
}

function writeTags() {
    $("#tags").text("");
    for (var i = 0; i < tags.length; i++) {
        var shownTags = $("<div></div>");
        var shownTagsContainer = $("<div></div>");
        shownTags.text("#" + tags[i]);
        shownTags.addClass("userTags");
        shownTags.attr("id", i);
        shownTags.click(tagClicked);
        shownTagsContainer.append(shownTags);
        $("#tags").append(shownTagsContainer);
    }
    $.get("/tag", {
        tags: tags.join(",")
    }, function(data, success) {
        showPosts(data, success);
    });
}

function showPosts(data, success) {
    var posts = data[0];
    var users = data[1]
    $("#postHolder").text("");
    for (var i = posts.length - 1; i >= 0; i--) {
        if (posts[i].show) {
            var creater = posts[i].creater;
            var published = posts[i].date;
            var body = posts[i].body;
            var picture = users[i].profilePicture;
            var tags = [];
            for (var j = 0; j < posts[i].tag.length; j++) {
                tags.push(posts[i].tag[j]);
            }
            // create containing divs
            var postHolder = $("<div></div>");
            var post = $("<div></div>");
            var profilePicture = $("<img>");
            var header = $("<div></div>");
            var lastUpdate = $("<div></div>");
            var tagHolder = $("<div></div>");

            // set styling
            postHolder.addClass("posts");
            post.addClass("post");
            header.addClass("header");
            lastUpdate.addClass("lastUpdate");
            profilePicture.addClass("image");

            // set values
            header.text(creater);
            profilePicture.attr("src", "/uploads/" + picture);
            lastUpdate.text(published);

            for (var j = 0; j < tags.length; j++) {
                if (tags[j] != "") {
                    var seenTags = $("<div></div>");
                    seenTags.text("#" + tags[j]);
                    seenTags.addClass("postTags");
                    tagHolder.append(seenTags);
                }
            }
            // put header in divs
            postHolder.append(profilePicture);
            postHolder.append(header);

            // set values
            body = body.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            post.text(body);

            // put divs in divs
            postHolder.append(post);
            postHolder.append(tagHolder);
            postHolder.append(lastUpdate);
            $("#postHolder").append(postHolder);
        }
    }
}

function tagClicked() {
    var id = $(this).attr("id");
    id = parseInt(id, 10);
    tags.splice(id, 1);
    writeTags();
}

$("#tag").keydown(detectKey);

function detectKey(event) {
    if (event.keyCode == 13) {
        submit();
    }
}

$("#searchTag").keydown(detectKeySearch);

function detectKeySearch(event) {
    if (event.keyCode == 13) {
        searchTags();
    }
}
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