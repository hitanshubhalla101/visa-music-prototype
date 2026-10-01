/**
 * The world: an arena on show night, inside and out.
 *
 * THE RULE — blue means you're in.
 *   · A fan's wristband, and the gate reader, light Visa blue when their card is approved;
 *     only then do they walk through the gate into the show.
 *   · Amber that fades out is a card that is not eligible: the gate stays shut, the fan steps aside.
 *   · Inside, every band is blue: everyone in there got in.
 *   · Gold (Register-to-Win only) is an entrant picked in the random drawing. Winners are the
 *     gold at the front of the stage.
 * Stage lights, the marquee and the work beam are just the venue; they never mean "approved".
 *
 * One full-screen fragment shader: analytic boxes, cylinders, capsules and spheres, two crowd
 * planes with hashed wristbands, and analytic beams and glows. No images, no libraries.
 */

export type Variant = 'access' | 'sweeps';
export type V3 = [number, number, number];

export interface Shot {
  p: V3; t: V3; f: number;
  pm?: V3; tm?: V3;
  via?: V3; via2?: V3; tvia?: V3;
  lens?: 1;
}

export const CROWD_Y = 1.45;
/** The facade: front face at z = 41, doorway |x| < 9, y < 7. */
export const FACADE_Z = 41;
export const GATE_Z = 41.8;
/** The reader on the pillar at x = 3, and where a tapping hand ends up. */
export const READER: V3 = [2.95, 1.13, 42.1];
/** The two fans at the hero gate stand here to tap: A (not eligible), then B (approved). */
export const TAP_SPOT: [number, number] = [2.1, 42.5];

/** Where the drawing's spotlight lands on the plaza, in order (x, z). */
export const DRAW_SPOTS: Array<[number, number]> = [[-4, 58], [7, 66], [13, 55]];
/** When each spot is reached, as a fraction of the drawing clock. */
export const DRAW_AT = [0.3, 0.55, 0.8];
/** Where the winners are once they're in: gold at the front of the stage. */
export const WIN_SPOTS: Array<[number, number]> = [[-7, -27], [3, -24], [11, -28]];

/** The highest point of the hero subject (top of the stage screen), for the hero lens. */
export const SUBJECT_TOP: V3 = [0, 16, -49.6];

/** Shoulder, hand and wristband of a fan at (x, z) with the arm raised by `arm` (0 down … 1 at the reader).
 *  Written twice: here for the callouts and in the shader's handOf(); they move together. */
export function armOf(x: number, z: number, arm: number): { s: V3; h: V3; band: V3 } {
  const s: V3 = [x + 0.22, 1.38, z];
  const rest: V3 = [x + 0.27, 0.84, z - 0.04];
  const to: V3 = [READER[0] - 0.05, READER[1] + 0.06, READER[2]];
  const e = arm * arm * (3 - 2 * arm);
  const h: V3 = [rest[0] + (to[0] - rest[0]) * e, rest[1] + (to[1] - rest[1]) * e, rest[2] + (to[2] - rest[2]) * e];
  const band: V3 = [s[0] + (h[0] - s[0]) * 0.8, s[1] + (h[1] - s[1]) * 0.8, s[2] + (h[2] - s[2]) * 0.8];
  return { s, h, band };
}

// ── shots ─────────────────────────────────────────────────────────────────────
const INSIDE: Shot = {                   // the show: what everyone outside is waiting for
  p: [2, 8, 33], t: [-9, 6, -40], f: 36, lens: 1,
  pm: [0, 9, 34], tm: [0, 7.5, -40],
};
const GATE: Shot = {                     // the reader, the fan tapping, the one behind
  p: [-0.2, 1.75, 50], t: [1.2, 1.2, 42.5], f: 32,
  pm: [0.4, 2.4, 49], tm: [2, 0.9, 42.5],
};
const OUT: V3 = [0, 4.5, 38];            // dolly backwards out of the doorway

