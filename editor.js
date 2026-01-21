import Konva from "https://cdn.jsdelivr.net/npm/konva@9.3.0/+esm";
import Victor from 'https://cdn.skypack.dev/victor';
import * as sys from './sys.js';
import {scriptDisplay} from './main.js';

const konvasizex=500;
const konvasizey=500;


const doc={

}

for (let e of document.querySelectorAll("*")) {
    doc[e.id]=e;
}
doc.glyphsel=document.querySelector(".glyphselc");
doc.variationsel=document.querySelector(".variationsel");
let strokes=[

]
let glyphselection=null;
let glyphvarselection=null;
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

let anydragging=false;
class Stroke {
    constructor() {
        if (strokes.length==0) {
            eraseall();
        }
        this.points=[];
        this.shape = new Konva.Shape({
            stroke: 'black',
            strokeWidth: 5,
            lineCap: 'round',
            lineJoin: 'round',
            
            sceneFunc: (context, shape) => {
                drawCatmullRom(context, this.points);
                context.strokeShape(shape);
            }
            
        });
        
        curvelayer.add(this.shape);
        strokes.push(this);
        const st0=this;
        this.shape.on('click',function(e) {
            e.cancelBubble = true;
            strokeselection=this;
            selectpoints([],true);
            selectstroke(st0);
            curvelayer.draw();
        });
        let dragging=false;
        
        this.shape.on('mousedown touchstart',function(e) {
            e.cancelBubble=true;
            const mpos=stage.getPointerPosition();
            dragging=true;
            anydragging=true;
            for (let p of st0.points) {
                p.offx=p.x-mpos.x;
                p.offy=p.y-mpos.y;
                
            }
            strokeselection=this;
            selectpoints([],true);
            selectstroke(st0);
            curvelayer.draw();
        })
        stage.on('mousemove touchmove',function(e) {
            if (!dragging) return;
            e.cancelBubble=true;
            const mpos=stage.getPointerPosition();
            
            for (let p of st0.points) {
                
                p.x=mpos.x+p.offx;
                p.y=mpos.y+p.offy;
                p.shape.position({x:p.x,y:p.y});
                
            }
            layer.batchDraw();
            curvelayer.batchDraw();
        });
        stage.on('mouseup touchend',function(e) {
            e.cancelBubble=true;
            dragging=false;
            anydragging=false;
            porttoglyphs();
        });
        porttoglyphs();
    }
    newPoint(x,y) {
        const pt=new Point(x,y);
        pt.stroke=this;
        this.points.push(pt);
        drawglyph();
        return pt;
    }
    setSelected(selected) {
        this.shape.stroke(selected ? 'red' : 'black');
        if (selected) {
            strokeselection=this;
        }  
        
    }
}
function selectstroke(s) {
    
    for (const st of strokes) {
        st.setSelected(st===s);
    }
    strokeselection=s;
    selectpoints(s.points,true);
    curvelayer.batchDraw();
    console.log(strokeselection);

}
class Point {
    constructor(x, y) {

        this.x = x;
        this.y = y;
        this.stroke=null;
        this.shape=null;
        this.selectionbox=null;

        
        pointselection=[this];
        porttoglyphs();
    }
    toVictor() {
        return new Victor(this.x, this.y);
    }
    toKonva() {
        const pt=this;
        var circle = new Konva.Circle({
            x: this.x,          // x position of center
            y: this.y,          // y position of center
            radius: 6,      // radius of circle
            fill: 'gray',  // inner color
            stroke: 'black',   // outline color
            strokeWidth: 3,   // thickness of the outline
            draggable:true,
        });
        this.shape=circle;
        layer.add(circle);
        layer.draw();
        circle.on('click', function () {
            console.log('Circle clicked at position: (' + this.x() + ', ' + this.y() + ')');
            selectpoints([pt],true);
            selectstroke(pt.stroke);
            
        });
        circle.on('dragmove', function () {
            const mpos=stage.getPointerPosition();
            pt.x=mpos.x;
            pt.y=mpos.y;
            if (pt.selectionbox != null) {
                pt.selectionbox.position({
                    x: pt.x - 8,
                    y: pt.y - 8,
                });
                selectlayer.batchDraw();
            }
            drawglyph();
            
        });
        circle.on('mousedown touchstart',function() {
            selectpoints([pt],true);
            console.log(pt.selectionbox);
        }) 
        drawglyph();
        porttoglyphs();
        return circle;
    }
}

let pointselection=[]
let strokeselection=null;
function drawglyph() {
    
    
    curvelayer.batchDraw();
    
   
}
const stage = new Konva.Stage({
  container: document.getElementById('editor-display'),
  width: konvasizex,
  height: konvasizey,
});

const curvelayer=new Konva.Layer();
const layer = new Konva.Layer();
const selectlayer=new Konva.Layer();
stage.add(curvelayer);
stage.add(layer);
stage.add(selectlayer);

