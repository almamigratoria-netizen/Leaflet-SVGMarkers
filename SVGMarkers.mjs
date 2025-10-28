// 
// SVGMarkers.js
//
// ESM for Leaflet v2 to create css styled SVG markers.
// No DivIcons, no <img> tags, no dependencies
// ... and so far no shadows, but I'm working on it.
//
// default export is the SVGMarker class.  
// also available are SVGIcon and SVGMarkerUtil
//
// This module was created not so much because I really like SVG's, but
// more so that I could learn a little bit about how SVG's work and a bit
// about extending leaflet v2
//

// Trust the importmap, I guess
import {Marker, Icon, LatLng, Util} from 'leaflet';

export class SVGMarker extends Marker {
    initialize(latlng, options) {
        this.name = SVGMarker;
        Util.setOptions(this, options);
        this.options.icon = new SVGIcon(options);
        this._latlng = new LatLng(latlng);
    }
}

//////////////////////////////////////////////////////////////////////
//
//                     User Serviceable Parts
//
//////////////////////////////////////////////////////////////////////
//
// This gets deserialized (turned from text into an SVGSVGElement) on 
// module load so changing this changes the default icon
const default_svgText = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" class="leaflet-zoom-animated leaflet-interactive leaflet-SVGIcon" style="width:25px">
  <g>
    <path d="M12.4 0C5.6 0-.02 5.76-.02 12.7-.02 15.12.4501 17.28 1.6 19.2L12.4 38.4 23.2 19.2C24.4 17.38 24.9 15.12 24.88 12.72 24.88 5.8 19.2 0 12.4 0z" />
    <circle class="markerDot" cx="12.5" cy="12.5" r="5"/>
  </g>