export const SHOTS: Record<Variant, Shot[]> = {
  access: [
    INSIDE,
    { p: [18, 3, 64], t: [-3, 4.5, 41], f: 42, pm: [1, 8, 62], tm: [0, 1.5, 42], via: OUT, via2: [1, 3.5, 46] }, // 01 the line
    { ...GATE },                                                                                                  // 02 the gate
    { p: [1.35, 1.55, 43.5], t: [2.8, 1.18, 42.05], f: 30, pm: [1.9, 1.75, 43.7], tm: [2.8, 1.02, 42.1] },       // 03 the band
    { p: [8, 15, 36], t: [-6, 1.5, -28], f: 40, pm: [0, 16, 38], tm: [0, 1.5, -24],                              // 04 follow them in
      via: [1.5, 2.2, 40], via2: [4, 9, 37.5] },
  ],
  sweeps: [
    INSIDE,
    { ...GATE, via: OUT, via2: [0.5, 3, 44] },                                                                    // 01 verify at the gate
    { p: [14, 7.5, 84], t: [-2, 1.2, 55], f: 40, pm: [5, 9, 86], tm: [0, 1.2, 56] },                              // 02 entries come in
    { p: [6, 30, 88], t: [-2, 1.4, 62], f: 42, pm: [0, 32, 86], tm: [0, 1.4, 62] },                               // 03 the drawing
    { p: [6, 7, 30], t: [-4, 2, -30], f: 40, pm: [0, 8, 32], tm: [0, 1.5, -26],                                  // 04 winners go in
      via: [3, 4, 52], via2: [2, 2.6, 43] },
  ],
};

const f2 = (x: number) => x.toFixed(2);
const v2 = (a: Array<[number, number]>) => a.map((s) => `vec2(${f2(s[0])},${f2(s[1])})`).join(',');

export const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime,uTanH,uShift,uLit,uLitP,uA,uB,uCode,uStage,uBeam,uLanded,uLandedIn,uGold,uOpen,uQueue,uLanes,uPlaza;
uniform vec3 uPos,uTgt,uSpot;
uniform vec4 uFA,uFB;   // fan A / fan B at the hero gate: x, z, arm raised 0..1, shown 0/1

const vec3 BAND=vec3(.03,.16,1.);
const vec3 AMBER=vec3(1.,.5,.1);
const vec3 GOLD=vec3(1.,.7,.12);
const vec3 WHITE=vec3(.82,.88,1.);
const vec3 SHOW=vec3(.5,.3,.95);
const float CY=${f2(CROWD_Y)};
const float FZ=${f2(FACADE_Z)};
const float GZ=${f2(GATE_Z)};
const vec3 READER=vec3(${READER.map(f2).join(',')});
const int ND=${DRAW_SPOTS.length};
const vec2 DS[ND]=vec2[ND](${v2(DRAW_SPOTS)});
const vec2 DSI[ND]=vec2[ND](${v2(WIN_SPOTS)});

float h21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*vn(p);p=p*2.03+vec2(13.7,5.1);a*=.5;}return s;}

// ── the night sky outside, with the glow of the show above the arena ──
vec3 sky(vec3 rd){
  float up=max(rd.y,0.);
  vec3 c=mix(vec3(.03,.035,.07),vec3(.004,.006,.016),pow(up,.45));
  float st=max(dot(rd,normalize(vec3(0.,.12,-1.))),0.);
  c+=vec3(.08,.07,.2)*pow(st,4.)*(.6+.8*uStage);
  vec2 g=floor(rd.xz/(rd.y+.25)*260.);
  c+=step(.9975,h21(g))*smoothstep(.1,.5,rd.y)*.7;
  return c;
}

