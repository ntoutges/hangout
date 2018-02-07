document.getElementById("submit").addEventListener("click", function() {
    var post = document.getElementById("post").value;
    var allTags = document.getElementById("tag").value;
    var tags = allTags.split(",");
    for (var i = 0; i < tags.length; i++) {
        tags[i] = tags[i].trim();
    }
    if (post) {
        sendPost(post, tags);
    }
});

function sendPost(post, tag) {
    var request = new XMLHttpRequest();
    request.open("POST", "/post");
    request.addEventListener("load", addPost);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send("post=" + post + "&tags=" + tag);
}

function addPost() {
    var response = this.response;
    if (response == "true") {
        document.getElementById("post").value = "";
        document.getElementById("error").innerHTML = "";
        window.location.reload();
    }
    else if (response == "false") {
        document.getElementById("error").innerHTML = "Sorry, there was an error, please try again";
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
document.getElementById("submitTag").addEventListener("click", function() {
    document.getElementById("postHolder").innerHTML = "";
    var tag = document.getElementById("searchTag").value;
    document.getElementById("searchTag").value = "";
    tags.push(tag);
    writeTags();
});

function writeTags() {
    document.getElementById("tags").innerHTML = "";
    for (var i = 0; i < tags.length; i++) {
        var shownTags = document.createElement("div");
        var shownTagsContainer = document.createElement("div");
        shownTags.innerHTML = "#" + tags[i];
        shownTags.setAttribute("class", "userTags");
        shownTags.setAttribute("id", i);
        shownTags.addEventListener("click", tagClicked);
        shownTagsContainer.appendChild(shownTags);
        document.getElementById("tags").appendChild(shownTagsContainer);
    }
    var request = new XMLHttpRequest();
    request.open("GET", "/tag?tags=" + tags);
    request.addEventListener("load", showPosts);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send();
}

function showPosts() {
    var posts = this.response;
    document.getElementById("postHolder").innerHTML = "";
    posts = JSON.parse(posts);
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].show) {
            var creater = posts[i].creater;
            var published = posts[i].date;
            var body = posts[i].body;
            var tags = [];
            for (var j = 0; j < posts[i].tag.length; j++) {
                tags.push(posts[i].tag[j]);
            }
            // create containing divs
            var postHolder = document.createElement("div");
            var post = document.createElement("div");
            var header = document.createElement("div");
            var lastUpdate = document.createElement("div");
            var tagHolder = document.createElement("div");

            // set styling
            postHolder.setAttribute("class", "posts");
            post.setAttribute("class", "post");
            header.setAttribute("class", "postHeader");
            lastUpdate.setAttribute("class", "lastUpdate");

            // set values
            header.innerHTML = creater;
            lastUpdate.innerHTML = published;
            
            for (var j = 0; j < tags.length; j++) {
                var seenTags = document.createElement("div");
                seenTags.innerHTML = "#" + tags[j];
                seenTags.setAttribute("class", "postTags");
                tagHolder.appendChild(seenTags);
            }
            // put header in divs
            postHolder.appendChild(header);

            // set values
            post.innerHTML = body;

            // put divs in divs
            postHolder.appendChild(post);
            postHolder.appendChild(tagHolder);
            postHolder.appendChild(lastUpdate);
            document.getElementById("postHolder").appendChild(postHolder);
        }
    }
}

function tagClicked() {
    var id = this.getAttribute("id");
    id = parseInt(id);
    console.log(id)
    tags.pop(id);
    writeTags();
}
