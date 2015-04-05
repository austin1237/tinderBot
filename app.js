
/**
 * Module dependencies
 */

var express = require('express'),
    jade = require('jade');
bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    errorHandler = require('express-error-handler'),
    morgan = require('morgan'),
    routes = require('./routes'),
    api = require('./routes/api'),
    https = require('https'),
    http = require('http'),
    path = require('path'),
    tinder = require('tinderjs'),
    Q = require('q'),
    _ = require('lodash'),
    request = require('request');


var app = module.exports = express();


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

var env = process.env.NODE_ENV || 'development';

// development only
if (env === 'development') {
  app.use(errorHandler());
}

// production only
if (env === 'production') {
  // TODO
}


/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/name', api.name);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


/**
 * Start Server
 */

var server =http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io')(server);

var matchesFound = 0;
var long = -104.984059;
var lat = 39.737736;

io.on('connection', function (socket) {
  console.log('conection hit');

  socket.on('auth', function(authData){
    var client = new tinder.TinderClient();
    var userId = authData.userId;
    var access = authData.auth;
    var currentlySearching = true;
    console.log('auth hit', userId, access);

    init(access, userId);

    function init (access, userId) {
      console.log('init hit from client socket', access, userId);
      var promise = authorize(access, userId);
      promise.then(function () {
        updatePosition(long, lat).then(function() {
        }).then(function(){
          setInterval(startTindering, 15000);
          //setInterval(getHistory, 50000);
        }).catch(function (err) {
          console.log('error occured' + err);
        }).done();
      });
    }

    //between a minute and a minute and a half
    function genRandomNumber (){
      return Math.floor(Math.random() * 90000) + 60000
    }



    function getUpdates(){
      console.log('get updates hit');
      client.getUpdates(function(err, data){
        console.log('updates are', data);
        socket.emit('updates', data);
        respHandler.apply(null, arguments);
      });
    }
    function getHistory(){
      console.log('get history hit');
      client.getHistory(respHandler);
    }

    function respHandler (err, data) {
      if(err) return console.log('OH SHIT>>>',err);
      //console.log('history is', data);
      socket.emit('updates', data);
      if(!data) {
        return;
      }
      var matches = data.matches;
      var blockes = data.blocks;
      if(!matches.length) {
        return;
      }
      _.each(matches, function(match,i){
        console.log('Loooking...', i);
        if(match && match.messages.length){
          if(match.messages[match.messages.length-1].from == '548625e25bb003da72be1fbe') {
            return;
          }
          console.log('sending message to', match.person.name, match.messages[match.messages.length-1].message);
          var obj = {
            name:match.person.name,
            message:match.messages[match.messages.length-1].message,
            id:match._id
          };
          generateMessage(obj);
          return false;
        }
      });

    }


    function getUser(){
      console.log()
    }

    function generateMessage (data){
      var options = {
        url: 'http://ct-slackbot.herokuapp.com/tinderbot',
        json: data
      };

      request.post(options, function(err, res1, body) {
        console.log('chat bot response', body);
        if(err) {
          console.log('FUCKKKKKK>>>',arguments);
          return false;
        }

        sendMessage(data.id,body.text);
      });
    }

    function startTindering() {
      var defer = Q.defer();
      getRecommendation().then(function (peeps) {
        swipeRight(peeps).then(function () {
          defer.resolve();
        });
      });
      return defer.promise;
    }

    function swipeRight(reccomendations) {
      var defer = Q.defer();
      var userIds = _.pluck(reccomendations, '_id');
      if(userIds.length) {
        socket.emit('matches', reccomendations);
        matchesFound++;
        console.log('MATCHES FOUND!!!!', matchesFound);
        console.log('total users', userIds.length);
      }
      _.each(userIds, function (id) {
        //setInterval(function () {
          client.like(id, function (err, matchInfo) {
            console.log('liking person');
            if (err) {
              console.log('err is', err);
              defer.reject(err);
            }
            if(matchInfo && matchInfo.match) {
              console.log('match info is', matchInfo);
              sendMessage(matchInfo.match._id , 'Hi ;)');
            }else{
              //console.log('result was null');
            }

          });
        //}, genRandomNumber());
      });
      defer.resolve();
      return defer.promise;
    }

    function updatePosition(lon, lat){
      var defer = Q.defer();
      client.updatePosition(lon, lat, function(){
        defer.resolve();
      });
      return defer.promise;
    }


    function sendMessage(id, msg){
      client.sendMessage(id, msg, function (err, data) {
        console.log('send message hit', msg);
        console.log('result of message', err, data);
      });
    }

    function authorize(access, user) {
      var defer = Q.defer();
      client.authorize(access, userId, function () {
        defer.resolve();
      });
      return defer.promise;
    }


    function getRecommendation() {
      var defer = Q.defer();
      var defaults = client.getDefaults();
      var recs_size = 100;
      //console.log('defaults is',defaults);
      client.getRecommendations(recs_size, function (err, data) {
        if (err) {
          console.log('err is', err);
          defer.reject(err);
        }

        if(data) {
          //console.log('Recommendations are', data);
          defer.resolve(data.results);
        }
      });
      return defer.promise;
    }

  });
});