// ── intersection ──
struct Hit{float t;vec3 n;int m;float id;vec3 q;};
float iBox(vec3 ro,vec3 ird,vec3 c,vec3 h,out vec3 n){
  vec3 p=(c-ro)*ird, k=abs(ird)*h, t1=p-k, t2=p+k;
  float tn=max(max(t1.x,t1.y),t1.z), tf=min(min(t2.x,t2.y),t2.z);
  n=vec3(0.);
  if(tn>tf||tf<0.) return 1e9;
  n=-sign(ird)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz);
  return tn;
}
bool hitsBox(vec3 ro,vec3 ird,vec3 c,vec3 h,float tmax){
  vec3 p=(c-ro)*ird, k=abs(ird)*h, t1=p-k, t2=p+k;
  float tn=max(max(t1.x,t1.y),t1.z), tf=min(min(t2.x,t2.y),t2.z);
  return tn<=tf&&tf>0.&&tn<tmax;
}
void bx(vec3 ro,vec3 ird,vec3 c,vec3 h,int m,float id,inout Hit H){
  vec3 n; float t=iBox(ro,ird,c,h,n);
  if(t>0.&&t<H.t){H.t=t;H.n=n;H.m=m;H.id=id;H.q=c;}
}
void cyl(vec3 ro,vec3 rd,vec2 c,float r,float y0,float y1,int m,float id,inout Hit H){
  vec2 oc=ro.xz-c, d=rd.xz;
  float a=dot(d,d), b=dot(oc,d), cc=dot(oc,oc)-r*r, h=b*b-a*cc;
  if(h<0.||a<1e-7) return;
  float t=(-b-sqrt(h))/a, y=ro.y+rd.y*t;
  if(t<0.||t>=H.t||y<y0||y>y1) return;
  vec3 p=ro+rd*t; H.t=t; H.n=normalize(vec3(p.x-c.x,0.,p.z-c.y)); H.m=m; H.id=id; H.q=vec3(c.x,y0,c.y);
}
void sph(vec3 ro,vec3 rd,vec3 c,float r,int m,float id,inout Hit H){
  vec3 oc=ro-c; float b=dot(oc,rd), h=b*b-dot(oc,oc)+r*r;
  if(h<0.) return;
  float t=-b-sqrt(h);
  if(t<0.||t>=H.t) return;
  H.t=t; H.n=normalize(ro+rd*t-c); H.m=m; H.id=id; H.q=c;
}
void cap(vec3 ro,vec3 rd,vec3 pa,vec3 pb,float r,int m,float id,inout Hit H){
  vec3 ba=pb-pa, oa=ro-pa;
  float baba=dot(ba,ba), bard=dot(ba,rd), baoa=dot(ba,oa), rdoa=dot(rd,oa), oaoa=dot(oa,oa);
  float a=baba-bard*bard, b=baba*rdoa-baoa*bard, c=baba*oaoa-baoa*baoa-r*r*baba, h=b*b-a*c;
  if(h<0.) return;
  float t=(-b-sqrt(h))/a, y=baoa+t*bard;
  if(!(y>0.&&y<baba)){
    vec3 oc=y<=0.?oa:ro-pb; b=dot(rd,oc); c=dot(oc,oc)-r*r; h=b*b-c;
    if(h<=0.) return;
    t=-b-sqrt(h);
  }
  if(t<0.||t>=H.t) return;
  vec3 p=ro+rd*t, pp=p-pa; float k=clamp(dot(pp,ba)/baba,0.,1.);
  H.t=t; H.n=(pp-k*ba)/r; H.m=m; H.id=id; H.q=vec3(k,0.,0.);
}

