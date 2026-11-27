import * as THREE from 'three';
import { fluidVertex, forceVertex, advectionFragment, forceFragment,
  divergenceFragment, pressureFragment, projectFragment } from './hero-shaders.js';

/** Low-resolution incompressible flow. Targets stay allocated during rendering. */
export class HeroFluid {
  constructor(renderer, width, height) {
    this.renderer=renderer;
    this.scene=new THREE.Scene(); this.camera=new THREE.Camera();
    this.geometry=new THREE.PlaneGeometry(2,2);
    this.quad=new THREE.Mesh(this.geometry); this.quad.frustumCulled=false;
    this.scene.add(this.quad);
    this.px=new THREE.Vector2(); this.size=new THREE.Vector2();
    this.boundary=new THREE.Vector2(); this.center=new THREE.Vector2();
    this.force=new THREE.Vector2(); this.previous=new THREE.Vector2();
    const uniforms={boundarySpace:{value:this.boundary},px:{value:this.px},
      fboSize:{value:this.size},dt:{value:.014},dissipation:{value:.96},
      velocity:{value:null},pressure:{value:null},divergence:{value:null}};
    const make=(fragmentShader)=>new THREE.ShaderMaterial({vertexShader:fluidVertex,fragmentShader,
      uniforms:THREE.UniformsUtils.clone(uniforms),depthTest:false,depthWrite:false});
    this.advect=make(advectionFragment);this.divergence=make(divergenceFragment);
    this.pressure=make(pressureFragment);this.project=make(projectFragment);
    this.forceMaterial=new THREE.ShaderMaterial({vertexShader:forceVertex,fragmentShader:forceFragment,
      uniforms:{center:{value:this.center},force:{value:this.force},px:{value:this.px},radius:{value:18}},
      depthTest:false,depthWrite:false,transparent:true,blending:THREE.AdditiveBlending});
    const type=/iPad|iPhone|iPod/.test(navigator.userAgent)?THREE.HalfFloatType:THREE.FloatType;
    this.targets=Array.from({length:5},()=>new THREE.WebGLRenderTarget(1,1,{
      type,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
      depthBuffer:false,stencilBuffer:false}));
    this.resize(width,height);
  }
  resize(width,height){
    const w=Math.max(32,Math.round(width*.1)),h=Math.max(32,Math.round(height*.1));
    this.size.set(w,h);this.px.set(1/110,(w/h)/110);this.boundary.copy(this.px);
    for(const t of this.targets){t.setSize(w,h);this.renderer.setRenderTarget(t);this.renderer.clear();}
    for(const m of [this.advect,this.divergence,this.pressure,this.project]){
      m.uniforms.px.value.copy(this.px);m.uniforms.fboSize.value.copy(this.size);
      m.uniforms.boundarySpace.value.copy(this.boundary);
    }
    this.renderer.setRenderTarget(null);
  }
  pass(material,target,clear=true){
    this.quad.material=material;this.renderer.setRenderTarget(target);
    if(clear)this.renderer.clear();this.renderer.render(this.scene,this.camera);
  }
  update(point){
    const [v0,v1,div,p0,p1]=this.targets;
    this.advect.uniforms.velocity.value=v0.texture;this.pass(this.advect,v1);
    this.force.copy(point).sub(this.previous).multiplyScalar(25);
    this.previous.copy(point);
    const rx=18*this.px.x,ry=18*this.px.y;
    this.center.set(THREE.MathUtils.clamp(point.x,-1+rx+2*this.px.x,1-rx-2*this.px.x),
      THREE.MathUtils.clamp(point.y,-1+ry+2*this.px.y,1-ry-2*this.px.y));
    this.pass(this.forceMaterial,v1,false);
    this.divergence.uniforms.velocity.value=v1.texture;this.pass(this.divergence,div);
    this.pressure.uniforms.divergence.value=div.texture;
    for(let i=0;i<4;i++){
      this.pressure.uniforms.pressure.value=(i%2===0?p0:p1).texture;
      this.pass(this.pressure,i%2===0?p1:p0);
    }
    this.project.uniforms.velocity.value=v1.texture;
    this.project.uniforms.pressure.value=p0.texture;this.pass(this.project,v0);
  }
  get texture(){return this.targets[0].texture;}
  reset(){this.previous.set(0,0);for(const t of this.targets){this.renderer.setRenderTarget(t);this.renderer.clear();}}
  dispose(){this.geometry.dispose();for(const t of this.targets)t.dispose();
    for(const m of [this.advect,this.divergence,this.pressure,this.project,this.forceMaterial])m.dispose();}
}
