import * as THREE from 'three';
import {blueprintVertex,blueprintFragment,blueprintWireFragment} from './hero-shaders.js?v=20261126-blueprint-1';
import {createPortraitMaps} from './portrait-maps.js?v=20261126-1';

// The natural portrait and the technical reveal share the same depth projection.
export async function createHeroSubjects(){
  const base=new URL('./assets/enzo/',import.meta.url),loader=new THREE.TextureLoader();
  const [portraitTexture,depthTexture]=await Promise.all(['portrait.webp','depth.png'].map(file=>loader.loadAsync(new URL(file,base).href)));
  const height=.72,displacement=.18,aspect=portraitTexture.image.width/portraitTexture.image.height;
  const derived=createPortraitMaps(portraitTexture.image,depthTexture.image,{height,displacement});
  const t={portrait:portraitTexture,depth:depthTexture,alpha:derived.alpha,clip:derived.clip,'portrait-normal':derived.normal};
  const plane=segments=>new THREE.PlaneGeometry(height*aspect,height,segments,segments).translate(0,-.04,0);
  t.portrait.colorSpace=t.depth.colorSpace=THREE.SRGBColorSpace;
  const portrait=new THREE.Group();portrait.name='Depth portrait';
  const portraitMaterial=new THREE.MeshStandardMaterial({map:t.portrait,alphaMap:t.clip,normalMap:t['portrait-normal'],normalScale:new THREE.Vector2(.2,.2),displacementMap:t.depth,displacementScale:displacement,transparent:true,roughness:1});
  const portraitMesh=new THREE.Mesh(plane(128),portraitMaterial);portrait.add(portraitMesh);
  const read=image=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,256,256);return context.getImageData(0,0,256,256).data;};
  const alphaPixels=derived.alphaPick,depthPixels=read(t.depth.image),sample=(pixels,u,v,channel=0)=>pixels[(Math.min(255,Math.max(0,Math.floor((1-v)*256)))*256+Math.min(255,Math.max(0,Math.floor(u*256))))*4+channel]/255;
  const pickGeometry=portraitMesh.geometry.clone(),vertices=pickGeometry.attributes.position,uvs=pickGeometry.attributes.uv;
  for(let i=0;i<vertices.count;i++){const d=sample(depthPixels,uvs.getX(i),uvs.getY(i)),linear=d<=.04045?d/12.92:Math.pow((d+.055)/1.055,2.4);vertices.setZ(i,linear*displacement);}
  pickGeometry.computeBoundingSphere();const pickMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),pickMesh=new THREE.Mesh(pickGeometry,pickMaterial),raycaster=new THREE.Raycaster();
  const blueprint=new THREE.Group();blueprint.name='Blueprint depth portrait';
  const uniforms={tPortrait:{value:t.portrait},tDepth:{value:t.depth},tAlpha:{value:t.alpha},uTime:{value:0},uDisplacement:{value:displacement}};
  const blueprintMaterial=new THREE.ShaderMaterial({vertexShader:blueprintVertex,fragmentShader:blueprintFragment,uniforms,transparent:true,depthWrite:false});
  blueprint.add(new THREE.Mesh(plane(128),blueprintMaterial));
  const wireMaterial=new THREE.ShaderMaterial({vertexShader:blueprintVertex,fragmentShader:blueprintWireFragment,uniforms,wireframe:true,transparent:true,depthWrite:false});
  const wire=new THREE.Mesh(plane(44),wireMaterial);wire.name='Blueprint face topology';wire.position.z=.0004;blueprint.add(wire);
  return {portrait,blueprint,blueprintMaterial,wireMaterial,restY:{desktop:0,mobile:-.095},
    hitPortrait(point,camera){portrait.updateWorldMatrix(true,true);camera.updateMatrixWorld();pickMesh.matrixWorld.copy(portrait.matrixWorld);raycaster.setFromCamera(point,camera);const hit=raycaster.intersectObject(pickMesh,false)[0];return !!hit&&sample(alphaPixels,hit.uv.x,hit.uv.y,1)>.15;},
    disposeAssets(){pickGeometry.dispose();pickMaterial.dispose();for(const texture of Object.values(t))texture.dispose();}};
}

export function addStudioLights(scene){
  scene.add(new THREE.HemisphereLight(0xffffff,0x000000,2.5));
  const key=new THREE.PointLight(0xffffff,2.5,0,2);key.position.set(-.75,.2,.4);scene.add(key);
}
