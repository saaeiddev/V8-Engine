(() => {
'use strict';

const EN_TO_FA = {
  'ENGINE': 'موتور',
  'Explorer': 'کاوشگر',
  'Systems': 'سیستم‌ها',
  'Combustion': 'احتراق',
  'Architecture': 'معماری',
  'Labels': 'برچسب‌ها',
  'Reset': 'بازنشانی',
  'INTERACTIVE V8 POWERTRAIN LAB': 'آزمایشگاه تعاملی قوای محرکه V8',
  'SEE EVERY': 'هر حرکت را',
  'POWER STROKE.': 'در کورس قدرت ببینید.',
  'UNDERSTAND': 'عملکرد',
  'EVERY PART.': 'تمام قطعات را بشناسید.',
  'A real-time, exploded and animated 90° V8 learning model. Rotate the engine, isolate systems, expose the internals and watch eight cylinders work together.': 'یک مدل آموزشی زنده، انفجاری و متحرک از موتور V8 با زاویه ۹۰ درجه. موتور را بچرخانید، سیستم‌ها را جدا کنید، اجزای داخلی را ببینید و هماهنگی هشت سیلندر را مشاهده کنید.',
  'Start Engine': 'روشن کردن موتور',
  '“A V8 is one coordinated machine: air, fuel, compression, spark, torque and exhaust — repeated eight times in perfect timing.”': '«موتور V8 یک مجموعه کاملاً هماهنگ است: هوا، سوخت، تراکم، جرقه، گشتاور و اگزوز؛ فرایندی که هشت بار با زمان‌بندی دقیق تکرار می‌شود.»',
  'ASSEMBLING V8 ENGINE': 'در حال آماده‌سازی موتور V8',
  'Crankshaft · Pistons · Valvetrain · Intake · Exhaust': 'میل‌لنگ · پیستون‌ها · سوپاپ‌ها · ورودی هوا · اگزوز',
  'LIVE 3D · 90° V8': 'سه‌بعدی زنده · V8 با زاویه ۹۰°',
  'ENGINE SPEED': 'سرعت موتور',
  '▶ Run': '▶ اجرا',
  '❚❚ Running': '❚❚ در حال اجرا',
  'Explode': 'نمای انفجاری',
  'X-Ray': 'نمای شفاف',
  'Cutaway': 'برش داخلی',
  'Drag to rotate · Wheel / pinch to zoom · Click a component': 'برای چرخش بکشید · برای زوم اسکرول یا پینچ کنید · روی یک قطعه کلیک کنید',
  'SELECTED COMPONENT': 'قطعه انتخاب‌شده',
  'V8 Engine Assembly': 'مجموعه موتور V8',
  'A 90-degree V8 uses two banks of four cylinders driving one crankshaft. Select a highlighted system or click a visible component to inspect it.': 'موتور V8 با زاویه ۹۰ درجه از دو ردیف چهار سیلندر استفاده می‌کند که یک میل‌لنگ مشترک را به حرکت درمی‌آورند. برای بررسی، یک سیستم مشخص‌شده یا قطعه قابل مشاهده را انتخاب کنید.',
  'Cycle': 'چرخه',
  'Selected': 'انتخاب‌شده',
  'Assembly': 'مجموعه',
  '4-Stroke': 'چهارزمانه',
  'Isolate': 'جداسازی',
  'Show All': 'نمایش همه',
  'Reset View': 'بازنشانی نما',
  'ENGINE SYSTEMS': 'سیستم‌های موتور',
  'Explore the complete V8 architecture': 'معماری کامل موتور V8 را بررسی کنید',
  'Select a system to highlight it in the 3D engine and read how it contributes to combustion and torque production.': 'یک سیستم را انتخاب کنید تا در مدل سه‌بعدی مشخص شود و نقش آن در احتراق و تولید گشتاور را ببینید.',
  'COMBUSTION LAB': 'آزمایشگاه احتراق',
  'Inside one cylinder — the complete four-stroke cycle': 'داخل یک سیلندر — چرخه کامل چهارزمانه',
  'Scrub through intake, compression, power and exhaust. The cutaway chamber visualizes piston motion, valve timing, mixture flow, ignition and expanding gases.': 'مراحل مکش، تراکم، قدرت و تخلیه را بررسی کنید. نمای برش‌خورده حرکت پیستون، زمان‌بندی سوپاپ‌ها، جریان مخلوط، جرقه و انبساط گازها را نمایش می‌دهد.',
  'CUTAWAY CYLINDER': 'نمای برش‌خورده سیلندر',
  'CURRENT STROKE': 'مرحله فعلی',
  'INTAKE': 'مکش',
  'COMPRESSION': 'تراکم',
  'POWER': 'قدرت',
  'EXHAUST': 'تخلیه',
  '❚❚ Auto': '❚❚ خودکار',
  '▶ Auto': '▶ خودکار',
  'of 720°': 'از ۷۲۰°',
  '1. Intake Stroke': '۱. مرحله مکش',
  '2. Compression Stroke': '۲. مرحله تراکم',
  '3. Power Stroke': '۳. مرحله قدرت',
  '4. Exhaust Stroke': '۴. مرحله تخلیه',
  'The intake valve opens while the piston travels down. The pressure drop draws fresh air-fuel mixture into the cylinder.': 'سوپاپ ورودی باز می‌شود و همزمان پیستون به سمت پایین حرکت می‌کند. افت فشار، مخلوط تازه هوا و سوخت را به داخل سیلندر می‌کشد.',
  'Both valves close. The rising piston compresses the trapped mixture, increasing pressure and temperature before ignition.': 'هر دو سوپاپ بسته می‌شوند. پیستون در حال بالا آمدن، مخلوط محبوس را فشرده می‌کند و پیش از جرقه فشار و دما افزایش می‌یابد.',
  'Near top dead center the spark plug ignites the compressed mixture. Rapid pressure rise pushes the piston down and delivers torque to the crankshaft.': 'نزدیک نقطه مرگ بالا، شمع مخلوط فشرده را مشتعل می‌کند. افزایش سریع فشار پیستون را پایین می‌راند و گشتاور را به میل‌لنگ منتقل می‌کند.',
  'The exhaust valve opens while the piston travels upward, forcing spent combustion gases out through the exhaust port and header.': 'سوپاپ خروجی باز می‌شود و پیستون با حرکت رو به بالا، گازهای سوخته را از مسیر خروجی و هدر اگزوز بیرون می‌راند.',
  'INTAKE VALVE': 'سوپاپ ورودی',
  'EXHAUST VALVE': 'سوپاپ خروجی',
  'SPARK': 'جرقه',
  'OPEN': 'باز',
  'CLOSED': 'بسته',
  'OFF': 'خاموش',
  'ARMED': 'آماده',
  'FIRE': 'جرقه',
  'Intake': 'مکش',
  'Compression': 'تراکم',
  'Power': 'قدرت',
  'Exhaust': 'تخلیه',
  'Air + fuel enters': 'ورود هوا + سوخت',
  'Mixture squeezed': 'فشرده شدن مخلوط',
  'Spark + expansion': 'جرقه + انبساط',
  'Gases expelled': 'خروج گازها',
  'V8 synchronization': 'هماهنگی V8',
  'While one cylinder fires, the other seven are distributed across intake, compression, power and exhaust phases to keep torque delivery smooth.': 'هنگامی که یک سیلندر در مرحله احتراق است، هفت سیلندر دیگر در مراحل مکش، تراکم، قدرت و تخلیه قرار دارند تا انتقال گشتاور یکنواخت بماند.',
  'V8 ANATOMY': 'آناتومی V8',
  'Major assemblies represented in the model': 'مجموعه‌های اصلی نمایش‌داده‌شده در مدل',
  'This educational model exposes the mechanical relationship between the rotating assembly, valvetrain, induction, ignition, lubrication, cooling and accessories.': 'این مدل آموزشی ارتباط مکانیکی میان مجموعه دوار، سیستم سوپاپ‌ها، ورودی هوا، احتراق، روغن‌کاری، خنک‌کاری و تجهیزات جانبی را نمایش می‌دهد.',
  'Rotating Assembly': 'مجموعه دوار',
  'Crankshaft, eight pistons, connecting rods, flywheel and counterweights convert cylinder pressure into rotation.': 'میل‌لنگ، هشت پیستون، شاتون‌ها، فلایویل و وزنه‌های تعادل فشار سیلندر را به حرکت دورانی تبدیل می‌کنند.',
  'Valvetrain': 'سیستم سوپاپ‌ها',
  'Camshaft, lifters, pushrods, rocker arms and sixteen valves control breathing on both cylinder banks.': 'میل‌سوپاپ، تایپت‌ها، پوش‌رادها، اسبک‌ها و شانزده سوپاپ تنفس هر دو ردیف سیلندر را کنترل می‌کنند.',
  'Air & Fuel': 'هوا و سوخت',
  'Throttle body, intake manifold, fuel rails and injectors meter the charge delivered to each cylinder.': 'دریچه گاز، منیفولد ورودی، ریل‌های سوخت و انژکتورها میزان مخلوط ورودی به هر سیلندر را کنترل می‌کنند.',
  'Ignition & Exhaust': 'جرقه و اگزوز',
  'Spark plugs ignite the compressed mixture; headers collect combustion gases from all eight cylinders.': 'شمع‌ها مخلوط فشرده را مشتعل می‌کنند و هدرها گازهای حاصل از احتراق هر هشت سیلندر را جمع می‌کنند.',
  'Lubrication & Cooling': 'روغن‌کاری و خنک‌کاری',
  'Oil pan and pump support the lubrication circuit while water pump and cooling passages control temperature.': 'کارتل و پمپ روغن مدار روغن‌کاری را تغذیه می‌کنند و پمپ آب و مجاری خنک‌کننده دمای موتور را کنترل می‌کنند.',
  'Front Drive': 'مجموعه انتقال جلویی',
  'Crank pulley, belt, alternator and water-pump pulley distribute mechanical power to engine accessories.': 'پولی میل‌لنگ، تسمه، دینام و پولی پمپ آب نیروی مکانیکی را به تجهیزات جانبی موتور منتقل می‌کنند.',
  'Cylinders': 'سیلندر',
  'Bank Angle': 'زاویه ردیف سیلندر',
  'Valves Shown': 'سوپاپ نمایش‌داده‌شده',
  'Combustion Cycle': 'چرخه احتراق',
  'Interactive Orbit': 'چرخش تعاملی',
  'Animated Mechanics': 'مکانیک متحرک',
  'V8 ENGINE · INTERACTIVE 3D MECHANICS': 'موتور V8 · مکانیک سه‌بعدی تعاملی',
  'Educational visualization · Built for the web': 'شبیه‌سازی آموزشی · ساخته‌شده برای وب',

  'Engine Block': 'بلوک موتور',
  'Cylinder Heads': 'سرسیلندرها',
  'Pistons & Rods': 'پیستون‌ها و شاتون‌ها',
  'Crankshaft': 'میل‌لنگ',
  'Intake System': 'سیستم ورودی هوا',
  'Fuel System': 'سیستم سوخت‌رسانی',
  'Ignition': 'سیستم جرقه‌زنی',
  'Exhaust Headers': 'هدرهای اگزوز',
  'Cooling System': 'سیستم خنک‌کاری',
  'Lubrication': 'سیستم روغن‌کاری',
  'Timing Drive': 'سیستم تایمینگ',
  'Accessories': 'تجهیزات جانبی',
  'Flywheel': 'فلایویل',
  'Block & cylinder bores': 'بلوک و محفظه‌های سیلندر',
  'Heads & combustion chambers': 'سرسیلندر و محفظه‌های احتراق',
  '8 pistons · 8 rods': '۸ پیستون · ۸ شاتون',
  'Main rotating assembly': 'مجموعه دوار اصلی',
  'Cam · pushrods · rockers · valves': 'میل‌سوپاپ · پوش‌راد · اسبک · سوپاپ',
  'Throttle · plenum · runners': 'دریچه گاز · پلنوم · رانرها',
  'Rails · 8 injectors': 'ریل‌ها · ۸ انژکتور',
  '8 spark plugs': '۸ شمع',
  '8 primaries · 2 collectors': '۸ لوله اولیه · ۲ کلکتور',
  'Water pump & passages': 'پمپ آب و مجاری خنک‌کننده',
  'Oil pan · pickup · pump': 'کارتل · مکش روغن · پمپ',
  'Crank gear · cam gear · chain': 'دنده میل‌لنگ · دنده میل‌سوپاپ · زنجیر',
  'Belt · alternator · pulleys': 'تسمه · دینام · پولی‌ها',
  'Rear inertia mass': 'جرم اینرسی عقب',
  'The rigid aluminum/iron structure that locates both cylinder banks, crankshaft mains and coolant/oil passages. This model uses a 90° bank angle.': 'ساختار صلب آلومینیومی یا چدنی که دو ردیف سیلندر، یاتاقان‌های اصلی میل‌لنگ و مجاری روغن و خنک‌کننده را در خود جای می‌دهد. این مدل زاویه ۹۰ درجه بین دو ردیف سیلندر دارد.',
  'Each head seals four cylinders and carries the valves, ports, spark plugs and rocker gear that control combustion breathing.': 'هر سرسیلندر چهار سیلندر را آب‌بندی می‌کند و سوپاپ‌ها، پورت‌ها، شمع‌ها و مجموعه اسبک‌ها را در خود جای می‌دهد.',
  'Eight pistons receive combustion pressure. Connecting rods transmit that force to offset crank journals, converting reciprocating motion into torque.': 'هشت پیستون فشار حاصل از احتراق را دریافت می‌کنند. شاتون‌ها این نیرو را به ژورنال‌های خارج از مرکز میل‌لنگ منتقل کرده و حرکت رفت‌وبرگشتی را به گشتاور تبدیل می‌کنند.',
  'The crankshaft collects force from all eight connecting rods. Counterweights balance rotating and reciprocating masses while the journals run in main bearings.': 'میل‌لنگ نیروی هر هشت شاتون را دریافت می‌کند. وزنه‌های تعادل جرم‌های دوار و رفت‌وبرگشتی را متعادل می‌کنند و ژورنال‌ها داخل یاتاقان‌های اصلی می‌چرخند.',
  'A central camshaft coordinates sixteen valves through lifters, pushrods and rocker arms. Intake and exhaust valves open at different parts of the 720° cycle.': 'میل‌سوپاپ مرکزی با کمک تایپت‌ها، پوش‌رادها و اسبک‌ها شانزده سوپاپ را هماهنگ می‌کند. سوپاپ‌های ورودی و خروجی در زمان‌های متفاوت چرخه ۷۲۰ درجه باز می‌شوند.',
  'The throttle body meters airflow into the plenum. Eight runners distribute air toward the intake ports, one path for each cylinder.': 'دریچه گاز مقدار هوای ورودی به پلنوم را تنظیم می‌کند. هشت رانر هوا را به پورت ورودی هر سیلندر هدایت می‌کنند.',
  'Twin fuel rails feed eight injectors. The injectors meter fuel near each intake port so the correct mixture can enter the cylinders.': 'دو ریل سوخت، هشت انژکتور را تغذیه می‌کنند. انژکتورها سوخت را نزدیک پورت ورودی هر سیلندر با مقدار دقیق تزریق می‌کنند.',
  'Spark plugs create the ignition event near the end of each compression stroke. Cylinder firing events are phased across two crank revolutions.': 'شمع‌ها نزدیک پایان مرحله تراکم جرقه ایجاد می‌کنند. احتراق سیلندرها طی دو دور کامل میل‌لنگ زمان‌بندی شده است.',
  'Four primary tubes on each bank carry hot combustion gases away from the exhaust ports and merge them into left and right collectors.': 'چهار لوله اولیه در هر ردیف، گازهای داغ احتراق را از پورت‌های خروجی خارج کرده و به کلکتورهای چپ و راست هدایت می‌کنند.',
  'The water pump circulates coolant through the engine block and cylinder heads, carrying combustion heat toward the radiator circuit.': 'پمپ آب مایع خنک‌کننده را در بلوک موتور و سرسیلندرها به گردش درمی‌آورد و گرمای احتراق را به مدار رادیاتور منتقل می‌کند.',
  'Engine oil is stored in the sump and circulated under pressure to bearings and valvetrain surfaces, reducing friction and removing heat.': 'روغن موتور در کارتل ذخیره شده و تحت فشار به یاتاقان‌ها و اجزای سیستم سوپاپ‌ها می‌رسد تا اصطکاک و گرما را کاهش دهد.',
  'The timing drive keeps the camshaft synchronized to the crankshaft at half crank speed so valve events remain aligned with piston position.': 'سیستم تایمینگ میل‌سوپاپ را با نصف سرعت میل‌لنگ همگام نگه می‌دارد تا زمان باز و بسته شدن سوپاپ‌ها با موقعیت پیستون هماهنگ باشد.',
  'The front accessory drive uses crankshaft power to spin the alternator and water pump through pulleys and a serpentine-style belt path.': 'مجموعه تجهیزات جلویی از نیروی میل‌لنگ برای به حرکت درآوردن دینام و پمپ آب از طریق پولی‌ها و تسمه استفاده می‌کند.',
  'The flywheel adds rotational inertia, smooths speed fluctuations between firing events and provides the mechanical interface toward the drivetrain.': 'فلایویل اینرسی دورانی را افزایش می‌دهد، نوسانات سرعت میان احتراق‌ها را نرم می‌کند و رابط مکانیکی با مجموعه انتقال قدرت است.',
  'Block': 'بلوک موتور',
  'Cylinder Heads': 'سرسیلندرها',
  'Pistons & Rods': 'پیستون‌ها و شاتون‌ها',
  'Intake': 'ورودی هوا',
  'Fuel': 'سوخت‌رسانی',
  'Cooling': 'خنک‌کاری'
};

const FA_TO_EN = Object.fromEntries(Object.entries(EN_TO_FA).map(([en, fa]) => [fa, en]));
const originalText = new WeakMap();
let currentLang = localStorage.getItem('v8-language') === 'fa' ? 'fa' : 'en';
let applying = false;

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function replaceTextNode(node) {
  const raw = node.nodeValue;
  const key = normalize(raw || '');
  if (!key) return;

  if (!originalText.has(node)) {
    if (EN_TO_FA[key]) originalText.set(node, key);
    else if (FA_TO_EN[key]) originalText.set(node, FA_TO_EN[key]);
  }

  const english = originalText.get(node);
  if (!english) return;
  const target = currentLang === 'fa' ? (EN_TO_FA[english] || english) : english;
  if (key === target) return;

  const leading = (raw.match(/^\s*/) || [''])[0];
  const trailing = (raw.match(/\s*$/) || [''])[0];
  node.nodeValue = leading + target + trailing;
}

function walk(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) replaceTextNode(node);
}

function translateAttributes() {
  const labels = {
    'V8 Engine home': 'خانه موتور V8',
    'Interactive 3D V8 engine': 'موتور V8 سه‌بعدی تعاملی',
    '3D controls': 'کنترل‌های سه‌بعدی',
    'Focus internals': 'تمرکز روی اجزای داخلی'
  };
  document.querySelectorAll('[aria-label]').forEach(el => {
    const original = el.dataset.i18nAria || el.getAttribute('aria-label');
    if (!el.dataset.i18nAria) el.dataset.i18nAria = original;
    el.setAttribute('aria-label', currentLang === 'fa' ? (labels[original] || original) : original);
  });
}

function updateChrome() {
  document.documentElement.lang = currentLang === 'fa' ? 'fa' : 'en';
  document.body.classList.toggle('lang-fa', currentLang === 'fa');
  document.title = currentLang === 'fa'
    ? 'موتور V8 — آزمایشگاه تعاملی سه‌بعدی مکانیک'
    : 'V8 ENGINE — Interactive 3D Mechanics Lab';

  const enBtn = document.getElementById('langEn');
  const faBtn = document.getElementById('langFa');
  if (enBtn) enBtn.classList.toggle('active', currentLang === 'en');
  if (faBtn) faBtn.classList.toggle('active', currentLang === 'fa');
}

function applyLanguage(lang) {
  currentLang = lang === 'fa' ? 'fa' : 'en';
  localStorage.setItem('v8-language', currentLang);
  applying = true;
  walk(document.body);
  translateAttributes();
  updateChrome();
  applying = false;
}

function installSwitcher() {
  const tools = document.querySelector('.header-tools');
  if (!tools || document.getElementById('languageSwitch')) return;

  const wrap = document.createElement('div');
  wrap.id = 'languageSwitch';
  wrap.className = 'language-switch';
  wrap.setAttribute('aria-label', 'Language');
  wrap.innerHTML = '<button type="button" id="langEn">EN</button><button type="button" id="langFa">فارسی</button>';
  tools.insertBefore(wrap, tools.firstChild);

  document.getElementById('langEn').addEventListener('click', () => applyLanguage('en'));
  document.getElementById('langFa').addEventListener('click', () => applyLanguage('fa'));
}

function installStyles() {
  if (document.getElementById('i18nStyles')) return;
  const style = document.createElement('style');
  style.id = 'i18nStyles';
  style.textContent = `
    .language-switch{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(5,12,18,.56);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);flex:0 0 auto}
    .language-switch button{appearance:none;border:0;background:transparent;color:rgba(224,241,250,.66);font:700 10px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.04em;padding:6px 8px;border-radius:999px;cursor:pointer;transition:.2s ease;white-space:nowrap}
    .language-switch button.active{background:rgba(45,181,255,.18);color:#e9f8ff;box-shadow:inset 0 0 0 1px rgba(78,193,255,.28)}
    .lang-fa{font-family:"Vazirmatn",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .lang-fa button,.lang-fa input,.lang-fa select,.lang-fa textarea{font-family:"Vazirmatn",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .lang-fa .intro p,.lang-fa .quote,.lang-fa .info-panel,.lang-fa .section-heading,.lang-fa .combustion-copy,.lang-fa .anatomy-grid article{direction:rtl}
    .lang-fa .intro p,.lang-fa .quote,.lang-fa .info-panel p,.lang-fa .section-heading p,.lang-fa .combustion-copy p,.lang-fa .anatomy-grid article p{text-align:right}
    .lang-fa .system-card b,.lang-fa .system-card small,.lang-fa .engine-label{direction:rtl}
    @media(max-width:760px){.language-switch button{padding:5px 6px;font-size:9px}}
  `;
  document.head.appendChild(style);
}

function init() {
  installStyles();
  installSwitcher();
  applyLanguage(currentLang);

  const observer = new MutationObserver(mutations => {
    if (applying) return;
    applying = true;
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        replaceTextNode(mutation.target);
      } else {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) replaceTextNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) walk(node);
        });
      }
    }
    applying = false;
  });
  observer.observe(document.body, {subtree:true, childList:true, characterData:true});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
else init();
})();
