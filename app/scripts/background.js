'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('previousVersion', details.previousVersion);
});

//firebase api url
var items = new Firebase('https://hacker-news.firebaseio.com/v0/item');
var users = new Firebase('https://hacker-news.firebaseio.com/v0/user');

//get user
var getUser = function(success, unset, context){
  chrome.storage.sync.get('hackerMuseUser', function(data){
    console.log('data inside getUser is: ', data);
    var keys = Object.keys(data);
    if (keys.length === 0){
      unset.call(context);
    } else {
      success.call(context || null, data.hackerMuseUser);
    }
  });
};

//set user
var setUser = function(userName, cb, context){
  chrome.storage.sync.set({'hackerMuseUser': userName}, function(){
    if (cb !== undefined){
     cb.call(context || null);
    }
  });
};

//callback is invoked whenever change to user occurs
//failure is invoked if no data found
var listenToUser = function(user, success, failure){
  users.child(user).on('value', function(data){
    if (data.val() === null) failure();
    else success(data.val());
  });
};

var removeUserListener = function(user, cb){
  if ( cb ) {
    users.child(user).off('value', cb);
  }
  else { 
    users.child(user).off('value');
  }
};

//callback is invoked whenever change to user's most recent post occurs
//or if there is a new most recent post
//failure is invoked if no data found
var mostRecentPost = function(user, success, failure){
  users.child(user).on('value', function(data){
    var submissions, curr;
    data = data.val();
    if (data === null) failure();
    else {
      submissions = data.submitted;
      console.log('data.submitted: ', data.submitted);
      curr = 0;
      (function getPost(){
        if (curr >= submissions.length) failure();
        else {
          items.child(submissions[curr]).on('value', function(data){
            data = data.val();
            if (data !== null && data.type === 'story'){
              success(data);
            }
            else {
              curr++;
              getPost();
            }
          });
        }
      })();
    }
  });
};

var removePostListeners = function(user){
  users.child(user).on('value', function(data){
    data = data.val();
    if ( data !== null ){
      console.log('inside removepost listeners data is: ', data);
      var submissions  = data.submitted;
      for ( var i = 0; i < submissions.length; i++ ){
        items.child(submissions[i]).off('value');
      }
    }
    users.child(user).off('value');
  });
};


var on;

on = false;

chrome.browserAction.onClicked.addListener(function(tab){
  chrome.tabs.sendMessage(tab.id, {modal: on}, function(response) {
    on = response.modal;
  });
});


//add listener for setting user
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  console.log('message received in background.js');
  //route message
  if ( message.method === 'setHackerMuseUser' ){
    //check to see if a user is already set 
    getUser(function(name){
      console.log('name is: ', name);


      //if user exists and setting to a different name
      if (name !== message.user){
        //remove all existing callbacks
        removePostListeners(name);
        removeUserListener(name);

        //and register cb's for new user
        setUser(message.user, function(){
          listenToUser(message.user, function(data){
            chrome.storage.sync.set({'hackerMuseUserData': data});
          });
          mostRecentPost(message.user, function(data){
            chrome.storage.sync.set({'hackerMuseRecentPostData': data});
          });
        });
        //send response indicating what work was done
        sendResponse({response: 'user changed'});
      }
    }, function(){
      //if no user exists
      //then set user and register firebase cb's
      setUser(message.user, function(){
          listenToUser(message.user, function(data){
            chrome.storage.sync.set({'hackerMuseUserData': data});
          });
          mostRecentPost(message.user, function(data){
            chrome.storage.sync.set({'hackerMuseRecentPostData': data});
          });
      });
      //send response indicating what work was done
      sendResponse({response: 'user set'});
    });
  }
});
