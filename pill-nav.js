// Adapted from the PillNav source supplied by the user; original motion engine.
export function initPillNav(){
 const root=document.querySelector('.pill-nav');if(!root)return;
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const trackRef={current:root.querySelector('.pill-nav__track')};
 const slotRefs={current:[...root.querySelectorAll('.pill-nav__slot')]};
 const dotRef={current:root.querySelector('.pill-nav__dot')};
 const glideRef={current:null},inkRef={current:null},slideRef={current:false};
 const links=[...root.querySelectorAll('a.pill-nav__item')];
 const settingsRef={current:{hoverEffect:'fill',indicator:'dot',activeIndex:0,bounce:0,stretch:.5}};


    if (!root) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      x0: 0,
      x1: 0,
      v0: 0,
      v1: 0,
      alpha: 0,
      pop: 1,
      press: 1,
      pressVelocity: 0,
      dotX: 0,
      dotVelocity: 0,
      dotAlpha: 0,
      hover: -1,
      focus: false,
      sliding: false,
      pressing: false,
      waiting: slideRef.current && !reduce
    };
    slideRef.current = false;
    const rects = [];
    let trackWidth = 0;
    let trackHeight = 0;
    let raf = 0;
    let last = 0;

    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      trackWidth = track.offsetWidth;
      trackHeight = track.offsetHeight;
      slotRefs.current.forEach((slot, index) => {
        if (!slot) return;
        rects[index] = { left: slot.offsetLeft, width: slot.offsetWidth };
        const reach = Math.ceil(2 * Math.sqrt((slot.offsetWidth / 2) ** 2 + slot.offsetHeight ** 2)) + 2;
        slot.style.setProperty('--pn-fill', `${reach}px`);
      });
    };

    const glideIndex = () => {
      const s = settingsRef.current;
      if (s.hoverEffect === 'fill') return -1;
      if (s.hoverEffect === 'glide' && state.hover >= 0) return state.hover;
      return s.indicator === 'pill' ? s.activeIndex : -1;
    };

    const sync = () => {
      const s = settingsRef.current;
      slotRefs.current.forEach((slot, index) => {
        if (!slot) return;
        const hovered = state.hover === index;
        slot.toggleAttribute('data-lit', hovered);
        slot.toggleAttribute('data-hover', hovered && s.hoverEffect === 'fill');
      });
      root.toggleAttribute('data-focus', state.focus && state.hover >= 0);
      root.toggleAttribute(
        'data-dot-lit',
        s.hoverEffect === 'fill' && state.hover >= 0 && state.hover === s.activeIndex
      );
    };

    const render = () => {
      const glideEl = glideRef.current;
      const ink = inkRef.current;
      const dot = dotRef.current;
      const width = Math.max(0, state.x1 - state.x0);
      const scale = state.press * state.pop;
      const target = rects[glideIndex()];
      const squash = target ? 1 - clamp((width / Math.max(target.width, 1) - 1) * 0.3, 0, 0.14) : 1;
      if (glideEl) {
        glideEl.style.width = `${width}px`;
        glideEl.style.transform = `translate3d(${state.x0}px, 0, 0) scale(${scale}, ${scale * squash})`;
        glideEl.style.opacity = `${state.alpha}`;
      }
      if (ink) {
        const half = (width * scale) / 2;
        const center = (state.x0 + state.x1) / 2;
        const inset = (trackHeight * (1 - scale * squash)) / 2;
        ink.style.clipPath = `inset(${inset}px ${trackWidth - center - half}px ${inset}px ${center - half}px round ${trackHeight / 2}px)`;
        ink.style.opacity = `${state.alpha}`;
      }
      if (dot) {
        const pull = clamp(Math.abs(state.dotVelocity) / 700, 0, 2.2);
        dot.style.transform = `translate3d(${state.dotX}px, 0, 0) scaleX(${1 + pull})`;
        dot.style.opacity = `${state.dotAlpha}`;
      }
    };

    const tick = now => {
      raf = 0;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const index = glideIndex();
      const target = rects[index];
      const zeta = 1 - 0.55 * s.bounce;
      const base = 520;
      let busy = false;

      if (target && !state.waiting) {
        const t0 = target.left;
        const t1 = target.left + target.width;
        if (state.alpha < 0.02 && !state.sliding) {
          state.x0 = t0;
          state.x1 = t1;
          state.v0 = 0;
          state.v1 = 0;
          state.pop = 0.9;
        }
        if (reduce) {
          state.x0 = t0;
          state.x1 = t1;
          state.v0 = 0;
          state.v1 = 0;
        } else {
          const direction = Math.sign((t0 + t1) / 2 - (state.x0 + state.x1) / 2);
          const lead = base * (1 + 0.9 * s.stretch);
          const trail = base * (1 - 0.5 * s.stretch);
          const k0 = direction < 0 ? lead : direction > 0 ? trail : base;
          const k1 = direction > 0 ? lead : direction < 0 ? trail : base;
          const steps = Math.ceil(dt / (1 / 240));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            state.v0 += (-k0 * (state.x0 - t0) - 2 * zeta * Math.sqrt(k0) * state.v0) * h;
            state.x0 += state.v0 * h;
            state.v1 += (-k1 * (state.x1 - t1) - 2 * zeta * Math.sqrt(k1) * state.v1) * h;
            state.x1 += state.v1 * h;
          }
        }
        state.alpha += (1 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.06));
        busy =
          Math.abs(state.x0 - t0) > 0.05 ||
          Math.abs(state.x1 - t1) > 0.05 ||
          Math.abs(state.v0) > 0.5 ||
          Math.abs(state.v1) > 0.5 ||
          state.alpha < 0.999;
        if (!busy) state.sliding = false;
      } else {
        state.alpha += (0 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.07));
        if (state.alpha > 0.002) busy = true;
        else state.alpha = 0;
      }

      state.pop += (1 - state.pop) * (reduce ? 1 : 1 - Math.exp(-dt / 0.09));
      if (Math.abs(1 - state.pop) > 0.001) busy = true;

      const pressTarget = state.pressing ? 0.95 : 1;
      if (reduce) {
        state.press = pressTarget;
        state.pressVelocity = 0;
      } else {
        state.pressVelocity += (-700 * (state.press - pressTarget) - 30 * state.pressVelocity) * dt;
        state.press += state.pressVelocity * dt;
      }
      if (Math.abs(state.press - pressTarget) > 0.0005 || Math.abs(state.pressVelocity) > 0.01) busy = true;

      const dotTarget = s.indicator === 'dot' ? rects[s.activeIndex] : null;
      if (dotTarget && !state.waiting) {
        const center = dotTarget.left + dotTarget.width / 2;
        if (state.dotAlpha < 0.02) {
          state.dotX = center;
          state.dotVelocity = 0;
        }
        if (reduce) {
          state.dotX = center;
          state.dotVelocity = 0;
        } else {
          const k = 360;
          const steps = Math.ceil(dt / (1 / 240));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            state.dotVelocity +=
              (-k * (state.dotX - center) - 2 * (1 - 0.5 * s.bounce) * Math.sqrt(k) * state.dotVelocity) * h;
            state.dotX += state.dotVelocity * h;
          }
        }
        state.dotAlpha += (1 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
        if (Math.abs(state.dotX - center) > 0.05 || Math.abs(state.dotVelocity) > 0.5 || state.dotAlpha < 0.999)
          busy = true;
      } else {
        state.dotAlpha += (0 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
        if (state.dotAlpha > 0.002) busy = true;
        else state.dotAlpha = 0;
      }

      render();
      if (busy) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const engine = {
      enter: (index, event) => {
        if (event?.pointerType === 'touch') return;
        state.hover = index;
        state.focus = false;
        sync();
        wake();
      },
      leave: () => {
        if (state.focus) return;
        state.hover = -1;
        sync();
        wake();
      },
      focus: (index, event) => {
        const target = event?.target;
        const visible = target instanceof Element && target.matches(':focus-visible');
        state.focus = visible;
        state.hover = visible ? index : state.hover;
        sync();
        wake();
      },
      blur: () => {
        if (!state.focus) return;
        state.focus = false;
        state.hover = -1;
        sync();
        wake();
      },
      press: event => {
        if (event && event.button > 0) return;
        state.pressing = true;
        wake();
      },
      release: () => {
        if (!state.pressing) return;
        state.pressing = false;
        wake();
      },
      refresh: () => {
        measure();
        sync();
        wake();
      }
    };

    root.querySelectorAll('.pill-nav__slot').forEach((slot,index)=>{
      slot.addEventListener('pointerenter',event=>engine.enter(index,event));
      slot.addEventListener('pointerdown',event=>engine.press(event));
      slot.addEventListener('focusin',event=>engine.focus(index,event));
      slot.addEventListener('focusout',()=>engine.blur());
      slot.querySelector('.pill-nav__item').addEventListener('click',()=>{
        if(index>=links.length)return;
        settingsRef.current.activeIndex=index;updateCurrent();engine.refresh();
      });
    });
    trackRef.current.addEventListener('pointerleave',()=>engine.leave());
    function updateCurrent(){links.forEach((link,index)=>{
      if(index===settingsRef.current.activeIndex)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
    });}
    const updateSection=()=>{
      let active=0;links.forEach((link,index)=>{const section=document.querySelector(link.getAttribute('href'));if(section&&section.getBoundingClientRect().top<=innerHeight*.4)active=index;});
      if(active!==settingsRef.current.activeIndex){settingsRef.current.activeIndex=active;updateCurrent();engine.refresh();}
    };
    window.addEventListener('scroll',updateSection,{passive:true});
    document.addEventListener('portfolio-language-change',()=>requestAnimationFrame(engine.refresh));
    updateCurrent();


    measure();
    sync();
    render();
    wake();

    let timer = 0;
    if (state.waiting) {
      state.x0 = 0;
      state.x1 = 0;
      timer = window.setTimeout(() => {
        state.waiting = false;
        if (glideIndex() >= 0) {
          state.alpha = 1;
          state.sliding = true;
        }
        wake();
      }, 420);
    }

    const resizeObserver = new ResizeObserver(() => {
      measure();
      render();
      wake();
    });
    if (trackRef.current) resizeObserver.observe(trackRef.current);
    document.fonts?.ready?.then(() => engine.refresh()).catch(() => {});
    window.addEventListener('pointerup', engine.release);
    window.addEventListener('pointercancel', engine.release);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('pointerup', engine.release);
      window.removeEventListener('pointercancel', engine.release);
      window.removeEventListener('scroll',updateSection);
    };

}
