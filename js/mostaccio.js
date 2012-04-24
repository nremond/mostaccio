var MUSTACHES = [];

$(document).ready(function() {     
     // avoid scrolling the whole page/document
     document.addEventListener('touchmove', function(e) {
         e.preventDefault();  
     }, false);

     // launch face detection when a new image is loaded
     $("#largeImage").on("load", function() {
         var canvas,
             ctx;

         canvas = $("#smallCanvas").get(0);
         ctx = canvas.getContext("2d");

         // TODO
         canvas.width = 320;
         canvas.height = 240;

        /*if($(this).width() > $(this).height()){
            // translate context to center of canvas
            ctx.translate(canvas.width / 2, canvas.height / 2);
            // rotate 90 degrees clockwise
            ctx.rotate(Math.PI / 2);  

            ctx.translate(-canvas.width / 2, -canvas.height / 2);            

            ctx.drawImage($(this).get(0), 0, 0,  canvas.height, canvas.width);          
        } else {*/
            ctx.drawImage($(this).get(0), 0, 0, canvas.width, canvas.height);

        /*}*/

         detectFace();
     });
 });
 
// constructor
function Mustache(domId, mustacheTemplateNumber, face) {
    this.transformations = {
        prevScale: 1,
        prevRotate: 0,
        translate: {x: 0, y: 0},
        scale: 1,
        rotate: 0
    };
    this.left = 0;
    this.top = 0;
    this.width = 0;
    this.height = 0;

    this.preventTranslate = false; // flag to prevent translations after a scale/rotate (2 finger gestures) when release one of the two fingers

    this.el = $('#mustacheTemplate').clone();
    this.replaceImg(mustacheTemplateNumber);
    this.el.attr('id', domId);

    this.face = face;
    this.el.on('load', $.proxy(this.onMustacheImgLoad, this));
}
 
Mustache.prototype = {
    removeDOM: function() {
        // remove mustache DOM element
        this.el.remove();
    },
    replaceImg: function(mustacheTemplateNumber) {
        this.el.attr('src', 'img/mustache-' + mustacheTemplateNumber + '.png');
    },
    onMustacheImgLoad: function() {
        var facePosition,
            faceTop,
            faceLeft,
            faceHeight,
            faceWidth,
            mustacheRatio;

        this.el.off('load');

        facePosition = this.face.position();
        faceTop = facePosition.top;
        faceLeft = facePosition.left;
        faceHeight = this.face.height();
        faceWidth = this.face.width();

        // anatomy lesson...
        mustacheRatio = 1; // all our mustaches are square... //this.el.width() / this.el.height();
        this.height = faceHeight / 1.2; // empirical value based on mustache-*.png image files
        this.width = this.height * mustacheRatio;
        this.top = faceTop + 4/5 * faceHeight - 1/3 * this.height;
        this.left = faceLeft + 1/2 * faceWidth - 1/2 * this.width;

        this.el.css({
            display: 'block',
            top: this.top,
            left: this.left,
            height: this.height,
            width: this.width
        });

        this.el.on('touchmove', $.proxy(this.onTouchMove, this));
        this.el.on('gesturechange', $.proxy(this.onGestureChange, this));
        this.el.on('gestureend', $.proxy(this.onGestureEnd, this));
        this.el.on('touchend', $.proxy(this.onTouchEnd, this));  

        this.el.appendTo('#picture');
    },
    onTouchEnd: function(e) {
        e.preventDefault();
        this.preventTranslate = false;
    },
    onGestureEnd: function(e) {
        e.preventDefault();
        this.preventTranslate = true;

        this.transformations.prevScale *= e.originalEvent.scale;                
        this.transformations.prevRotate += e.originalEvent.rotation;
    },
    onGestureChange: function(e) {
        var theta,
            lambda;

        e.preventDefault();
        preventTranslate = true; 

        this.transformations.scale = Math.max(e.originalEvent.scale * this.transformations.prevScale, 1);
        this.transformations.rotate = e.originalEvent.rotation + this.transformations.prevRotate;

        this.doCSSTransform();
    },
    onTouchMove: function(e) {
        var style;
        
        e.preventDefault();

        if(this.preventTranslate || (e.originalEvent.touches && e.originalEvent.touches.length !== 1)) {
            return;
        }

        if(e.originalEvent.touches && e.originalEvent.touches.length) {
            e = e.originalEvent.touches[0];
        } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
            e = e.originalEvent.changedTouches[0];
        }

        this.transformations.translate = {
            x: Math.floor(e.pageX - this.left - this.width/2),
            y: Math.floor(e.pageY - this.top - this.height/2)
        };

        this.doCSSTransform();
    },
    doCSSTransform: function() {
        var transform,
            t_translate,
            t_rotate,
            t_scale;

        // TODO: 3d transform to use hardware acceleration?
        t_translate = 'translate(' + this.transformations.translate.x + 'px, ' + this.transformations.translate.y + 'px) '; 
        t_scale = 'scale(' + this.transformations.scale + ') ';
        t_rotate = 'rotate(' + this.transformations.rotate + 'deg) ';
        transform = t_translate + t_rotate + t_scale;

        this.el.css({
            '-webkit-transform': transform,
            '-moz-transform': transform,
            'transform': transform
        });
    }
}

