'use strict';

chrome.storage.sync.get(['hackerMuseUser', 'hackerMuseUserData', 'hackerMuseRecentPostData'], function(data){
  console.log('get hackerMuseUser from Content');
  console.log(data);
});

chrome.runtime.sendMessage({method: 'setHackerMuseUser', user: 'JDoty'}, function(response) {
  console.log('response from emitted event is: ', response.response);
});

var background, modal, on, appendModal, detachModal, toggleModal;
var view, textfield, button, label, flipper, flipped, image;
var pointFlipper, pointFlipped, pointLabel;
var commentFlipper, commentFlipped, commentLabel;
var userLabel, mainLabel;

background = document.createElement('div');
background.classList.add('hn-muse-background');

modal = document.createElement('div');
modal.classList.add('hn-muse-modal');

/* user view */

view = document.createElement('div');
view.classList.add('hn-muse-view');
view.classList.add('hn-muse-dark');

textfield = document.createElement('input');
textfield.setAttribute('type', 'text');
textfield.classList.add('hn-muse-textfield');

button = document.createElement('button');
button.classList.add('hn-user-button');


label = document.createElement('h1');
label.innerHTML = 'Which user do you want to track?';
label.classList.add('hn-muse-label');

modal.appendChild(view);
view.appendChild(textfield);
view.appendChild(button);
view.appendChild(label);

flipper = document.createElement('div');
flipper.classList.add('hn-karma-flipper');

flipped = document.createElement('div');
flipped.classList.add('hn-muse-flipped');

image = document.createElement('img');
image.src = chrome.extension.getURL('/images/Y.svg');
image.classList.add('hn-muse-logo');

modal.appendChild(flipper);
flipper.appendChild(image);
flipper.appendChild(flipped);

function track() {
  // change view background
  view.classList.remove('hn-muse-dark');
  view.classList.add('hn-muse-light');

  // remove textfield
  textfield = view.removeChild(textfield);

  // repurpose label
  label.innerHTML = 'POST';
  label.classList.remove('hn-muse-label');
  label.classList.add('hn-muse-post');

  // repurpose image
  image = flipper.removeChild(image);
  image.src = chrome.extension.getURL('/images/link.svg');
  image.classList.remove('hn-muse-logo');
  image.classList.add('hn-muse-link');
  view.appendChild(image);

  // repurpose button
  button.classList.remove('hn-user-button');
  button.classList.add('hn-track-button');
  button.removeEventListener('click', track);

  // user
  userLabel = document.createElement('h1');
  userLabel.classList.add('hn-user-label');
  userLabel.innerHTML = textfield.value;
  modal.appendChild(userLabel);

  // karma
  mainLabel = document.createElement('h1');
  mainLabel.classList.add('hn-main-label');
  mainLabel.innerHTML = 'KARMA';
  modal.appendChild(mainLabel);

  // point
  pointFlipper = document.createElement('div');
  pointFlipper.classList.add('hn-point-flipper');

  pointFlipped = document.createElement('div');
  pointFlipped.classList.add('hn-muse-flipped');

  pointLabel = document.createElement('h1');
  pointLabel.classList.add('hn-point-label');
  pointLabel.innerHTML = 'POINTS';

  view.appendChild(pointFlipper);
  pointFlipper.appendChild(pointFlipped);
  view.appendChild(pointLabel);

  // comment
  commentFlipper = document.createElement('div');
  commentFlipper.classList.add('hn-comment-flipper');

  commentFlipped = document.createElement('div');
  commentFlipped.classList.add('hn-muse-flipped');
  
  commentLabel = document.createElement('h1');
  commentLabel.classList.add('hn-comment-label');
  commentLabel.innerHTML = 'COMMENTS';

  view.appendChild(commentFlipper);
  commentFlipper.appendChild(commentFlipped);
  view.appendChild(commentLabel);
}

function select() {

}

button.addEventListener('click', track);

appendModal = function() {
  // blur everything in the background
  Array.prototype.forEach.call(document.body.children, function(child) {
    child.classList.add('hn-muse-blur');
  });

  // add background overlay
  document.body.appendChild(background);

  // append modal
  document.body.appendChild(modal);
  window.getComputedStyle(modal).transform; // make sure transform is loaded
  modal.classList.add('hn-muse-on');
};

detachModal = function() {
  // remove blur from everything in the background
  Array.prototype.forEach.call(document.body.children, function(child) {
    child.classList.remove('hn-muse-blur');
  });

  // remove background overlay
  background = document.body.removeChild(background);

  // remove modal
  modal = document.body.removeChild(modal);
  modal.classList.remove('hn-muse-on');
};

toggleModal = function(message) {
  if (!message.modal) appendModal();
  else detachModal();
  on = !message.modal;
};

on = false;

// add listener for escape key
document.addEventListener('keyup', function(e) {
  if(e.keyCode === 27) {
    if (on) chrome.runtime.sendMessage({modal: on}, toggleModal);
  }
});

// add modal click listener
background.addEventListener('click', function() {
  chrome.runtime.sendMessage({modal: on}, toggleModal);
});

// add background script listener
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
  toggleModal(message);
  sendResponse({modal: on});
});
