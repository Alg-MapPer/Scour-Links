function toggleMenu() {

    let navBarLinks = document.querySelector('.navbar .navbar-links');

    if(navBarLinks.style.right === "70px") {
    navBarLinks.style.right = "-999px";
    } else {
    navBarLinks.style.right = "70px";
    }

}

// TippyJs

tippy('#flagImage', {
    theme: 'main',
    placement: 'bottom',
    animation: 'scale-extreme'
  });

tippy('#login', {
    theme: 'main',
    placement: 'bottom',
    animation: 'scale-extreme'
});

tippy('#new', {
    theme: 'main',
    placement: 'bottom',
    animation: 'scale-extreme'
});

// Send Request

$(function() {
        
    $("#new_link").on("click", function () {

    let button = document.getElementById('new_link');

    let alertBox = document.querySelector('.alert');
    let alertIcon = document.querySelector('.alert-icon');
    let alertMessage = document.querySelector('.alert-content');

    function sendAlert(status, icon, text) {
    alertBox.classList.add(status);
    alertBox.style.left = "30px";
    alertIcon.innerHTML = icon
    alertMessage.innerText = text;
    }

    function hideAlert(status) {
    alertBox.style.left = "-999px";
    alertBox.classList.remove(status);
    }

    button.disabled = true;
    button.style.cursor = "not-allowed";

    $.ajax({
    type: 'POST',
    url: '/new',
    data: {
    title: $('#link_title').val(),
    privacy: $('#link_privacy').val(),
    value: $('#link_value').val(),
    maxUsage: $('#link_maxUsage').val(),
    description: $('#link_description').val(),
    },
    success: function(data) {
    
    if(data.status === "error") {

    sendAlert(data.status, `<i class="fas fa-times"></i>`, data.message);

    setTimeout(function() {
    
    hideAlert(data.status);

    button.disabled = false;
    button.style.cursor = "pointer";

    }, 5000);

    } else {

    console.log(data.status);

    sendAlert(data.status, `<i class="fas fa-check"></i>`, data.message);

    setTimeout(function() {
    
    hideAlert(data.status);

    window.location.href = `/link/${data.link.code}`;

    }, 5000);


    }
}
    });
});
});

// News Toggle

function toggleNewsMessage() {

    let newsDiv = document.querySelector('.newsDiv');
    
    if(newsDiv.style.display === "block") {
        newsDiv.style.display = "none";
        document.body.style.overflowY = "auto";
    } else {
        newsDiv.style.display = "block";
        document.body.style.overflowY = "hidden";
    }

}