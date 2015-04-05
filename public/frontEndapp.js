var socket = io.connect('http://localhost:8080');
var cachedMatches = [];
socket.on('matches', function (data) {
    console.log('matches hit', data);
    if(!Person.people.length) {
        Person.people = data;
        _.each(Person.people, function (peep) {
            Person.add(peep);
        });
    }else{
        cachedMatches = cachedMatches.concat(data);
    }
    App.likeAll();
});

socket.on('updates', function (data){
   console.log('update data is', data);
});

socket.on('history', function (data){
    console.log('history data is', data);
});

<!--facebook sdk-->
    // This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
    var userToken;
    var authToken;
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
        // Logged into your app and Facebook.
        console.log('response is', response);
        userToken = response.authResponse.userID;
        authToken = $('#auth').val();
        authToken = authToken.split('&');
        authToken = authToken[0].split('=');
        authToken = authToken[1];
        console.log('auth is', authToken);
        console.log('emitting socket');
        socket.emit('auth', {userId: userToken, auth: authToken})
    } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
        document.getElementById('status').innerHTML = 'Please log ' +
        'into this app.';
    } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
        document.getElementById('status').innerHTML = 'Please log ' +
        'into Facebook.';
    }
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
    FB.getLoginStatus(function(response) {
        console.log('login status return is', response);
        statusChangeCallback(response);
    });
}

window.fbAsyncInit = function() {
    FB.init({
        appId      : '617113231768702',
        cookie     : true,  // enable cookies to allow the server to access
                            // the session
        xfbml      : true,  // parse social plugins on this page
        version    : 'v2.1' // use version 2.1
    });

    // Now that we've initialized the JavaScript SDK, we call
    // FB.getLoginStatus().  This function gets the state of the
    // person visiting this page and can return one of three states to
    // the callback you provide.  They can be:
    //
    // 1. Logged into your app ('connected')
    // 2. Logged into Facebook, but not your app ('not_authorized')
    // 3. Not logged into Facebook and can't tell if they are logged into
    //    your app or not.
    //
    // These three cases are handled in the callback function.

    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });

};

// Load the SDK asynchronously
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Here we run a very simple test of the Graph API after login is
// successful.  See statusChangeCallback() for when this call is made.
function testAPI() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
        console.log('Successful login for: ' + response.name);
        document.getElementById('status').innerHTML =
            'Thanks for logging in, ' + response.name + '!';
    });
}

<!--end of facebook sdk-->



    $('a[href*=#]').click(function(){return false;});

    var animationEndEvent = "webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend";

    var Person = {
        wrap: $('#people'),
        people: [],
        add: function(peep){
            this.wrap.append("<div class='person'><img alt='" + peep.name + "' src='" + peep.photos[0].url + "' /><span><span><strong>" + peep.name + "</strong></div>");
        },
        searching: function(){
            console.log('searching hit');
            this.wrap.append("<div class='person'><img alt='' src='https://i.imgur.com/AdiBPrO.jpg' /><span><strong>Searching for Matches</strong></div>")
        }
    };

    var App = {
        yesButton: $('.button.yes .trigger'),
        noButton: $('.button.no .trigger'),
        blocked: false,
        searching: true,
        like: function(liked){
            var animate = liked ? 'animateYes' : 'animateNo';
            var self = this;
            if(!this.blocked){
                this.blocked = true;
                $('.person').eq(0).addClass(animate).one(animationEndEvent, function(){
                    $(this).remove();
                    self.blocked = false;
                });
            }
        },

        likeAll: function(){
            var animate = true ? 'animateYes' : 'animateNo';
            var self = this;
            if(!this.blocked){
                this.blocked = true;
                $('.person').eq(0).addClass(animate).one(animationEndEvent, function(){
                    $(this).remove();
                    self.blocked = false;
                    if(Person.people.length) {
                        Person.people.splice(Person.people.length-1, 1);
                        setInterval(self.likeAll(), 500);
                    }else{
                        Person.people.splice(0, 1);
                        if(!cachedMatches.length) {
                            Person.searching();
                        }else{
                            Person.people = cachedMatches;
                            _.each(Person.people, function (peep) {
                                Person.add(peep);
                            });
                            setInterval(self.likeAll(), 500);
                        }
                    }
                });
            }
        }
    };

    var Phone = {
        wrap: $('#phone'),
        clock: $('.clock'),
        updateClock: function(){
            var date = new Date();
            var hours = date.getHours();
            var min = date.getMinutes();
            hours = (hours < 10 ? "0" : "") + hours;
            min = (min < 10 ? "0" : "") + min;
            var str = hours + ":" + min;
            this.clock.text(str);
        }
    };

    App.yesButton.on('mousedown', function(){
        App.like(true);
    });

    App.noButton.on('mousedown', function(){
        App.like(false);
    });

    $(document).ready(function(){
        Phone.updateClock();
        setInterval('Phone.updateClock()', 1000);
        Person.searching();
    });


var userAuthToken




