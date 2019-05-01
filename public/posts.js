var $ = window.$;

var allPosts = document.getElementsByClassName("posts");
var post = document.getElementsByClassName("post");
for (var i = 0; i < allPosts.length; i++) {
    var width = allPosts[i].clientWidth - 20;
    post[i].style.width = width + "px";
}

$("#searchFriends").click(function() {
    $("#searchTag").val("/*friends*/");
});

setInterval(function() {
    var tags = $("#searchTag").val();
    tags = tags.replace("#", "");
    $.get("/tag", {
        tags: tags
    }, function(data, success) {
        showPosts(data, success);
    });
}, 500);

function showPosts(data, success) {
    var posts = data[0];
    var users = data[1];
    var admin = data[2];
    $("#postHolder").text("");
    for (var i = posts.length - 1; i >= 0; i--) {
        if (posts[i].show) {
            var creater = posts[i].creater;
            var published = posts[i].date;
            var array = posts[i].body;
            var likes = posts[i].likes;
            var dislikes = posts[i].dislikes;
            // escape body text
            var body = $("<div></div>");
            for (var j = 0; j < array.length; j++) {
                let text = array[j].text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                var div = $("<div class=post>" + text + "</div>");
                div.addClass(array[j].type);
                if (array[j].type == "tag") {
                    div.click(setTag);
                }
                body.append(div);
            }
            
            var picture = users[i];
            var postImage = posts[i].picture;

            // create containing divs
            var postHolder = $("<div class=posts>" +
                "<div class=postHeader>" +
                "<img src=/profileUploads/" + picture + " class= 'header image'>" +
                "<div class=header> Creator: " + creater + "</div>" +
                "</div>");
            postHolder.append(body);

            var img = "";
            if (postImage) {
                img = $("<div class=pictureHolder>" +
                    "<img src=/postUploads/" + postImage + " class=postPicture>" +
                    "</div>");
            }
            var likeDislike = "";
            if (admin) {
                likeDislike = $("<div class=lastUpdate>" + published + "</div> <div class=likes><span class=postLikes>" +
                    likes + "</span> <img src=like.png class=like number=" + i + "><span class=postDislikes>" + dislikes +
                    "</span><img src=dislike.png class=dislike number=" + i + "><button class=delete id=" + i + ">DELETE</button></div>");
            }
            else {
                likeDislike = $("<div class=lastUpdate>" + published + "</div> <div class=likes><span class=postLikes>" +
                    likes + "</span> <img src=like.png class=like number=" + i + "><span class=postDislikes>" + dislikes +
                    "</span><img src=dislike.png class=dislike number=" + i + "></div>");
            }
            // put divs in divs
            $("#postHolder").append(postHolder);
            postHolder.append(img);
            postHolder.append(likeDislike);
            $(".delete").click(function() {
                deletePost($(this).attr("id"));
            });
        }
    }
    $(".like").click(function() {
        like(true, this);
    });
    $(".dislike").click(function() {
        like(false, this);
    });
}

function setTag() {
    var tag = $(this).text();
    
    // remove '#' symbol
    tag = tag.substring(1, tag.length);
    
    $("#searchTag").val(tag);
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

function like(liked, thisOne) {
    var number = thisOne.getAttribute("number");
    $.post("/like", {
        like: liked,
        number: number
    }, function(data, success) {
        if (data == "reload") {
            window.location.reload();
        }
    });
}
var send = true;

function deletePost(number) {
    if (send) {
        send = false;
        setTimeout(function() {
            send = true;
        }, 500);
        number = parseInt(number, 10);
        $.post("/delete", {
            "postNum": number
        });
    }
}
