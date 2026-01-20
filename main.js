// main.js
import {
    ScriptDisplay,
    ScriptDisplayField,
    Glyph,
    GlyphVariation,
    GlyphStroke,
    GlyphStrokePoint,
    Victor
} from './sys.js';
console.log("misafnif loaded");
//import Victor from 'https://cdn.skypack.dev/victor';

// --- HTML elements ---
const inputField = document.getElementById("script-input");
const displayContainer = document.getElementById("script-display");

// --- Display field ---
const displayField = new ScriptDisplayField(displayContainer, 600, 150);

// --- Script display controller ---
const scriptDisplay = new ScriptDisplay(inputField,displayField);
scriptDisplay.konvaStage = displayField.konvaStage;
scriptDisplay.konvaLayer = displayField.konvaLayer;

// --- Define key groups ---
scriptDisplay.keyInputGroups = ["a", "ka","fuhh"];

// =======================
// GLYPH DEFINITIONS
// =======================

// ---- Glyph A ----
const glyphA = new Glyph();
glyphA.id = "glyph-a";
glyphA.classes.push("letter");

const aVar = new GlyphVariation(glyphA);
aVar.id = "main";

// Stroke for A
const aStroke = new GlyphStroke(aVar);

aStroke.id = "stroke-1";

// Bezier points (simple curve)
aStroke.points.push(
    new GlyphStrokePoint("p1", new Victor(0, 0), aStroke),
    new GlyphStrokePoint("p2", new Victor(0, 1), aStroke),
    new GlyphStrokePoint("p3", new Victor(1, 1), aStroke),
    new GlyphStrokePoint("p4", new Victor(1, 0), aStroke),
    new GlyphStrokePoint("p5", new Victor(0, 2), aStroke),
    new GlyphStrokePoint("p6", new Victor(0, 0), aStroke),
);

aVar.strokes.push(aStroke);
glyphA.variations["main"] = aVar;

// ---- Glyph B ----
const glyphB = new Glyph();
glyphB.id = "glyph-b";
glyphB.classes.push("letter");

const bVar = new GlyphVariation(glyphB);
bVar.id = "main";

const bStroke = new GlyphStroke(bVar);
bStroke.points.push(
    new GlyphStrokePoint("p1", new Victor(0,0), bStroke),
    new GlyphStrokePoint("p2", new Victor(0,1), bStroke),
    new GlyphStrokePoint("p3", new Victor(0.4,0.5), bStroke)
);
bStroke.id = "stroke-1";
bVar.strokes.push(bStroke);
glyphB.variations["main"] = bVar;

// --- Register glyphs ---
scriptDisplay.glyphs.push(glyphA, glyphB);

// =======================
// INPUT HANDLER
// =======================
scriptDisplay.onInput = (event) => {
    
    // console.log(event);
    // if (event.lastKeyGroup === "a") {
    //     const char = scriptDisplay.nextCharacter();
    //     scriptDisplay.drawGlyph("glyph-a", "main", char);
    // }

    // if (event.lastKeyGroup === "ka") {
    //     const char = scriptDisplay.nextCharacter();
    //     scriptDisplay.drawGlyph("glyph-b", "main", char);
    // }
    
    
};
scriptDisplay.mapLastKeyGroupBehavior({
    "a":()=>{
        const char = scriptDisplay.nextCharacter();
        scriptDisplay.drawGlyph("glyph-a", "main", char);
    },
    "ka":()=>{
        const char = scriptDisplay.nextCharacter();
        scriptDisplay.drawGlyph("glyph-b", "main", char);
    },
    "fuhh":()=>{
        const char = scriptDisplay.lastCharacter;
        scriptDisplay.drawGlyph("glyph-b", "main", char, {glyph:{offset:new Victor(0,0.5),offsetRotation:20},strokes:{}});
    }
});