// A fan, as a silhouette: legs, torso, head, a hanging left arm. The right arm wears the band.
bool nearFan(vec3 ro,vec3 rd,vec2 f,float tmax){
  vec2 oc=ro.xz-f, d=rd.xz;
  float a=dot(d,d), b=dot(oc,d), c=dot(oc,oc)-.16, h=b*b-a*c;
  if(h<0.||a<1e-7) return length(oc)<.4;
  float t0=(-b-sqrt(h))/a, t1=(-b+sqrt(h))/a;
  if(t1<0.||t0>tmax) return false;
  float y0=ro.y+rd.y*max(t0,0.), y1=ro.y+rd.y*t1;
  return min(y0,y1)<1.8&&max(y0,y1)>0.;
}
void body(vec3 ro,vec3 rd,vec2 f,float id,inout Hit H){
  cap(ro,rd,vec3(f.x,1.,f.y),vec3(f.x,1.33,f.y),.19,8,id,H);                  // torso
  cap(ro,rd,vec3(f.x-.09,.08,f.y),vec3(f.x-.09,.92,f.y),.075,8,id,H);         // legs
  cap(ro,rd,vec3(f.x+.09,.08,f.y),vec3(f.x+.09,.92,f.y),.075,8,id,H);
  sph(ro,rd,vec3(f.x,1.64,f.y),.105,8,id,H);                                  // head
  cap(ro,rd,vec3(f.x-.23,1.36,f.y),vec3(f.x-.27,.86,f.y+.03),.052,8,id,H);    // left arm
}
void fan(vec3 ro,vec3 rd,vec2 f,float id,inout Hit H){
  if(!nearFan(ro,rd,f,H.t)) return;
  body(ro,rd,f,id,H);
  cap(ro,rd,vec3(f.x+.23,1.36,f.y),vec3(f.x+.27,.86,f.y-.03),.052,12,id,H);   // right arm, with the band
}
// The two at the hero gate also have an arm that reaches the reader (mirrors armOf() in JS).
vec3 handOf(vec4 F){
  vec3 rest=vec3(F.x+.27,.84,F.y-.04);
  float e=F.z*F.z*(3.-2.*F.z);
  return mix(rest,READER+vec3(-.05,.06,0.),e);
}
void tapper(vec3 ro,vec3 rd,vec4 F,float id,inout Hit H){
  if(F.w<.5) return;
  body(ro,rd,F.xy,id,H);
  cap(ro,rd,vec3(F.x+.22,1.38,F.y),handOf(F),.052,9,id,H);
}
// Every lane has a barrier, and nobody gets past it unverified. Each lane runs the same cycle
// (q = 0..1): the front fan stands at the gate and taps; the reader and their band turn blue;
// only then does the barrier open; they walk through; it shuts behind them; the line steps up.
// The fans, the readers, the bands and the barriers all read these same functions, so they can't drift apart.
float laneQ(int i){return uQueue*(.9+.12*float(i))+float(i)*.37;}
const float TAP_Z=42.55;                                  // where the front fan stands to tap
float laneApproved(float q){return smoothstep(.12,.16,q);}                    // card approved: blue
float laneOpen(float q){return smoothstep(.2,.28,q)*(1.-smoothstep(.6,.7,q));}  // barrier up, only after approval
float leadZ(float q){return TAP_Z-smoothstep(.28,.95,q)*7.;}                  // waits, then walks in
float stepUp(float q){return smoothstep(.62,.98,q);}                          // the line moves up one place
void lanes(vec3 ro,vec3 rd,vec3 ird,inout Hit H){
  for(int i=0;i<4;i++){
    float x=-4.5+3.*float(i);
    if(!hitsBox(ro,ird,vec3(x,.9,47.),vec3(.4,.95,11.),H.t)) continue;
    if(i==2){                                            // the hero lane: a line behind the two at the gate
      for(int k=0;k<6;k++) fan(ro,rd,vec2(x+.12*sin(float(k)*2.1),47.6+float(k)*1.2),10.+float(k),H);
      continue;
    }
    float q=fract(laneQ(i));
    fan(ro,rd,vec2(x,leadZ(q)),-1.-float(i),H);          // the front fan: id encodes the lane
    for(int k=0;k<8;k++) fan(ro,rd,vec2(x+.08*sin(float(k)*1.7+float(i)),TAP_Z+(float(k)+1.-stepUp(q))*1.2),float(k),H);
  }
}

