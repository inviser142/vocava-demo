'use strict';

const viewport = document.querySelector('#viewport');
const panels = [...document.querySelectorAll('.panel')];
const ids = panels.map(p => p.id);
const names = ['Компания', 'Системы хранения', 'Инженерный подход', 'Ваш проект'];
const kindNames = { pallet: 'Паллетная', shelf: 'Полочная', mezzanine: 'Мезонинная' };
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let desired = 0, driving = false, lastTime = performance.now(), touchTimer, nativeTouch = false;
let wheelTimer, wheelStart = 0, wheelGesture = false;
let navigation = null;
let kind = 'pallet', current = 0;
const width = () => viewport.clientWidth;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function sync() {
  const progress = viewport.scrollLeft / width();
  current = clamp(Math.round(progress), 0, panels.length - 1);
  document.querySelector('#chapter-label').textContent = names[current];
  document.querySelector('#chapter-count').textContent = `${String(current + 1).padStart(2, '0')} / 04`;
  document.querySelector('#progress-fill').style.width = `${(1 + progress) / panels.length * 100}%`;
  document.querySelector('#prev').disabled = progress < .015;
  document.querySelector('#next').disabled = progress > panels.length - 1.015;
  document.querySelectorAll('.nav [data-slide]').forEach(a => Number(a.dataset.slide) === current ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
  document.body.dataset.section = String(current);
  const mobile=innerWidth<=760||innerWidth/innerHeight<1.15;
  const pitch=mobile?20:Math.min(60,Math.max(44,innerWidth*.038));
  document.documentElement.style.setProperty('--rib-width',`${pitch}px`);
  document.documentElement.style.setProperty('--parked',`${Math.min(progress,3)*pitch}px`);
  document.documentElement.style.setProperty('--content-left',`${(mobile?24:64)+Math.min(progress,3)*pitch}px`);
  const smooth=t=>t*t*(3-2*t);
  for(let i=0;i<panels.length;i++){
    const t=clamp(progress-i,0,1), e=smooth(t);
    const edge=(innerWidth-pitch)*(1-e)+i*pitch*e;
    panels[i].style.zIndex=String(10-i);
    panels[i].style.clipPath=`inset(0 ${Math.max(0,innerWidth-edge-pitch)}px 0 ${i*pitch}px)`;
    panels[i].style.visibility=i>Math.ceil(progress)+1?'hidden':'visible';
    panels[i].querySelector('.screen-content').style.transform=`translateX(${-e*(mobile?36:110)}px)`;
    panels[i].style.setProperty('--panel-left',`${(mobile?24:64)+i*pitch}px`);
    panels[i].inert=i!==current;
    panels[i].setAttribute('aria-hidden',String(i!==current));
  }
  document.querySelectorAll('[data-rib]').forEach(b=>{
    const i=Number(b.dataset.rib), t=clamp(progress-i,0,1),e=smooth(t);
    b.hidden=i>Math.ceil(progress);
    b.style.left=`${(innerWidth-pitch)*(1-e)+i*pitch*e}px`;
    b.style.width=`${pitch}px`;
    b.style.zIndex=String(45-i);
    b.dataset.parked=String(t>=.99);
    b.setAttribute('aria-label',t>=.99?`Вернуться к экрану: ${names[i]}`:`Открыть экран: ${names[i+1]}`);
    b.style.setProperty('--shine',`${(1-e)*100}%`);
  });
}
function goTo(index, instant = false) {
  clearTimeout(wheelTimer);
  wheelGesture = false;
  index = clamp(index, 0, panels.length - 1);
  desired = index * width();
  nativeTouch = false;
  clearTimeout(touchTimer);
  if (motion.matches || instant) {
    navigation = null;
    driving = false;
    viewport.scrollLeft = desired;
    sync();
  } else {
    navigation = { from: viewport.scrollLeft, to: desired, start: performance.now(), duration: Math.min(1500,1100+Math.max(0,Math.abs(index-current)-1)*200) };
    driving = true;
  }
  history.replaceState(null, '', `#${ids[index]}`);
}
function setKind(value) {
  if (!Object.hasOwn(kindNames, value)) return;
  kind = value;
  document.querySelectorAll('[data-kind]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
  document.querySelector('#chosen-system').textContent = `ВАША СИСТЕМА / ${kindNames[kind].toUpperCase()}`;
  document.querySelector('#brief-kind').value = kind;
  
}
document.querySelectorAll('[data-slide]').forEach(a => a.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  if (a.dataset.choice) setKind(a.dataset.choice);
  goTo(Number(a.dataset.slide));
}));
document.querySelectorAll('[data-kind]').forEach(b => b.addEventListener('click', () => setKind(b.dataset.kind)));
document.querySelector('#prev').addEventListener('click', () => goTo(current - 1));
document.querySelector('#next').addEventListener('click', () => goTo(current + 1));
viewport.addEventListener('wheel', e => {
  if (e.ctrlKey || e.metaKey || e.target.closest('dialog,input,select,textarea')) return;
  const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? width() : 1);
  if (!delta) return;
  e.preventDefault();
  nativeTouch = false;
  if (navigation) { desired = viewport.scrollLeft; navigation = null; }
  if (motion.matches) {
    if (!driving) { goTo(current + Math.sign(delta), true); driving = true; setTimeout(() => driving = false, 300); }
    return;
  }
  if (!wheelGesture) { wheelStart = driving ? desired : viewport.scrollLeft; wheelGesture = true; }
  desired = clamp((driving ? desired : viewport.scrollLeft) + delta * 1.3, 0, (panels.length - 1) * width());
  driving = true;
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => {
    const moved = desired - wheelStart;
    const target = Math.abs(moved) > 45 && Math.abs(moved) < width() * .55
      ? Math.round(wheelStart / width()) + Math.sign(moved)
      : Math.round(desired / width());
    wheelGesture = false;
    goTo(target);
  }, 180);
}, { passive: false });
viewport.addEventListener('pointerdown', e => { navigation = null; driving = false; desired = viewport.scrollLeft; nativeTouch = e.pointerType === 'touch'; });
viewport.addEventListener('scroll', () => {
  sync();
  if (!driving) desired = viewport.scrollLeft;
  if (nativeTouch && !driving) {
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => goTo(Math.round(viewport.scrollLeft / width())), 300);
  }
}, { passive: true });
document.addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]') || e.target.closest('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  if ([' ', 'Enter'].includes(e.key) && e.target.closest('button,a')) return;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goTo(current + 1); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(current - 1); }
  else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
  else if (e.key === 'End') { e.preventDefault(); goTo(panels.length - 1); }
});
viewport.addEventListener('focusin', e => { if (e.target !== viewport) { driving = false; desired = viewport.scrollLeft; } });
function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, .06);
  lastTime = now;
  if (driving && !motion.matches) {
    if (navigation) {
      const t = clamp((now-navigation.start)/navigation.duration,0,1);
      viewport.scrollLeft=navigation.from+(navigation.to-navigation.from)*(t*t*(3-2*t));
      if(t>=1){viewport.scrollLeft=navigation.to;navigation=null;driving=false;sync();}
    } else {
      const gap = desired - viewport.scrollLeft;
      if (Math.abs(gap) < 2.5) { viewport.scrollLeft = desired; driving = false; sync(); }
      else viewport.scrollLeft += gap * (1 - Math.exp(-dt * 10));
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener('resize', () => {
  driving = false;
  navigation = null;
  desired = current * width();
  viewport.scrollLeft = desired;
  sync();
});
window.addEventListener('hashchange', () => { const i = ids.indexOf(location.hash.slice(1)); if (i >= 0) goTo(i); });
motion.addEventListener('change', () => { if(motion.matches){navigation=null;driving=false;viewport.scrollLeft=desired;sync();} });
const initial = ids.indexOf(location.hash.slice(1));
goTo(initial < 0 ? 0 : initial, true);

const briefDialog = document.querySelector('#brief-dialog');
const aboutDialog = document.querySelector('#about-dialog');
document.querySelector('#open-brief').addEventListener('click', () => briefDialog.showModal());
document.querySelector('#about-concept').addEventListener('click', () => aboutDialog.showModal());
document.querySelectorAll('.close-dialog').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => {
  if (e.target !== d) return;
  const r = d.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
}));
document.querySelector('#brief-kind').addEventListener('change', e => setKind(e.target.value));
let toastTimer;
function toast(text) {
  clearTimeout(toastTimer);
  const el = document.querySelector('#toast');
  el.textContent = text; el.classList.add('visible');
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4000);
}
let briefBlobUrl = null;
document.querySelector('#brief-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!e.target.reportValidity()) return;
  const data = new FormData(e.target);
  const text = `\uFEFFСТВОР / ЗАДАНИЕ НА ПОДБОР СИСТЕМЫ\n\nТип системы: ${kindNames[data.get('kind')]}\nПлощадь помещения: ${data.get('area')} м²\nВысота помещения: ${data.get('height')} м\nГруз и особенности работы склада: ${data.get('comment') || 'Не указано'}\n\nДля обсуждения проекта подготовьте план помещения, вес и габариты груза, количество мест хранения и характеристики складской техники.\n\nСамостоятельный портфолио-концепт. Не является заявкой, расчётом конструкции или коммерческим предложением.\n`;
  if(briefBlobUrl)URL.revokeObjectURL(briefBlobUrl);
  briefBlobUrl=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  document.querySelector('#download-brief').href=briefBlobUrl;
  document.querySelector('#brief-text').value=text.replace(/^\uFEFF/,'');
  document.querySelector('#brief-result').hidden=false;
  document.querySelector('#brief-text').scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'nearest'});
  toast('Задание готово: его можно скопировать или скачать');
});
document.querySelector('#copy-brief').addEventListener('click',async()=>{
  const field=document.querySelector('#brief-text');
  try{await navigator.clipboard.writeText(field.value);toast('Текст задания скопирован');}
  catch{field.focus();field.select();toast('Текст выделен. Скопируйте его привычной командой.');}
});

