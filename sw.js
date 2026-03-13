const CACHE_NAME = "motika-v1";

const urlsToCache = [

"/Alexa/",
"/Alexa/index.html",
"/Alexa/style.css",
"/Alexa/script.js"

];

self.addEventListener("install", event => {

event.waitUntil(

caches.open(CACHE_NAME)
.then(cache => cache.addAll(urlsToCache))

);

});

self.addEventListener("fetch", event => {

event.respondWith(

caches.match(event.request)
.then(response => {

return response || fetch(event.request);

})

);

});