Hit trace(vec3 ro,vec3 rd){
  Hit H; H.t=1e9; H.m=-1; H.n=vec3(0.); H.id=0.; H.q=vec3(0.);
  vec3 ird=1./rd;
  if(rd.y<0.){
    float t=(CY-ro.y)/rd.y; vec3 p=ro+rd*t;
    if(t>0.&&abs(p.x)<31.&&p.z>-33.&&p.z<36.){H.t=t;H.n=vec3(0.,1.,0.);H.m=1;H.id=0.;}                 // the crowd inside
    else if(uPlaza>.5&&t>0.&&abs(p.x)<26.&&p.z>47.5&&p.z<86.){H.t=t;H.n=vec3(0.,1.,0.);H.m=1;H.id=1.;} // entrants outside
    float tg=-ro.y/rd.y;                                                                               // the ground
    if(tg>0.&&tg<H.t){H.t=tg;H.n=vec3(0.,1.,0.);H.m=7;H.id=0.;}
  }
  bx(ro,ird,vec3(0.,1.1,-42.),vec3(20.,1.1,8.),2,0.,H);         // stage deck, front at z=-34
  bx(ro,ird,vec3(0.,9.5,-49.6),vec3(19.,6.5,.4),3,0.,H);        // the screen
  bx(ro,ird,vec3(0.,18.2,-38.),vec3(24.,.3,.3),4,0.,H);         // lighting truss
  bx(ro,ird,vec3(-24.5,9.,-38.),vec3(.35,9.2,.35),4,0.,H);
  bx(ro,ird,vec3(24.5,9.,-38.),vec3(.35,9.2,.35),4,0.,H);
  bx(ro,ird,vec3(-40.,2.5,0.),vec3(6.,2.5,36.),5,0.,H);         // the stands
  bx(ro,ird,vec3(-49.,6.,0.),vec3(4.,6.,36.),5,1.,H);
  bx(ro,ird,vec3(40.,2.5,0.),vec3(6.,2.5,36.),5,0.,H);
  bx(ro,ird,vec3(49.,6.,0.),vec3(4.,6.,36.),5,1.,H);
  // the shell: facade with its doorway, walls, roof
  bx(ro,ird,vec3(-32.5,13.5,40.5),vec3(23.5,13.5,.5),6,0.,H);
  bx(ro,ird,vec3(32.5,13.5,40.5),vec3(23.5,13.5,.5),6,0.,H);
  bx(ro,ird,vec3(0.,17.,40.5),vec3(9.,10.,.5),6,1.,H);
  bx(ro,ird,vec3(0.,27.5,-7.5),vec3(56.,.5,48.5),6,2.,H);
  bx(ro,ird,vec3(-56.5,13.5,-7.5),vec3(.5,13.5,48.5),6,2.,H);
  bx(ro,ird,vec3(56.5,13.5,-7.5),vec3(.5,13.5,48.5),6,2.,H);
  bx(ro,ird,vec3(0.,13.5,-56.5),vec3(56.5,13.5,.5),6,2.,H);
  // the gates
  if(hitsBox(ro,ird,vec3(0.,1.,GZ),vec3(6.5,1.2,.6),H.t)){
    for(int i=0;i<5;i++) bx(ro,ird,vec3(-6.+3.*float(i),.55,GZ),vec3(.18,.55,.45),10,float(i),H);
    for(int i=0;i<4;i++){                                          // a barrier on every lane
      float open=i==2?uOpen:uLanes>.5?laneOpen(fract(laneQ(i))):0.;
      float hw=mix(1.32,.02,open), xr=-3.18+3.*float(i);
      bx(ro,ird,vec3(xr-hw,.92,GZ),vec3(hw,.035,.035),11,float(i),H);
    }
  }
  if(uLanes>.5) lanes(ro,rd,ird,H);
  if(length(ro.xz-vec2(2.,43.))<60.){ tapper(ro,rd,uFA,0.,H); tapper(ro,rd,uFB,1.,H); }
  return H;
}

// ── the rule: whose band is lit ──
float litKey(vec2 w,float h){return h*.35+clamp((w.y+33.)/69.,0.,1.)*.65;}   // inside: front rows first
vec3 bandCol(vec2 w,float h,float outside){
  float lit=outside>.5?clamp((uLitP-h)/.04,0.,1.):clamp((uLit-litKey(w,h))/.04,0.,1.);
  vec3 c=mix(vec3(.45,.48,.6)*.3, BAND*(2.5+.5*sin(uTime*2.6+h*40.)), lit);
  if(uGold>.5){
    for(int i=0;i<ND;i++){
      float on=outside>.5?clamp(uLanded-float(i),0.,1.):clamp(uLandedIn-float(i),0.,1.);
      vec2 s=outside>.5?DS[i]:DSI[i];
      c=mix(c,GOLD*2.8,on*smoothstep(2.4,1.6,length(w-s))*step(.2,lit));
    }
  }
  return c;
}
vec3 bands(vec3 p,float t,float outside){
  float cs=.95;
  vec2 g=p.xz/cs, cell=floor(g), f=g-cell;
  float h=h21(cell), h2=h21(cell+17.3);
  if(h2>.62) return vec3(0.);
  vec2 dp=vec2(.25+.5*h21(cell+3.1),.25+.5*h21(cell+7.7));
  float d=length(f-dp)*cs, r=max(.045,t*.0021);
  float g0=exp(-d*d/(r*r))*pow(.045/r,1.1);
  return g0*bandCol((cell+dp)*cs,h,outside);
}

