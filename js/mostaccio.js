var TRANSFORMATIONS = {},
     preventTranslate = false; // flag to prevent translations after a scale/rotate (2 finger gestures) when release one of the two fingers
 
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

 function reset() {
     var canvas,
         ctx;

     // remove image
     canvas = $("#smallCanvas").get(0);
     ctx = canvas.getContext("2d");
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     
     // remove faces
     $('.face').remove();

     // remove mustaches
     $('.mustache[id!=mustacheTemplate]').remove();
     
     // reset transformations
     TRANSFORMATIONS = {};
 }
 
 function onPhotoURISuccess(imageURI) {
     var largeImage;
     
     reset();
     
     // Get image handle
     largeImage = document.getElementById('largeImage');
     
     // Show the captured photo
     // The inline CSS rules are used to resize the image
     largeImage.src = imageURI;          
 }
 
 // Take picture using device camera
 function capturePhoto() {
     // Don't retrieve image as base64-encoded string, it causes memory issues
     navigator.camera.getPicture(onPhotoURISuccess, consoleLog, {
         quality: 50, 
         destinationType: navigator.camera.DestinationType.FILE_URI, 
         sourceType: navigator.camera.PictureSourceType.CAMERA });
 }
 
 // load a picture from the photo library
 function getPhotoFromLibrary() {
     navigator.camera.getPicture(onPhotoURISuccess, consoleLog, { quality: 50, 
                                 destinationType: navigator.camera.DestinationType.FILE_URI,
                                 sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY });
 }
 
 function detectFace() {
     $("#smallCanvas").faceDetection({
         complete:function(img, coords) {
             for (var i = 0; i < coords.length; i++) {
                 $('<div>', {
                     'class':'face',
                     'css': {
                         'position':	'absolute',
                         'left':		coords[i].positionX +'px',
                         'top':		coords[i].positionY +'px',
                         'width': 	coords[i].width		+'px',
                         'height': 	coords[i].height	+'px'
                     }
                 })
                 .appendTo('#picture');
             }
         },
         error:function(img, code, message) {
             alert('Error: '+message);
         }
     });
 }
 
 function debugPhoto(){
     onPhotoURISuccess("img/photo.jpg")
 }
             
 function showMustache(mustacheNumber) {
     var mustaches;
     
     mustaches = $('.mustache[id!=mustacheTemplate]');
     if(mustaches.length > 0){
         mustaches.each(function(){
            $(this).attr('src', 'img/mustache-' + mustacheNumber + '.png'); 
         });
     } else {
         loadMustache(mustacheNumber);
     } 
 }
             
 function loadMustache(mustacheNumber) {
     $('.face').each(function(i) {
         var mustache,
             origMustache,
             face;
             
         // create a mustache "instance"
         origMustache = $('#mustacheTemplate');
         
         mustache = origMustache.clone();
         mustache.attr('src', 'img/mustache-' + mustacheNumber + '.png');

         face = $(this);
         mustache.on('load', function() {
             onMustacheImgLoad(mustache, face, i);
         });                                       
     });
 }
 
 function onMustacheImgLoad(mustache, face, i) {
     var facePosition,
         faceTop,
         faceLeft,
         faceHeight,
         faceWidth,
         mustacheWidth,
         mustacheHeight,
         mustacheTop,
         mustacheLeft,
         mustacheRatio;
                             
     mustache.off('load');
                
     facePosition = face.position();
     faceTop = facePosition.top;
     faceLeft = facePosition.left;
     faceHeight = face.height();
     faceWidth = face.width();
     
     // anatomy lesson...
     mustacheRatio = 1; // all our mustaches are square... //mustache.width() / mustache.height();
     mustacheHeight = faceHeight / 1.2; // empirical value based on mustache-*.png image files
     mustacheWidth = mustacheHeight * mustacheRatio;
     mustacheTop = faceTop + 4/5 * faceHeight - 1/3 * mustacheHeight;
     mustacheLeft = faceLeft + 1/2 * faceWidth - 1/2 * mustacheWidth;
     
     mustache.css({
         display: 'block',
         top: mustacheTop,
         left: mustacheLeft,
         height: mustacheHeight,
         width: mustacheWidth
     });

     mustache.on('mousemove touchmove', onTouchMove);
     mustache.on('gesturechange', onGestureChange);
     mustache.on('gestureend', onGestureEnd);
     mustache.on('touchend', onTouchEnd);  
     
     mustache.appendTo('#picture');
     mustache.attr('id', 'mustache' + i);       
 }
 
 function onTouchEnd(e) {
     e.preventDefault();
     preventTranslate = false;
 }
 
 function onGestureEnd(e) {
     var mustacheId,
         trans;
     
     e.preventDefault();
     preventTranslate = true;
     
     mustacheId = e.target.id;
     trans = TRANSFORMATIONS[mustacheId];
     
     trans.prevScale = trans.prevScale || 1;                    
     trans.prevScale *= e.originalEvent.scale;
     
     trans.prevRotate = trans.prevRotate || 0;                    
     trans.prevRotate += e.originalEvent.rotation;
 }
 
 function onGestureChange(e) {
     var theta,
         lambda,
         mustacheId,
         trans,
         scale,
         rotation;
     
     e.preventDefault();
     preventTranslate = true;
     
     mustacheId = e.target.id;
     trans = TRANSFORMATIONS[mustacheId];
     
     scale = trans && trans.prevScale ? trans.prevScale : 1;     
     rotation = trans && trans.prevRotate ? trans.prevRotate : 0;   
     
     lambda = e.originalEvent.scale * scale;
     theta = e.originalEvent.rotation + rotation;
     
     doCSSTransform(mustacheId, null, Math.max(lambda, 1), theta);
 }

 function onTouchMove(e) {
     var mustacheId,
         el;
 
     e.preventDefault();
 
     if(preventTranslate || (e.originalEvent.touches && e.originalEvent.touches.length > 1)){
         return;
     }
 
     if(e.originalEvent.touches && e.originalEvent.touches.length) {
         e = e.originalEvent.touches[0];
     } else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
         e = e.originalEvent.changedTouches[0];
     }
     
     mustacheId = e.target.id;
     
     el = window.getComputedStyle(document.getElementById(mustacheId), null);
     
     doCSSTransform(mustacheId, {
         x: Math.floor(e.pageX - pxToNumber(el.left) - pxToNumber(el.width)/2),
         y: Math.floor(e.pageY - pxToNumber(el.top) - pxToNumber(el.height)/2)
     });
 }
 
 function pxToNumber(pxValue) {
     return Number(pxValue.replace('px','')); 
 }
 
 function doCSSTransform(id, translate, scale, rotate) {
     var transform,
         t,
         t_translate,
         t_rotate,
         t_scale;
     
     if(!TRANSFORMATIONS[id]) {
         TRANSFORMATIONS[id] = {};
     }
     t = TRANSFORMATIONS[id];
     
     if(translate) {
         t.translate = translate;
     }
     if(scale) {
         t.scale = scale;
     }
     if(rotate) {
         t.rotate = rotate;
     }
     
     // TODO: 3d transform to use hardware acceleration?
     t_translate =  t.translate ? 'translate(' + t.translate.x + 'px, ' + t.translate.y + 'px) ' : ' '; 
     t_scale = t.scale ? 'scale(' + t.scale + ') ' : ' ';
     t_rotate = t.rotate ? 'rotate(' + t.rotate + 'deg) ' : ' ';
     transform = t_translate + t_rotate + t_scale;

     $('#' + id).css({
         '-webkit-transform': transform,
         '-moz-transform': transform,
         'transform': transform
     });
 }
 
 // TODO
 function saveImageWithMustache() {
     var canvas = $("#largeCanvas"),
         c = canvas.get(0),
         ctx = c.getContext("2d");
                     
     ctx.drawImage($('#largeImage').get(0), 0, 0);
     ctx.drawImage($('#mustache1').get(0), 0, 0);
     
     canvas.show();
 }
            
 function consoleLog(str) {
     if(console && typeof(console.log) === 'function') {
         console.log(str);
     } else {
         $('#console').text(str);
     }
 }