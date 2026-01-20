
import Konva from "https://cdn.jsdelivr.net/npm/konva@9.3.0/+esm";


import Victor from 'https://cdn.skypack.dev/victor';

class ScriptDisplayField {
    constructor(containerElement,width=500,height=100) {
        this.containerElement = containerElement;
        this.width = width;
        this.height=height;
        this.wrapText=true;
        this.verticalScroll=false;
        this.main=document.createElement("div");
        const mdiv=this.main;
        containerElement.appendChild(mdiv);
        mdiv.style.width=`${this.width}px`;
        mdiv.style.height=`${this.height}px`;
        mdiv.style.maxHeight=`${this.height}px`;
        mdiv.style.display="flex";
        mdiv.style.flexWrap=this.wrapText?"wrap":"nowrap";
        mdiv.style.paddingTop="5px";
        if (this.verticalScroll) {
            mdiv.style.overflowY="scroll";
        } else {
            mdiv.style.flexDirection="column";            
        }
        this.konvaStage = new Konva.Stage({
            container: mdiv,
            width: this.width,
            height: this.height
        });
        this.konvaLayer = new Konva.Layer();
        this.konvaStage.add(this.konvaLayer);
    }
}
class ScriptDisplay {
    constructor(inputField, displayField) {
        this.inputField = inputField;
        this.canvas = null;
        this.characters = [];
        this.keyInputGroups=[];
        this.fontScale=78;
        this.fontWidth=0.1;
        this.lastCharacter=null;
        this.glyphs=[];
        this.currentEntry="";
        this.displayField=displayField;

        this.keygroupquickmap={};
        this.scriptEvent={
            lastKey:"",
            lastKeyGroup:"",
            keyGroups:[],
            keys:[],
            lastKeyGroupPosition:0,
            lastPosition:0,
            

        };
        this.onInput=null;
        let lastlen=0;
        if (this.inputField.tagName.toLowerCase()=="input" && this.inputField.type=="text") {
            this.inputField.addEventListener("input",(e)=>{
                const ntxt=e.target.value;
                
                
                const lastchar=ntxt.charAt(ntxt.length-1);
                
                const kgsort=this.keyInputGroups.sort((a, b) => b.length - a.length);

                let cuml="";
                let tempkgs=[];
                let i=0;
                while (i < ntxt.length) {
                    let matched = false;

                    for (const kg of kgsort) {
                        // Check if the string starting at i matches the group
                        if (ntxt.startsWith(kg, i)) {
                            tempkgs.push(kg);
                            i += kg.length; // Jump past the group
                            matched = true;
                            break; 
                        }
                    }

                    // If no group matches, treat the single character as the group (or skip)
                    if (!matched) {
                        // Option: Add the single character as a group if desired
                        // tempkgs.push(ntxt[i]); 
                        i++;
                    }
                }
                this.scriptEvent.lastKeyGroupPosition=tempkgs.length>0?ntxt.lastIndexOf(tempkgs[tempkgs.length-1]):0;
                this.scriptEvent.lastPosition=ntxt.length-1;
                this.scriptEvent.keys=ntxt.split("");
                this.scriptEvent.keyGroups=tempkgs;
                this.scriptEvent.lastKeyGroup=tempkgs.length>0?tempkgs[tempkgs.length-1]:"";
                this.scriptEvent.lastKey=lastchar;
                
                
                if (this.onInput==null) {
                    console.warn("ScriptDisplay: onInput handler is not set");
                } else {
                    if (ntxt.length<lastlen) {
                        this.clear();
                        this.scribe(ntxt);
                        
                    } else {
                        this.displayField.konvaLayer.destroyChildren();
                        this.onInput(this.scriptEvent);
                        if (this.keygroupquickmap.hasOwnProperty(this.scriptEvent.lastKeyGroup) && this.scriptEvent.lastKeyGroupPosition==this.scriptEvent.lastPosition - this.scriptEvent.lastKeyGroup.length + 1) {
                            this.keygroupquickmap[this.scriptEvent.lastKeyGroup]();
                        } else {
                            
                        }
                        
                    }
                    
                    this.renderCurrentState();
                }
                lastlen=ntxt.length;
                console.log(this.scriptEvent);
                console.log(this.characters);
            });


        } else {
            console.error("ScriptDisplay: inputField is not a valid input element");
        }
        
    }
    matchLastKeyGroup(targetKeyGroup) {
        const lkg=this.scriptEvent.lastKeyGroup;
        const llet=this.scriptEvent.lastKey;
        return lkg==targetKeyGroup && llet==lkg.charAt(lkg.length-1);
    }
    mapLastKeyGroupBehavior(map) {
        
        this.keygroupquickmap=map;
    }
    getCharacter(index) {
        return this.characters[index];
    }
    getCharacterFromEnd(indexFromEnd) {
        return this.characters[this.characters.length-1-indexFromEnd];
    }
    getLastEntry() {
        return this.currentEntry[this.currentEntry.length-1];
    }
    getLastEntryKeyGroup() {
        const kgs=this.scriptEvent.keyGroups;
        if (kgs.length>0) {
            return kgs[kgs.length-1];
        }
        
    }
    getKeyGroupAt(index) {
        return this.scriptEvent.keyGroups[index];
    }
    getEntryKeyGroupAt(index) {
        return this.scriptEvent.keyGroups[index];
    }
    getEntryKeyGroupFromEnd(indexFromEnd) {
        const kgs=this.scriptEvent.keyGroups;
        return kgs[kgs.length-1-indexFromEnd];
    }
    getLastGlyphOfClass(className) {
        for (let i=this.characters.length-1;i>=0;i--) {
            const c=this.characters[i];
            const g=c.getLastGlyphOfClass(className);
            if (g!=null) {
                return g;
            }
        }
    }
    getGlyphById(id) {
        for (const g of this.glyphs) {
            if (g.id==id) {
                return g;
            }
        }
        return null;
    }
    getGlyphs() {
        const glyphs=[];
        for (const c of this.characters) {
            for (const g of c.glyphRenderers) {
                glyphs.push(g);
            }
        }
        return glyphs;
    }
    getGlyphsOfClass(className) {
        const gs=[];
        for (const c of this.characters) {
            for (const g of c.getGlyphsOfClass(className)) {
                gs.push(g);
            }
            
        }
        return gs;
    }
    nextCharacter() {
        const char=new Character(this);
        this.characters.push(char);
        this.lastCharacter=char;
        return char;
    }
    drawGlyph(id,variationId="main",character=this.lastCharacter,transformOverrides=null) {
        const glyph=this.getGlyphById(id);
        if (glyph==null) {
            console.error(`ScriptDisplay: Glyph with id ${id} not found`);
            return null;
        } else {
            return glyph.draw(character,variationId,transformOverrides);
        }
    }
    editGlyph(character,id,transformOverrides) {
        const glyph=character.getGlyphById(id);
        if (glyph==null) {
            console.error(`ScriptDisplay: GlyphRenderer with id ${id} not found`);
            return null;
        } else {
            return glyph.draw(character,character.getGlyphById(id).glyphVariation,transformOverrides);
        }
    }
    scribe(text) {
        for (let i=0;i<text.length;i++) {
            this.onInput({target:{value:text.substring(0,i+1)}});
        }
    }
    renderCurrentState() {
        for (const c of this.characters) {
            for (const g of c.glyphRenderers) {
                g.render();
            }
        }
    }
    clear() {
        this.displayField.konvaLayer.destroyChildren(); 
        this.characters=[];
    }



}
class GlyphVariation {
    constructor(glyph,id="") {
        
        this.strokes=[];
        this.glyph=glyph;
        this.id=id;
        this.offset=new Victor(0,0); //relative to glyph origin
        this.offsetRotation=0; //degrees, relative to glyph rotation
        glyph.variations[id]=this;
    }
    
}
class GlyphRenderer { //individual one that shows in each character instance
    constructor(glyph,glyphVariationId,character) {
        this.id = null;
        this.absolutePosition=new Victor(0,0);
        this.type="stroke";
        this.character=character;
        this.glyph=glyph;
        this.glyphVariation=glyphVariationId;
        this.glyphTransformOverrides={
            glyph:{},
            strokes:{}
        };

        this.boundsSize=new Victor(0,0);

    }
    render() {
        const layer=this.character.scriptDisplay.konvaLayer;
        const gvar=this.glyph.variations[this.glyphVariation];
        const scale=this.character.scriptDisplay.fontScale;
        for (const stroke of gvar.strokes) {
            const abspoints=[];
            for (const pt of stroke.points) {
                
                const abspt=pt.position.clone();
                abspt.rotate(this.glyphTransformOverrides.strokes[stroke.id].offsetRotation);
                abspt.add(this.glyphTransformOverrides.strokes[stroke.id].offset);
                abspt.rotate(this.glyphTransformOverrides.glyph.offsetRotation);
                abspt.add(this.glyphTransformOverrides.glyph.offset);
                //abspt.multiply(new Victor(scale,scale));
                abspt.add(this.character.absolutePosition);
                abspoints.push(abspt);
            }
            for (const vec of abspoints) {
                
                vec.multiply(new Victor(scale,scale));
                console.log(vec);
            }
            function drawCatmullRom(context, pts) {
                if (pts.length < 2) return;
    
                context.beginPath();
                context.moveTo(pts[0].x, pts[0].y);
    
                for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[i - 1] || pts[i];
                    const p1 = pts[i];
                    const p2 = pts[i + 1];
                    const p3 = pts[i + 2] || p2;
    
                    const cp1x = p1.x + (p2.x - p0.x) / 6;
                    const cp1y = p1.y + (p2.y - p0.y) / 6;
    
                    const cp2x = p2.x - (p3.x - p1.x) / 6;
                    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
                    context.bezierCurveTo(
                        cp1x, cp1y,
                        cp2x, cp2y,
                        p2.x, p2.y
                    );
                }
            }
    
                const bezierLine = new Konva.Shape({
                stroke: 'black',
                strokeWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                sceneFunc: function (context, shape) {
                    if (abspoints.length < 2) return;
    
                    drawCatmullRom(context, abspoints);
                    context.strokeShape(shape);
                }
    
            });

            // Helper function for n-degree Bezier calculation
            

            layer.add(bezierLine);
            layer.draw();
        }
    }
    erase() {
        const layer=this.character.scriptDisplay.konvaLayer;
        layer.destroyChildren();
        layer.draw();
    }
    transform(offset,rotation) {
        this.glyphTransformOverrides.glyph.offset=offset;
        this.glyphTransformOverrides.glyph.offsetRotation=rotation;
        this.render();
    }
    deform(strokeTransformations) {
        for (const sid in strokeTransformations) {
            this.glyphTransformOverrides.strokes[sid]=strokeTransformations[sid];
        }
        this.render();
    }

}
class Glyph {
    constructor() {
        this.variations={};
        this.classes = [];
        this.id=null;
        this.offset=new Victor(0,0); //relative to character origin
        this.offsetRotation=0; //degrees
    }
    draw(character,variationId,transformOverrides) {
       
        // Inside Glyph.draw()

        transformOverrides=transformOverrides||{};
        transformOverrides.glyph=transformOverrides.glyph||{};
        transformOverrides.strokes=transformOverrides.strokes||{};
        transformOverrides.glyph.offset=transformOverrides.glyph.offset||this.offset.clone();
        transformOverrides.glyph.offsetRotation=transformOverrides.glyph.offsetRotation||this.offsetRotation;

        for (const stroke of this.variations[variationId].strokes) {
                // Fix: Nest under .strokes
            if (!transformOverrides.strokes.hasOwnProperty(stroke.id)) {
                    
                transformOverrides.strokes[stroke.id] = {
                    offset: stroke.offset.clone(),
                    offsetRotation: stroke.offsetRotation
                };
            } else {
                transformOverrides.strokes[stroke.id].offset = transformOverrides.strokes[stroke.id].offset || stroke.offset.clone();
                transformOverrides.strokes[stroke.id].offsetRotation = transformOverrides.strokes[stroke.id].offsetRotation || stroke.offsetRotation;
            }
        }
        const grend=new GlyphRenderer(this,variationId,character);
        grend.glyphTransformOverrides=transformOverrides;
        grend.id=this.id;
        grend.render();
        character.glyphRenderers.push(grend);
        return grend;
    }
    erase(character) {
        const grend=character.getGlyphById(this.id);
        if (grend!=null) {
            grend.erase();
            const index=character.glyphRenderers.indexOf(grend);
            if (index>-1) {
                character.glyphRenderers.splice(index,1);
            }
        } else {
            console.warn(`Glyph: GlyphRenderer based on Glyph with ${this.id} not found in character`);
        }
    }
}

