import * as THREE from './vendor/three.module.js';
const canvas=document.querySelector('#clubCanvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();renderer.setClearColor(0x000000,0);
const camera=new THREE.PerspectiveCamera(38,1,.025,70);
let seed=21;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function wood(base,dark){const c=document.createElement('canvas');c.width=1024;c.height=1024;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,1024,1024);for(let i=0;i<2800;i++){const x=rand()*1024;g.beginPath();g.strokeStyle=`rgba(${dark},${.008+rand()*.025})`;g.lineWidth=.3+rand()*1.4;g.moveTo(x,0);for(let y=0;y<=1024;y+=16)g.lineTo(x+Math.sin(y*.007+i*.36)*(.6+rand()*1.8),y);g.stroke()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(.7,.28);t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
const spruce=wood('#c39256','69,39,16'),rosewood=wood('#392317','7,3,1'),ebony=wood('#251b16','0,0,0');
const mat=(color,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const topMat=new THREE.MeshPhysicalMaterial({map:spruce,roughness:.36,clearcoat:.55,clearcoatRoughness:.25});const sideMat=new THREE.MeshPhysicalMaterial({map:rosewood,roughness:.35,clearcoat:.5});const fretMat=mat('#c9b995',.25,.85),stringMat=mat('#ba9f73',.28,.8),ivory=mat('#d0bc91',.4),black=mat('#100a07',.6),fingerMat=new THREE.MeshStandardMaterial({map:ebony,roughness:.62});
// Soft photographic reflections, independent of the visible club backdrop.
const env=new THREE.Scene();env.background=new THREE.Color('#554a3d');for(const [x,y,z,w,h,color,power] of [[-5,3,4,3,6,'#ffe0af',5],[5,1,1,2,5,'#adbbcc',2],[0,6,-2,6,3,'#efaa62',3]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,1,0);env.add(m)}const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(env,.025).texture;scene.environmentIntensity=.55;pmrem.dispose();
const guitar=new THREE.Group();scene.add(guitar);
function mesh(geo,material,x=0,y=0,z=0,parent=guitar){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
// Dreadnought proportions: broad shoulders, restrained waist, a rounded flat lower bout.
function bodyShape(hole=false){const s=new THREE.Shape();s.moveTo(0,1.46);
s.bezierCurveTo(-.48,1.46,-1.08,1.33,-1.12,.84);
s.bezierCurveTo(-1.16,.47,-.91,.29,-.94,.02);
s.bezierCurveTo(-.98,-.26,-1.34,-.54,-1.34,-1.08);
s.bezierCurveTo(-1.34,-1.69,-.99,-1.96,-.52,-1.99);
s.bezierCurveTo(-.18,-2.02,.18,-2.02,.52,-1.99);
s.bezierCurveTo(.99,-1.96,1.34,-1.69,1.34,-1.08);
s.bezierCurveTo(1.34,-.54,.98,-.26,.94,.02);
s.bezierCurveTo(.91,.29,1.16,.47,1.12,.84);
s.bezierCurveTo(1.08,1.33,.48,1.46,0,1.46);
if(hole){const h=new THREE.Path();h.absarc(0,.57,.35,0,Math.PI*2,true);s.holes.push(h)}return s}

const bodyOpt={depth:.36,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:40};mesh(new THREE.ExtrudeGeometry(bodyShape(true),bodyOpt),sideMat,0,0,-.18);
mesh(new THREE.ExtrudeGeometry(bodyShape(true),{...bodyOpt,depth:.025,bevelSize:.012,bevelThickness:.008}),topMat,0,0,.21);
mesh(new THREE.ShapeGeometry(bodyShape()),sideMat,0,0,-.20);
const rimPts=bodyShape().getPoints(180).map(p=>new THREE.Vector3(p.x,p.y,.245));rimPts.push(rimPts[0]);mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts),300,.018,6,true),ivory);
for(const [r,t,col] of [[.371,.007,'#e4c78a'],[.392,.012,'#23160d'],[.414,.007,'#d3b779'],[.436,.006,'#2c1e12']])mesh(new THREE.TorusGeometry(r,t,8,100),mat(col,.5),0,.57,.25);
// Tapered neck, real fret geometry and pearloid position markers.
const neck=new THREE.Shape();neck.moveTo(-.285,1.0);neck.lineTo(.285,1);neck.lineTo(.205,4.25);neck.lineTo(-.205,4.25);neck.closePath();mesh(new THREE.ExtrudeGeometry(neck,{depth:.19,bevelEnabled:true,bevelSize:.035,bevelThickness:.03,bevelSegments:4}),sideMat,0,0,.07);mesh(new THREE.ExtrudeGeometry(neck,{depth:.025,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2}),fingerMat,0,0,.29);
function rod(a,b,r,material,parent=guitar){const d=new THREE.Vector3().subVectors(b,a);const o=mesh(new THREE.CylinderGeometry(r,r,d.length(),10),material,0,0,0,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o}
const fretY=n=>4.25-4.9*(1-Math.pow(2,-n/12));for(let n=1;n<=20;n++){const y=fretY(n),w=.205+(4.25-y)/3.25*.08;rod(new THREE.Vector3(-w,y,.331),new THREE.Vector3(w,y,.331),.007,fretMat);if([3,5,7,9,12,15,17,19].includes(n)){const yy=(fretY(n-1)+y)*.5;for(const x of n===12?[-.09,.09]:[0])mesh(new THREE.CircleGeometry(.022,20),ivory,x,yy,.321)}}
mesh(new THREE.BoxGeometry(.435,.045,.055),ivory,0,4.25,.34);
const head=new THREE.Shape();head.moveTo(-.20,4.25);head.lineTo(-.30,4.55);head.lineTo(-.29,5.30);head.quadraticCurveTo(0,5.4,.29,5.30);head.lineTo(.30,4.55);head.lineTo(.20,4.25);head.closePath();mesh(new THREE.ExtrudeGeometry(head,{depth:.115,bevelEnabled:true,bevelSize:.025,bevelThickness:.018,bevelSegments:3}),sideMat,0,0,.14);
for(const side of [-1,1])for(let i=0;i<3;i++){const y=4.6+i*.26;mesh(new THREE.CylinderGeometry(.042,.042,.05,16).rotateX(Math.PI/2),fretMat,side*.21,y,.29);rod(new THREE.Vector3(side*.27,y,.20),new THREE.Vector3(side*.42,y,.20),.021,fretMat);const key=mesh(new THREE.SphereGeometry(.075,20,12),fretMat,side*.44,y,.20);key.scale.set(.55,1,.7);}
mesh(new THREE.BoxGeometry(.79,.18,.09),fingerMat,0,-.65,.29);mesh(new THREE.BoxGeometry(.55,.026,.045),ivory,0,-.615,.36);
const pick=new THREE.Shape();pick.moveTo(.3,.76);pick.bezierCurveTo(.88,.69,.83,-.35,.54,-.44);pick.bezierCurveTo(.27,-.49,.25,-.03,.32,.14);pick.bezierCurveTo(.56,.4,.4,.56,.3,.76);mesh(new THREE.ShapeGeometry(pick,40),mat('#27130d',.3),0,0,.253);
const strings=[];for(let i=0;i<6;i++){const x=(i-2.5)*.086;const a=new THREE.Vector3(x,-.615,.39),b=new THREE.Vector3((i-2.5)*.063,4.25,.39);const g=new THREE.TubeGeometry(new THREE.LineCurve3(a,b),120,.0025+(5-i)*.0007,6,false);const o=mesh(g,stringMat);strings.push({geo:g,base:g.attributes.position.array.slice(),phase:i*.72});mesh(new THREE.SphereGeometry(.023,12,8),ivory,x,-.71,.36);const ty=4.6+(i<3?i:5-i)*.26;rod(b,new THREE.Vector3(i<3?-.21:.21,ty,.30),.0035,stringMat)}
// Lighting matches the photographic tungsten pendant; visible environment is the generated backdrop.
scene.add(new THREE.HemisphereLight('#e2ba85','#1a1311',.9));const key=new THREE.SpotLight('#ffc582',50,22,.68,.75,1.3);key.position.set(3.6,4.7,3);key.target.position.set(0,.5,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0003;scene.add(key,key.target);const fill=new THREE.DirectionalLight('#b7c0cd',.7);fill.position.set(-3,3,5);scene.add(fill);const rim=new THREE.DirectionalLight('#e2a263',2.5);rim.position.set(-3,4,-1);scene.add(rim);
const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()};addEventListener('resize',resize);resize();
const clamp=THREE.MathUtils.clamp;function ease(x){x=clamp(x,0,1);return x*x*(3-2*x)}
const keys=[{p:0,pos:[3.1,1.75,12.6],at:[-3.0,1.55,0],fov:38},{p:.16,pos:[2.1,.65,8],at:[-.3,1.7,.1],fov:43},{p:.36,pos:[.08,-.45,.86],at:[0,3.4,.35],fov:64},{p:.58,pos:[-.045,1.05,.60],at:[0,4.5,.34],fov:64},{p:.78,pos:[.025,3.1,.53],at:[0,5.7,.34],fov:62},{p:1,pos:[.03,5.15,.61],at:[0,8,.4],fov:58}];
const v=new THREE.Vector3(),target=new THREE.Vector3();
function sample(prop,p){let i=0;while(i<keys.length-2&&p>keys[i+1].p)i++;let a=keys[i],b=keys[i+1],prev=keys[Math.max(0,i-1)],next=keys[Math.min(keys.length-1,i+2)],d=b.p-a.p,u=clamp((p-a.p)/d,0,1);return a[prop].map((av,j)=>{let bv=b[prop][j],m0=(bv-prev[prop][j])/(b.p-prev.p),m1=(next[prop][j]-av)/(next.p-a.p);if((av-prev[prop][j])*(bv-av)<=0)m0=0;if((bv-av)*(next[prop][j]-bv)<=0)m1=0;const slope=(bv-av)/d;if(slope===0){m0=m1=0}else{m0=m0*slope<=0?0:Math.sign(slope)*Math.min(Math.abs(m0),3*Math.abs(slope));m1=m1*slope<=0?0:Math.sign(slope)*Math.min(Math.abs(m1),3*Math.abs(slope))}return (2*u*u*u-3*u*u+1)*av+(u*u*u-2*u*u+u)*m0*d+(-2*u*u*u+3*u*u)*bv+(u*u*u-u*u)*m1*d})}
let pluck=0;window.addEventListener('pointermove',e=>{if(Math.abs(e.clientY-innerHeight*.82)<25)pluck=.012});
window.clubScene={render(p,t,velocity,reduced){let k=0;while(k<keys.length-2&&p>keys[k+1].p)k++;const a=keys[k],b=keys[k+1],u=ease((p-a.p)/(b.p-a.p));v.fromArray(sample('pos',p));target.fromArray(sample('at',p));if(innerWidth>760)target.x-=1.05*(1-ease(p/.30));if(innerWidth<761){v.x+=1.4*(1-ease(p/.3));target.x+=.8*(1-ease(p/.3));camera.fov=a.fov+(b.fov-a.fov)*u+9*(1-ease(p/.3))}else camera.fov=a.fov+(b.fov-a.fov)*u;camera.position.copy(v);camera.lookAt(target);camera.updateProjectionMatrix();pluck*=.94;const amp=reduced?0:Math.min(.009,velocity*.8)+pluck;for(const s of strings){const arr=s.geo.attributes.position.array;for(let i=0;i<arr.length;i+=3){const along=clamp((s.base[i+1]+.615)/4.865,0,1);arr[i+2]=s.base[i+2]+Math.sin(along*Math.PI)*Math.sin(t*.023+s.phase)*amp} s.geo.attributes.position.needsUpdate=true}renderer.render(scene,camera)},info:{renderer:'WebGL',model:'Procedural 3D acoustic guitar',strings:6,frets:20}};
document.documentElement.classList.add('scene-ready');
