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
    <path d="M12.4 0C5.6 0-.02 5.76-.02 12.7-.02 15.12.4501 17.28 1.6 19.2L12.4 38.4 23.2 19.2C24.4 17.38 24.9 15.12 24.88 12.72 24.88 5.8 19.2 0 12.4 0z" />
    <circle class="markerDot" cx="12.5" cy="12.5" r="5"/>
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
  left: -12px;
}
.SVGMarkerShadow path {
  stroke: #666;
  fill: #666;
}
.SVGInvisible {
  opacity: 0;
  left: -10000px;
  top: -10000px;
}
`;
////////////////////////////////////////////////////////////////////
//
//                      End user servicable parts
//
/////////////////////////////////////////////////////////////////////
// gets filled in by module init code
let default_SVGIcon = undefined;

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
    // append SVG to the DOM so we can use their def's for
    // gradients and transforms etc.  The intention is that
    // the SVG should just contain defs, but that's on you, neighbor.
    // FIXME:  Should we just have one SVG for all the defs we get?
    static svgExport(svg=null) {
        const fragment = SVGMarkerUtil.svgDeserialize(svg);
        // need to see if fragment is just a filter/gradient, etc
        // if so, wrap in a <def />.
        // If just a def, wrap in <svg />
        if (fragment) { document.body.prepend(fragment); }
        return fragment;
    }

    // Trying to apply color, gaussian blur, rotate to get
    // a shadow of an SVG, but the browser isn't rendering the
    // blur, and there seems to be some strange interaction between
    // CSS transforms applied by leaflet and SVG transforms.
    static svgCreateShadow(shape, icon) {
        // console.log(`Creating shadow for ${shape}`);
        let a = icon.cloneNode(true);
        a.querySelector('circle').remove();
        const pathEl = a.querySelector('path');
        pathEl.setAttribute('transform', 'rotate(45, 12, 41)');
        a.classList.add('SVGInvisible');
        document.body.prepend(a);
        let el = document.querySelector('.SVGInvisible');
        let elBB = el.getBBox();
        document.body.removeChild(el);
        a.classList.remove('SVGInvisible');
        elBB.x = Math.round(elBB.x);
        elBB.y = Math.round(elBB.y);
        elBB.width = Math.round(elBB.width);
        elBB.height = Math.ceil(elBB.height);
        console.log("shape = ", shape);
        console.log("elBB = ", elBB);
        a.setAttribute('viewBox', `0 0 ${elBB.width} ${elBB.height}`);
        a.style.width = `${elBB.width}px`;
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

    // SVG's have a large attack surface.  Sanitize your inputs.
    // svgDeserialize attempts to use DOMParser to deserialize the strings,
    // but falls back to a hand-rolled simple deserializer if DOMParser
    // throws an Error (probably because of your CSP).  This simple
    // fallback deserializer is sufficient for the provided icons, but
    // may or may not work on SVG's with more than the basic SVG 
    // element tags. 
    static svgDeserialize(inputSVG, cullTextNodes=true) {
        // return SVGMarkerUtil.kludge_svgDeserializer(inputSVG);
        let SVGElement = null;
        try {
            const Dp = new DOMParser();
            const svgDoc = Dp.parseFromString(inputSVG, 'image/svg+xml');
            const errorNode = svgDoc.querySelector("parsererror");
            if (errorNode) {
                console.warn("DOMParser error:", JSON.stringify(errorNode));
            }
            SVGElement = svgDoc.documentElement;
        } catch(e) {
            console.warn(`svgDeserialize: ${e.name} ${e.message}`);
            console.warn("You might want to pass TrustedHTML");
            SVGElement = SVGMarkerUtil.kludge_svgDeserializer(inputSVG);
        }
        // When passing SVG's as strings, there are usually newlines
        // These might generate text nodes in the final SVG.  Not needed.
        // But maybe you *want* text nodes, so we have the option.
        if (cullTextNodes) {
            function removeTextNodes(node) {
              if (node.nodeType === 3) { // Node.TEXT_NODE
                node.parentNode.removeChild(node);
              } else {
                // is there a more "modern" way to iterate the children?
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                  removeTextNodes(node.childNodes[i]);
                }
              }
            }
            removeTextNodes(SVGElement);
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

        const re_attrib = /((?<key>\w+)\s*=\s*(?<value>(['"])[^'"]*?\4))/g;
        // ideally, our re_tag would detect self-closers as well.
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
            'raiseOnHover', 'pane', 'shadowPane', 'bubblingPointerEvents',
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
                // does the URL start with '.' or '/' ?  Probably relative
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
        // console.log("createShadow args = ", args);
        const shape = this.options['shape'] || 'default';
        let a = SVGIconShadows[shape].cloneNode(true);
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
    const BlurFilter = `
<svg><defs>
<filter id="blurMe" width="0" height="0">
  <feGaussianBlur in="SourceGraphic" stdDeviation="3"></feGaussianBlur>
</filter>
</defs></svg>`;
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
    SVGMarkerUtil.svgExport(BlurFilter);
})();

