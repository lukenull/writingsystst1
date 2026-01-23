const codefield=document.getElementById("codearea");
const codeview=document.getElementById("codeview");
import * as sys from './sys.js'
import {scriptDisplay} from './main.js'
import Prism from "https://esm.sh/prismjs";
import "https://esm.sh/prismjs/components/prism-javascript";

// import { EditorState } from "@codemirror/state";
// import { EditorView, keymap} from "@codemirror/view";
// import {basicSetup} from "codemirror";
// import { defaultKeymap } from "@codemirror/commands";
// import { javascript } from "@codemirror/lang-javascript"; // For language support
// import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language"; // For highlighting
// import {autocompletion} from "@codemirror/autocomplete";
import getCaretCoordinates from "textarea-caret";

const termsuggest=document.getElementById("termsuggest");
termsuggest.style.display="none";
const tsiprefab=termsuggest.querySelector(".termsuggestitem");
tsiprefab.style.display="none";
tsiprefab.id="tsioriginal";

const highlight={
    functions: {strings:Object.getOwnPropertyNames(sys.ScriptDisplay.prototype).filter(prop => typeof sys.ScriptDisplay.prototype[prop] === 'function' && prop !== 'constructor')},
    variables: {strings:Object.getOwnPropertyNames(scriptDisplay).filter(prop => {
  return typeof scriptDisplay[prop] !== 'function';
})},
    keywords: {strings:["if","else","function","of",'in','return','class']}

}
const customSchema = {
  sys: [
    { label: "getCharacter", type: "function", detail: "() => string" },
    { label: "glyphLength", type: "variable", detail: "number" }
  ]
};



const brackets={"(":")","[":"]","{":"}",'"':'"'};
Prism.languages.javascript['globalfunction'] = new RegExp(`\\b(${highlight.functions.strings.join('|')})\\b`);
Prism.languages.javascript['globalvariable'] = new RegExp(`\\b(${highlight.variables.strings.join('|')})\\b`);
Prism.languages.javascript['systemvariable'] = new RegExp(`\\b(sys)\\b`);

function suggest(stuff) {
    const caret = getCaretCoordinates(codefield, codefield.selectionEnd);

  
    const rect = codefield.getBoundingClientRect();
    const abstop = rect.top + caret.top - codefield.scrollTop;
    const absleft = rect.left + caret.left - codefield.scrollLeft;
    termsuggest.style.left=`${absleft}px`;
    termsuggest.style.top=`${abstop}px`;
    termsuggest.style.display="flex";
    for (let ji of termsuggest.querySelectorAll(".termsuggestitem")) {
        if (ji.id!="tsioriginal") {
            ji.remove();
        }
    }
    for (let thing of stuff) {
        const ts=tsiprefab.cloneNode(true);
        ts.querySelector('.tsilabel').innerText=thing.label;
        termsuggest.appendChild(ts);
       ts.id="";
        ts.style.display="flex";
    }

}
function dosuggest() {
    const cumulstr=codefield.value.substring(0,codefield.selectionStart);
    
    const suggs=[];
    const starti=cumulstr.lastIndexOf("sys.")
    if (starti>-1) {
        const endcs=cumulstr.substring(starti+4);
        
        for (let cat in highlight) {
        
            for (let thing of highlight[cat].strings) {
                
                if (thing.startsWith(endcs)) {
                    
                    suggs.push({label:thing});
                    
                }
            }
        }
    
    }
    const syssugg=suggs.length>0;
    console.log(suggs);
    console.log(syssugg);
    if (syssugg) {
        suggest(suggs);
    } else {
        termsuggest.style.display="none";
    }
}

codefield.addEventListener('input',()=>{
    
    let str=codefield.value;
    let cumulstr=codefield.value.substring(0,codefield.selectionStart);
    const lastch=cumulstr.at(-1);
    if (brackets.hasOwnProperty(lastch)) {
        codefield.value+=brackets[lastch];
        str=codefield.value;

        codefield.setSelectionRange(str.length-1,str.length-1);
    }
     
     
    const highlighted = Prism.highlight(
    str, 
    Prism.languages.javascript, 
    'javascript'
    );
    codeview.innerHTML=highlighted;
    dosuggest();
});






// function customCompletions(context) {
//   // 1. Match the object and the optional property after the dot
//   // This regex matches "sys" followed by a dot and any word characters
//   let nodeBefore = context.matchBefore(/\w+\.\w*/);
  
//   if (nodeBefore) {
//     // Split to separate the object (e.g., "sys") from the property typed so far
//     let [objectName, propertyPart] = nodeBefore.text.split(".");
//     let options = customSchema[objectName];

//     if (options) {
//       return {
//         // 'from' must be the position immediately AFTER the dot
//         from: nodeBefore.from + objectName.length + 1,
//         options: options,
//         validFor: /^[\w$]*$/
//       };
//     }
//   }

//   // 2. Fallback for typing the object name itself (e.g., "sys")
//   let word = context.matchBefore(/\w+/);
//   if (word) {
//     if (word.text === "sys") {
//        return {
//          from: word.from,
//          options: [{ label: "sys", type: "keyword" }]
//        };
//     }
//   }

//   return null;
// }


// // 3. Initialize the editor
// const view = new EditorView({
//   doc: "// Type 'sys.' to see suggestions\n",
//   extensions: [
//     basicSetup,
//     javascript(),
//     autocompletion({ override: [customCompletions] }) // use 'override' to control all suggestions
//   ],
//   parent: document.body
// });