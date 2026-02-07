
import {
    ScriptDisplay,
    ScriptDisplayField,
    Glyph,
    GlyphVariation,
    GlyphStroke,
    GlyphStrokePoint,
    Victor
} from './sys.js';


const logicedit=document.getElementById("logiceditor");
const glyphedit=document.getElementById("glypheditor");
const logiceditb=document.getElementById("logicedit");
const glypheditb=document.getElementById("graphicedit");
// --- HTML elements ---
const inputField = document.getElementById("script-input");
const displayContainer = document.getElementById("script-display");
const codefield=document.getElementById("codearea");

// --- Display field ---
const displayField = new ScriptDisplayField(displayContainer, 600, 150);

// --- Script display controller ---
const scriptDisplay = new ScriptDisplay(inputField,displayField);
scriptDisplay.konvaStage = displayField.konvaStage;
scriptDisplay.konvaLayer = displayField.konvaLayer;

// --- Define key groups ---
scriptDisplay.keyInputGroups = ["a", "ka","fuhh"];

const iframe = document.getElementById("codesandbox");
let sandbox = null;

iframe.addEventListener("load", () => {
  sandbox = iframe.contentWindow;
});


// main.js - Add this to your existing message listener
import * as sysClasses from './sys.js';

// main.js - Update your message listener

// window.addEventListener("message", (e) => {
//   if (e.data.type === "call") {
//     const { method, args } = e.data;

//     if (typeof scriptDisplay[method] === "function") {
//       scriptDisplay[method](...args);
//     }
//   }
// });


// // =======================
// // GLYPH DEFINITIONS
// // =======================

// // ---- Glyph A ----
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

// // ---- Glyph B ----
// const glyphB = new Glyph();
// glyphB.id = "glyph-b";
// glyphB.classes.push("letter");

// const bVar = new GlyphVariation(glyphB);
// bVar.id = "main";

// const bStroke = new GlyphStroke(bVar);
// bStroke.points.push(
//     new GlyphStrokePoint("p1", new Victor(0,0), bStroke),
//     new GlyphStrokePoint("p2", new Victor(0,1), bStroke),
//     new GlyphStrokePoint("p3", new Victor(0.4,0.5), bStroke)
// );
// bStroke.id = "stroke-1";
// bVar.strokes.push(bStroke);
// glyphB.variations["main"] = bVar;

// // --- Register glyphs ---
scriptDisplay.glyphs.push(glyphA);

function extractMethods(obj) {
  const methods = new Set();

  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach(name => {
      if (
        typeof obj[name] === "function" &&
        name !== "constructor"
      ) {
        methods.add(name);
      }
    });
    proto = Object.getPrototypeOf(proto);
  }

  return [...methods];
}

// const scriptAPI = extractMethods(scriptDisplay);
// window.addEventListener("message", e => {
//   if (e.data?.type !== "call") return;

//   const { method, args, callId } = e.data;

//   if (!scriptAPI.includes(method)) {
//     e.source.postMessage({
//       type: "error",
//       callId,
//       error: "Method not allowed"
//     }, "*");
//     return;
//   }

//   try {
//     const result = scriptDisplay[method](...args);

//     e.source.postMessage({
//       type: "return",
//       callId,
//       result
//     }, "*");
//   } catch (err) {
//     e.source.postMessage({
//       type: "error",
//       callId,
//       error: err.message
//     }, "*");
//   }
// });
// main.js - Add a Registry to track returned objects
const objectRegistry = new Map();
let objIdCounter = 0;
// main.js - Update the message listener
window.addEventListener("message", e => {
  if (e.data?.type !== "call") return;

  const { method, args, callId, targetId } = e.data;
  
  // Resolve the target (either the main API or a specific object handle)
  const target = targetId !== undefined ? objectRegistry.get(targetId) : scriptDisplay;

  if (!target) {
    e.source.postMessage({ type: "error", callId, error: "Target object not found" }, "*");
    return;
  }

  // FIX: Before executing, check if any arguments are Character proxies 
  // and ensure they have a reference to the scriptDisplay
  const processedArgs = args.map(arg => {
    if (arg && typeof arg === 'object' && arg.__isProxy) {
      const realObj = objectRegistry.get(arg.id);
      // If it's a character, it needs the display reference to render
      if (realObj && realObj.constructor.name === "Character") {
        realObj.scriptDisplay = scriptDisplay;
      }
      return realObj;
    }
    return arg;
  });

  try {
    const result = target[method](...processedArgs);

    let responsePayload = { type: "return", callId, result };

    if (result && (typeof result === "object" || typeof result === "function")) {
      const id = objIdCounter++;
      objectRegistry.set(id, result);
      responsePayload.result = { __isProxy: true, id: id };
    }

    e.source.postMessage(responsePayload, "*");
  } catch (err) {
    console.error(err);
    e.source.postMessage({ type: "error", callId, error: err.message }, "*");
  }
});
const sandboxEvents = {
  onInput: new Map()
};

window.addEventListener("message", e => {
  const msg = e.data;

  if (msg.type === "register") {
    sandboxEvents[msg.event].set(msg.id, e.source);
  }
});
scriptDisplay.onInput = event => {
  for (const [id, win] of sandboxEvents.onInput) {
    win.postMessage({
      type: "event",
      event: "onInput",
      id,
      data: event
    }, "*");
  }
};

logiceditb.addEventListener("click",()=>{
    logicedit.style.display="block";
    glyphedit.style.display="none";
})
glypheditb.addEventListener("click",()=>{
    glyphedit.style.display="block";
    logicedit.style.display="none";
})

export {scriptDisplay};


