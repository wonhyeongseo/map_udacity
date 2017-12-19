var map;
var infoWindow;
var markers = [];
var vm;
var viewModel;
//locations list-would normally be in database
//current types: Education, Supermarket, Park
var myLocations = [{
name: "Homeplus",
type: "Supermarket",
latlngLoc: {
    lat: 36.507410,
    lng: 127.258948
}
}, {
name: "Sejong Lake Park",
type: "Park",
latlngLoc: {
    lat: 36.498608,
    lng: 127.271346
}
}, {
name: "Sejong National Library",
type: "Education",
latlngLoc: {
    lat: 36.498702,
    lng: 127.268319
}
}, {
name: "Lotte Hi-Mart",
type: "Supermarket",
latlngLoc: {
    lat: 36.497093,
    lng: 127.263325
}
}, {
name: "Wonsu Mountain (Korea)",
type: "Park",
latlngLoc: {
    lat: 36.516971,
    lng: 127.277627
}
}];

function initMap() {
// Create a styles array to use with the map.
var styles = [{
    featureType: 'water',
    stylers: [{
        color: '#19a0d8'
    }]
}, {
    featureType: 'administrative',
    elementType: 'labels.text.stroke',
    stylers: [{
        color: '#ffffff'
    }, {
        weight: 6
    }]
}, {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{
        color: '#e85113'
    }]
}, {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{
        color: '#efe9e4'
    }, {
        lightness: -40
    }]
}, {
    featureType: 'transit.station',
    stylers: [{
        weight: 9
    }, {
        hue: '#e85113'
    }]
}, {
    featureType: 'road.highway',
    elementType: 'labels.icon',
    stylers: [{
        visibility: 'off'
    }]
}, {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{
        lightness: 100
    }]
}, {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{
        lightness: -100
    }]
}, {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{
        visibility: 'on'
    }, {
        color: '#f0e4d3'
    }]
}, {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{
        color: '#efe9e4'
    }, {
        lightness: -25
    }]
}];
//create new map
map = new google.maps.Map(document.getElementById('map'), {
    center: {
        lat: 39.941932,
        lng: -75.152870
    },
    zoom: 12,
    styles: styles,
    mapTypeControl: false
});
//makes list clickable & ties together with markers
var Pin = function(data) {
    this.name = ko.observable(data.name);
    this.type = ko.observable(data.type);
};
var ViewModel = function() {
    var self = this;
    this.url = ko.observable();
    this.title = ko.observable();
    this.wikiLink = ko.observable();
    this.pinList = ko.observableArray([]);
    this.currentPin = ko.observable(this.pinList()[0]);
    // Modified filter function, original by Blake Watson on codepen
    self.myLocations = myLocations;
    self.selectedType = ko.observable("All");
    self.filteredmyLocations = ko.computed(function(pinItem) {
        var type = self.selectedType();
        console.log(self.selectedType);
        if (type === "All") {
            console.log(type);
            self.myLocations.forEach(function(myLocations) {
                if (myLocations.marker) myLocations.marker
                    .setVisible(true);
            });
            // iterate over self.myLocations & set marker to visible
            return self.myLocations;
        } else {
            var tempList = self.myLocations.slice();
            return tempList.filter(function(myLocation) {
                var match = myLocation.type === type;
                console.log(myLocation);
                myLocation.marker.setVisible(match);
                return match;
            });
        }
    });
    this.setPin = function(clickedPin) {
        largeInfoWindow.marker = null;
        self.currentPin(clickedPin);
        showInfoWindow(clickedPin.marker, largeInfoWindow);
        self.loadData(clickedPin.name);
    };
    // get wiki info
    this.loadData = function(name) {
        var wikiUrl =
            'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
            name + '&format=json&callback=wikiCallback';
        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",
            jsonp: "callback",
            success: function(response) {
                console.log(response)
                let wikiLink = 'No Wiki Info';
                if (response[3].length != 0) {
                    let url = response[3][0];
                    let title = response[0];
                    wikiLink = '<a href="' + url + '">Find out more about ' +
                        title + ' on Wikipedia<\/a>';
                }
                self.wikiLink(wikiLink);
            }
        }).fail(function(jqXHR, textStatus) {
            alert("Failed To Retrieve Wiki Info");
        });
    };
};
vm = new ViewModel();
ko.applyBindings(vm);
var largeInfoWindow = new google.maps.InfoWindow();
var bounds = new google.maps.LatLngBounds();
var defaultIcon = makeIcon('0091ff');
var highlightIcon = makeIcon('FFFF24');
//array of markers per location
function makeMarkers(i) {
    var position = myLocations[i].latlngLoc;
    var name = myLocations[i].name;
    var type = myLocations[i].type;
    var marker = new google.maps.Marker({
        map: map,
        position: position,
        name: name,
        type: type,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        id: i
    });
    vm.myLocations[i].marker = marker;
    markers.push(marker);
    marker.addListener('click', function() {
        showInfoWindow(this, largeInfoWindow);
        vm.loadData(name);
    });
    bounds.extend(markers[i].position);
    map.fitBounds(bounds);
    marker.addListener('mouseover', function() {
        this.setIcon(highlightIcon);
    });
    marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });
}
for (var i = 0; i < myLocations.length; i++) {
    makeMarkers(i);
    console.log(markers);
}
}
var loadError = function() {
console.log("Problem detected.");
window.alert("Problem detected.");
};
//populates info window on clicked marker
function showInfoWindow(marker, infoWindow) {
if (infoWindow.marker != marker) {
    infoWindow.setContent('');
    infoWindow.marker = marker;
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 1350);
    infoWindow.addListener('closeclick', function() {
        infoWindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    var getStreetView = function(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
                nearStreetViewLocation, marker.position);
            infoWindow.setContent('<div>' + marker.name +
                '<\/div><div id="pano"><\/div');
            var panoramaOptions = {
                position: nearStreetViewLocation,
                pov: {
                    heading: heading,
                    pitch: 30
                }
            };
            var panorama = new google.maps.StreetViewPanorama(document.getElementById(
                'pano'), panoramaOptions);
        } else {
            infoWindow.setContent('<div>' + marker.name + '<\/div>' +
                '<div>No Street View<\/div>');
        }
    };
    streetViewService.getPanoramaByLocation(marker.position, radius,
        getStreetView);
    infoWindow.open(map, marker);
}
}

function showPins() {
var bounds = new google.maps.LatLngBounds();
for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
}
map.fitBounds(bounds);
google.maps.event.addDomListener(window, 'resize', function() {
    map.fitBounds(bounds);
});
}

function hidePins() {
for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
}
}

function makeIcon(markerColor) {
var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' +
    markerColor + '|40|_|%E2%80%A2', new google.maps.Size(21, 34), new google
    .maps.Point(0, 0), new google.maps.Point(10, 34), new google.maps.Size(
        21, 34));
return markerImage;
}