import Konva from "https://cdn.jsdelivr.net/npm/konva@9.3.0/+esm";
import Victor from 'https://cdn.skypack.dev/victor';
import * as sys from './sys.js';
import {scriptDisplay} from './main.js';

const doc={

}
for (let e of document.querySelectorAll("*")) {
    doc[e.id]=e;
}

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
            pointselection=[];
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
            pointselection=[];
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
            
        });
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
    }
}
function selectstroke(s) {
    
    for (const st of strokes) {
        st.setSelected(st===s);
    }
    strokeselection=s;
    curvelayer.batchDraw();
    console.log(strokeselection);

}
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.stroke=null;
        this.shape=null;
        pointselection=[this];
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
            pointselection=[this];
            strokeselection=this.stroke;
            
        });
        circle.on('dragmove', function () {
            const mpos=stage.getPointerPosition();
            pt.x=mpos.x;
            pt.y=mpos.y;
            drawglyph();
            
        });
        drawglyph();
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
  width: 500,
  height: 500,
});

const curvelayer=new Konva.Layer();
const layer = new Konva.Layer();
stage.add(curvelayer);
stage.add(layer);

strokeselection=new Stroke();



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
   
});
function eraseall() {
    layer.removeChildren();
    layer.draw();
    curvelayer.removeChildren();
    curvelayer.draw();
    strokeselection=null;
    pointselection=[];
    strokes=[];

}
function porttoglyphs() {
    for (let st of strokes) {
        for (let i=0;i<st.points.length;i++) {
            glyphvarselection.strokes.points[i].position=new Victor(st.points[i].x,st.points[i].y);
            
        }
    }
}
doc.glyphsel.style.display="none";
doc.variationsel.style.display="none";
function loadglyphvar(glyphvar) {
    for (let s of glyphvar.strokes) {
        const st=new Stroke();
        for (let p of s.points) {
            const pt=st.newPoint(p.x,p.y);
        }
        
    }
    glyphvarselection=glyphvar;
    doc.windowlabel.innerText=`${glyphvar.id} - ${glyphselection.id}`;
}
function loadglyph(glyphobj) {
    eraseall();
    for (let v of glyphobj.variations) {
        doc.variationpanel.replaceChildren();
        const btn=document.cloneNode(variationsel);
        btn.innerText=v.id;
        btn.addEventListener('click',()=>{
            loadglyphvar(v);
        })
        btn.style.display="flex";
    }
}