strokeselection=null;
function selectpoints(pts,clearcurrent) {
    console.log("selecting boxes on ");
    console.log(pts);
    if (clearcurrent) {
        for (let s of strokes) {
            for (let p of s.points) {
                if (p.selectionbox==null) continue;
                p.selectionbox.destroy();
                p.selectionbox=null;
            }
            
        }
        pointselection=[];
    }
    console.log("next loop");
    for (let p of pts) {
        pointselection.push(p);
        const selbox=new Konva.Rect({
            stroke: 'dodgerblue',
            strokeWidth: 2,
            dash: [4, 2],
            listening: false,
            x: p.x - 8,
            y: p.y - 8,
            width: 16,
            height: 16,
            visible:true
        });
       
        
        p.selectionbox=selbox;
        selectlayer.add(selbox);
        
    }
    console.log("NEWSELECTION");
    console.log(pointselection);
    selectlayer.draw();
}


stage.on('contextmenu', function (e) {
    
  e.evt.preventDefault(); //  stop browser context menu

    strokeselection=new Stroke();
    console.log(strokes);
    const mpos=stage.getPointerPosition();
    const point=strokeselection.newPoint(mpos.x,mpos.y);
    point.toKonva();
});
stage.on('click', function (e) {
    if (strokeselection==null || anydragging==true) return;
    if (e.evt.button !== 0) return;
    const mpos=stage.getPointerPosition();
    const point=strokeselection.newPoint(mpos.x,mpos.y);
    point.toKonva();
    selectpoints([point],true);
   
});
function eraseall() {
    layer.removeChildren();
    layer.draw();
    curvelayer.removeChildren();
    curvelayer.draw();
    strokeselection=null;
    selectpoints([],true);
    strokes=[];

}

function porttoglyphs() {
    if (!glyphvarselection) return;

    const newStrokes = [];

    for (let si = 0; si < strokes.length; si++) {
        const st = strokes[si];
        const nst = new sys.GlyphStroke(glyphvarselection);

        for (let i = 0; i < st.points.length; i++) {
            const npt = new sys.GlyphStrokePoint(
                `${glyphvarselection.id}_${si}_${i}`,
                new Victor(st.points[i].x/konvasizex, st.points[i].y/konvasizey),
                nst
            );
            nst.points.push(npt);
        }

        newStrokes.push(nst);
    }

    glyphvarselection.strokes = newStrokes;
}

doc.glyphsel.style.display="none";
doc.variationsel.style.display="none";
function loadglyphvar(glyphvar) {
    eraseall();
    glyphvarselection=glyphvar;
    console.log("STROKEYS");
    console.log(glyphvar.strokes);
    for (let s of glyphvar.strokes) {
        const st=new Stroke();
        for (let p of s.points) {
            const pt=st.newPoint(p.position.x*konvasizex,p.position.y*konvasizey);
            pt.toKonva();
        }
        
    }
    console.log("STROKEYS ADDED");
    console.log(strokes);
    doc.windowlabel.innerText=`${glyphvar.id} - ${glyphselection.id}`;
    
    drawglyph();
}
function loadglyph(glyphobj) {
    //porttoglyphs();
    eraseall();
    glyphselection=glyphobj;
    console.log(glyphobj);
    doc.variationpanel.replaceChildren();
    let o=0;
    let oc;
    for (let vi in glyphobj.variations) { 
        const v=glyphobj.variations[vi];
        
        const btn=doc.variationsel.cloneNode(true);
        btn.innerText=v.id;
        btn.addEventListener('click',()=>{
            porttoglyphs();
            loadglyphvar(v);
        })
        
        doc.variationpanel.appendChild(btn);
        btn.style.display="flex";
        if (o==0) {
            oc=v;
        }
        o+=1;
        
    }
    loadglyphvar(oc);
    
}
function newglyph() {
    const glyph=new sys.Glyph();
    glyph.id=`Glyph${scriptDisplay.glyphs.length}`;
    const glyphv=new sys.GlyphVariation(glyph,`Variation${Object.keys(glyph.variations).length}`);
    
    glyphselection=glyph;
    glyphvarselection=glyphv;
    const btn=doc.glyphsel.cloneNode(true);
    btn.querySelector(".glyphsel").innerText=glyph.id;
    console.log("makingnewglyphbtn");
    console.log(btn);
    btn.addEventListener('click',()=>{
        loadglyph(glyph);
    })
    
    btn.style.display="flex";
    doc.glyphlist.appendChild(btn);
    loadglyph(glyph);
    loadglyphvar(glyphv);
}
function newvariation() {
    porttoglyphs();
    const glyphv=new sys.GlyphVariation(glyphselection,`Variation${Object.keys(glyphselection.variations).length}`);
     eraseall();

    const btn=doc.variationsel.cloneNode(true);
    btn.innerText=glyphv.id;
    btn.addEventListener('click',()=>{
        porttoglyphs();
        loadglyphvar(glyphv);
    })
     btn.style.display="flex";
    doc.variationpanel.appendChild(btn);
    loadglyphvar(glyphv);
    glyphvarselection=glyphv;
    selectpoints([],true);
    strokeselection=null;
   
    curvelayer.removeChildren();
    curvelayer.draw();
}
doc.newglyph.addEventListener('click',()=>{
    newglyph();
})
doc.newvari.addEventListener('click',()=>{
    newvariation();
})