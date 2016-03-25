(function () {

  var config = {
    url: 'https://victor.bettercompany.co',
    messagesPath: '',
    sessionPath: '',
    sessionToken: '',
    user: {
      email: '',
      password: ''
    }
  };

  var t = {
    titleHeader: function (str) {
      var c = el('div', 'title');
      var title = el('h1');
      title.textContent = 'Triangle';

      var subtext = el('p', 'subtext');
      subtext.textContent = 'Chat with interesting people in your city.';

      append(c, title, subtext);
      return c;
    },

    loginContainer: function (fn) {
      var c = el('div', 'login');
      
      var emailInput = el('input', 'email');
      emailInput.setAttribute('type', 'email');
      emailInput.setAttribute('placeholder', 'Email');

      var passwordInput = el('input', 'password');
      passwordInput.setAttribute('type', 'password');
      passwordInput.setAttribute('placeholder', 'Password');
      
      var submitButton = el('button');
      submitButton.textContent = 'Login';
      submitButton.addEventListener('click', function () {
        var email = emailInput.value;
        var password = passwordInput.value;
        fn(email, password);
      });

      append(c, emailInput, passwordInput, submitButton);
      return c;
    },

    message: function (message) {
      var m = el('div', 'message');
      
      var author = el('div', 'author');
      author.textContent = message.author;

      var content = el('div', 'message-content');
      content.textContent = message.content;

      append(m, author, content);
      return m;
    },

    logout: function (fn) {
      var logoutIcon = el('img', 'logout');
      logoutIcon.setAttribute('src', './assets/btn_logout.png');
      logoutIcon.addEventListener('click', function () {
        fn();
      });
      return logoutIcon;
    },

    postMessage: function (fn) {
      var postMessageIcon = el('img', 'post-message-icon');
      postMessageIcon.setAttribute('src', './assets/btn_compose@2x.png');
      postMessageIcon.addEventListener('click', fn);
      return postMessageIcon;
    }
  };

  window.config = config;

  var app = {messages: [], v: {}, t: {}};

  app.init = function () {
    app.v.initialLayout();
  };

  app.v.clear = function () {
    document.body.innerHTML = '';
  };

  app.v.initialLayout = function () {
    app.v.clear();
    var appContainer = el('div', 'app');
    var title = t.titleHeader();
    var loginContainer = t.loginContainer(login);
    append(appContainer, title, loginContainer);
    append(document.body, appContainer);
  };

  app.v.messages = function (messages) {
    app.v.clear();
    var appContainer = el('div', 'app');
    append(appContainer, t.logout(logout));
    for (var i = 0; i < messages.length; i++) {
      append(appContainer, t.message(messages[i])); 
    }
    append(document.body, appContainer);
    append(document.body, t.postMessage(app.v.postMessage));
  };


  app.v.postMessage = function () {
    var shadowbox = el('div', 'shadowbox');
    shadowbox.addEventListener('click', closeLightbox);
    
    var postMessageContainer = el('div', 'post-message');

    var lightbox = el('textarea');
    lightbox.setAttribute('placeholder', 'What do you want to say?');

    var postButton = el('button');
    postButton.textContent = 'Post';
    postButton.addEventListener('click', function () {
      var message = lightbox.value.trim();
      console.log(message);
      if (message) postNewMessage(message);
      closeLightbox();
    });

    append(postMessageContainer, lightbox, postButton)
    append(document.body, shadowbox, postMessageContainer);
 
    position(); 
    window.onresize = position;

    // repositions the lightbox and forward and back buttons
    // needed to keep things centered and responsive
    function position () {
      var lightboxWidth = getWidth(postMessageContainer);
      var windowWidth = getWidth(document.body);

      var lightboxLeft = (windowWidth - lightboxWidth) / 2;
      postMessageContainer.style.left = lightboxLeft;
    };

    // removes the lightbox-associated DOM nodes
    function closeLightbox () {
      window.removeEventListener('onresize', position);
      remove(shadowbox, postMessageContainer);
    };

  };
  // xhr tools

  // xhr GET 
  function getAuthenticationPath (url, success, error) {
    var req = new XMLHttpRequest();
    req.addEventListener('load', function (res) {
      var authPath = res.target.response['authenticate-url'];
      postUserCredentials(url + authPath);
    });
    req.addEventListener('error', function (err) {
      console.log(error);
    });
    req.open('GET', url, true);
    req.responseType = 'json';
    req.setRequestHeader('Accept', 'application/json; scheme=root; version=0');
    req.send();    
  };

  // xhr POST 
  function postUserCredentials (url) {
    var serializedData = JSON.stringify(config.user);
    console.log(serializedData);
    var req = new XMLHttpRequest();
    req.addEventListener('load', function (res) {
      var sessionToken = this.getResponseHeader('x-session-token');
      var sessionPath = this.getResponseHeader('location');
      config.sessionToken = sessionToken;
      config.sessionPath = sessionPath;
      getSessionDocument(config.url + config.sessionPath);
    });
    req.addEventListener('error', function (err) {
      console.log(err); 
    });
    req.open('POST', url, true);
    req.responseType = 'json';
    req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8; scheme=authentication; version=0');
    req.send(serializedData);    
  };


  // xhr GET 
  function getSessionDocument (url) {
    var req = new XMLHttpRequest();
    req.addEventListener('load', function (res) {
      console.log(res.target.response);
      config.messagesPath = res.target.response['messages-url'];
      getListOfMessages(config.url + config.messagesPath);
    });
    req.addEventListener('error', function (err) {
      console.log(err); 
    });
    req.open('GET', url, true);
    req.responseType = 'json';
    //req.setRequestHeader('host', 'localhost:8008');
    req.setRequestHeader('x-session-token', config.sessionToken);
    req.setRequestHeader('Accept', 'application/json; scheme=session; version=0');
    req.send();    
  };

  // xhr GET 
  function getListOfMessages (url) {
    var req = new XMLHttpRequest();
    req.addEventListener('load', function (res) {
      var messages = res.target.response.messages.reverse();
      app.messages = messages;
      app.v.messages(messages);
    });
    req.addEventListener('error', function (err) {
      console.log(err); 
    });
    req.open('GET', url, true);
    req.responseType = 'json';
    req.setRequestHeader('x-session-token', config.sessionToken);
    req.setRequestHeader('Accept', 'application/json; scheme=messages; version=0');
    req.send();    
  };  

  // xhr POST 
  function postNewMessage (messageContent) {
    var serializedData = JSON.stringify({content: messageContent});
    var url = config.url + config.messagesPath;
    var req = new XMLHttpRequest();
    req.addEventListener('load', function (res) {
      getListOfMessages(config.url + config.messagesPath);
    });
    req.addEventListener('error', function (err) {
      console.log(err); 
    });
    req.open('POST', url, true);
    req.responseType = 'json';
    req.setRequestHeader('x-session-token', config.sessionToken);
    req.setRequestHeader('Content-Type', 'application/json; scheme=message-content; version=0');
    req.send(serializedData);    
  };


  function login (email, password) {
    config.user.email = email;
    config.user.password = password;
    getAuthenticationPath(config.url);
  };


  function logout () {
    config.user.email = '';
    config.user.password = '';
    app.v.initialLayout();
  };

  // utility functions
 
  function XHRGet (url, success, error) {
    var req = new XMLHttpRequest();
    req.addEventListener('load', success);
    req.addEventListener('error', error);
    req.open('GET', url, true);
    req.responseType = 'json';
    return req;
  };
 
  // like underscore's sample, takes an array or string
  // and returns a randomly selected element from the collection
  function sample (arrayOrString) {
    return arrayOrString[Math.floor(Math.random() * arrayOrString.length)];
  };

  // returns a uuid string
  // taken from stackoverflow (http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript) 
  function uuid () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }); 
  };

  // takes a tag and any number of classes to add as extra arguments
  // returns a DOM node of that tag type with those classes
   function el (tag) {
    var el = document.createElement(tag || 'div');
    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        el.classList.add(arguments[i]);
      }
    }
    return el;
  };

  // takes a target DOM node and any number of additional DOM nodes
  // all DOM nodes after the first will be appended to the target
  function append (target) {
    for (var i = 1; i < arguments.length; i++) {
      target.appendChild(arguments[i]);
    }
  };

  // removes all DOM nodes passed as arguments
  function remove () {
    if (!arguments.length) return;
    for (var i = 0; i < arguments.length; i++) {
      var node = arguments[i];
      node.parentNode.removeChild(node);
    }
  };

  // takes a DOM node and returns it's width in pixels
  function getWidth (node) {
    return parseInt(window.getComputedStyle(node).width, 10);
  };
    
    window.app = app;
})();
