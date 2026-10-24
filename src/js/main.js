import { config } from './config.js';
import * as THREE from 'three';
import './scrollbar.js';
(function(){
/* ---- Loader: Three.js rotating Earth ---- */
var cv=document.getElementById('earth');
var loader=document.getElementById('loader');
var alreadyLoaded=sessionStorage.getItem('aw_loaded');

if(loader&&!alreadyLoaded){
  var scene,camera,renderer,earth,clouds,atmosphere,light;
  var earthTexture,cloudTexture;
  var rotationSpeed=matchMedia('(prefers-reduced-motion:reduce)').matches?0.0003:0.0015;
  var isAnimating=true;

  function initEarth(){
    var canvasSize=window.innerWidth<480?170:200;
    cv.width=canvasSize;
    cv.height=canvasSize;

    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(45,1,0.1,1000);
    camera.position.z=2.5;

    renderer=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
    renderer.setSize(canvasSize,canvasSize);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

    var textureLoader=new THREE.TextureLoader();
    earthTexture=textureLoader.load('/assets/img/earth_day_2k.jpg');
    cloudTexture=textureLoader.load('/assets/img/earth_clouds_2k.png');

    var earthGeometry=new THREE.SphereGeometry(1,64,64);
    var earthMaterial=new THREE.MeshPhongMaterial({
      map:earthTexture,
      shininess:5
    });
    earth=new THREE.Mesh(earthGeometry,earthMaterial);
    earth.rotation.z=23*Math.PI/180;
    scene.add(earth);

    var cloudGeometry=new THREE.SphereGeometry(1.02,64,64);
    var cloudMaterial=new THREE.MeshPhongMaterial({
      map:cloudTexture,
      transparent:true,
      opacity:0.8,
      side:THREE.DoubleSide
    });
    clouds=new THREE.Mesh(cloudGeometry,cloudMaterial);
    clouds.rotation.z=23*Math.PI/180;
    scene.add(clouds);

    var atmosphereGeometry=new THREE.SphereGeometry(1.15,64,64);
    var atmosphereMaterial=new THREE.ShaderMaterial({
      vertexShader:'varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec3 vNormal;void main(){float intensity=pow(0.65-dot(vNormal,vec3(0.0,0.0,1.0)),4.0);gl_FragColor=vec4(0.3,0.6,1.0,1.0)*intensity;}',
      blending:THREE.AdditiveBlending,
      side:THREE.BackSide,
      transparent:true
    });
    atmosphere=new THREE.Mesh(atmosphereGeometry,atmosphereMaterial);
    scene.add(atmosphere);

    light=new THREE.DirectionalLight(0xffffff,1.2);
    light.position.set(-1,0.5,1);
    scene.add(light);

    var ambientLight=new THREE.AmbientLight(0x404040,0.3);
    scene.add(ambientLight);
  }

  function animate(){
    if(!isAnimating)return;
    earth.rotation.y+=rotationSpeed;
    clouds.rotation.y+=rotationSpeed*1.15;
    renderer.render(scene,camera);
    if(!window.__loaded||document.getElementById('loader'))requestAnimationFrame(animate);
  }

  function disposeEarth(){
    isAnimating=false;
    if(renderer){
      renderer.dispose();
      renderer=null;
    }
    if(earth&&earth.geometry)earth.geometry.dispose();
    if(earth&&earth.material)earth.material.dispose();
    if(clouds&&clouds.geometry)clouds.geometry.dispose();
    if(clouds&&clouds.material)clouds.material.dispose();
    if(atmosphere&&atmosphere.geometry)atmosphere.geometry.dispose();
    if(atmosphere&&atmosphere.material)atmosphere.material.dispose();
    if(earthTexture)earthTexture.dispose();
    if(cloudTexture)cloudTexture.dispose();
    scene=null;
    camera=null;
    earth=null;
    clouds=null;
    atmosphere=null;
    light=null;
  }

  initEarth();
  animate();

  var observer=new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
      if(mutation.type==='childList'&&!document.getElementById('loader')){
        disposeEarth();
        observer.disconnect();
      }
    });
  });
  observer.observe(document.body,{childList:true,subtree:true});

  var fill=document.querySelector('.bar i'),pct=0,t0=Date.now();
  var tick=setInterval(function(){pct=Math.min(pct+Math.random()*14,window.__loaded?100:88);fill.style.width=pct+'%'},260);
  function finish(){window.__loaded=true;sessionStorage.setItem('aw_loaded','true');var wait=Math.max(0,2200-(Date.now()-t0));
    setTimeout(function(){fill.style.width='100%';clearInterval(tick);setTimeout(function(){loader.classList.add('done');document.body.classList.add('ready');setTimeout(function(){loader.remove()},900)},350)},wait)}
  if(document.readyState==='complete')finish();else window.addEventListener('load',finish);
}else if(loader){
  loader.remove();
}

