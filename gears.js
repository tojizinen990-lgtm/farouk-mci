// ============================================================
//  gears.js  —  تروس وأدوات متحركة — صيانةبلس
// ============================================================

(function() {
  var canvas = document.getElementById('gear-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var shapes = [];

  // فصل إعدادات الأشكال الأساسية خارج الدالة لتسهيل قراءتها وتعديلها
  var G = 'rgba(201,168,76,.9)'; // اللون الذهبي
  var T = 'rgba(14,165,233,.9)'; // اللون الأزرق

  var shapeConfigs = [
    {t:'g', cx:.05, cy:.15, r:70, n:16, s:.003,   c:G, a:.42},
    {t:'g', cx:.94, cy:.08, r:50, n:12, s:-.004,  c:G, a:.36},
    {t:'g', cx:.88, cy:.55, r:80, n:18, s:.0025,  c:T, a:.28},
    {t:'g', cx:.02, cy:.78, r:60, n:14, s:-.003,  c:G, a:.32},
    {t:'g', cx:.50, cy:.94, r:45, n:10, s:.005,   c:G, a:.24},
    {t:'g', cx:.74, cy:.22, r:35, n:8,  s:-.006,  c:T, a:.30},
    {t:'g', cx:.18, cy:.48, r:30, n:8,  s:.007,   c:T, a:.24},
    {t:'g', cx:.62, cy:.68, r:40, n:10, s:-.004,  c:G, a:.22},
    {t:'w', cx:.25, cy:.07, r:48, n:0,  s:.004,   c:G, a:.26},
    {t:'w', cx:.70, cy:.87, r:40, n:0,  s:-.003,  c:T, a:.24},
    {t:'w', cx:.42, cy:.30, r:34, n:0,  s:.005,   c:G, a:.22},
  ];

  function drawGear(cx, cy, r, teeth, rot, col, alpha) {
    var ir = r * 0.65, step = (Math.PI * 2) / teeth;
    ctx.save(); 
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col; 
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    
    for (var i = 0; i < teeth; i++) {
      var a0 = step * i + rot, 
          a1 = a0 + step * .35, 
          a2 = a0 + step * .65, 
          a3 = a0 + step;
          
      ctx.lineTo(cx + Math.cos(a0) * ir, cy + Math.sin(a0) * ir);
      ctx.lineTo(cx + Math.cos(a1) * r,  cy + Math.sin(a1) * r);
      ctx.lineTo(cx + Math.cos(a2) * r,  cy + Math.sin(a2) * r);
      ctx.lineTo(cx + Math.cos(a3) * ir, cy + Math.sin(a3) * ir);
    }
    
    ctx.closePath(); 
    ctx.stroke();
    
    // رسم الدائرة الداخلية للترس
    ctx.beginPath(); 
    ctx.arc(cx, cy, r * .2, 0, Math.PI * 2); 
    ctx.stroke();
    
    ctx.restore();
  }

  function drawWrench(cx, cy, size, rot, col, alpha) {
    ctx.save(); 
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col; 
    ctx.lineWidth = size * .08; 
    ctx.lineCap = 'round';
    ctx.translate(cx, cy); 
    ctx.rotate(rot);
    
    // رسم جسم المفتاح
    ctx.beginPath(); 
    ctx.moveTo(-size * .45, 0); 
    ctx.lineTo(size * .45, 0); 
    ctx.stroke();
    
    // رسم رأس المفتاح (الدائري)
    ctx.beginPath(); 
    ctx.arc(size * .45, 0, size * .2, 0, Math.PI * 2); 
    ctx.stroke();
    
    // رسم رأس المفتاح (المفتوح)
    ctx.beginPath(); 
    ctx.arc(-size * .45, 0, size * .14, 0, Math.PI); 
    ctx.stroke();
    
    ctx.restore();
  }

  function init() {
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // [إصلاح حرج]: توليد الأشكال مرة واحدة فقط للحفاظ على زاوية الدوران أثناء تغيير حجم النافذة
    if (shapes.length === 0) {
      shapeConfigs.forEach(function(d) {
        shapes.push({
          type: d.t, 
          cxBase: d.cx, // الاحتفاظكنسب مئوية لإعادة الحساب لاحقاً
          cyBase: d.cy, 
          cx: d.cx * W, 
          cy: d.cy * H, 
          r: d.r, 
          n: d.n,
          speed: d.s, 
          col: d.c, 
          alpha: d.a, 
          rot: Math.random() * Math.PI * 2 // تعيين دوران ابتدائي عشوائي لمرة واحدة فقط
        });
      });
    } else {
      // تحديث إحداثيات العرض والطول فقط دون تصفير مصفوفة الأشكال
      shapes.forEach(function(s) {
        s.cx = s.cxBase * W;
        s.cy = s.cyBase * H;
      });
    }
  }

  function resize() {
    init();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    shapes.forEach(function(s) {
      s.rot += s.speed; // زيادة زاوية الدوران
      if (s.type === 'g') drawGear(s.cx, s.cy, s.r, s.n, s.rot, s.col, s.alpha);
      if (s.type === 'w') drawWrench(s.cx, s.cy, s.r, s.rot, s.col, s.alpha);
    });
    
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  init(); 
  animate();
})();