</svg>
`;

// NOTE:  If you add a new shape, be aware that all the 'shape' option does
//        is paste this value into the 'd' attribute of the <path> of a copy
//        of the default icon (defined above).
const extra_paths = {
    square: 'M21.44 0H3.66C1.70 0 0.10 1.87 0.10 4.18V24.03 C0.10 26.33 1.70 28.2 3.66 28.2H8.11L12.54 41L17 28.2H21.45C23.41 28.2 25 26.33 25 24.02V4.18C25 1.87 23.41 0 21.45 0Z',
    penta: 'M0 14.0124 6.2456 0h12.492L24.8 14 12.4912 40.991z',
};

const ourCSS = `
.leaflet-SVGIcon {
  fill: #267fca;
  stroke: blue;
  width: 25px;
  height: 41px;
  /* filter: drop-shadow(5px -5px 5px rgba(0, 0, 0, 0.6)); */
}
.leaflet-SVGIcon .markerDot {
  fill:white;
}
span.SVGIconGlyph {
  width: 25px;
  text-align: center;
  vertical-align: middle;
  position: relative;
  display: inline-block;
}
svg.SVGMarkerShadow {
  opacity: 0.5;
  filter: blur(3.5px);
  top: -41px; 
}
.SVGMarkerShadow path {
  stroke: #666;
  fill: #666;
}
`;
////////////////////////////////////////////////////////////////////
//
//                      End user servicable parts
//
/////////////////////////////////////////////////////////////////////
// gets filled in by module init code
let default_SVGIcon = undefined;

// Wanted to do this by injecting a rotate and blur filter into
// the default and shaped icons, then save the result.  The problem
// is they display great when I save one and open it, but don't display
// well in the browser when constructed and cloned.  I may work on that....
// So for now the blur is happening in CSS.  Not so bad, let's us style
// them.
const SVGIconsPreRotatedPaths = {
    default: 'M27.3 3.7C22.5-1.1 14.4-1 9.5 3.9 7.8 5.6 6.6 7.5 6.1 9.6L.1 30.8 21.3 24.9C23.5 24.5 25.4 23.2 27.1 21.5 32 16.6 32.1 8.5 27.3 3.7z',
};
// gets populated by module init code. 
const SVGIconShadows = {
}

const defaultOptions = {  // same as L.Icon
    iconSize:    [25, 41],
    iconAnchor:  [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize:  [41, 41],
};

class SVGMarkerUtil {
    // append SVG <def>'s to the DOM so we can use them for
    // gradients and transforms etc.
    static svgExport(svg=null) {
        svg = null;
        // PLACEHOLDER FOR NOW.
        // deserialize if necessary,
        // wrap in <svg> tag if all they gave us was a <def> or gradient
        // append to DOM
        return svg;
    }

    // Trying to apply color, gaussian blur, rotate to get
    // a shadow of an SVG, but the browser isn't rendering the
    // blur, and there seems to be some strange interaction between
    // CSS transforms applied by leaflet and SVG transforms.
    static svgCreateShadow(shape, icon) {
        console.log(`Creating shadow for ${shape}`);
        SVGIconShadows[shape] = undefined;
        const rpath = SVGIconsPreRotatedPaths[shape];
        let a = icon.cloneNode(true);
        // use these two lines until we get the BBox working
        a.setAttribute('viewBox', '0 0 31 31');
        a.style.width = 31;
        a.querySelector('circle').remove();
//        let b = `
//<defs>
//  <filter id="blurMe" width="0" height="0">
//    <feGaussianBlur in="SourceGraphic" stdDeviation="3"></feGaussianBlur>
//  </filter>
//</defs>
//`;
//        const filter = SVGMarkerUtil.svgDeserialize(b);
//        a.prepend(filter);
        const pathEl = a.querySelector('path');
        pathEl.setAttribute('d', rpath);
        // bbox apparently only works when the element is added to the DOM
        // maybe try shadowDom?
        //let bbox = a.getBBox();
        //bbox = pathEl.getBBox();
        //a.setAttribute('viewbox', `0 0 ${bbox.width} ${bbox.height}`);
        //a.setAttribute('width', bbox.width);
        //a.style.width = bbox.width;
        //a.setAttribute('height', bbox.height);
        a.classList.add('SVGMarkerShadow');
        SVGIconShadows[shape] = a;
    }

    static serializeSVG(svgElement) {
        // check if arg === element.  Could also allow selectors?
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        return svgString;
    }

    // Create a dataURL from an SVG for use as img.src (not unicode safe!)
    // We no longer use this. SVG's in <img>'s can be styled
    static svgToDataURL(inputSVG) {
        if (inputSVG instanceof SVGSVGElement) {
            inputSVG = SVGMarkerUtil.serializeSVG(inputSVG);
        }
        const base64 = btoa(inputSVG);
        const s = `data:image/svg+xml;base64,${base64}`;
        return s;
    }

    static svgDeserialize(inputSVG, cullTextNodes=true) {
        // NOTE:  Remove next line for production
        // return SVGMarkerUtil.kludge_svgDeserializer(inputSVG);
        let SVGElement = null;
        try {
            const Dp = new DOMParser();
            const svgDoc = Dp.parseFromString(inputSVG, 'image/svg+xml');
            const errorNode = svgDoc.querySelector("parsererror");
            if (errorNode) {
                console.log("DOMParser error:", JSON.stringify(errorNode));
                return SVGElement;
            }
            SVGElement = svgDoc.documentElement;
        } catch(e) {
            console.warn(`svgDeserialize: ${e.name} ${e.message}`);
            console.warn("You might want to pass TrustedHTML");
            SVGElement = SVGMarkerUtil.kludge_svgDeserializer(inputSVG);
        }
        // When passing SVG's as strings, there are usually newlines
        // These generate text nodes in the final SVG.  Not needed.
        // But maybe you *want* text nofrd, so we have the option.
        if (cullTextNodes) {
            let children = Array.from(SVGElement.childNodes);
            for (let node of children) {
                if (node.nodeType == Node.TEXT_NODE) {
                    SVGElement.removeChild(node);
                }
            }
        }
        return SVGElement;
    }

    // This is a kludge.  You really can't parse XML with regex.
    // But it'll work for our markers, and it was fun to build.
    static kludge_svgDeserializer(svgString) {
        // Use a stack instead of recursion.  Might refactor it later. 
        let tagStack = []; 
        // eslint-disable-next-line no-useless-escape 
        const re_tag = /<\s*(?<tagclose>[\/])?\s*(?<tag>\/?\w+)\s*(?<attribs>[^>]*)?>/g;

        // ideally our re_tag would detect self-closers as well.
        const re_attrib = /((?<key>\w+)\s*=\s*(?<value>(['"])[^'"]*?\4))/g;
        const re_selfClose = /\/\s*>/;
        let match = svgString.matchAll(re_tag);
        const allMatches = Array.from(match);
        for (const match of allMatches) {
            const { tagclose, tag, attribs } = match.groups;
            let attrs = {};
            if (attribs?.length) {
                let attr_match = attribs.matchAll(re_attrib);
                const allAttrs = Array.from(attr_match);
                for (const one_attr of allAttrs) {
                    const {key, value} = one_attr.groups;
                    attrs[key.replace('"', '')] = value.slice(1,-1);
                }
            }
            let el = SVGMarkerUtil.svgMaker(tag, attrs);
            if (match[0].match(re_selfClose) || tagclose) {
                // tag closed.  Append to parent.
                tagStack.at(-1).appendChild(el);
                if (tagStack.length > 1) {  // dont pop the bottom tag
                    tagStack.pop();
                }
            } else {
                // tag not closed, so next element is a child
                tagStack.push(el);
            }
        }
        return tagStack.pop();
    }

    // Creates and returns a tag in the SVG namespace with
    // attributes set according to the passed object
    static svgMaker(tag, attrs) {
        if (tag.startsWith("/")) { return null; }
        const svgNS = "http://www.w3.org/2000/svg";
        const el = document.createElementNS(svgNS, tag);
        for (const key in attrs) {
            el.setAttribute(key, attrs[key]);
        }
        return el;
    }
}


class SVGIcon extends Icon {

    // Build the icon from (mostly) scratch.
    _createSVGIcon(options) {
        let icon = default_SVGIcon.cloneNode(true);
        let ignore_these_keys = [
            // Our own options 
            'glyphColor', 'glyphPrefix', 'imageOpts',
            // L.Marker options we can ignore (Marker will handle them)
            'keyboard', 'title', 'alt', 'zIndexOffset', 'opacity', 
            'raisoOnHover', 'pane', 'shadowPane', 'bubblingPointerEvents',
            'autoPanOnFocus'
        ];
        for (const [key, value] of Object.entries(options)) {
            // These keys handled by another key's handler
            if (ignore_these_keys.includes(key)) { continue; }
            if (key == 'shape') {
                if (value in extra_paths) {
                    let p = icon.querySelector('path');
                    p.setAttribute('d', extra_paths[value]);
                } else {
                    console.warn(`unknown shape: ${value}`);
                }
            } else if (key == 'color') { 
                if (CSS.supports('color', value)) {
                    for (const child of icon.children) {
                        // Specific CSS can still over-ride these
                        child.setAttribute('fill', value);
                        child.setAttribute('stroke', value);
                    }
                } else { console.warn(`color ${value} not supported`); }
            } else if (key == "class") {
                for (let c of value.split(/\s+/)) { icon.classList.add(c); }
            } else if (key == "fill") {
                if (CSS.supports('color', value)) {
                    icon.querySelector('path').style.fill = value;
                }
            } else if (key == "stroke") {
                for (const child of icon.children) {
                    child.setAttribute('stroke', value);
                }
            } else if (key == 'dotColor') { 
                if (CSS.supports('color', value)) {
                    let el = icon.querySelector('.markerDot');
                    if (el) el.style.fill = value;
                } else { console.warn(`color ${value} not supported`); }
            } else if (key == 'dotRadius') { 
                icon.querySelector('.markerDot')?.setAttribute('r', value);
            } else if (key == 'image') {
                let v = value;
                // did they give us an svg string?
                if (typeof v === 'string' && v.trim().match(/^<svg.*>/)) {
                    v = SVGMarkerUtil.svgToDataURL(v);
                }
                // eslint-disable-next-line no-useless-escape
                if (v.match(/^[\.\/]/)) { // they gave us a relative URL
                    let a = document.createElement('a');
                    a.setAttribute('href', v);
                    v = a.href;  // Magic incantation to get canonical URL
                }
                // at this point we should have either a dataURL or canonical
                // This is in case none of the above tests matched anything
                if (!URL.canParse(v)) { 
                    console.warn("Bad image option %o", value);
                    continue;
                }
                let imgOpts = options['imageOpts'] || {};
                imgOpts.href = v;
                if (!imgOpts.width) {imgOpts.width = 15}
                if (!imgOpts.height) {imgOpts.height = 15}
                if (imgOpts.width && !imgOpts.x) {
                    imgOpts.x = (25 - imgOpts.width)/2;
                }
                if (imgOpts.height && !imgOpts.y) {
                    imgOpts.y = (25 - imgOpts.height)/2;
                }
                let el = SVGMarkerUtil.svgMaker('image', imgOpts);
                // ROADMAP: Could probably do an Image(), set href, then 
                // try to get native size in an onload handler

                icon.appendChild(el);
                el = icon.querySelector('.markerDot');
                if (el) el.setAttribute('r', 0);
            } else if (key == 'glyph' || key == 'number') {
                let i = document.createElement('span');
                // basic build
                if (key == 'glyph') {
                    const pre = options.glyphPrefix || value.split('-')[0];
                    i.className = `${pre} ${value}`;
                } else {
                    i.textContent = value;
                }
                i.classList.add('SVGIconGlyph');
                // handle glyphColor
                const color = options.glyphColor || 'white';
                if (!CSS.supports('color', color)) {
                    console.warn(`Bad glyphColor ${options.glyphCOlor}`);
                    i.style.color = 'white';
                } else {
                    i.style.color = color;
                }
                // embed it in the SVG
                let forx = SVGMarkerUtil.svgMaker('foreignObject', {x:0,y:0});
                forx.style.height = `${this.options.iconSize[1]}px`;
                forx.style.width = `${this.options.iconSize[0]}px`;
                forx.appendChild(i);
                icon.appendChild(forx);
                // "remove" the white dot when we use an icon
                icon.querySelector('.markerDot')?.setAttribute('r', 0);
            } else if (key == 'style') {
                const style = SVGMarkerUtil.svgMaker('style');
                style.append(value);
                icon.prepend(style);
            } else {
                for (const child of icon.children) {
                    child.style[key] = value;
                }
            }
        }

        return icon;
    }

    // over-rides L.Icon.createIcon();
    createIcon() {
        const options = this._options || {};
        let icon;
        if (!Object.keys(options).length) { 
            // No options provided, so use default icon
            icon = default_SVGIcon.cloneNode(true); 
        } else {
            icon = this._createSVGIcon(options);
        }
        const anchor = this.options.iconAnchor;
        icon.style.marginLeft = `${-anchor[0]}px`;
        icon.style.marginTop  = `${-anchor[1]}px`;
        return icon;
    }


    createShadow(args) {
        console.log("createShadow args = ", args);
        const shape = this.options['shape'] || 'default';
        let a = SVGIconShadows[shape].cloneNode(true);
        // Do we need to attach some attributes to this ??
        // Like so we don't translate it down?
        return a; 
    }

    initialize(options) {
        if (!default_SVGIcon) {
            default_SVGIcon = SVGMarkerUtil.svgDeserialize(default_svgText);
        }
        this.name = SVGIcon;
        this._options = options;
        this.options = {...defaultOptions, ...options}
    }
}


export {SVGMarker as default, SVGIcon, SVGMarkerUtil};

// Run on module load, not instance instantiation
(function() {
    const _writeCSS = function() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(ourCSS);
        document.adoptedStyleSheets.push(sheet);
    }

    const _create_shadows = function() {
        const icon = default_SVGIcon.cloneNode(true);
        SVGMarkerUtil.svgCreateShadow('default', icon);
        for (const [shape, path] of Object.entries(extra_paths)) {
            icon.querySelector('path').setAttribute('d', path);
            SVGMarkerUtil.svgCreateShadow(shape, icon);
        }
    }

    _writeCSS();    
    default_SVGIcon = SVGMarkerUtil.svgDeserialize(default_svgText, true);
    _create_shadows();
})();

