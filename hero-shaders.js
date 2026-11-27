// Hero-only GPU passes. Fluid equations use BFECC advection and a Jacobi
// pressure projection; no image/model/shader assets from the reference site.
export const fullscreenVertex = /* glsl */`
varying vec2 vUv;
void main() { vUv=uv; gl_Position=vec4(position.xy,0.,1.); }
`;

// Ashima Arts / Stefan Gustavson, webgl-noise (MIT), 3D simplex noise.
export const simplex = /* glsl */`
vec4 permute(vec4 x){return mod(((x*34.)+1.)*x,289.);}
vec4 invSqrt(vec4 x){return 1.79284291400159-.85373472095314*x;}
float snoise(vec3 v){
 const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
 vec3 i=floor(v+dot(v,C.yyy)), x0=v-i+dot(i,C.xxx);
 vec3 g=step(x0.yzx,x0.xyz),l=1.-g;
 vec3 i1=min(g.xyz,l.zxy),i2=max(g.xyz,l.zxy);
 vec3 x1=x0-i1+C.xxx,x2=x0-i2+C.yyy,x3=x0-D.yyy;
 i=mod(i,289.);
 vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
 vec3 ns=(1./7.)*D.wyz-D.xzx;
 vec4 j=p-49.*floor(p*ns.z*ns.z), xx=floor(j*ns.z), yy=floor(j-7.*xx);
 vec4 x=xx*ns.x+ns.yyyy,y=yy*ns.x+ns.yyyy,h=1.-abs(x)-abs(y);
 vec4 b0=vec4(x.xy,y.xy),b1=vec4(x.zw,y.zw),sh=-step(h,vec4(0.));
 vec4 a0=b0.xzyw+(floor(b0)*2.+1.).xzyw*sh.xxyy;
 vec4 a1=b1.xzyw+(floor(b1)*2.+1.).xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x),p1=vec3(a0.zw,h.y),p2=vec3(a1.xy,h.z),p3=vec3(a1.zw,h.w);
 vec4 n=invSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
 p0*=n.x;p1*=n.y;p2*=n.z;p3*=n.w;
 vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m*=m;
 return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const noiseFragment = /* glsl */`