// ── light ──
vec3 doorGlow(vec3 p){                                 // the show spilling out of the doorway
  vec3 d=p-vec3(0.,3.,FZ); return SHOW*(.35+.5*uStage)*14./(dot(d,d)+14.);
}
vec3 shade(vec3 ro,vec3 rd,Hit H){
  vec3 p=ro+rd*H.t, n=H.n, alb=vec3(.05), em=vec3(0.);
  bool outside=p.z>FZ-.01;
  vec3 L=vec3(0.,11.,-36.)-p; float ld=length(L); L/=ld;
  float key=outside?0.:(.7+1.4*uStage)*max(dot(n,L),0.)*90./(ld*ld+90.);
  vec3 amb=vec3(.035,.04,.07);
  if(outside) amb+=doorGlow(p)*(.5+.8*max(n.z,0.));
  if(H.m==1){                                           // a crowd, seen as heads and raised hands
    float b=fbm(p.xz*2.1);
    alb=vec3(.011,.012,.018)*(.5+b);
    if(H.id<.5){ float spill=exp(-(p.z+34.)*.055); em+=vec3(.05,.06,.14)*spill*(.6+1.2*uStage)*b; }
    em+=bands(p,H.t,H.id);
    if(uGold>.5){
      for(int i=0;i<ND;i++){
        float on=H.id>.5?clamp(uLanded-float(i),0.,1.):clamp(uLandedIn-float(i),0.,1.);
        vec2 s=H.id>.5?DS[i]:DSI[i];
        em+=GOLD*(H.id>.5?.22:.6)*on*exp(-dot(p.xz-s,p.xz-s)/4.5);
      }
      if(H.id>.5) em+=GOLD*.5*uSpot.z*exp(-dot(p.xz-uSpot.xy,p.xz-uSpot.xy)/3.);
    }
  } else if(H.m==2){                                    // stage deck with a light strip
    alb=vec3(.04);
    em+=WHITE*(1.4+1.6*uStage)*(1.-smoothstep(0.,.06,abs(p.y-2.12)))*step(.5,n.z);
  } else if(H.m==3){                                    // the stage screen
    vec2 uv=vec2(p.x/38.+.5,(p.y-3.)/13.);
    vec3 s=mix(vec3(.05,.07,.32),vec3(.42,.16,.62),uv.y)*(.6+.4*sin(uv.x*9.+uTime*.6+uv.y*3.));
    em+=s*(.75+.25*step(.5,fract(uv.y*26.)))*mix(.42,1.3,uStage)*step(.5,n.z);
    alb=vec3(.01);
  } else if(H.m==4){ alb=vec3(.08);                     // truss and towers
  } else if(H.m==5){                                    // the stands: everyone in there got in
    alb=vec3(.02);
    if(n.y>.5||abs(n.x)>.5){
      vec2 uv=n.y>.5?p.xz:p.zy;
      vec2 g=uv/vec2(1.1,.9), c=floor(g), f=fract(g);
      float h=h21(c+H.id*9.1), d=length(f-.5), r=max(.12,H.t*.0024);
      em+=smoothstep(r,0.,d)*step(h21(c+4.2),.5)*bandCol(p.xz,h,0.)*.9;
    }
  } else if(H.m==6){                                    // the building
    alb=vec3(.035,.038,.05);
    if(outside&&n.z>.5){
      vec2 pn=vec2(p.x/4.,p.y/3.);                      // cladding panels
      alb*=.75+.25*step(.06,fract(pn.x))*step(.06,fract(pn.y));
      if(abs(p.y-11.5)<1.6&&abs(p.x)<24.){              // the marquee: tonight's show
        float u=p.x/48.+.5;
        vec3 s=mix(vec3(.45,.16,.62),vec3(.2,.1,.45),u)*(.65+.35*sin(u*14.-uTime*1.2));
        em+=s*1.05*(.8+.2*step(.5,fract(p.y*5.)))*(1.-smoothstep(1.35,1.6,abs(p.y-11.5)));
      }
      em+=WHITE*.5*(1.-smoothstep(0.,.08,abs(abs(p.x)-9.2)))*step(p.y,7.2)*step(abs(p.x),9.4);   // door frame
      em+=WHITE*.4*(1.-smoothstep(0.,.08,abs(p.y-7.15)))*step(abs(p.x),9.3);
    } else if(H.id>1.5&&n.y<-.5){                       // the roof from inside: rig lights
      vec2 g=p.xz/6., c=floor(g);
      em+=vec3(.6,.7,1.)*.3*smoothstep(.08,0.,length(fract(g)-.5))*step(.5,h21(c));
    }
  } else if(H.m==7){                                    // the ground: plaza and concourse
    alb=vec3(.022,.024,.03)*(1.+.4*vn(p.xz*3.));
    if(outside){                                      // the forecourt, lit by the show spilling out
      vec3 d=p-vec3(0.,0.,FZ);
      em+=SHOW*(.1+.12*uStage)*exp(-dot(d.xz*vec2(.07,.11),d.xz*vec2(.07,.11)));
    }
  } else if(H.m==8){                                    // a fan: silhouette, rim lit by the doorway
    alb=vec3(.06,.055,.06);
    float rim=pow(1.-max(dot(n,-rd),0.),2.5);
    em+=(outside?SHOW*.5:vec3(.16,.2,.42)*.4)*rim;
  } else if(H.m==12){                                   // a fan's right arm: the band at the wrist, lit once they're through
    alb=vec3(.06,.055,.06);
    float rim=pow(1.-max(dot(n,-rd),0.),2.5);
    em+=(outside?SHOW*.5:vec3(.16,.2,.42)*.4)*rim;
    float in_=outside?step(p.z,GZ-.3):1.;
    if(H.id<-.5) in_=laneApproved(fract(laneQ(int(-H.id-.5))));   // a front fan: lit on approval
    em+=(1.-smoothstep(.04,.07,abs(H.q.x-.86)))*mix(vec3(.3,.32,.4)*.35,BAND*2.4,in_);
  } else if(H.m==9){                                    // the tapping arm and its band
    alb=vec3(.035,.03,.03);
    float k=H.q.x, rim=pow(1.-max(dot(n,-rd),0.),3.);
    em+=SHOW*.3*rim;
    vec3 on=H.id<.5?AMBER*uA*3.:BAND*uB*(3.+2.5*uCode);
    em+=(1.-smoothstep(.035,.06,abs(k-.8)))*(on+vec3(.3,.32,.4)*.15);
  } else if(H.m==10){                                   // gate pillars and their readers
    alb=vec3(.06,.065,.08);
    float top=step(.5,n.y)*(1.-smoothstep(.1,.16,abs(p.z-(GZ+.3))));
    vec3 idle=WHITE*.35, c=idle;
    int i=int(H.id+.5);
    if(i==3) c=mix(mix(idle,AMBER*2.5,uA),BAND*3.,uB);
    else if(i>0&&uLanes>.5){ float q=fract(laneQ(i-1)); c=mix(idle,BAND*3.,laneApproved(q)*(1.-smoothstep(.62,.72,q))); }
    em+=c*top+c*.3*step(.5,n.z)*(1.-smoothstep(.02,.05,abs(p.y-.9)));
  } else if(H.m==11){                                   // the barrier: shut until approved
    alb=vec3(.1);
    int i=int(H.id+.5);
    float open=i==2?uOpen:uLanes>.5?laneOpen(fract(laneQ(i))):0.;
    em+=mix(WHITE*.8,BAND*2.2,smoothstep(.1,.5,open));
  }
  return alb*(amb+key*vec3(.75,.8,1.))+em;
}