/* ---- Fallback fade-in for browsers without View Transitions ---- */
if(!CSS.supports('view-transition-name','nav')){
  var main=document.querySelector('main');
  if(main){setTimeout(function(){main.classList.add('loaded')},50)}
}
/* ---- Header on scroll ---- */
var hd=document.querySelector('header');
if(hd)addEventListener('scroll',function(){hd.classList.toggle('scrolled',scrollY>30)},{passive:true});
/* ---- Cards hop in one by one ---- */
var cards=document.querySelectorAll('.card');
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.25});
  cards.forEach(function(c){io.observe(c)})}else cards.forEach(function(c){c.classList.add('in')});
/* ---- Button ripple ---- */
document.addEventListener('click',function(e){var b=e.target.closest('.btn');if(!b)return;
  var r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),sp=document.createElement('span');
  sp.className='ripple';sp.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(e.clientX-r.left-s/2)+'px;top:'+(e.clientY-r.top-s/2)+'px';
  b.appendChild(sp);setTimeout(function(){sp.remove()},650)});
/* ---- Galaxy mouse parallax ---- */
var g=document.querySelector('.galaxy');
if(g&&matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches)addEventListener('mousemove',function(e){
  var maxParallax=14;
  g.style.transform=window.getComputedStyle(g).transform+' translate('+((e.clientX/innerWidth-.5)*-maxParallax)+'px,'+((e.clientY/innerHeight-.5)*-maxParallax)+'px)'});

/* ---- count-up, card spotlight, cursor glow, word delay ---- */
document.querySelectorAll('.hero h1 .w').forEach(function(w,i){w.style.setProperty('--k',i)});
document.querySelectorAll('[data-n]').forEach(function(el){var n=+el.dataset.n,s=el.dataset.s||'',st=null;
 function go(t){st=st||t;var p=Math.min((t-st)/1800,1);el.textContent=Math.round(n*(1-Math.pow(1-p,3)))+s;if(p<1)requestAnimationFrame(go)}
 setTimeout(function(){requestAnimationFrame(go)},2800)});
document.querySelectorAll('.card').forEach(function(c){c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')})});
var gl=document.createElement('div');gl.className='glow';document.body.appendChild(gl);
if(matchMedia('(pointer:fine)').matches)addEventListener('mousemove',function(e){gl.style.left=e.clientX+'px';gl.style.top=e.clientY+'px'});
/* ---- Login (front-end demo) ---- */
var form=document.getElementById('login');
if(form){var eye=document.getElementById('eye'),pw=document.getElementById('pw'),msg=document.getElementById('msg');
  eye.addEventListener('click',function(){var s=pw.type==='password';pw.type=s?'text':'password';eye.textContent=s?'Hide':'Show'});
  form.addEventListener('submit',function(e){e.preventDefault();var btn=form.querySelector('.btn');
    if(!form.email.value||!pw.value){form.parentNode.classList.remove('shake');void form.offsetWidth;form.parentNode.classList.add('shake');msg.textContent='Enter your email and password to continue.';return}
    btn.firstChild.textContent='Entering the universe…';msg.textContent='';
    function reset(t){btn.firstChild.textContent='Sign In ';msg.textContent=t}
    if(!config.apiUrl){setTimeout(function(){reset('Demo mode: set VITE_API_URL in .env to connect your backend.')},1200);return}
    fetch(config.apiUrl+config.loginEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,password:pw.value})})
      .then(function(r){if(!r.ok)throw new Error('Login failed');return r.json()})
      .then(function(){reset('Welcome aboard!')})
      .catch(function(){reset('Could not sign in. Check your details.')})
  })}
})();