// Full-height steel end plates are also navigation handles.
document.querySelectorAll('[data-rib]').forEach(b=>b.addEventListener('click',()=>{
  const i=Number(b.dataset.rib);goTo(b.dataset.parked==='true'?i:i+1);
}));
const products={
  "pallet": {
    "name": "Доступ к каждой паллете из прохода",
    "description": "Для грузов на поддонах и работы погрузчика. Высота ярусов и ширина проходов подбираются под груз и технику.",
    "caption": "Паллетная система",
    "code": "ST / P-01",
    "use": "ПАЛЛЕТЫ / ПОГРУЗЧИК"
  },
  "shelf": {
    "name": "Удобная комплектация вручную",
    "description": "Для коробок, запчастей и штучного товара. Размер полок и расстояние между ними подбираются под ассортимент.",
    "caption": "Полочная система",
    "code": "ST / S-02",
    "use": "КОРОБКИ / РУЧНАЯ СБОРКА"
  },
  "mezzanine": {
    "name": "Дополнительная площадь по высоте",
    "description": "Для размещения хранения и комплектации на разных уровнях. Возможность установки зависит от высоты помещения и расчётных нагрузок.",
    "caption": "Мезонинная система",
    "code": "ST / M-03",
    "use": "НЕСКОЛЬКО УРОВНЕЙ / ЛЕСТНИЦЫ"
  }
};
document.querySelectorAll('[data-product]').forEach(b=>b.addEventListener('click',()=>{
  const k=b.dataset.product,d=products[k];setKind(k);
  document.querySelectorAll('[data-product]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  for(const [id,key] of [['product-name','name'],['product-description','description'],['product-caption','caption'],['product-code','code'],['product-use','use']])document.getElementById(id).textContent=d[key];
  const img=document.querySelector('#product-image');img.src=`assets/rack-${k}.svg`;img.alt=`Аксонометрическая иллюстрация: ${d.caption.toLowerCase()}`;
}));