vec3 beam(vec3 ro,vec3 rd,float tmax,vec3 a,vec3 b,float w0,float w1){
  vec3 ba=b-a, w=ro-a;
  float bb=dot(ba,ba), rb=dot(rd,ba), ob=dot(w,ba), wr=dot(w,rd);
  float s=clamp((ob-wr*rb)/max(bb-rb*rb,1e-4),0.,1.);
  float t=clamp(s*rb-wr,0.,tmax);
  s=clamp(dot(w+rd*t,ba)/bb,0.,1.);
  float d=length(w+rd*t-ba*s), ww=mix(w0,w1,s);
  return vec3(exp(-d*d/(ww*ww))*(1.-.55*s)*step(0.,t));
}
vec3 glow(vec3 ro,vec3 rd,float tmax,vec3 P,float k,float e){
  float t=clamp(dot(P-ro,rd),0.,tmax), d=length(ro+rd*t-P);
  return vec3(k/(d*d+e));
}
vec3 glows(vec3 ro,vec3 rd,float tmax){
  vec3 g=vec3(0.);
  if(uBeam>0.){
    vec3 a=vec3(-15.,18.,-38.), b=vec3(-4.+16.*sin(uTime*.33),CY,-6.+10.*cos(uTime*.21));
    g+=WHITE*.2*uBeam*beam(ro,rd,tmax,a,b,.25,2.6);
  }
  if(uStage>.01){
    for(int i=0;i<6;i++){
      float fi=float(i), x=-20.+8.*fi;
      vec3 a=vec3(x,18.,-38.), b=vec3(x*.6+9.*sin(uTime*.5+fi*1.7),CY,-18.+12.*cos(uTime*.37+fi));
      vec3 c=mod(fi,2.)<.5?WHITE:vec3(.55,.35,1.);
      g+=c*.075*uStage*beam(ro,rd,tmax,a,b,.2,2.2);
      g+=c*uStage*glow(ro,rd,tmax,a,.02,.03);
    }
  }
  // the hero gate: the reader and the bands of the two fans
  float rc=max(uA,uB);
  if(rc>0.) g+=(uB>=uA?BAND:AMBER)*rc*glow(ro,rd,tmax,READER+vec3(0.,.04,0.),.0016,.004);
  if(uFA.w>.5&&uA>0.) g+=AMBER*uA*glow(ro,rd,tmax,mix(vec3(uFA.x+.22,1.38,uFA.y),handOf(uFA),.8),.0008,.003);
  if(uFB.w>.5&&uB>0.) g+=BAND*uB*(1.+1.5*uCode)*glow(ro,rd,tmax,mix(vec3(uFB.x+.22,1.38,uFB.y),handOf(uFB),.8),.001,.003);
  if(uGold>.5&&uLandedIn>0.){                          // inside: each winner in a follow-spot at the front
    for(int i=0;i<ND;i++){
      float on=clamp(uLandedIn-float(i),0.,1.);
      g+=GOLD*.16*on*beam(ro,rd,tmax,vec3(DSI[i].x*.5,18.,-37.),vec3(DSI[i].x,CY,DSI[i].y),.15,1.4);
    }
  }
  if(uGold>.5&&uSpot.z>0.){
    vec3 a=vec3(uSpot.x*.3,26.,uSpot.y+14.), b=vec3(uSpot.x,CY,uSpot.y);
    g+=GOLD*.32*uSpot.z*beam(ro,rd,tmax,a,b,.2,1.7);
  }
  return g;
}