function reset() {
    var canvas,
        ctx;

    // remove image
    canvas = $("#smallCanvas").get(0);
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // remove faces
    $('.face').remove();

    MUSTACHES.forEach(function(mustache) {
        mustache.removeDOM();
    });
}

function onPhotoURISuccess(imageURI) {
    reset();
    document.getElementById('largeImage').src = imageURI;          
}

// Take picture using device camera
function capturePhoto() {
    // Don't retrieve image as base64-encoded string, it causes memory issues
    navigator.camera.getPicture(onPhotoURISuccess, consoleLog, {
        quality: 50, 
        destinationType: navigator.camera.DestinationType.FILE_URI, 
        sourceType: navigator.camera.PictureSourceType.CAMERA
    });
}

// load a picture from the photo library
function getPhotoFromLibrary() {
    navigator.camera.getPicture(onPhotoURISuccess, consoleLog, {
        quality: 50, 
        destinationType: navigator.camera.DestinationType.FILE_URI,
        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
    });
}

function detectFace() {
    $("#smallCanvas").faceDetection({
        complete:function(img, coords) {
            var i;

            for (i = 0; i < coords.length; i++) {
                $('<div>', {
                    'class':'face',
                    'css': {
                        'position': 'absolute',
                        'left': coords[i].positionX +'px',
                        'top': coords[i].positionY +'px',
                        'width': coords[i].width +'px',
                        'height': coords[i].height +'px'
                    }
                }).appendTo('#picture');
            }
        },
        error:function(img, code, message) {
            alert('Error: ' + message);
        }
    });
}

function debugPhoto(){
    onPhotoURISuccess("img/photo.jpg")
}

function showMustache(mustacheTemplateNumber) {
    if(MUSTACHES.length > 0){
        MUSTACHES.forEach(function(mustache){
            mustache.replaceImg(mustacheTemplateNumber); 
        });
    } else {
        loadMustache(mustacheTemplateNumber);
    } 
}

function loadMustache(mustacheTemplateNumber) {
    $('.face').each(function(i) {
        MUSTACHES.push(new Mustache('mustache' + i, mustacheTemplateNumber, $(this)))                                       
    });
}

function saveImageWithMustache() {
    var canvas,
        image,
        ctx;

    canvas = document.createElement("canvas");
    image = $('#largeImage');
    ctx = canvas.getContext('2d');

    canvas.width = image.width();
    canvas.height = image.height();

    ctx.drawImage(image.get(0), 0, 0);
    //ctx.drawImage($('#mustache0').get(0), 0, 0);

    try {
        window.plugins.SaveImage.saveImage(canvas.toDataURL().replace(/^([^,]+),/, ''));
    } catch(e) {
        consoleLog(e);
    }
}

function consoleLog(str) {
    if(console && typeof(console.log) === 'function') {
        console.log(str);
    } else {
        $('#console').text(str);
    }
}