class Character { //scales dynamically with longest glyph size but origin stays fixed
    constructor(scriptDisplay) {
        this.glyphs = [];
        this.glyphRenderers=[];
        this.scriptDisplay = scriptDisplay;
        this.boundsSize=new Victor(1,1.3); //in font units
        this.absolutePosition=new Victor(0.5,0);
        for (const c of this.scriptDisplay.characters) {
            this.absolutePosition.add(new Victor(c.boundsSize.x,0));
        }
        
    }
    glyphCount() {
        return this.glyphRenderers.length;
    }
    getFirstGlyphOfClass(className) {
        for (const g of this.glyphRenderers) {
            if (g.glyph.classes.includes(className)) {
                return g;
            }
        }
    }
    getLastGlyphOfClass(className) {
        for (let i=this.glyphRenderers.length-1;i>=0;i--) {
            const g=this.glyphRenderers[i];
            if (g.glyph.classes.includes(className)) {
                return g;
            }
        }
        
    }
    getGlyphsOfClass(className) {
        const gs=[];
        for (const g of this.glyphRenderers) {
            if (g.glyph.classes.includes(className)) {
                gs.push(g);
            }
        }
        return gs;
    }
    getGlyphById(id) {
        for (const g of this.glyphRenderers) {
            if (g.id==id) {
                return g;
            }
        }
        return null;
    }

}
class GlyphStroke {
    constructor(glyphVariation) {
        this.points=[];
        this.id="";
        this.glyph=glyphVariation.glyph;
        this.glyphVariation=glyphVariation;
        this.offset=new Victor(0,0); //relative to glyph variation origin
        this.offsetRotation=0; //degrees, relative to glyph variation rotation
    }
}
class GlyphStrokePoint {
    constructor(id,position,stroke) {
        
        this.position=position;  //relative to glyph variation origin + stroke offset
        this.id=id;
        this.stroke=stroke;

    }
}
class GlyphStrokePointCtrl {
    constructor(id,position,point) {
        this.position=position; //relative to stroke point position
        this.id=id;
        this.point=point;
        this.strokePosition=position.clone().add(point.position);
    }
}
export { ScriptDisplay, ScriptDisplayField, Glyph, GlyphVariation, GlyphRenderer, Character, GlyphStroke, GlyphStrokePoint, GlyphStrokePointCtrl, Victor};