vec3 render(vec3 ro,vec3 rd){
  Hit H=trace(ro,rd);
  float tmax=min(H.t,400.);
  vec3 gl=glows(ro,rd,tmax);
  if(H.t>1e8) return sky(rd)+gl;
  vec3 c=shade(ro,rd,H);
  float fog=1.-exp(-H.t*.0065);
  vec3 fc=sky(normalize(vec3(rd.x,.03,rd.z)))*.55;
  return mix(c,fc,fog)+gl;
}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y;
  vec3 fw=normalize(uTgt-uPos), rt=normalize(cross(fw,vec3(0.,1.,0.))), up=cross(rt,fw);
  vec3 rd=normalize(fw+(uv.x*rt+(uv.y+uShift)*up)*uTanH);
  vec3 col=pow(aces(render(uPos,rd)*1.3),vec3(1./2.2));
  vec2 q=gl_FragCoord.xy/uRes;
  col*=.5+.5*pow(16.*q.x*q.y*(1.-q.x)*(1.-q.y),.18);
  col+=(h21(gl_FragCoord.xy+fract(uTime*7.)*97.)-.5)*.018;
  fragColor=vec4(col,1.);
}`;

export const UNIFORMS = ['uRes', 'uTime', 'uTanH', 'uShift', 'uLit', 'uLitP', 'uA', 'uB', 'uCode', 'uStage', 'uBeam',
  'uLanded', 'uLandedIn', 'uGold', 'uOpen', 'uQueue', 'uLanes', 'uPlaza', 'uPos', 'uTgt', 'uSpot', 'uFA', 'uFB'] as const;
