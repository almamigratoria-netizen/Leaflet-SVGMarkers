# Leaflet-SVGMarkers

Provides pure SVG markers (no more DivIcons, no unstylable dataURL's) for Leaflet v2.  No dependacies (other than Leaflet v2).  Markers are styled by CSS and accept a modest range of options.  Surprisingly, on my laptop they render faster than standard markers, and are about 3 times as fast on my phone.  Your milage may vary.

Basically I wanted colorable markers that would take glyphs and couldn't find
a suitable plugin for Leaflet v2, so whipped this up.  

View the [demo](https://github.com/alamagratoria-netizen/Leaflet-SVGMarker/)

![Screenshot](./Screenshot.png "Screenshot")

## Usage
```js
import {Map, TileLayer} from 'leaflet';
import {SVGMarker} from "./SVGMarker.js";

const OSM = 'https://{s}.tile.osm.org/{x}/{y}/{z}.png';
const map = new Map("mapdiv").setView([52.5,13.4], null, 13);
new TileLayer(`${OSM}`).addTo(map);
new SVGMarker([52.5, 13.395]);
// bi-bank is from BootStrap Icons.
const newMarker = new SVGMarker([52.5, 13.405], {color: 'black', glyph: 'bi-bank'});
newMarker.addTo(map);
```

## Options
* `shape:`: 'square' or 'penta'.  Easily extensible, just add a path to the 'extra\_paths' object.
* `color:` sets the stroke and fill style attributes.  Only colors supported by CSS are accepted.
* `stroke:` sets the stroke attribute
* `fill:` sets the fill attribute 
* `dotColor:` sets the color of the dot in the marker
* `dotRadius:` sets the radius of the dot in the marker (defaults to 5)
* `style:` Embeds the passed string as a stylesheet in your SVGMarker 
icon.  You probably want to use this in conjunction with `class:`
* `glyph:` name of a glyph from a CSS you have loaded.
* `glyphPrefix:` Defaults to the name of the glyph up to the first '-'
* `glyphColor:` Defaults to `white`.
__glyphs tested with font-awesome 4.7, boxicons, bootstrap-icons 1.13.1__
* `class:` add a whitespace separated list of classes to the SVG element.
* `image:` SVG (string) or URL.  Adds a user supplied image to the SVG.
* `imageOpts:` attributes for the image.  Typically you should supply width and height (both default to 15, the standard Maki-icon size).  Supply x and y to center the image (although it will try to center with the information it has). 
* Any option not understood will try to be applied to the "style" attributes, which may or may not be what you want.

## The SVGMarkerUtil class
You can also import the SVGMarkerUtil class.  There are some potentially 
useful utility functions declared static so you can use them without invoking
an instance of the class.

## License
Distributed under the terms of the [MIT](https://opensource.org/license/mit) license.

