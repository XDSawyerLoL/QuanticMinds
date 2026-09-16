(()=>{
  const header=document.querySelector('.site-header');
  const toggle=document.querySelector('.menu-toggle');
  const mobile=document.querySelector('.mobile-nav');
  const syncHeader=()=>header?.classList.toggle('scrolled',scrollY>18);
  syncHeader();addEventListener('scroll',syncHeader,{passive:true});
  toggle?.addEventListener('click',()=>{const open=mobile?.classList.toggle('open');document.body.classList.toggle('menu-open',!!open);toggle.setAttribute('aria-expanded',open?'true':'false')});
  mobile?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobile.classList.remove('open');document.body.classList.remove('menu-open')}));
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('[data-nav]').forEach(a=>{const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(href===page)a.classList.add('active')});
  const io=('IntersectionObserver'in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08}):null;
  document.querySelectorAll('.reveal').forEach(el=>io?io.observe(el):el.classList.add('visible'));
  const params=new URLSearchParams(location.search);const subj=params.get('subject');if(subj){const s=document.querySelector('select[name="subject"]');if(s){[...s.options].forEach(o=>{if(o.textContent.toLowerCase().includes(subj.toLowerCase()))s.value=o.value})}}
  document.querySelectorAll('[data-contact-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form);const subject=encodeURIComponent(fd.get('subject')||'Contact Quantic Sillage');const body=encodeURIComponent(`Nom : ${fd.get('name')||''}\nOrganisation : ${fd.get('company')||''}\nEmail : ${fd.get('email')||''}\n\n${fd.get('message')||''}`);location.href=`mailto:contact@quanticminds.fr?subject=${subject}&body=${body}`}));
})();