${simplex}
varying vec2 vUv;
uniform float uAspect,uTime,uMousePace,uReveal;
uniform vec2 uMouseCoords;
void main(){
 vec2 p=vUv*vec2(uAspect,1.);
 float intro=25.*(1.-uReveal);
 p.y=(p.y+intro*4./3.)/(1.+intro);
 vec2 m=(uMouseCoords*.5+.5)*vec2(uAspect,1.);
 float influence=clamp((1.-distance(p,m)*3.)*uMousePace,-.75,1.);
 float warp=.5+.5*snoise(vec3(p,uTime*.01));
 float field=fract((.5+.5*snoise(vec3(p+influence*.15+warp*.5,uTime*.1)))*3.);
 gl_FragColor=vec4(step(.5,field),field,0.,1.);
}
`;

export const fluidVertex = /* glsl */`
varying vec2 vUv;
uniform vec2 boundarySpace;
void main(){ vec2 p=position.xy*(1.-2.*boundarySpace);vUv=p*.5+.5;gl_Position=vec4(p,0.,1.); }
`;

export const advectionFragment = /* glsl */`
varying vec2 vUv; uniform sampler2D velocity;
uniform vec2 fboSize; uniform float dt,dissipation;
void main(){
 vec2 ratio=max(fboSize.x,fboSize.y)/fboSize;
 vec2 a=texture2D(velocity,vUv).xy;
 vec2 back=vUv-a*dt*ratio;
 vec2 b=texture2D(velocity,back).xy;
 vec2 forward=back+b*dt*ratio;
 vec2 corrected=vUv-(forward-vUv)*.5;
 vec2 c=texture2D(velocity,corrected).xy;
 gl_FragColor=vec4(texture2D(velocity,corrected-c*dt*ratio).xy*dissipation,0.,1.);
}
`;

export const forceVertex = /* glsl */`
varying vec2 vUv;uniform vec2 center,px;uniform float radius;
void main(){ vUv=uv;gl_Position=vec4(position.xy*radius*px+center,0.,1.); }
`;
export const forceFragment = /* glsl */`
varying vec2 vUv;uniform vec2 force;
void main(){ float d=max(0.,1.-length((vUv-.5)*2.));gl_FragColor=vec4(force*d*d,0.,1.); }
`;
export const divergenceFragment = /* glsl */`
varying vec2 vUv;uniform sampler2D velocity;uniform vec2 px;uniform float dt;
void main(){
 float l=texture2D(velocity,vUv-vec2(px.x,0.)).x,r=texture2D(velocity,vUv+vec2(px.x,0.)).x;
 float b=texture2D(velocity,vUv-vec2(0.,px.y)).y,t=texture2D(velocity,vUv+vec2(0.,px.y)).y;
 gl_FragColor=vec4((r-l+t-b)*.5/dt);
}
`;
export const pressureFragment = /* glsl */`
varying vec2 vUv;uniform sampler2D pressure,divergence;uniform vec2 px;
void main(){
 vec2 x=vec2(px.x*2.,0.),y=vec2(0.,px.y*2.);
 float p=texture2D(pressure,vUv+x).r+texture2D(pressure,vUv-x).r+texture2D(pressure,vUv+y).r+texture2D(pressure,vUv-y).r;
 gl_FragColor=vec4(p/5.-texture2D(divergence,vUv).r);
}
`;
export const projectFragment = /* glsl */`
varying vec2 vUv;uniform sampler2D velocity,pressure;uniform vec2 px;uniform float dt;
void main(){
 vec2 grad=vec2(texture2D(pressure,vUv+vec2(px.x,0.)).r-texture2D(pressure,vUv-vec2(px.x,0.)).r,
 texture2D(pressure,vUv+vec2(0.,px.y)).r-texture2D(pressure,vUv-vec2(0.,px.y)).r)*.5;
 gl_FragColor=vec4(texture2D(velocity,vUv).xy-grad*dt,0.,1.);
}
`;

export const flowColorFragment = /* glsl */`
varying vec2 vUv;uniform sampler2D velocity;
void main(){vec2 v=texture2D(velocity,vUv).xy;
 gl_FragColor=vec4(mix(vec3(1.),vec3(v*.5+.5,1.),length(v)),1.);}
`;

export const compositeFragment = /* glsl */`
varying vec2 vUv;
uniform sampler2D tDefaultDiffuse,tBlueprint,tCursorEffect,tBackgroundNoise;
uniform float uReveal,uBlueprintReveal,uFilter,uCursorIntensity,uHover,uBackgroundOnly;
uniform float uCompositionLayer;
uniform vec3 uColorHover,uBackgroundColor;
void main(){
 vec4 n=texture2D(tBackgroundNoise,vUv);
 float edge=0.; const float d=.000005;
 edge=max(edge,abs(n.r-texture2D(tBackgroundNoise,vUv+vec2(d,0.)).r));
 edge=max(edge,abs(n.r-texture2D(tBackgroundNoise,vUv-vec2(d,0.)).r));
 edge=max(edge,abs(n.r-texture2D(tBackgroundNoise,vUv+vec2(0.,d)).r));
 edge=max(edge,abs(n.r-texture2D(tBackgroundNoise,vUv-vec2(0.,d)).r));
 edge=step(.000001,edge);
 vec3 bg=mix(uBackgroundColor,vec3(.018,.023,.028),edge*uReveal);
 float mask=1.-texture2D(tCursorEffect,vec2(.025)+vUv*.95).r;
 float cursor=step(.1,mask)*uCursorIntensity;
 vec3 trail=mix(uBackgroundColor+vec3(.001,.002,.005),uBackgroundColor+vec3(.002,.004,.009),n.r);
 float boundary=1.-vUv.y-sin(vUv.x*3.14159265)*sin(uBlueprintReveal*3.14159265)*.2;
 float wipe=smoothstep(boundary-.015,boundary+.015,uBlueprintReveal);
 bg=mix(bg,trail,cursor*(1.-wipe));
 float paperGrid=max(1.-smoothstep(.0,.75,abs(mod(gl_FragCoord.x,64.)-32.)),1.-smoothstep(.0,.75,abs(mod(gl_FragCoord.y,64.)-32.)));
 bg+=vec3(.0015,.0025,.008)*paperGrid*wipe;
 bg=mix(bg,uColorHover,step(n.g,-.1+uHover*1.1));
 vec4 base=texture2D(tDefaultDiffuse,vUv),alt=texture2D(tBlueprint,vUv);
 // Transparent render targets contain premultiplied RGB; undo it before mixing
 // to preserve native hair edges instead of darkening their alpha twice.
 base.rgb=base.a>.00001?base.rgb/base.a:vec3(0.);
 alt.rgb=alt.a>.00001?alt.rgb/alt.a:vec3(0.);
 vec3 color=mix(bg,base.rgb,base.a*(1.-uBackgroundOnly));
 color=mix(color,alt.rgb,alt.a*min(1.,cursor+wipe)*(1.-uBackgroundOnly));
 float outputAlpha=1.;
 if(uCompositionLayer>.5&&uCompositionLayer<1.5){color=bg;}
 if(uCompositionLayer>1.5){
   float a=base.a*(1.-uBackgroundOnly),b=alt.a*min(1.,cursor+wipe)*(1.-uBackgroundOnly);
   outputAlpha=a+b*(1.-a);
   color=outputAlpha>.00001?(base.rgb*a*(1.-b)+alt.rgb*b)/outputAlpha:vec3(0.);
 }
 float grey=dot(color,vec3(.299,.587,.114));
 color=mix(color,grey*vec3(.62,.69,.49),uFilter);
 gl_FragColor=vec4(color,outputAlpha);
 #include <colorspace_fragment>
 #include <premultiplied_alpha_fragment>
}
`;

export const wireVertex = /* glsl */`
varying vec3 vPosition;
void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
export const wireFragment = /* glsl */`
varying vec3 vPosition;uniform float uTime,uOpacity;
void main(){float scan=.1*pow(fract(-vPosition.y*10.-uTime),4.);gl_FragColor=vec4(vec3(.1,.125,.14),scan*uOpacity);}
`;

