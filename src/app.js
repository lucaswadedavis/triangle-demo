(function(){

  // credentials for the API - I built the thing
  // so I'm not too worried about what'll happen with these on Github
  var creds = {
    appID: '1541c5a2-b78d-48d0-9b41-1be7072d7c1b',
    jsKey: '6b0ef299-e3ce-479e-bc1d-e1b62df2c5ba'
  };
  
  // the app has:
  // views (v) which will actually manipulate the DOM
  // templates (t) which return DOM nodes (without touching the DOM itself)
  // and images (which I like to be able to get at through the app object)
  // it's also got an init method that fires when the body has loaded
  var app = {images:[], v: {}, t: {}};
  
  // executed on body.onload to create the initial DOM tree and fetch images
  app.init = function () { 
    app.v.layout();
    getImages();
    getImages();
    getImages();
  };

  // returns the header DOM node with getImage plus button
  app.t.header = function () {
    var header = el('div', 'header');
    header.textContent = 'Lightbox Demo';
    header.appendChild(app.t.getImageButton());
    return header;
  };
 
  // returns the getImage plus button for the header
  app.t.getImageButton = function () {
    var button = el('span', 'header-plus');
    button.textContent = '+';
    button.addEventListener('click', getImages);
    return button;
  };
 
  // returns the div where all our image cells will be appended
  app.t.imageCellSection = function () {
    return el('div', 'image-cell-section');
  };

  // takes an src and (optional) id, and returns an img DOM node
  // worth noting: that src can be a base64 encoded image, or an image url
  app.t.image = function (src, id) {
    var img = el('img');
    img.setAttribute('id', id);
    img.setAttribute('src', src);
    return img;
  };

  // takes an image DOM node and title string
  // and returns the 'cell' or 'card' that the image will be injected into
  app.t.imageCell = function (imageNode, imageTitle) {
    var cell = el('div', 'image-cell');
    cell.appendChild(imageNode);

    var title = el('p', 'image-title');
    title.textContent = imageTitle || 'Lightbox Demo Title';
    cell.appendChild(title);
    return cell;
  };

  app.t.lightbox = function (imageTitle, imageNode, closeCallback) {
    var lightbox = el('div', 'lightbox');
    var close = app.t.lightboxElement('lightbox-close', 'X', closeCallback);
    var title = app.t.lightboxTitle(imageTitle);
    append(lightbox, close, imageNode, title);
    return lightbox;
  };

  // takes a class name, text, and a callback
  // and returns a clickable div DOM node with that text and class added
  app.t.lightboxElement = function(className, textContent, callback) {
    var button = el('div', className);
    button.textContent = textContent;
    button.addEventListener('click', callback);
    return button;
  };

  // takes a string and returns the title paragraph tag DOM node
  app.t.lightboxTitle = function (imageTitle) {
    var title = el('p');
    title.textContent = imageTitle || 'Lightbox Demo Title';
    return title;
  };

  // takes a string and returns a failure notification div DOM node
  app.t.failureNotification = function (message, notificationClass) {
    var notification = el('div', notificationClass || 'xhr-failure-notification');
    notification.textContent = message || 'it seems like there\'s a problem';
    return notification;
  };

  // adds the header and image cell section to document.body - you can read
  app.v.layout = function () {
    append(document.body, app.t.header(), app.t.imageCellSection());
  };

  // notifies user on XHR request failure
  app.v.xhrFailureNotification = function (message) {
    var notification = app.t.failureNotification(message);
    append(document.body, notification);
    setTimeout(function () {
      remove(notification);
    }, 6000);
  };

  // adds images 'cells' to the 'images section'
  app.v.addImage = function (image) {
    var imageNode = app.t.image(image.src);
    imageNode.addEventListener('click', function () {
      app.v.lightbox(app.t.image(image.src, image.id), image.title, app.images);
    });

    append(
      document.getElementsByClassName('image-cell-section')[0],
      app.t.imageCell(imageNode, image.title)
    );
  };

  // creates the lightbox DOM nodes and appends them to document.body
  // takes advantage of JS closures to handle adding and removing events
  app.v.lightbox = function (imageNode, imageTitle, imageCollection) {
    var shadowbox = app.t.lightboxElement('shadowbox', '', closeLightbox); 
    var lightbox = app.t.lightbox(imageTitle, imageNode, closeLightbox);
    var backButton = app.t.lightboxElement('lightbox-back-button', '<', regress);
    var forwardButton = app.t.lightboxElement('lightbox-forward-button', '>', progress);
    
    append(document.body, shadowbox, backButton, forwardButton, lightbox);
  
    position(); 
    window.onresize = position;
    window.addEventListener('keydown', navigateOnKeyDown);

    // repositions the lightbox and forward and back buttons
    // needed to keep things centered and responsive
    function position () {
      var lightboxWidth = getWidth(lightbox);
      var windowWidth = getWidth(document.body);
      var backButtonWidth = getWidth(backButton);
      var forwardButtonWidth = getWidth(forwardButton);
      var margin = 20;

      var lightboxLeft = (windowWidth - lightboxWidth) / 2;
      lightbox.style.left = lightboxLeft;
      backButton.style.left = lightboxLeft - backButtonWidth - 3 * margin;
      forwardButton.style.left = lightboxLeft + lightboxWidth + margin;
    };

    // for easy keyboard naviation using the arrow keys
    function navigateOnKeyDown (ev) {
      var keys = {rightArrow: 39, leftArrow: 37};
      if (ev.which === keys.rightArrow) {
        progress();
      } else if (ev.which === keys.leftArrow) {
        regress();
      }
    };
    
    // steps teh lightbox forwards in the collection
    function progress  () {
      for (var i = 0; i < imageCollection.length; i++) {
        if (imageNode.id === imageCollection[i].id && i < imageCollection.length - 1) {
            closeLightbox();
            var image = imageCollection[i + 1];
            app.v.lightbox(
                app.t.image(image.src, image.id),
                image.title,
                imageCollection
            );
            return;
        }
      }

      closeLightbox();
    };

    // steps the lightbox backwards in the collection
    function regress () {
      for (var i = 0; i < imageCollection.length; i++) {
        if (imageNode.id === imageCollection[i].id && i > 0) {
            closeLightbox();
            var image = imageCollection[i - 1];
            app.v.lightbox(app.t.image(image.src, image.id), image.title, imageCollection);
            return;
        }
      }

      closeLightbox();
    };

    // removes the lightbox-associated DOM nodes and removes the keydown listener
    function closeLightbox () {
      window.removeEventListener('keydown', navigateOnKeyDown);
      remove(lightbox, backButton, forwardButton, shadowbox);
    };
  };


  // utility functions

  // xhr GET with authorization set to our credentials
  function get (url, success, error) {
    var req = new XMLHttpRequest();
    req.addEventListener('load', success);
    req.addEventListener('error', error);
    req.open('GET', url, true);
    req.responseType = 'json';
    req.setRequestHeader(
      'Authorization',
      'Basic ' + btoa(creds.appID + ':' + creds.jsKey)
    );
    req.send();    
  };

  // takes an int to request an icon from the server of pixelsWide width
  // right now the server only returns a single image as a base64 encoded string
  // but it could be trivially changed to return image urls, and lots of them.
  function getImages (pixelsWide) {
    var url = 'http://104.131.154.14:3000/' + (pixelsWide || 500);
    
    var success = function (e) {
      var images = e.target.response.images; 
      for (var i = 0; i < images.length; i++) {
        var image = new Image(images[i]);
        app.images.push(image);
        app.v.addImage(image);
      }
    };

    var error = function (e) {
      app.v.xhrFailureNotification('something went wrong');
    };

    get(url, success, error);
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

  // returns a fake title for our images
  function fakeTitle () {
    var consonants = 'bcdfghjklmnpqrstvwxyz';
    var vowels = 'aeiou';
    var patterns = 'CVC VC CV CVVCV CVCV VCVVC CVCCVC';
    
    var n = 1 + Math.floor(Math.random() * 3);
    var words = [];
    for (var i = 0; i < n; i++) {
      words.push(sample(patterns.split(' ')));
    }

    return words.join(' ').replace(/[CV]/g, function(x) {
      var c = sample(consonants);
      var v = sample(vowels);
      return x === 'C' ? c : v;
    });
  };

  // Constructor for image instances
  function Image (src) {
    this.src = src;
    this.id = uuid();
    this.title = fakeTitle();
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

})()