export const blueprintVertex=/* glsl */`
varying vec2 vBlueprintUv;
uniform sampler2D tDepth;
uniform float uDisplacement;
void main(){
 vBlueprintUv=uv;
 vec3 p=position+normal*texture2D(tDepth,uv).r*uDisplacement;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;

export const blueprintFragment=/* glsl */`
varying vec2 vBlueprintUv;
uniform sampler2D tPortrait,tDepth,tAlpha;
uniform float uTime;
void main(){
 vec2 uv=vBlueprintUv;
 float alpha=texture2D(tAlpha,uv).g;
 if(alpha<.015)discard;
 vec3 image=texture2D(tPortrait,uv).rgb;
 float grey=dot(image,vec3(.299,.587,.114));
 float depth=texture2D(tDepth,uv).r;
 float contours=1.-smoothstep(.025,.085,abs(fract(depth*22.)-.5));
 float gridX=1.-smoothstep(.018,.045,abs(fract(uv.x*28.)-.5));
 float gridY=1.-smoothstep(.018,.045,abs(fract(uv.y*28.)-.5));
 float scan=1.-smoothstep(.002,.009,abs(uv.y-fract(uTime*.12)));
 float ink=floor(pow(clamp(grey,0.,1.),.65)*12.)/12.;
 vec3 color=mix(vec3(.002,.004,.018),vec3(.045,.085,.36),ink);
 color+=vec3(.025,.055,.13)*contours;
 color+=vec3(.008,.014,.035)*max(gridX,gridY);
 color+=vec3(.025,.05,.12)*scan;
 // Small photographic details remain readable between contour lines.
 float stipple=step(.82,fract(gl_FragCoord.x*.5)*fract(gl_FragCoord.y*.5)*4.);
 color+=vec3(.008,.014,.03)*stipple*grey;
 gl_FragColor=vec4(color,alpha);
 #include <colorspace_fragment>
}`;

export const blueprintWireFragment=/* glsl */`
varying vec2 vBlueprintUv;
uniform sampler2D tAlpha,tDepth;
uniform float uTime;
void main(){
 float alpha=texture2D(tAlpha,vBlueprintUv).g;
 float depth=texture2D(tDepth,vBlueprintUv).r;
 gl_FragColor=vec4(vec3(.15,.27,.64),alpha*(.05+depth*.08));
 #include <colorspace_fragment>
}`;
