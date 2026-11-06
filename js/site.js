/* LA LANGUE : "fr" ou "en" (toujours le français à l'ouverture ; En / Fr change la langue jusqu'au prochain chargement) */
var MQ_MOBILE = window.matchMedia ? matchMedia("(max-width: 1099px), (pointer: coarse) and (max-width: 1000px) and (max-height: 520px)") : null;   // la même règle que la version mobile du CSS
window.MOBILE = function () { return MQ_MOBILE ? MQ_MOBILE.matches : innerWidth <= 1099; };

/* LES SOULIGNEMENTS AU CRAYON : la ligne dessinée par Victoria dans Figma (#ligne-crayon, 381 × 3,8, dans index.html).
   Elle n'est jamais étirée : on garde son début (à gauche) et sa fin (à droite), coupés à la longueur exacte de chaque lien. */
(function () {
  var LONG = 381, HAUT = 3.81, ECH = 0.8, n = 0;               // ECH : 1 unité de la ligne = 0,8 px (le trait fait ~3 px d'épaisseur)
  function morceau(x, w, debutLigne, y) {                      // on ne montre qu'un morceau de la ligne : de debutLigne à debutLigne + w, posé en x
    var id = "cl" + (++n);
    return '<clipPath id="' + id + '"><rect x="' + x.toFixed(2) + '" y="-20" width="' + w.toFixed(2) + '" height="60"/></clipPath>' +
      '<g clip-path="url(#' + id + ')"><use href="#ligne-crayon" transform="translate(' + (x - debutLigne).toFixed(2) + ',' + y.toFixed(2) + ')"/></g>';
  }
  window.dessinerTrait = function (svg) {
    var r = svg.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    var cle = Math.round(r.width) + "x" + Math.round(r.height);
    if (svg.getAttribute("data-cle") === cle) return;
    var W = r.width / ECH, H = r.height / ECH, y = (H - HAUT) / 2;
    svg.setAttribute("viewBox", "0 0 " + W.toFixed(2) + " " + H.toFixed(2));
    svg.setAttribute("preserveAspectRatio", "none");
    var html;
    if (W <= LONG) {
      var m = Math.min(W, W / 2 + 4);                            // à gauche le début de la ligne, à droite sa fin (elles se chevauchent un peu au milieu)
      html = morceau(0, m, 0, y) + morceau(W - m, m, LONG - m, y);
    } else {
      html = morceau(0, LONG, 0, y) + morceau(W - LONG, LONG, 0, y);
    }
    svg.innerHTML = html;
    svg.setAttribute("data-cle", cle);
  };
  window.poserTraits = function () { [].forEach.call(document.querySelectorAll("svg.trait-cr"), window.dessinerTrait); };
})();
// on (re)dessine les soulignements quand ils changent de taille : au chargement, polices prêtes, changement de page, menu ouvert, survol, fenêtre redimensionnée
(function () {
  function plusTard() { requestAnimationFrame(window.poserTraits); }
  document.addEventListener("DOMContentLoaded", plusTard);
  addEventListener("load", plusTard);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(plusTard);
  addEventListener("resize", plusTard);
  document.addEventListener("mouseover", function (e) {
    var a = e.target.closest && e.target.closest("a, button");
    var s = a && a.querySelector("svg.trait-cr");
    if (s) window.dessinerTrait(s);
  });
  document.addEventListener("click", function () { setTimeout(window.poserTraits, 60); setTimeout(window.poserTraits, 500); }, true);
})();


/* ---------- LE CV : il s'ouvre par-dessus la page, en entier, à la taille de l'écran (ordinateur et téléphone) ----------
   (un PDF ouvert directement s'affiche sur toute la largeur dans Safari, et on ne peut pas régler sa taille d'ouverture)
   placé tout en haut du fichier : il est actif même si une autre partie du site avait un souci dans un navigateur.
   - un clic sur la feuille = on s'approche (× 1,8), là où on a cliqué ; la molette / le trackpad (ou la main) pour parcourir la feuille ; un clic sans glisser = on revient
   - « Télécharger le PDF » en bas ; « fermer » en haut à droite, comme dans les galeries des projets ; Échap ou clic à côté = fermer
   - le courriel et le téléphone restent cliquables sur la feuille */
(function () {
  var voile = null;
  function fermer() {
    if (!voile) return;
    var v = voile; voile = null;
    v.classList.remove("cv-montre");
    document.documentElement.classList.remove("cv-ouvert");
    setTimeout(function () { v.remove(); }, 450);
  }
  function ouvrir(a) {
    if (voile) return;
    var pdf = a.getAttribute("href");
    voile = document.createElement("div");
    voile.className = "cv-voile";
    voile.setAttribute("role", "dialog");
    voile.setAttribute("aria-modal", "true");
    voile.innerHTML =
      '<button class="cv-fermer" type="button">' + a.dataset.cvFermer + '</button>' +
      '<div class="cv-cadre"><figure class="cv-feuille">' +
        '<img src="' + a.dataset.cv + '" alt="' + a.dataset.cvAlt + '" draggable="false">' +
        '<a class="cv-zone" style="left:72.8%;top:5.2%;width:20.4%;height:2.5%" href="mailto:roboe1@ulaval.ca" aria-label="roboe1@ulaval.ca"></a>' +
        '<a class="cv-zone" style="left:72.8%;top:8.0%;width:20.4%;height:2.5%" href="tel:+14185648532" aria-label="418 564 8532"></a>' +
      '</figure></div>' +
      '<a class="cv-telecharger" href="' + pdf + '" download="CV_Rose Boucher-Emond.pdf">' + a.dataset.cvTel + '</a>';
    document.body.appendChild(voile);
    var v = voile, feuille = v.querySelector(".cv-feuille"), im = v.querySelector("img");
    function montrer() { requestAnimationFrame(function () { requestAnimationFrame(function () { if (voile === v) v.classList.add("cv-montre"); }); }); }
    if (im.complete) montrer(); else { im.addEventListener("load", montrer); im.addEventListener("error", montrer); }
    document.documentElement.classList.add("cv-ouvert");

    // le zoom : un clic = on s'approche (× 1,8) là où on a cliqué. La feuille est alors VRAIMENT agrandie (image en haute définition,
    // pas une loupe sur une petite image) : elle reste nette, et on la parcourt avec la molette / le trackpad (on glisse vers le bas pour lire la suite),
    // ou en l'attrapant avec la main. Un clic sans glisser = on revient à la feuille entière.
    var cadre = v.querySelector(".cv-cadre"), Z = 1.8, proche = false, dep = null;
    function rapprocher(e) {
      var r = feuille.getBoundingClientRect(), c = cadre.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;   // le point cliqué, sur la feuille (0 à 1)
      var w = r.width * Z, h = r.height * Z;
      proche = true;
      feuille.style.transition = "none";
      cadre.classList.add("proche");
      feuille.style.width = w + "px"; feuille.style.height = h + "px";
      var ox = Math.max(0, (c.width - w) / 2), oy = Math.max(0, (c.height - h) / 2);
      cadre.scrollLeft = ox + px * w - (e.clientX - c.left);
      cadre.scrollTop = oy + py * h - (e.clientY - c.top);
      // une petite transition douce : on part de la taille d'avant
      var r2 = feuille.getBoundingClientRect();
      feuille.style.transformOrigin = "0 0";
      feuille.style.transform = "translate(" + (r.left - r2.left) + "px," + (r.top - r2.top) + "px) scale(" + (1 / Z) + ")";
      feuille.getBoundingClientRect();
      feuille.style.transition = "transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)";
      feuille.style.transform = "none";
    }
    function eloigner() {
      var r = feuille.getBoundingClientRect();
      proche = false;
      feuille.style.transition = "none";
      cadre.classList.remove("proche");
      feuille.style.width = ""; feuille.style.height = "";
      cadre.scrollLeft = 0; cadre.scrollTop = 0;
      var r2 = feuille.getBoundingClientRect();
      feuille.style.transformOrigin = "0 0";
      feuille.style.transform = "translate(" + (r.left - r2.left) + "px," + (r.top - r2.top) + "px) scale(" + Z + ")";
      feuille.getBoundingClientRect();
      feuille.style.transition = "transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)";
      feuille.style.transform = "none";
    }
    feuille.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".cv-zone") || e.button > 0) return;
      dep = { x: e.clientX, y: e.clientY, sl: cadre.scrollLeft, st: cadre.scrollTop, bouge: false, souris: e.pointerType === "mouse" };
      if (dep.souris) { try { feuille.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); }
    });
    feuille.addEventListener("pointermove", function (e) {
      if (!dep) return;
      var dx = e.clientX - dep.x, dy = e.clientY - dep.y;
      if (!dep.bouge && Math.abs(dx) + Math.abs(dy) > 5) { dep.bouge = true; cadre.classList.add("glisse"); }
      if (dep.bouge && proche && dep.souris) { cadre.scrollLeft = dep.sl - dx; cadre.scrollTop = dep.st - dy; }   // (au doigt, le cadre défile tout seul)
    });
    function lacher(e) {
      if (!dep) return;
      var d = dep; dep = null;
      cadre.classList.remove("glisse");
      if (d.bouge) return;
      if (proche) eloigner(); else rapprocher(e);
    }
    feuille.addEventListener("pointerup", lacher);
    feuille.addEventListener("pointercancel", function () { dep = null; cadre.classList.remove("glisse"); });
    feuille.addEventListener("click", function (e) { if (!e.target.closest(".cv-zone")) e.stopPropagation(); });
    v.addEventListener("click", function (e) {
      if (e.target === v || (e.target.classList.contains("cv-cadre") && !e.target.classList.contains("proche")) || e.target.classList.contains("cv-fermer")) fermer();
    });
  }
  document.addEventListener("click", function (e) {
    var t = e.target; if (t && t.nodeType === 3) t = t.parentNode;     // (vieux Safari : la cible peut être le texte lui-même)
    var a = t && t.closest && t.closest("a[data-cv]");
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    ouvrir(a);
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fermer(); });
  addEventListener("hashchange", fermer);
})();


/* TÉLÉPHONE : des images plus légères (img/m/, 1400 px au plus — assez pour un écran de téléphone, même agrandi)
   — le téléphone a beaucoup moins de mémoire qu'un ordinateur ; l'ordinateur garde les images d'origine */
window.PETIT = window.MOBILE();
var IMG_M = {};
var IMG_M_LISTE = ["img/a-axo.jpg", "img/a-coupe-paysage.jpg", "img/a-coupe-tech.jpg", "img/a-elevation.jpg", "img/a-forces-corps.jpg", "img/a-forces-vent.jpg", "img/a-int-gradins.jpg", "img/a-int-repas.jpg", "img/a-mapping.jpg", "img/a-plan-l2.jpg", "img/a-poteau.jpg", "img/a-saisons.jpg", "img/m-expo-3.jpg", "img/m-expo-4.jpg", "img/m-expo-5.jpg", "img/m-expo-6.jpg", "img/m-expo-7.jpg", "img/m-expo-8.jpg", "img/m-expo-9.jpg", "img/m-machine-7.jpg", "img/a-trame-poteaux.jpg", "img/a-vue-ext.jpg", "img/b-bain.jpg", "img/b-cyano-1.jpg", "img/b-cyano-2.jpg", "img/b-cyano-3.jpg", "img/b-cyano-4.jpg", "img/b-cyano-5.jpg", "img/b-cyano-6.jpg", "img/b-mapping.jpg", "img/b-objet-1.jpg", "img/b-objet-2.jpg", "img/b-objet-3.jpg", "img/b-objet-4.jpg", "img/c-axo.jpg", "img/c-coupe.jpg", "img/c-croquis.jpg", "img/c-elevation-long.jpg", "img/c-elevation.jpg", "img/c-facade.jpg", "img/c-film.jpg", "img/c-maq-a2.jpg", "img/c-maq-b.jpg", "img/c-maq-c.jpg", "img/c-maq-d.jpg", "img/c-maq-e.jpg", "img/c-maq-f.jpg", "img/c-maq-g.jpg", "img/c-maq-h.jpg", "img/c-maq-i.jpg", "img/c-maq-j.jpg", "img/c-maq-k.jpg", "img/c-maq-l.jpg", "img/c-maq-m.jpg", "img/c-maq-n.jpg", "img/c-maq-o.jpg", "img/c-plan.jpg", "img/f-elevation.jpg", "img/f-espaces.jpg", "img/f-maquette.jpg", "img/f-membrane.jpg", "img/f-motif.jpg", "img/f-plan-bulles.jpg", "img/f-scenario.jpg", "img/f-subdivision.jpg", "img/f-texture.jpg", "img/m-expo-1.jpg", "img/m-expo-2.jpg", "img/m-machine-1.jpg", "img/m-machine-3.jpg", "img/m-machine-4.jpg", "img/m-machine-5.jpg", "img/m-machine-6.jpg", "img/m-manifeste.jpg", "img/m-planche.jpg", "img/m-processus.jpg", "img/n-albedome.jpg", "img/n-chunk.jpg", "img/n-fabrice.jpg", "img/n-maquette.jpg", "img/n-mirabilia.jpg", "img/n-modules.jpg", "img/n-narration.jpg", "img/n-partition.jpg", "img/n-rendu.jpg", "img/n-robot-1.jpg", "img/n-robot-2.jpg", "img/n-site-axo.jpg", "img/n-voxel.jpg", "img/o-atelier-1.jpg", "img/o-atelier-2.jpg", "img/o-atelier-3.jpg", "img/o-atelier-4.jpg", "img/o-croquis.jpg", "img/o-diable-1.jpg", "img/o-diable-2.jpg", "img/o-diable-3.jpg", "img/o-diable-4.jpg", "img/o-rue.jpg", "img/papier.jpg", "img/s-coupe-atelier.jpg", "img/s-coupe-paysage.jpg", "img/s-coupe-persp.jpg", "img/s-maisons.jpg", "img/s-plan-ecole-1.jpg", "img/s-plan-ecole-rdc.jpg", "img/s-plan-site.jpg", "img/s-production.jpg", "img/s-resto.jpg", "img/s-rotonde.jpg", "img/v-dispositif.jpg", "img/v-processus.jpg"];
IMG_M_LISTE.forEach(function (s) { IMG_M[s] = 1; });
function IM(s) { return window.PETIT && IMG_M[s] ? "img/m/" + s.slice(4) : s; }

/* PINCER AVEC DEUX DOIGTS = ZOOMER (accueil et carte, sur téléphone et tablette) */
function pincer(el, quandPince) {
  var doigts = {}, avant = null;
  function liste() { return Object.keys(doigts).map(function (k) { return doigts[k]; }); }
  el.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "touch") return;
    doigts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (liste().length === 2) { el.dataset.pince = "1"; avant = null; }
  });
  addEventListener("pointermove", function (e) {
    if (!doigts[e.pointerId]) return;
    doigts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var L = liste();
    if (L.length < 2) return;
    var a = L[0], b = L[1], dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (avant) quandPince(dist / avant.dist, mx, my, mx - avant.mx, my - avant.my);
    avant = { dist: dist, mx: mx, my: my };
  });
  function fin(e) {
    delete doigts[e.pointerId];
    if (liste().length < 2) { avant = null; setTimeout(function () { if (liste().length < 2) el.dataset.pince = ""; }, 120); }
  }
  addEventListener("pointerup", fin);
  addEventListener("pointercancel", fin);
}

window.LANG = "fr";   // le site s'ouvre TOUJOURS en français (à chaque chargement) ; l'anglais seulement avec le bouton Fr / En
try { localStorage.removeItem("rose-langue"); } catch (e) {}
document.documentElement.lang = window.LANG;

/* =========================================================
   ROSE BOUCHER-EMOND — le JavaScript de tout le site (version 7)
   tout le site est dans index.html ; ce fichier affiche la bonne page selon l’adresse
   ========================================================= */



/* ============================================================
   LES TRAITS DE CRAYON (dessins)
   ============================================================ */
/* traits au crayon (svg) — générés, pas besoin d'y toucher */
window.CRAYONS = {"cercle": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 220 120\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n<defs>\n <filter id=\"cr-circle\" x=\"-5%\" y=\"-5%\" width=\"110%\" height=\"110%\">\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.035\" numOctaves=\"2\" seed=\"4\" result=\"warp\"/>\n  <feDisplacementMap in=\"SourceGraphic\" in2=\"warp\" scale=\"4\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"w\"/>\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"3\" seed=\"11\" result=\"grain\"/>\n  <feColorMatrix in=\"grain\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05\" result=\"mask\"/>\n  <feComposite in=\"w\" in2=\"mask\" operator=\"in\" result=\"g\"/>\n  <feGaussianBlur in=\"g\" stdDeviation=\"0.25\"/>\n </filter>\n</defs>\n\n<g filter=\"url(#cr-circle)\">\n<path d=\"M194.0,42.6 L198.8,46.1 L202.4,50.6 L206.0,55.0 L208.9,59.9 L209.7,65.5 L207.7,70.7 L205.1,75.4 L201.4,79.7 L197.4,84.9 L191.2,89.0 L184.1,93.2 L175.9,97.0 L167.0,100.2 L157.5,102.3 L147.5,101.9 L137.7,101.8 L128.2,101.6 L118.7,101.4 L109.4,102.8 L99.9,103.3 L90.5,102.6 L81.0,101.4 L71.4,99.6 L62.0,97.5 L52.3,97.3 L43.5,94.6 L35.4,91.3 L28.2,87.9 L21.6,84.6 L17.0,80.0 L13.0,75.5 L13.0,69.9 L13.9,65.1 L14.9,60.4 L16.4,55.5 L20.3,51.7 L23.8,47.4 L28.4,44.0 L33.2,40.4 L37.6,36.2 L42.4,31.9 L48.2,28.2 L54.4,24.3 L61.2,20.0 L69.2,16.6 L78.5,15.1 L87.9,11.9 L93.0,10.3 L98.2,10.5 L103.5,10.0 L108.8,10.2 L114.2,10.5 L119.5,10.5 L124.5,12.7 L129.8,12.2 L139.6,13.9 L149.0,15.6 L157.1,19.2 L164.8,22.0 L171.6,25.4 L177.1,30.0 L182.8,33.4 L187.6,37.5 L191.3,42.3 L196.5,45.4 L201.2,49.0 L204.8,53.4 L206.3,58.8 L207.3,63.9 L208.2,68.9 L207.2,74.3 L204.9,79.8 L200.4,84.3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</g>\n</svg>", "fleche": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 180 50\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n<defs>\n <filter id=\"cr-arrow\" x=\"-5%\" y=\"-5%\" width=\"110%\" height=\"110%\">\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.035\" numOctaves=\"2\" seed=\"4\" result=\"warp\"/>\n  <feDisplacementMap in=\"SourceGraphic\" in2=\"warp\" scale=\"4\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"w\"/>\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"3\" seed=\"11\" result=\"grain\"/>\n  <feColorMatrix in=\"grain\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05\" result=\"mask\"/>\n  <feComposite in=\"w\" in2=\"mask\" operator=\"in\" result=\"g\"/>\n  <feGaussianBlur in=\"g\" stdDeviation=\"0.25\"/>\n </filter>\n</defs>\n\n<g filter=\"url(#cr-arrow)\">\n<path d=\"M6.0,30.2 L11.4,30.3 L16.9,30.3 L22.3,30.5 L27.7,30.2 L33.2,30.2 L38.5,28.3 L43.8,27.6 L49.3,28.0 L54.7,27.6 L60.0,27.7 L65.0,26.8 L70.0,27.0 L75.0,26.7 L80.0,27.2 L85.0,27.7 L90.1,27.1 L95.1,27.1 L100.1,27.3 L105.0,28.8 L110.0,29.7 L115.0,29.3 L120.0,30.3 L124.9,28.9 L130.0,28.7 L134.9,27.4 L139.8,26.0 L144.9,26.5 L149.9,25.5 L154.8,24.5 L160.0,25.2 L165.1,25.3 L170.0,24.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M6.1,30.9 L11.5,30.4 L16.9,30.1 L22.2,28.9 L27.7,29.4 L33.1,29.1 L38.5,29.4 L44.0,29.3 L49.3,28.0 L54.6,27.0 L60.0,25.8 L65.1,25.5 L70.1,25.1 L75.1,25.5 L80.1,26.4 L85.1,26.0 L90.1,27.1 L95.1,27.3 L100.1,27.5 L105.0,28.8 L110.0,29.1 L115.0,29.1 L120.0,29.6 L125.0,29.5 L129.9,28.0 L135.0,28.5 L139.9,26.9 L145.0,27.0 L150.1,27.1 L154.9,25.3 L160.0,25.4 L165.0,24.5 L170.0,24.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M150.4,9.3 L155.1,11.7 L159.6,14.3 L163.4,18.1 L168.0,20.5 L172.2,24.0 L166.9,26.7 L161.8,29.5 L157.3,33.1 L152.7,36.6 L147.9,39.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</g>\n</svg>", "reliure": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 1200\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n<defs>\n <filter id=\"cr-gutter\" x=\"-5%\" y=\"-5%\" width=\"110%\" height=\"110%\">\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.035\" numOctaves=\"2\" seed=\"4\" result=\"warp\"/>\n  <feDisplacementMap in=\"SourceGraphic\" in2=\"warp\" scale=\"4\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"w\"/>\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"3\" seed=\"11\" result=\"grain\"/>\n  <feColorMatrix in=\"grain\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05\" result=\"mask\"/>\n  <feComposite in=\"w\" in2=\"mask\" operator=\"in\" result=\"g\"/>\n  <feGaussianBlur in=\"g\" stdDeviation=\"0.25\"/>\n </filter>\n</defs>\n\n<g filter=\"url(#cr-gutter)\">\n<path d=\"M9.1,6.0 L8.3,11.0 L8.7,16.0 L9.8,21.0 L11.5,26.0 L10.6,31.0 L10.5,36.0 L9.6,41.0 L10.1,46.0 L9.2,51.0 L10.1,56.0 L9.1,61.0 L8.6,66.0 L9.2,71.0 L9.3,76.0 L8.9,81.0 L10.2,86.0 L9.9,91.0 L9.0,96.0 L10.0,101.0 L9.0,106.0 L8.7,111.0 L7.9,116.0 L9.0,121.0 L10.5,126.0 L9.4,131.0 L8.6,136.0 L9.1,141.0 L10.6,146.0 L11.4,151.0 L10.7,156.0 L11.2,161.0 L9.4,166.0 L9.3,171.0 L10.4,176.0 L9.8,181.0 L10.3,186.0 L8.8,191.0 L7.8,196.0 L8.3,201.0 L8.3,206.0 L8.1,211.0 L7.6,216.0 L6.7,221.0 L9.0,226.0 L9.7,231.0 L9.4,236.0 L10.2,241.0 L9.9,246.0 L11.2,251.0 L9.7,256.0 L9.7,261.0 L11.0,266.0 L10.2,271.0 L10.8,276.0 L11.5,281.0 L11.2,286.0 L12.1,291.0 L12.5,296.0 L10.7,301.0 L9.9,306.0 L11.5,311.0 L10.2,316.0 L11.7,321.0 L11.8,326.0 L10.1,331.0 L9.7,336.0 L10.4,341.0 L10.7,346.0 L10.9,351.0 L11.8,356.0 L9.8,361.0 L11.3,366.0 L11.2,371.0 L10.1,376.0 L10.4,381.0 L8.8,386.0 L9.9,391.0 L8.4,396.0 L7.5,401.0 L7.6,406.0 L7.0,411.0 L7.9,416.0 L7.4,421.0 L7.1,426.0 L7.7,431.0 L8.4,436.0 L8.1,441.0 L8.9,446.0 L10.5,451.0 L9.6,456.0 L10.4,461.0 L10.4,466.0 L9.4,471.0 L10.6,476.0 L12.0,481.0 L12.7,486.0 L11.7,491.0 L11.7,496.0 L12.1,501.0 L11.7,506.0 L9.9,511.0 L10.7,516.0 L10.8,521.0 L9.4,526.0 L9.2,531.0 L10.1,536.0 L10.2,541.0 L10.2,546.0 L11.3,551.0 L11.4,556.0 L11.6,561.0 L10.3,566.0 L10.8,571.0 L10.1,576.0 L8.5,581.0 L7.6,586.0 L8.6,591.0 L8.6,596.0 L9.5,601.0 L10.0,606.0 L10.0,611.0 L9.1,616.0 L7.9,621.0 L9.1,626.0 L10.9,631.0 L10.8,636.0 L12.0,641.0 L13.0,646.0 L11.4,651.0 L12.3,656.0 L11.0,661.0 L11.2,666.0 L9.5,671.0 L8.5,676.0 L10.3,681.0 L11.2,686.0 L9.5,691.0 L9.2,696.0 L9.7,701.0 L8.9,706.0 L8.1,711.0 L8.6,716.0 L9.1,721.0 L10.6,726.0 L10.9,731.0 L11.8,736.0 L10.9,741.0 L10.4,746.0 L11.4,751.0 L10.7,756.0 L11.8,761.0 L12.6,766.0 L11.5,771.0 L11.2,776.0 L9.6,781.0 L9.3,786.0 L8.8,791.0 L10.3,796.0 L9.2,801.0 L10.7,806.0 L10.2,811.0 L8.8,816.0 L7.8,821.0 L7.1,826.0 L8.0,831.0 L7.9,836.0 L7.5,841.0 L9.3,846.0 L8.0,851.0 L7.2,856.0 L8.1,861.0 L7.7,866.0 L8.4,871.0 L9.5,876.0 L9.0,881.0 L10.6,886.0 L9.5,891.0 L8.1,896.0 L9.3,901.0 L8.0,906.0 L9.9,911.0 L8.8,916.0 L9.8,921.0 L8.3,926.0 L9.0,931.0 L7.9,936.0 L9.9,941.0 L11.3,946.0 L9.9,951.0 L9.5,956.0 L9.5,961.0 L11.1,966.0 L11.9,971.0 L11.8,976.0 L12.8,981.0 L10.5,986.0 L9.5,991.0 L8.2,996.0 L8.0,1001.0 L9.0,1006.0 L10.6,1011.0 L9.7,1016.0 L11.0,1021.0 L10.6,1026.0 L10.6,1031.0 L10.5,1036.0 L11.7,1041.0 L12.6,1046.0 L11.9,1051.0 L12.9,1056.0 L12.1,1061.0 L12.7,1066.0 L12.7,1071.0 L13.2,1076.0 L12.2,1081.0 L12.0,1086.0 L12.4,1091.0 L12.7,1096.0 L11.8,1101.0 L10.0,1106.0 L10.3,1111.0 L11.3,1116.0 L11.6,1121.0 L12.0,1126.0 L11.3,1131.0 L10.0,1136.0 L9.8,1141.0 L10.9,1146.0 L11.2,1151.0 L11.3,1156.0 L11.1,1161.0 L11.2,1166.0 L9.3,1171.0 L9.3,1176.0 L9.0,1181.0 L8.5,1186.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</g>\n</svg>", "coche": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 46 40\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n<defs>\n <filter id=\"cr-tick\" x=\"-5%\" y=\"-5%\" width=\"110%\" height=\"110%\">\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.035\" numOctaves=\"2\" seed=\"4\" result=\"warp\"/>\n  <feDisplacementMap in=\"SourceGraphic\" in2=\"warp\" scale=\"4\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"w\"/>\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"3\" seed=\"11\" result=\"grain\"/>\n  <feColorMatrix in=\"grain\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05\" result=\"mask\"/>\n  <feComposite in=\"w\" in2=\"mask\" operator=\"in\" result=\"g\"/>\n  <feGaussianBlur in=\"g\" stdDeviation=\"0.25\"/>\n </filter>\n</defs>\n\n<g filter=\"url(#cr-tick)\">\n<path d=\"M6.2,21.8 L9.9,25.5 L12.9,29.8 L16.0,33.1 L18.9,29.6 L22.3,25.5 L25.4,21.2 L29.0,17.4 L32.1,13.1 L35.7,9.2 L38.8,5.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"5.0\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</g>\n</svg>", "tiret": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 16\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n<defs>\n <filter id=\"cr-dash\" x=\"-5%\" y=\"-5%\" width=\"110%\" height=\"110%\">\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.035\" numOctaves=\"2\" seed=\"4\" result=\"warp\"/>\n  <feDisplacementMap in=\"SourceGraphic\" in2=\"warp\" scale=\"4\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"w\"/>\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"3\" seed=\"11\" result=\"grain\"/>\n  <feColorMatrix in=\"grain\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05\" result=\"mask\"/>\n  <feComposite in=\"w\" in2=\"mask\" operator=\"in\" result=\"g\"/>\n  <feGaussianBlur in=\"g\" stdDeviation=\"0.25\"/>\n </filter>\n</defs>\n\n<g filter=\"url(#cr-dash)\">\n<path d=\"M4.0,7.6 L9.1,8.3 L14.2,7.5 L19.3,7.8 L24.4,7.1 L29.4,6.7 L34.5,7.6 L39.6,7.0 L44.7,7.2 L49.8,7.1 L54.9,7.0 L60.0,6.9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4.0\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</g>\n</svg>", "poteaux": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 165\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n<defs>\n <filter id=\"cr-poles\" x=\"-5%\" y=\"-5%\" width=\"110%\" height=\"110%\">\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.035\" numOctaves=\"2\" seed=\"4\" result=\"warp\"/>\n  <feDisplacementMap in=\"SourceGraphic\" in2=\"warp\" scale=\"4\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"w\"/>\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"3\" seed=\"11\" result=\"grain\"/>\n  <feColorMatrix in=\"grain\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05\" result=\"mask\"/>\n  <feComposite in=\"w\" in2=\"mask\" operator=\"in\" result=\"g\"/>\n  <feGaussianBlur in=\"g\" stdDeviation=\"0.25\"/>\n </filter>\n</defs>\n\n<g filter=\"url(#cr-poles)\">\n<path d=\"M29.9,150.0 L29.8,144.9 L29.4,139.8 L30.2,134.8 L29.5,129.7 L29.8,124.6 L30.7,119.5 L30.0,114.5 L30.3,109.4 L30.7,104.3 L30.0,99.2 L30.1,94.1 L30.7,89.1 L30.7,84.0 L31.2,78.9 L30.7,73.8 L30.5,68.8 L30.1,63.7 L30.5,58.6 L31.5,53.5 L31.7,48.5 L32.2,43.4 L31.9,38.3 L32.3,33.2 L31.6,28.2 L31.4,23.1 L31.9,18.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"5.0\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M30.4,150.0 L30.2,144.9 L29.6,139.8 L29.4,134.8 L29.3,129.7 L29.2,124.6 L30.1,119.5 L29.8,114.5 L30.7,109.4 L31.3,104.3 L30.5,99.2 L30.5,94.1 L30.6,89.1 L30.0,84.0 L30.2,78.9 L31.2,73.8 L30.6,68.8 L31.0,63.7 L30.6,58.6 L31.0,53.5 L31.8,48.5 L31.3,43.4 L30.7,38.3 L30.4,33.2 L30.8,28.1 L30.4,23.1 L30.2,18.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M150.0,150.0 L150.7,144.9 L150.5,139.9 L150.3,134.8 L150.6,129.7 L150.0,124.6 L150.3,119.5 L149.9,114.5 L150.3,109.4 L151.2,104.3 L150.4,99.2 L150.7,94.2 L151.0,89.1 L150.5,84.0 L150.3,78.9 L151.4,73.8 L152.2,68.8 L151.4,63.7 L151.8,58.6 L152.5,53.6 L151.9,48.5 L152.1,43.4 L151.3,38.3 L151.3,33.2 L151.7,28.2 L152.0,23.1 L152.5,18.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"5.0\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M149.3,150.0 L149.3,144.9 L150.2,139.8 L150.4,134.8 L150.3,129.7 L150.3,124.6 L151.1,119.5 L151.2,114.5 L150.3,109.4 L150.9,104.3 L150.7,99.2 L150.7,94.2 L150.3,89.1 L150.5,84.0 L150.4,78.9 L150.0,73.8 L150.6,68.8 L150.2,63.7 L151.0,58.6 L150.4,53.5 L151.2,48.5 L151.8,43.4 L151.9,38.3 L152.2,33.2 L151.8,28.2 L152.3,23.1 L152.1,18.0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M32.2,39.6 L36.7,43.4 L41.8,46.2 L46.8,48.8 L51.4,52.0 L56.5,54.1 L61.4,56.4 L66.5,57.6 L71.2,59.5 L76.3,59.9 L81.2,59.7 L86.1,60.7 L90.9,59.7 L96.0,59.7 L101.1,59.1 L106.1,57.4 L110.7,54.5 L115.3,51.8 L120.1,49.2 L125.0,46.7 L130.1,44.5 L135.4,42.7 L140.2,40.0 L144.9,37.1 L149.9,35.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4.0\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M32.5,99.7 L35.4,104.5 L37.4,109.3 L41.9,111.3 L46.9,111.9 L51.8,112.9 L56.6,113.8 L61.5,114.1 L66.4,113.3 L71.5,112.9 L76.2,110.8 L81.3,109.4 L86.4,107.6 L91.5,105.7 L96.3,102.9 L100.8,99.6 L105.4,96.5 L110.4,94.2 L115.2,91.6 L120.3,89.9 L125.1,87.7 L130.3,87.1 L135.2,85.8 L140.1,84.8 L145.2,84.6 L150.1,85.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4.0\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M20.2,152.1 L22.8,143.9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M59.1,151.7 L62.3,143.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M121.2,152.4 L124.0,144.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M171.2,152.4 L172.6,143.9\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M4.0,153.4 L9.1,154.1 L14.1,153.7 L19.2,153.3 L24.2,153.0 L29.3,153.9 L34.3,152.1 L39.4,152.4 L44.4,152.4 L49.5,151.6 L54.5,152.3 L59.6,152.7 L64.6,151.3 L69.7,152.0 L74.7,151.7 L79.8,151.6 L84.8,152.0 L89.9,150.6 L94.9,151.1 L100.0,150.8 L105.1,152.0 L110.1,151.1 L115.2,152.1 L120.2,152.5 L125.3,152.6 L130.3,153.3 L135.4,151.5 L140.4,151.7 L145.5,151.9 L150.5,152.2 L155.6,151.7 L160.6,150.3 L165.7,149.6 L170.7,150.3 L175.8,149.6 L180.8,148.7 L185.9,148.9 L190.9,149.3 L196.0,149.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"4.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</g>\n</svg>", "souligne": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 30\" preserveAspectRatio=\"none\" aria-hidden=\"true\">\n<defs>\n <filter id=\"cr-underline\" x=\"-5%\" y=\"-5%\" width=\"110%\" height=\"110%\">\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.035\" numOctaves=\"2\" seed=\"4\" result=\"warp\"/>\n  <feDisplacementMap in=\"SourceGraphic\" in2=\"warp\" scale=\"4\" xChannelSelector=\"R\" yChannelSelector=\"G\" result=\"w\"/>\n  <feTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"3\" seed=\"11\" result=\"grain\"/>\n  <feColorMatrix in=\"grain\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4.2 0 0 0 3.05\" result=\"mask\"/>\n  <feComposite in=\"w\" in2=\"mask\" operator=\"in\" result=\"g\"/>\n  <feGaussianBlur in=\"g\" stdDeviation=\"0.25\"/>\n </filter>\n</defs>\n\n<g filter=\"url(#cr-underline)\">\n<path d=\"M8.0,13.4 L13.1,13.4 L18.2,12.9 L23.4,13.1 L28.5,13.2 L33.6,11.8 L38.7,10.6 L43.8,11.7 L49.0,11.0 L54.1,10.4 L59.3,11.6 L64.4,11.3 L69.5,11.8 L74.7,11.3 L79.8,11.3 L84.9,10.0 L90.0,10.1 L95.0,11.1 L100.0,11.1 L105.0,11.6 L110.0,11.8 L115.0,10.6 L120.0,11.4 L125.0,11.6 L130.0,11.1 L135.0,10.1 L140.0,11.4 L145.0,11.5 L150.0,12.1 L155.0,13.1 L160.0,13.4 L164.9,14.2 L170.0,13.5 L175.0,14.0 L180.0,13.6 L184.9,14.5 L189.9,15.1 L195.0,13.7 L200.0,12.7 L205.1,11.8 L210.2,12.9 L215.3,12.4 L220.5,12.3 L225.5,11.5 L230.7,11.2 L235.8,10.7 L240.9,10.2 L246.0,10.2 L251.1,10.2 L256.3,10.9 L261.4,10.8 L266.5,11.3 L271.7,11.4 L276.8,11.7 L281.9,11.1 L287.0,9.4 L292.1,9.7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"5.0\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M8.1,15.1 L13.2,15.6 L18.3,15.0 L23.5,14.9 L28.5,13.5 L33.7,14.0 L38.8,13.6 L43.9,12.5 L49.0,11.2 L54.1,12.0 L59.3,12.8 L64.4,11.3 L69.5,11.7 L74.6,11.1 L79.7,9.9 L84.8,9.3 L90.0,9.9 L95.0,11.0 L100.0,9.8 L105.0,10.3 L110.0,9.4 L115.0,10.4 L120.0,10.2 L125.0,11.4 L130.0,12.6 L135.0,12.3 L139.9,13.4 L145.0,12.6 L150.0,11.4 L155.0,11.9 L160.0,10.8 L165.0,10.5 L170.0,10.8 L175.0,11.6 L180.0,11.1 L185.1,10.4 L190.0,12.0 L195.0,11.9 L200.0,13.4 L205.2,13.9 L210.3,13.1 L215.4,12.5 L220.5,12.2 L225.6,12.2 L230.7,12.0 L235.8,11.7 L240.9,11.5 L246.1,12.1 L251.2,11.5 L256.3,10.7 L261.4,10.8 L266.5,9.6 L271.5,8.8 L276.7,9.7 L281.8,9.3 L286.9,8.9 L292.0,7.3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M30.0,21.8 L35.0,21.9 L40.0,20.8 L45.0,21.2 L50.0,21.4 L55.0,20.4 L60.0,20.8 L65.0,20.7 L70.0,21.1 L75.0,20.6 L80.0,21.0 L85.0,21.3 L90.0,20.0 L95.0,19.1 L100.0,19.7 L105.0,20.6 L110.0,19.9 L115.0,19.7 L120.0,19.8 L125.0,19.3 L130.0,19.0 L135.0,18.6 L140.0,18.4 L145.0,18.7 L150.0,18.3 L155.0,18.3 L160.0,19.2 L165.0,18.4 L170.0,18.8 L175.0,19.6 L180.0,19.3 L185.0,19.0 L190.0,19.9 L195.0,19.5 L200.0,19.1 L205.0,19.3 L210.0,20.1 L215.0,19.4 L220.0,19.4 L225.0,19.5 L230.0,20.6 L235.0,20.6 L240.0,21.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</g>\n</svg>"};


/* ============================================================
   LA LISTE DES PROJETS (pour ajouter un projet, c’est ici)
   ============================================================ */
/* =========================================================
   projets.js — la liste des 9 projets
   pour ajouter un projet : remplir un bloc "à venir" plus bas
   (les 3 vues de l'accueil - grille, carte, liste - lisent tout ici)
   ========================================================= */


window.PROJETS = [

  /* du plus récent (en haut de la page Projets) au plus ancien */

  {
    no: "09",
    titre_en: "The Québec National Film Centre",
    sous_en: "",
    lignes_en: ["The Québec National", "Film Centre"],
    lignes: ["Le Centre national", "du film du Québec"],          // le titre sur deux lignes dans le cahier (page Projets)
    titre: "Le Centre national du film du Québec",
    sous: "",
    annee: "",
    page: "#/centre-national-du-film",
    couverture: "img/c-ext.jpg",
    entier: 1.18,                           // la couverture est montrée en entier
    images: [
      ["img/c-ext.jpg", 1.18],
      [IM("img/c-plan.jpg"), 1.74, "plan"],
      [IM("img/c-croquis.jpg"), 1.1, "plan"],
      ["img/c-poteaux.jpg", 1.38, "plan"],
      [IM("img/c-elevation-long.jpg"), 2.86, "plan"],
      [IM("img/c-axo.jpg"), 1.57, "plan"],
      [IM("img/c-coupe.jpg"), 0.77, "plan"],
      [IM("img/c-elevation.jpg"), 1.18],
      [IM("img/c-facade.jpg"), 1.18],
      ["img/c-int-4.jpg", 1.18],
      ["img/c-int-1.jpg", 1.18],
      ["img/c-int-6.jpg", 0.98]
    ]
  },


  {
    no: "08",
    titre_en: "Video Exploration",
    sous_en: "",
    titre: "Exploration vidéo",
    sous: "",
    annee: "2025",
    page: "#/exploration-video",
    couverture: "img/v-image.jpg",
    entier: 1.78,                           // la couverture est montrée en entier
    images: [
      ["img/v-image.jpg", 1.78],
      [IM("img/v-dispositif.jpg"), 0.75],
      [IM("img/v-processus.jpg"), 0.75]
    ]
  },


  {
    no: "07",
    titre_en: "July 1st",
    sous_en: "La Crise de l’Objet",
    titre: "1er Juillet",
    sous: "La crise de l’objet",
    annee: "Hiver 2026",
    page: "#/1er-juillet",
    couverture: IM("img/o-diable-1.jpg"),
    entier: 0.8,                           // la couverture est montrée en entier
    images: [
      [IM("img/o-diable-4.jpg"), 0.8],
      [IM("img/o-diable-1.jpg"), 0.8],
      [IM("img/o-diable-2.jpg"), 0.8],
      [IM("img/o-croquis.jpg"), 1.02, "plan"],
      [IM("img/o-diable-3.jpg"), 0.8],
      [IM("img/o-atelier-1.jpg"), 0.74],
      [IM("img/o-atelier-3.jpg"), 0.87],
      [IM("img/o-atelier-4.jpg"), 1.03],
      [IM("img/o-atelier-2.jpg"), 0.83],
      [IM("img/o-rue.jpg"), 0.86]
    ]
  },


  {
    no: "06",
    titre_en: "16 Manifesto Architectures",
    sous_en: "Studio 5",
    titre: "16 architectures manifestes",
    sous: "Atelier 5",
    annee: "Automne 2025",
    page: "#/16-architectures-manifestes",
    couverture: IM("img/m-expo-1.jpg"),
    entier: 0.75,                           // la couverture est montrée en entier
    images: [
      [IM("img/m-expo-1.jpg"), 0.75],
      [IM("img/m-expo-2.jpg"), 1.0],
      [IM("img/m-manifeste.jpg"), 1.4, "plan"],
      [IM("img/m-processus.jpg"), 1.33, "plan"],
      [IM("img/m-planche.jpg"), 2.31, "plan"],
      [IM("img/m-machine-1.jpg"), 1.44],
      ["img/m-machine-2.jpg", 0.42],
      [IM("img/m-machine-5.jpg"), 0.64],
      [IM("img/m-machine-3.jpg"), 1.44],
      [IM("img/m-machine-4.jpg"), 1.56],
      [IM("img/m-machine-6.jpg"), 1.63]
    ]
  },


  {
    no: "05",
    titre_en: "Designing a Speculative Museum in the Namib Desert",
    sous_en: "Digital",
    lignes_en: ["Designing a Speculative Museum", "in the Namib Desert"],
    lignes: ["Conception d’un musée spéculatif dans", "le désert de Namib"],          // le titre sur deux lignes dans le cahier (page Projets)
    titre: "Conception d’un musée spéculatif dans le désert de Namib",
    sous: "Numérique",
    annee: "Automne 2025",
    page: "#/musee-namib",
    couverture: IM("img/n-rendu.jpg"),
    entier: 1.78,                           // la couverture est montrée en entier
    images: [
      [IM("img/n-rendu.jpg"), 1.78],
      [IM("img/n-narration.jpg"), 0.7, "plan"],
      [IM("img/n-partition.jpg"), 1.79, "plan"],
      [IM("img/n-site-axo.jpg"), 2.0, "plan"],
      ["img/n-schema.jpg", 1.0, "plan"],
      [IM("img/n-albedome.jpg"), 1.78, "plan"],
      [IM("img/n-chunk.jpg"), 1.78],
      [IM("img/n-voxel.jpg"), 1.83, "plan"],
      ["img/n-bloc.jpg", 0.99],
      ["img/n-texture-2.jpg", 0.99],
      [IM("img/n-modules.jpg"), 4.49, "plan"],
      [IM("img/n-maquette.jpg"), 1.5]
    ]
  },


  {
    no: "04",
    titre_en: "The Art of the Everyday",
    sous_en: "INSA Strasbourg",
    titre: "L’Art du quotidien",
    sous: "INSA Strasbourg",
    annee: "Hiver 2025",
    page: "#/art-du-quotidien",
    couverture: IM("img/s-coupe-persp.jpg"),
    entier: 1.77,                           // la couverture est montrée en entier
    images: [
      [IM("img/s-coupe-persp.jpg"), 1.77, "plan"],
      [IM("img/s-plan-site.jpg"), 1.44, "plan"],
      [IM("img/s-coupe-paysage.jpg"), 4.24, "plan"],
      [IM("img/s-rotonde.jpg"), 0.78, "plan"],
      [IM("img/s-plan-ecole-rdc.jpg"), 0.76, "plan"],
      [IM("img/s-plan-ecole-1.jpg"), 0.63, "plan"],
      [IM("img/s-maisons.jpg"), 1.15, "plan"],
      [IM("img/s-resto.jpg"), 0.71, "plan"],
      [IM("img/s-production.jpg"), 0.78, "plan"],
      [IM("img/s-coupe-atelier.jpg"), 1.41, "plan"]
    ]
  },


  {
    no: "03",
    titre_en: "The Butterfly Effect",
    sous_en: "Digital Figuration",
    titre: "L’effet papillon",
    sous: "Figuration numérique",
    annee: "Hiver 2024",
    page: "#/effet-papillon",
    couverture: IM("img/f-maquette.jpg"),
    entier: 1.36,                           // l'image principale est montrée en entier (largeur / hauteur)
    // vue liste : quelques images choisies, en rangées, jamais coupées ([image, largeur / hauteur])
    liste: [
      [[IM("img/f-maquette.jpg"), 1.36], ["img/f-bulle.jpg", 0.75]],
      [[IM("img/f-motif.jpg"), 1.37], [IM("img/f-subdivision.jpg"), 1.36, "plan"]]
    ],
    images: [
      [IM("img/f-maquette.jpg"), 1.36],
      [IM("img/f-elevation.jpg"), 1.37, "plan"],
      [IM("img/f-subdivision.jpg"), 1.36, "plan"],
      [IM("img/f-texture.jpg"), 0.92],
      [IM("img/f-scenario.jpg"), 1.18, "plan"],
      ["img/f-bulle.jpg", 0.75],
      [IM("img/f-motif.jpg"), 1.37],
      [IM("img/f-membrane.jpg"), 1.37],
      [IM("img/f-plan-bulles.jpg"), 1.14, "plan"],
      [IM("img/f-espaces.jpg"), 1.27, "plan"]
    ]
  },


  {
    no: "02",
    titre_en: "The Spatial Field",
    sous_en: "Studio 4",
    titre: "Le champ spatial",
    sous: "Atelier 4",
    annee: "Hiver 2024",
    page: "#/champ-spatial",
    p: 18,
    couverture: IM("img/a-vue-ext.jpg"),
    // vue liste : la vue extérieure en entier, puis quelques images choisies (jamais coupées)
    liste: [
      [[IM("img/a-vue-ext.jpg"), 1.79]],
      [[IM("img/a-int-gradins.jpg"), 1.78], [IM("img/a-plan-l2.jpg"), 1.78, "plan"]]
    ],
    images: [
      [IM("img/a-vue-ext.jpg"), 1.79],
      [IM("img/a-mapping.jpg"), 1.78, "plan"],
      [IM("img/a-forces-vent.jpg"), 1.77, "plan"],
      [IM("img/a-axo.jpg"), 0.43, "plan"],
      [IM("img/a-int-gradins.jpg"), 1.78],
      ["img/a-trame-corps.jpg", 1.13, "plan"],
      [IM("img/a-plan-l2.jpg"), 1.78, "plan"],
      [IM("img/a-int-repas.jpg"), 1.78],
      [IM("img/a-poteau.jpg"), 1.55, "plan"],
      [IM("img/a-forces-corps.jpg"), 1.78, "plan"],
      [IM("img/a-coupe-tech.jpg"), 1.95, "plan"],
      [IM("img/a-trame-poteaux.jpg"), 1.86, "plan"],
      [IM("img/a-elevation.jpg"), 2.95, "plan"]
    ]
  },


  {
    no: "01",
    titre_en: "Inspire",
    sous_en: "Wood",
    titre: "Inspire",
    sous: "Bois",
    annee: "Automne 2023",
    page: "#/inspire",
    p: 3,                                   // "page" du carnet dans la vue liste
    couverture: IM("img/b-objet-2.jpg"),
    // [image, largeur / hauteur]  (le ratio sert à placer les images sur la carte)
    images: [
      [IM("img/b-objet-2.jpg"), 0.75],
      [IM("img/b-objet-1.jpg"), 0.73],
      [IM("img/b-cyano-1.jpg"), 1.0],
      [IM("img/b-bain.jpg"), 1.3],
      [IM("img/b-objet-3.jpg"), 0.59],
      [IM("img/b-cyano-6.jpg"), 1.03],
      [IM("img/b-mapping.jpg"), 1.41, "plan"],
      [IM("img/b-cyano-3.jpg"), 0.99],
      [IM("img/b-objet-4.jpg"), 0.85],
      [IM("img/b-cyano-2.jpg"), 1.0],
      ["img/b-cyano-7.jpg", 0.75],
      [IM("img/b-cyano-5.jpg"), 1.02],
      [IM("img/b-cyano-4.jpg"), 1.03]
    ]
  }

];


/* ============================================================
   OUTIL : poser les traits de crayon
   ============================================================ */
/* TRAITS AU CRAYON - chaque [data-crayon] reçoit son dessin (crayons.js) */

function dessinerCrayons(racine) {
  (racine || document).querySelectorAll("[data-crayon]").forEach(function (el) {
    if (!el.dataset.fait) {
      el.innerHTML = window.CRAYONS[el.dataset.crayon] || "";
      el.dataset.fait = 1;
    }
  });
}


/* ============================================================
   COMMUN À TOUTES LES PAGES : menu, chapitres, images en grand, À propos…
   ============================================================ */
function initCommun() {
dessinerCrayons();




/* MENU - un cercle au crayon se dessine autour du mot qu'on survole */

document.querySelectorAll(".menu a, .menu button").forEach(function (lien, n) {

  // une ellipse un peu tremblée qui dépasse son point de départ, comme à la main
  var d = "", depart = -0.6 + n * 0.4;
  for (var k = 0; k <= 40; k++) {
    var t = depart + (k / 40) * (Math.PI * 2 + 0.55);
    var r = 1 + Math.sin(t * 3 + n) * 0.04 + (k / 40) * 0.06;
    var x = 50 + Math.cos(t) * 48 * r;
    var y = 20 + Math.sin(t) * 18 * r - (k / 40) * 2;
    d += (k ? " L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
  }

  lien.insertAdjacentHTML("beforeend",
    '<svg class="cercle-menu" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + '" vector-effect="non-scaling-stroke"/>' +
    "</svg>");

  var p = lien.querySelector(".cercle-menu path");
  var L = p.getTotalLength();
  p.style.strokeDasharray = L;
  p.style.strokeDashoffset = L;

  // la page où on est : le cercle se dessine à l'arrivée
  if (lien.classList.contains("ici")) {
    lien.classList.remove("ici");
    lien.style.color = "var(--bleu)";
    setTimeout(function () { lien.classList.add("ici"); }, 350);
  }

});




/* EN / FR : on change de langue (la même page, traduite) */

var en = document.getElementById("en");

if (en) {
  en.addEventListener("click", function () { if (window.changerLangue) window.changerLangue(); });
}




/* TRANSITION DOUCE quand on change de page */

document.addEventListener("click", function (e) {
  var a = e.target.closest("a[href$='.html']");
  if (!a || e.metaKey || e.ctrlKey || a.target) return;
  e.preventDefault();
  document.body.classList.add("part");
  setTimeout(function () { location.href = a.getAttribute("href"); }, 400);
});

// retour en arrière : on réaffiche
window.addEventListener("pageshow", function () {
  document.body.classList.remove("part");
});




/* GRIBOUILLIS - un trait + un gribouillis au crayon par-dessus chaque chapitre
   (caché au début, il se dessine quand on a fini le chapitre) */

var graineGri = 3;
function hasardGri() {
  graineGri = (graineGri * 16807) % 2147483647;
  return (graineGri - 1) / 2147483646;
}

document.querySelectorAll(".biffe").forEach(function (b) {
  var w = b.offsetWidth + 18;

  // 1er trait : une longue ligne un peu montante
  var d1 = "M2," + (16 + hasardGri() * 3);
  for (var x = 0; x <= w; x += w / 6) {
    d1 += " L" + x.toFixed(1) + "," + (15 - x / w * 5 + (hasardGri() - 0.5) * 2.5).toFixed(1);
  }

  // 2e trait : le gribouillis qui fait des allers-retours serrés sur le mot
  var debut = w * 0.18, fin = w * (0.5 + hasardGri() * 0.2);
  var d2 = "M" + debut.toFixed(1) + ",17";
  for (var k = 1; k <= 14; k++) {
    var t = k / 14;
    var xx = debut + (fin - debut) * (k % 2 ? t : t * 0.55) + (hasardGri() - 0.5) * 8;
    var yy = (k % 2 ? 7 : 21) + (hasardGri() - 0.5) * 4;
    d2 += " L" + xx.toFixed(1) + "," + yy.toFixed(1);
  }

  b.insertAdjacentHTML("beforeend",
    '<svg viewBox="0 0 ' + w + ' 26" aria-hidden="true">' +
      '<path d="' + d1 + '" stroke-width="4.5"/>' +
      '<path d="' + d2 + '" stroke-width="2.6"/>' +
    "</svg>");

  // chaque trait est "rangé" (invisible) jusqu'à ce qu'on l'efface
  b.querySelectorAll("path").forEach(function (p) {
    var L = p.getTotalLength();
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
  });
});




/* PAGE PROJET - le texte de gauche suit le chapitre qu'on regarde à droite */

var chapitres = document.querySelectorAll(".chapitre");
var texte = document.querySelector(".texte-chapitre .t");
var liens = document.querySelectorAll(".chapitres a");
var actuel = -1;

function montrerChapitre(i, direct) {
  if (i === actuel) return;
  actuel = i;

  var nouveau = chapitres[i].querySelector(".texte-mobile").innerHTML;
  var garder = !nouveau.trim();             // chapitre sans texte (ex. le mapping de Bois) : on garde le texte d'avant

  liens.forEach(function (l, j) {
    l.setAttribute("aria-current", j === i);
    l.classList.toggle("lu", j < i);        // les chapitres d'avant sont "effacés"
  });

  if (garder) return;
  // même texte que celui déjà affiché (ex. cyanotype ↔ mapping) : on ne refait pas l'effet
  if (nouveau.trim() === texte.innerHTML.trim()) return;
  if (direct) { texte.innerHTML = nouveau; return; }

  // petit fondu pendant que le texte change
  texte.classList.add("fondu");
  setTimeout(function () {
    texte.innerHTML = nouveau;
    texte.parentElement.scrollTop = 0;
    texte.classList.remove("fondu");
  }, 380);
}

if (chapitres.length && texte) {

  montrerChapitre(0, true);

  var obs = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting) montrerChapitre([].indexOf.call(chapitres, e.target));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  chapitres.forEach(function (c) { obs.observe(c); });

  // tout en bas de la page : le dernier chapitre est fini aussi
  addEventListener("scroll", function () {
    if (!liens.length) return;
    var fini = innerHeight + scrollY >= document.body.scrollHeight - 40;
    liens[liens.length - 1].classList.toggle("lu", fini);
  });

  // clic sur un chapitre = on glisse jusqu'à lui
  liens.forEach(function (l, j) {
    l.addEventListener("click", function (e) {
      e.preventDefault();
      chapitres[j].scrollIntoView({ behavior: "smooth" });
    });
  });

}




/* VISIONNEUSE - clic sur une image pour la voir en grand,
   puis on se promène dans toutes les images du projet (gauche / droite) */

var visio = document.querySelector(".visio");

if (visio) {

  var visioImg = visio.querySelector("img");
  var toutes = [].slice.call(document.querySelectorAll("figure .im"));
  var pos = 0;

  function afficher(i, doux) {
    pos = (i + toutes.length) % toutes.length;     // après la dernière, on revient à la première
    var img = toutes[pos].querySelector("img");
    var poser = function () {
      visioImg.src = img.src;
      visioImg.alt = img.alt;
      visio.querySelector(".legende").textContent = img.alt;
      visio.querySelector(".compte").textContent = (pos + 1) + " / " + toutes.length;
      visioImg.classList.remove("change");
    };
    if (!doux) { poser(); return; }
    visioImg.classList.add("change");               // petit fondu entre deux images
    setTimeout(poser, 300);
  }

  function ouvrir(el) {
    afficher(toutes.indexOf(el));
    visio.classList.add("on");
    visio.querySelector(".fermer").focus();
  }

  function fermer() {
    visio.classList.remove("on");
    toutes[pos].focus();
  }

  toutes.forEach(function (el) {
    el.addEventListener("click", function () { ouvrir(el); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ouvrir(el); }
    });
  });

  visio.querySelector(".prec").addEventListener("click", function () { afficher(pos - 1, true); });
  visio.querySelector(".suiv").addEventListener("click", function () { afficher(pos + 1, true); });
  visio.querySelector(".fermer").addEventListener("click", fermer);

  // clavier : flèches pour avancer / reculer, Échap pour fermer
  document.addEventListener("keydown", function (e) {
    if (!visio.classList.contains("on")) return;
    if (e.key === "Escape") fermer();
    if (e.key === "ArrowRight") afficher(pos + 1, true);
    if (e.key === "ArrowLeft") afficher(pos - 1, true);
  });

}




/* À PROPOS - le CV apparaît doucement quand on y arrive */

var cv = document.getElementById("cv");

if (cv) {
  var obsCv = new IntersectionObserver(function (entrees) {
    if (entrees[0].isIntersecting) cv.classList.add("vu");
  }, { rootMargin: "0px 0px -35% 0px" });
  obsCv.observe(cv);
}


// la tache "bio" apparaît seulement quand on est descendu sur la page
if (document.body.classList.contains("apropos")) {
  addEventListener("scroll", function () {
    document.body.classList.toggle("descendu", scrollY > innerHeight * 0.4);
  });
}




/* PARTOUT - le menu de droite disparaît tout de suite quand on descend,
   et réapparaît peu à peu quand on remonte */
{
  var dernierY = scrollY;
  addEventListener("scroll", function () {
    var y = scrollY;
    if (y > dernierY && y > 10) document.body.classList.add("menu-cache");
    else if (y < dernierY - 2 || y <= 10) document.body.classList.remove("menu-cache");
    document.body.classList.toggle("loin-du-haut", y > 30);   // téléphone : son nom n'apparaît qu'en haut de la page (jamais par-dessus les textes)
    dernierY = y;
  }, { passive: true });
}




/* PAGES PROJET - un titre trop long pour la moitié gauche devient un peu plus petit
   (pour ne jamais passer sous la ligne pointillée) */
function ajusterTitre() {
  var t = document.querySelector(".projet-titre");
  if (!t) return;
  t.style.fontSize = "";
  var taille = parseFloat(getComputedStyle(t).fontSize);
  while (t.scrollWidth > t.clientWidth + 1 && taille > 30) {
    taille -= 2;
    t.style.fontSize = taille + "px";
  }
}
ajusterTitre();
addEventListener("resize", ajusterTitre);
if (document.fonts) document.fonts.ready.then(ajusterTitre);
}


/* ============================================================
   MENU : le trait de crayon sous les mots
   ============================================================ */
function initMenu() {
/* VERSION 7 : le trait de crayon, sous chaque mot du menu */
(function () {
  var trait = '<svg class="trait-menu trait-cr" aria-hidden="true"></svg>';
  document.querySelectorAll(".menu a").forEach(function (l) {   // le trait de crayon : seulement dans le menu du haut (pied de page : la couleur seule)   // Fr / En : seulement la couleur au survol, pas de trait
   if (!l.querySelector(".trait-menu")) l.insertAdjacentHTML("beforeend", trait); });   // le même trait de crayon au survol : menu du haut et pied de page

  /* TÉLÉPHONE : le menu = deux petits traits en haut à droite ; on touche = le menu s'ouvre sur toute la page
     (sur ordinateur, ces éléments sont cachés : le menu reste comme avant) */
  var haut = document.querySelector(".haut");
  if (!haut || haut.querySelector(".burger")) return;
  var anglais = window.LANG === "en";
  var liens = "";
  document.querySelectorAll(".haut .menu a").forEach(function (a) {
    var ici = a.classList.contains("ici") || a.style.color;
    liens += '<a href="' + a.getAttribute("href") + '"' + (ici ? ' class="ici"' : "") + ">" + a.firstChild.textContent.trim() + trait + "</a>";
  });
  liens += '<button type="button" class="langue"><span' + (anglais ? "" : ' class="on"') + '>Fr</span> / <span' + (anglais ? ' class="on"' : "") + ">En</span></button>";
  haut.insertAdjacentHTML("beforeend",
    '<button type="button" class="burger" aria-label="Menu" aria-expanded="false">' +
      // deux traits au crayon bleu (même crayon et même épaisseur que les flèches et les lignes de l'accueil)
      '<svg class="t1" viewBox="0 0 26 6" aria-hidden="true"><path d="M1.2,3.3 C3.4,3.0 5.6,3.4 7.9,3.2 C10.3,3.0 12.4,3.3 14.8,3.1 C17.3,2.9 19.4,3.3 21.7,3.0 C22.9,2.9 24.0,3.0 24.8,2.8"/></svg>' +
      '<svg class="t2" viewBox="0 0 26 6" aria-hidden="true"><path d="M1.0,2.9 C3.3,3.2 5.4,2.9 7.8,3.1 C10.2,3.3 12.5,2.9 14.9,3.1 C17.2,3.3 19.5,3.0 21.9,3.2 C23.0,3.3 24.1,3.1 24.9,3.2"/></svg>' +
      "</button>" +
    '<div class="menu-plein" aria-hidden="true"><nav>' + liens + "</nav></div>");
  var bouton = haut.querySelector(".burger"), plein = haut.querySelector(".menu-plein");
  function ouvrir(oui) {
    document.body.classList.toggle("menu-ouvert", oui);
    bouton.setAttribute("aria-expanded", oui ? "true" : "false");
    bouton.setAttribute("aria-label", oui ? "Fermer le menu" : "Menu");
    plein.setAttribute("aria-hidden", oui ? "false" : "true");
  }
  bouton.addEventListener("click", function () { ouvrir(!document.body.classList.contains("menu-ouvert")); });
  plein.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (a.classList.contains("ici")) { ouvrir(false); return; }      // la page où on est déjà : on referme, simplement
      setTimeout(function () { ouvrir(false); }, 120);
    });
  });
  plein.querySelector(".langue").addEventListener("click", function () { ouvrir(false); if (window.changerLangue) window.changerLangue(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") ouvrir(false); });
})();
}


/* ============================================================
   PAGE PROJETS : la grille et la carte
   ============================================================ */
function initProjets() {
if (!document.getElementById("vue-grille")) return;
/* VERSION 7 : écrit ici, directement dans la page */
/* =========================================================
   accueil.js — les 3 façons de regarder les projets
   grille / carte / liste  (les projets viennent de projets.js)
   ========================================================= */


var PROJETS = window.PROJETS;




/* =========================================================
   ACCESSOIRES - pince, trombone, ruban bleu, ruban gris
   posés en haut à gauche ou à droite des images (au hasard, mais toujours pareil),
   comme si les images étaient accrochées sur une planche
   ========================================================= */

var ACCESSOIRES = ["ruban-bleu"];   // VERSION 7 : seulement des rubans bleus (plus de pince, de trombone ni de ruban gris)

var graineAcc = 11;
function hasardAcc() {
  graineAcc = (graineAcc * 16807) % 2147483647;
  return (graineAcc - 1) / 2147483646;
}

// n = quel accessoire (on les fait tourner pour utiliser les 4)
function accessoire(n, coteForce) {
  var type = ACCESSOIRES[n % ACCESSOIRES.length];
  var cote = coteForce || (hasardAcc() < 0.5 ? "gauche" : "droite");
  var angle = ((hasardAcc() - 0.5) * 14).toFixed(1);        // un peu de travers, comme à la main
  return '<img class="acc acc-' + type + " " + cote + '" src="img/' + type + '.png" alt="" aria-hidden="true" draggable="false" style="--r:' + angle + 'deg">';
}
var vrais = PROJETS.filter(function (p) { return !p.aVenir; });

// partout pareil : le titre « Inspire (Bois) » en lettres simples, l'année seule en bleu écrit à la main
function texteP(p, champ) { return window.LANG === "en" && p[champ + "_en"] != null ? p[champ + "_en"] : p[champ]; }   // la version anglaise si on lit en anglais
function titreComplet(p, coupe) {
  var lignes = texteP(p, "lignes"), sous = texteP(p, "sous");
  var t = '<span class="titre-cap">' + (coupe && lignes ? lignes.join("<br>") : texteP(p, "titre")) + "</span>";
  if (!sous) return t;
  if (sous.length <= 16) return t + ' <span class="nowrap">(' + sous + ")</span>";
  var i = sous.lastIndexOf(" ");      // un long sous-titre peut passer à la ligne
  return t + " (" + sous.slice(0, i) + ' <span class="nowrap">' + sous.slice(i + 1) + ")</span>";
}function anneeSeule(p) { return p.aVenir ? "" : (p.annee.match(/\d{4}/) || [""])[0]; }




/* =========================================================
   1. GRILLE - les projets en quinconce, comme dans la maquette
   ========================================================= */

/* place de chaque projet : [gauche %, haut vw, largeur vw, hauteur vw]
   (le 1er est seul à droite sur le premier écran, la moitié gauche reste vide) */
var PLACES = [
  [54.6,   5.8, 42.4, 41],
  [ 4.3,  60.3, 42.4, 41],
  [54.7,  63.3, 42.4, 41],
  [ 4.3, 117,   26.2, 38],
  [41.3, 121,   54.9, 36],
  [ 3.6, 169,   54.9, 36],
  [61.7, 182,   35.4, 41],
  [ 4.3, 231,   42.4, 38],
  [54.7, 236,   42.4, 41]
];

// de quel côté on écrit le titre, pour chaque projet (mélangé "au hasard", toujours le même)


var grille = document.getElementById("vue-grille");
var basGrille = 0;

PROJETS.forEach(function (p, i) {
  var pl = PLACES[i % PLACES.length];
  var tour = Math.floor(i / PLACES.length) * 290;   // si un jour il y a plus de 9 projets
  var t = document.createElement(p.aVenir ? "div" : "a");

  t.className = "tuile" + (p.aVenir ? " a-venir" : "");
  if (!p.aVenir) t.href = p.page;

  t.style.left = pl[0] + "%";
  t.style.top = (pl[1] + tour) + "vw";

  var annee = anneeSeule(p);
  // image principale entière (sans la couper) : le cadre prend la forme de l'image
  var haut = p.entier ? +(pl[2] / p.entier).toFixed(2) : pl[3];
  var larg = pl[2];
  if (p.entier && haut > pl[3] + 4) {
    haut = pl[3] + 4;
    larg = +(haut * p.entier).toFixed(2);
    if (pl[0] > 50) t.style.left = (pl[0] + pl[2] - larg) + "%";   // colonne de droite : collée au bord droit
  }
  t.style.width = larg + "vw";

  t.innerHTML = accessoire(i) +
    '<span class="cadre" style="height:' + haut + 'vw">' +
      (p.aVenir ? "" : '<img src="' + p.couverture + '" alt="' + p.titre + '" loading="lazy">') +
    "</span>" +
    // sous l'image, sur une même ligne : le titre à gauche, l'année (bleue) à droite
    '<span class="legende-tuile" style="top:' + haut + 'vw">' +
      '<span class="titre-tuile' + (texteP(p, "lignes") && texteP(p, "lignes")[0].length > 24 ? " long" : "") + '">' + titreComplet(p, true) + "</span>" +
      (annee ? '<span class="annee-tuile main">' + annee + "</span>" : "") +
    "</span>";

  grille.appendChild(t);
  basGrille = Math.max(basGrille, pl[1] + tour + haut);
});

// la hauteur de la grille = jusqu'au bas de la dernière image, + de l'air
grille.style.height = (basGrille + 12) + "vw";




/* =========================================================
   2. CARTE - toutes les images posées sur une grande table,
      on glisse pour se promener, on zoome avec la molette
   ========================================================= */

var carte = document.getElementById("vue-carte");
var monde = carte.querySelector(".monde");

var W = 5200, H = 3300;          // la taille de la "table"
monde.style.width = W + "px";
monde.style.height = H + "px";


// un hasard qui donne toujours le même résultat (la carte ne change pas à chaque visite)
var graine = 7;
function hasard() {
  graine = (graine * 16807) % 2147483647;
  return (graine - 1) / 2147483646;
}


// on prépare tous les éléments : les images des projets + les projets à venir
var elements = [];

// VERSION 7 : sur la carte, seulement 2 ou 3 images choisies par projet (sinon c'est le chaos)
var CARTE = {
  "01": [[IM("img/b-objet-2.jpg"), 0.75], [IM("img/b-cyano-1.jpg"), 1.0], [IM("img/b-mapping.jpg"), 1.41, "plan"]],
  "02": [[IM("img/a-vue-ext.jpg"), 1.79], [IM("img/a-int-gradins.jpg"), 1.78], [IM("img/a-plan-l2.jpg"), 1.78, "plan"]],
  "03": [[IM("img/f-maquette.jpg"), 1.36], ["img/f-bulle.jpg", 0.75], [IM("img/f-plan-bulles.jpg"), 1.14, "plan"]],
  "04": [[IM("img/s-coupe-persp.jpg"), 1.77, "plan"], [IM("img/s-rotonde.jpg"), 0.78, "plan"]],
  "05": [[IM("img/n-rendu.jpg"), 1.78], [IM("img/n-mirabilia.jpg"), 1.5], ["img/n-robot-3.jpg", 0.68]],
  "06": [[IM("img/m-expo-1.jpg"), 0.75], [IM("img/m-machine-3.jpg"), 1.44]],
  "07": [[IM("img/o-diable-1.jpg"), 0.8], [IM("img/o-croquis.jpg"), 1.02, "plan"], [IM("img/o-rue.jpg"), 0.86]],
  "08": [["img/v-image.jpg", 1.78], [IM("img/v-processus.jpg"), 0.75]],
  "09": [["img/c-ext.jpg", 1.18], [IM("img/c-maq-a2.jpg"), 1.3], ["img/c-int-3.jpg", 1.18]]
};
vrais.forEach(function (p) {
  (CARTE[p.no] || p.images.slice(0, 3)).forEach(function (im) {
    elements.push({ p: p, src: im[0], ratio: im[1], plan: im[2] === "plan" });
  });
});

PROJETS.filter(function (p) { return p.aVenir; }).forEach(function (p) {
  elements.push({ p: p, ratio: 0.8 + hasard() * 0.6, vide: true });
});

// on mélange — TOUJOURS de la même façon, dans tous les navigateurs.
// (avant : .sort() au hasard ; Safari et Chrome ne trient pas de la même manière, donc la carte n'était pas la même d'un navigateur à l'autre.
//  ce petit tri par fusion refait exactement l'ordre de Safari : la carte que Victoria et Rose voient sur leur Mac est maintenant celle de tout le monde)
function melanger(t) {
  var n = t.length, src = t.slice(), dst = new Array(n);
  for (var lg = 1; lg < n; lg *= 2) {
    for (var i = 0; i < n; i += 2 * lg) {
      var g = i, gFin = Math.min(i + lg, n), d = gFin, dFin = Math.min(d + lg, n);
      for (var k = i; k < dFin; k++) {
        if (d < dFin && (g >= gFin || hasard() - 0.5 < 0)) dst[k] = src[d++];
        else dst[k] = src[g++];
      }
    }
    var tmp = src; src = dst; dst = tmp;
  }
  for (var j = 0; j < n; j++) t[j] = src[j];
}
melanger(elements);


// on pose chaque élément sans qu'il en chevauche un autre
var poses = [];
var nAcc = 0;

// VERSION 7 : la table est divisée en cases invisibles (une par image, dans un ordre mélangé) ;
// chaque image est posée au hasard dans sa case, avec une taille un peu différente : réparti, jamais l'une sur l'autre
var nCol = 1, nRang = elements.length, meilleur = 1e9;
for (var c = 1; c <= elements.length; c++) {          // le nombre de colonnes qui laisse le moins de cases vides (cases pas trop allongées)
  var rr = Math.ceil(elements.length / c), vides = c * rr - elements.length;
  var forme = Math.abs(Math.log((W / c) / (H / rr) / 1.15));
  var score = vides * 3 + forme;
  if (score < meilleur) { meilleur = score; nCol = c; nRang = rr; }
}
var caseW = (W - 160) / nCol, caseH = (H - 160) / nRang;
var cases = [];
for (var q = 0; q < nCol * nRang; q++) cases.push(q);
melanger(cases);       // les cases vides tombent n'importe où, pas toutes en bas
// la moitié droite de la carte était trop « rangée » (comme une grille) : quelques petits décalages, très discrets
var DECALE_CARTE = {
  // moitié droite : moins « rangée » ; Le champ spatial (l'intérieur en bois) s'éloigne de la ligne, vers la droite
  "a-int-gradins.jpg": [110, -30], "a-plan-l2.jpg": [40, 90],
  "f-bulle.jpg": [60, 60], "f-plan-bulles.jpg": [40, -60], "c-int-3.jpg": [-60, 50], "c-ext.jpg": [60, -30],
  "n-mirabilia.jpg": [-60, 30], "b-cyano-1.jpg": [-40, 40], "o-rue.jpg": [60, 40], "n-robot-3.jpg": [90, 20],
  "s-rotonde.jpg": [-40, 60], "c-maq-a2.jpg": [20, -40],
  // moitié gauche : le diable (1er Juillet) et la coupe (L'Art du quotidien) ne se collent plus
  "o-diable-1.jpg": [-60, 0], "s-coupe-persp.jpg": [40, 40]
};
elements.forEach(function (el, k) {
  var aire = 200000 + hasard() * 190000;
  var w = Math.sqrt(aire * el.ratio);
  var h = w / el.ratio;
  var maxW = caseW - 110, maxH = caseH - 120;              // de l'air autour (et la place de l'étiquette)
  if (w > maxW) { w = maxW; h = w / el.ratio; }
  if (h > maxH) { h = maxH; w = h * el.ratio; }
  var c = cases[k] % nCol, r = Math.floor(cases[k] / nCol);
  var x = 80 + c * caseW + 30 + hasard() * (caseW - 60 - w);
  var y = 80 + r * caseH + 30 + hasard() * (caseH - 100 - h);
  var dec = DECALE_CARTE[(el.src || "").replace(/.*\//, "")];
  if (dec) { x += dec[0]; y += dec[1]; }
  poses.push({ x: x, y: y, w: w, h: h });

  var n = document.createElement(el.vide ? "div" : "a");
  n.className = "point" + (el.vide ? " a-venir" : "");
  n.draggable = false;
  if (!el.vide) n.href = el.p.page;
  // un peu de travers, comme posées à la main sur la table
  n.style.cssText = "left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px;transform:rotate(" + ((hasard() - 0.5) * 6).toFixed(1) + "deg)";
  n.innerHTML = (nAcc++ % 3 === 0 && !el.plan ? accessoire(nAcc) : "") +
    (el.vide ? "" : '<span class="p-cadre"><img src="' + el.src + '" alt="" decoding="async" draggable="false" onload="this.classList.add(\'charge\')"></span>') +
    (el.vide ? '<span class="etiquette main">' + el.p.no + " à venir</span>"
             : '<span class="etiquette">' + titreComplet(el.p) + ' <span class="main">' + anneeSeule(el.p) + "</span></span>");
  monde.appendChild(n);
});


carte.querySelectorAll(".p-cadre img").forEach(function (im) { if (im.complete) im.classList.add("charge"); });

// position et zoom de la caméra
var cam = { x: 0, y: 0, s: 1 };       // où on est
var vise = { x: 0, y: 0, s: 1 };      // où on va (pour glisser en douceur)
var zMin = 0.1, zMax = 1.5;

function vueDEnsemble() {
  var s = Math.min(innerWidth / W, (innerHeight - 40) / H) * 0.96;
  if (window.MOBILE()) s = Math.min((innerHeight - 140) / H, innerWidth / W * 2.2);   // téléphone : les images plus grandes, on glisse pour voir le reste
  zMin = s * 0.5;
  vise.s = s;
  vise.x = (innerWidth - W * s) / 2;
  vise.y = (innerHeight - H * s) / 2 + 20;
}

vueDEnsemble();
cam.x = vise.x; cam.y = vise.y; cam.s = vise.s;

// ORDINATEUR : on voit toute la carte, puis après 1 seconde elle s'approche doucement (comme l'accueil sur téléphone) :
// les images dépassent un peu les marges, on a envie de se promener. (on touche la carte = on arrête, on laisse la main)
var introCarte = null;
function lancerIntroCarte() {
  if (window.MOBILE()) return;
  var g = {}; introCarte = g;
  (function attendre() {
    if (introCarte !== g) return;
    if (document.body.classList.contains("page-cache")) { setTimeout(attendre, 50); return; }
    // on attend que les images de la carte soient arrivées (au plus 3 s) : la carte ne bouge jamais pendant qu'elles apparaissent
    var t0 = performance.now();
    (function images() {
      if (introCarte !== g) return;
      var pas = [].some.call(carte.querySelectorAll(".p-cadre img"), function (im) { return !im.complete; });
      if (pas && performance.now() - t0 < 3000) { setTimeout(images, 80); return; }
      setTimeout(function () { if (introCarte === g && vue === "carte") demarrer(); }, 1000);
    })();
  })();
  function demarrer() {
    var a = { x: vise.x, y: vise.y, s: vise.s }, f = 1.34, t0 = performance.now(), duree = 2400;
    var cx = a.x + W * a.s / 2, cy = a.y + H * a.s / 2;          // on s'approche du centre de la carte (la ligne pointillée reste au milieu)
    (function pas(t) {
      if (introCarte !== g) return;
      var k = Math.min(1, (t - t0) / duree);
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;   // lent au départ, lent à l'arrivée
      var m = Math.pow(f, e);
      cam.s = vise.s = a.s * m; cam.x = vise.x = cx - (cx - a.x) * m; cam.y = vise.y = cy - (cy - a.y) * m;
      if (k < 1) requestAnimationFrame(pas); else introCarte = null;
    })(t0);
  }
}
carte.addEventListener("pointerdown", function () { introCarte = null; }, true);
carte.addEventListener("wheel", function () { introCarte = null; }, { capture: true, passive: true });

function zoomer(f, cx, cy) {
  var s = Math.max(zMin, Math.min(zMax, vise.s * f));
  f = s / vise.s;
  vise.x = cx - (cx - vise.x) * f;
  vise.y = cy - (cy - vise.y) * f;
  vise.s = s;
}

// la caméra rejoint doucement la cible
function boucle() {
  cam.x += (vise.x - cam.x) * 0.18;
  cam.y += (vise.y - cam.y) * 0.18;
  cam.s += (vise.s - cam.s) * 0.18;
  monde.style.transform = "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.s + ")";
  requestAnimationFrame(boucle);
}

boucle();


// molette / pavé tactile = zoom
carte.addEventListener("wheel", function (e) {
  e.preventDefault();
  if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    zoomer(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX, e.clientY);
  } else {
    vise.x -= e.deltaX; vise.y -= e.deltaY;
  }
}, { passive: false });


// glisser une image = on la déplace (comme les croquis de l'accueil) ; glisser le fond = on se promène
var tire = null, bouge = 0, prise = null, zPoint = 100;

carte.addEventListener("dragstart", function (e) { e.preventDefault(); });
pincer(carte, function (f, cx, cy, dx, dy) { if (prise) { prise.el.classList.remove("prise"); prise = null; } tire = null; zoomer(f, cx, cy); vise.x += dx; vise.y += dy; bouge = 99; });   // Safari : pas de « glisser le lien »

carte.addEventListener("pointerdown", function (e) {
  if (e.button > 0) return;
  bouge = 0;
  var pt = e.target.closest(".point");
  if (pt) {
    prise = { el: pt, x: e.clientX, y: e.clientY, l: parseFloat(pt.style.left), t: parseFloat(pt.style.top) };
    pt.style.zIndex = ++zPoint;
    pt.classList.add("prise");
  } else {
    tire = { x: e.clientX, y: e.clientY };
  }
  carte.classList.add("tire");
});

addEventListener("pointermove", function (e) {
  if (carte.dataset.pince) return;                  // deux doigts : on zoome, on ne tire rien
  if (prise) {
    var dx = e.clientX - prise.x, dy = e.clientY - prise.y;
    bouge = Math.abs(dx) + Math.abs(dy);
    prise.el.style.left = (prise.l + dx / cam.s) + "px";
    prise.el.style.top = (prise.t + dy / cam.s) + "px";
    return;
  }
  if (!tire) return;
  var dx = e.clientX - tire.x, dy = e.clientY - tire.y;
  bouge += Math.abs(dx) + Math.abs(dy);
  vise.x += dx; vise.y += dy;
  cam.x += dx; cam.y += dy;   // la caméra suit tout de suite pendant qu'on tire
  tire = { x: e.clientX, y: e.clientY };
});

addEventListener("pointerup", function () {
  if (prise) prise.el.classList.remove("prise");
  tire = null; prise = null;
  carte.classList.remove("tire");
});

// si on a glissé, ce n'est pas un clic sur l'image
carte.addEventListener("click", function (e) {
  if (bouge > 6) { e.preventDefault(); e.stopPropagation(); }
}, true);

// double-clic = on s'approche
carte.addEventListener("dblclick", function (e) {
  zoomer(2, e.clientX, e.clientY);
});

// boutons + / -


addEventListener("resize", function () { if (vue === "carte") { introCarte = null; vueDEnsemble(); } });




/* =========================================================
   3. LISTE - les titres à gauche, les images à droite
   ========================================================= */

var sommaire = document.getElementById("sommaire");
var mosaique = document.getElementById("mosaique");
var choisi = null;

PROJETS.forEach(function (p) {
  var li = document.createElement("li");
  li.innerHTML =
    '<button type="button" class="entree' + (p.aVenir ? " a-venir" : "") + '" data-no="' + p.no + '">' +
      '<span class="t">' + titreComplet(p) + "</span>" +
      '<span class="annee main">' + anneeSeule(p) + "</span>" +
    "</button>";
  sommaire.appendChild(li);
});

dessinerCrayons(sommaire);


function placerNotes() {}   // (plus de petite note à placer)


// rangées « justifiées », calculées en pixels (pas de coupe, même dans Safari) :
// chaque rangée remplit la largeur jusqu'à la marge ; si c'est trop haut pour l'écran, tout rapetisse ensemble
function ajusterRangees() {
  if (!mosaique.classList.contains("rangees")) return;
  var G = 9;
  var L = mosaique.clientWidth, H = mosaique.clientHeight;
  var rangees = [].slice.call(mosaique.querySelectorAll(".rangee"));
  var hauteurs = rangees.map(function (r) {
    var somme = 0;
    r.querySelectorAll("a").forEach(function (a) { somme += +a.dataset.r; });
    return (L - G * (r.children.length - 1)) / somme;
  });
  var total = hauteurs.reduce(function (s, h) { return s + h; }, 0) + G * (rangees.length - 1);
  var f = total > H ? (H - G * (rangees.length - 1)) / (total - G * (rangees.length - 1)) : 1;
  rangees.forEach(function (r, i) {
    var h = Math.floor(hauteurs[i] * f);
    r.querySelectorAll("a").forEach(function (a) {
      a.style.width = Math.floor(h * a.dataset.r) + "px";
      a.style.height = h + "px";
    });
  });
}
addEventListener("resize", ajusterRangees);


function montrerImages(p) {
  if (choisi === p) return;
  choisi = p;

  sommaire.querySelectorAll(".entree").forEach(function (b) {
    b.classList.toggle("choisi", b.dataset.no === p.no);
  });

  mosaique.classList.add("fondu");

  setTimeout(function () {
    mosaique.classList.remove("rangees");
    if (p.aVenir) {
      mosaique.innerHTML = '<div class="vide main">' + p.titre + " — à venir</div>";
    } else {
      mosaique.classList.toggle("rangees", !!p.liste);
      if (p.liste) {
        // rangées « justifiées » : chaque image garde ses proportions, rien n'est coupé
        var n = 0;
        mosaique.innerHTML = p.liste.map(function (rangee) {
          return '<div class="rangee">' + rangee.map(function (im, k) {
            n++;
            // côté de l'accessoire : jamais vers la ligne pointillée (1re image d'une rangée → à droite)
            var cote = k === 0 ? "droite" : "gauche";
            var acc = n === 2 ? accessoire(Number(p.no), cote) : n === 3 ? accessoire(Number(p.no) + 2, cote) : "";
            return '<a href="' + p.page + '" data-r="' + im[1] + '">' + acc + '<span class="m-im"><img src="' + im[0] + '" alt="' + p.titre + '"></span></a>';
          }).join("") + "</div>";
        }).join("");
        ajusterRangees();
        mosaique.classList.remove("fondu");
        return;
      }
      mosaique.innerHTML = p.images.slice(0, 7).map(function (im, k) {
        // (côté choisi pour ne pas sortir de l'écran ni passer sur la ligne pointillée)
        var acc = k === 1 ? accessoire(Number(p.no), "gauche") : k === 5 ? accessoire(Number(p.no) + 2, "droite") : "";
        return '<a href="' + p.page + '">' + acc + '<span class="m-im"><img src="' + im[0] + '" alt="' + p.titre + '"></span></a>';
      }).join("");
    }
    mosaique.classList.remove("fondu");
  }, 300);
}


// survol = on regarde / clic = on choisit, 2e clic = on ouvre le projet
sommaire.addEventListener("pointerover", function (e) {
  var b = e.target.closest(".entree:not(.a-venir)");
  if (b) montrerImages(PROJETS.find(function (p) { return p.no === b.dataset.no; }));
});

sommaire.addEventListener("click", function (e) {
  var b = e.target.closest(".entree");
  if (!b) return;
  var p = PROJETS.find(function (q) { return q.no === b.dataset.no; });
  if (b.classList.contains("choisi") && !p.aVenir && e.detail > 0 && b.dataset.vu) {
    document.body.classList.add("part");
    setTimeout(function () { location.href = p.page; }, 400);
    return;
  }
  sommaire.querySelectorAll(".entree").forEach(function (x) { delete x.dataset.vu; });
  b.dataset.vu = 1;
  montrerImages(p);
});

montrerImages(vrais[0]);




/* =========================================================
   CHANGER DE VUE - les 3 boutons en bas à gauche
   ========================================================= */

var vue = "grille";
var boutons = document.querySelectorAll(".choix-vue button");


function changerVue(v) {
  vue = v;

  document.querySelectorAll(".vue").forEach(function (el) {
    el.classList.toggle("on", el.id === "vue-" + v);
  });

  boutons.forEach(function (b) {
    b.setAttribute("aria-pressed", b.dataset.vue === v);
  });

  // la grille défile, la carte et la liste non
  document.body.classList.toggle("fixe", v !== "grille");


  if (v === "carte") { vueDEnsemble(); cam.x = vise.x; cam.y = vise.y; cam.s = vise.s; lancerIntroCarte(); }
  else introCarte = null;
  if (v === "liste") placerNotes();
  if (v === "grille") scrollTo(0, 0);

  
  try { localStorage.setItem("vue-rose", v); } catch (e) {}
}

boutons.forEach(function (b) {
  b.addEventListener("click", function () { changerVue(b.dataset.vue); });
});

// on revient sur la dernière vue choisie
var depart = location.hash.slice(1);
if (["grille", "carte", "liste"].indexOf(depart) < 0) {
  try { depart = localStorage.getItem("vue-rose"); } catch (e) {}
}
changerVue(["grille", "carte", "liste"].indexOf(depart) >= 0 ? depart : "grille");
}


/* ============================================================
   ACCUEIL : les feuilles de calque
   ============================================================ */
function initAccueil() {
if (!document.getElementById("calques")) return;
/* VERSION 7 : écrit ici, directement dans la page */
/* =========================================================
   calque.js — ACCUEIL, idée 1 : la grande table de calques
   tous les croquis de Rose, chacun sur une feuille de papier calque, posés sur une grande table.
   on arrive en vue d'ensemble ; molette / pincement = zoomer, glisser le fond = se promener,
   glisser une feuille = la déplacer (elle passe par-dessus), double-clic = s'approcher.
   ========================================================= */

/* [croquis ("" = calque vide), x, y, hauteur (px de la table), angle, rubans]
   rubans : "hg" "hd" "bg" "bd" (coins), "h" (milieu haut), "g" / "d" (milieu des côtés)
   l'ordre = l'empilement : la première est tout en dessous */
var FEUILLES = [
  // les feuilles du dessous
  // les 3 nouveaux croquis de Rose (octobre 2026), posés dans les espaces libres, sous les autres feuilles
  ["img/croquis/021a.png",     329, -477, 420,  -3, ["hg:bleu"]],   // carte des lectures (Ana Peric, Dana Taut…), en haut à gauche
  ["img/croquis/023b.png",     476, 1398, 440,   2, []],          // carnet : plan du travail, en bas à gauche (à la place des notes de la page 6)
  ["img/croquis/022a.png",    2615,  525, 455,  -2, ["hd:bleu"]],   // « vide » : L, E, I, P, A, à droite
  ["img/croquis/017f.png",    1000,  520, 760,  -6, []],     // mapping (page 18 du carnet)
  // (le plan coté de la page 6 est retiré : demande de Rose)
  // (les notes de la page 6 sont retirées aussi : le X de Rose couvre toute la page 6 du carnet)
  ["img/croquis/008r.png",     520,  300, 650,   6, []],
  ["img/croquis/016l.png",    1930,  380, 640,  -5, []],
  ["img/croquis/010r.png",    1180, 1220, 620,   4, []],
  ["img/croquis/005f.png",    3060, 1250, 640,  -4, []],

  // rangée du haut
  ["img/croquis/008l.png",     200,  100, 700,  -3, ["hg:bleu"]],
  ["img/croquis/010l.png",     820,   60, 680,   2, []],
  ["img/croquis/012f.png",    1380,  170, 560,  -1, []],
  ["img/croquis/011r.png",    2270,   80, 720,   3, ["hd:bleu"]],
  ["img/croquis/009r.png",    2880,  220, 640,  -2, []],

  // rangée du milieu
  ["img/croquis/013r.png",      80,  860, 720,   2, ["hd:bleu"]],
  ["img/croquis/015l.png",     700,  780, 700,  -4, ["bg:bleu"]],
  ["img/croquis/003.png",     1180,  800, 540,   1, []],
  ["img/croquis/014f.png",    2070,  900, 620,  -2, ["bd:bleu"]],
  ["img/croquis/016r.png",    2790,  870, 700,   4, []],

  // rangée du bas
  ["img/croquis/019f.png",     160, 1590, 560,  -2, ["hg:bleu"]],
  ["img/croquis/009l.png",     860, 1470, 700,   3, []],
  ["img/croquis/011l.png",    1460, 1500, 680,  -1.5, []],
  ["img/croquis/020r.png",    2010, 1520, 680,   2, []],
  ["img/croquis/013l.png",    2560, 1540, 660,  -3, ["hd:bleu"]],

  // ORDINATEUR seulement : la page 7 de son carnet (Bordwell, les 3 actes…) remplit le blanc en haut, entre « principe constructif » et la ligne
  ["img/croquis/007r.png",    1405, -235, 630,   3, [], "ordi"],

  // AU CENTRE, PAR-DESSUS : le carnet de croquis de Rose, fermé (sa couverture noire), d'où sortent toutes les feuilles
  ["img/croquis/cahier.png",   1545,  680, 710,  -6, []]
];

// déplacements (px de la table) pour mieux répartir les croquis sur la page d'accueil
var DEPLACE = {
  "008l": [-211, -211],
  "008r": [0, -200],
  "010l": [75, -263],
  "012f": [302, -452],
  "011r": [200, -264],
  "009r": [166, -286],
  "006r": [449, -11],
  "016r": [339, -53],
  "005f": [237, 375],
  "013l": [180, 150],
  "020r": [60, 170],
  "011l": [113, 234],
  "009l": [121, 302],
  "019f": [-181, 204],
  "013r": [-162, 19],
  "017f": [1, -271],
  "015l": [94, -120],
  "003": [520, 500],
  "014f": [132, -75],
  "010r": [-19, -57],
  "006l": [38, 113],
  "016l": [151, 0]
};

// ORDINATEUR : la ligne pointillée passe au centre de l'écran ; les croquis qui ont une note juste au-dessus ou au-dessous
// (« axonométrie : lecture des volumes », « gabarits, profils ») sont décalés vers la droite pour que leur texte ne soit jamais sur la ligne
var DEPLACE_ORDI = {
  "012f": [500, 0], "011r": [480, 0], "009r": [300, 0],      // en haut : la ligne passe entre deux croquis
  "011l": [840, 0], "020r": [-606, 0],                       // en bas : « gabarits, profils » échange sa place avec le croquis voisin
  "021a": [-140, 0], "009l": [-260, 0]                                          // et « structure + façade » s’éloigne un peu de la ligne, à gauche
};
// largeur / hauteur de chaque croquis (mesurées sur les fichiers) : si on remplace une image, mettre son rapport à jour ici
var RATIO_CROQUIS = { "003": 1.4946, "005f": 0.7582, "007r": 0.738, "008l": 0.7336, "008r": 0.7327, "009l": 0.74, "009r": 0.7282, "010l": 0.7564, "010r": 0.7436, "011l": 0.7091, "011r": 0.7455, "012f": 1.5048, "013l": 0.7509, "013r": 0.82, "014f": 1.0956, "015l": 0.7445, "016l": 0.7364, "016r": 0.7309, "017f": 1.3614, "019f": 1.1542, "020r": 0.6845, "021a": 1.3228, "022a": 1.2821, "023b": 1.4837, "cahier": 0.7064 };
var W = 4450, H = 2640;                               // la taille de la table
var zone = document.getElementById("calques");
var monde = zone.querySelector(".monde-calques");
monde.style.width = W + "px";
monde.style.height = H + "px";
var z = 10;


/* ---------- 1. on pose les feuilles ---------- */

var nbRubans = 0;
FEUILLES.forEach(function (f) { nbRubans += f[5].length; });
var graine = 7;
function hasard() { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; }
var couleurs = [];
for (var q = 0; q < nbRubans; q++) couleurs.push("bleu");   // VERSION 7 : seulement des rubans bleus
for (var q = couleurs.length - 1; q > 0; q--) { var r = Math.floor(hasard() * (q + 1)); var t = couleurs[q]; couleurs[q] = couleurs[r]; couleurs[r] = t; }
var qc = 0;
var feuilleEl = {};

FEUILLES.forEach(function (f, i) {
  if (f[6] === "ordi" && window.MOBILE()) return;
  var el = document.createElement("div");
  el.className = "calque" + (f[0] ? "" : " vide") + (/cahier/.test(f[0]) ? " cahier" : "");
  // on aère : plus d\'espace entre les croquis, surtout vers la gauche
  var px = f[1] < 1900 ? f[1] * 1.22 : 2318 + (f[1] - 1900) * 1.12;
  // VERSION 7 : les croquis un peu plus répartis (d'après la capture de Victoria)
  var cle = (f[0] || "").replace(/.*\//, "").replace(".png", "");
  var dep = DEPLACE[cle] || [0, 0];
  var ordi = (!window.MOBILE() && DEPLACE_ORDI[cle]) || [0, 0];   // ordinateur seulement : aucun texte sur la ligne pointillée du centre
  el.style.left = (px + dep[0] + ordi[0]) + "px";
  el.style.top = (f[2] * 1.12 + dep[1] + ordi[1]) + "px";
  el.style.height = f[3] + "px";
  // la largeur est connue AVANT que l'image arrive : la table est déjà à sa place au premier affichage (avant : les croquis se replaçaient une fois chargés)
  var rc = RATIO_CROQUIS[cle] || 0.74;
  el.style.width = (!f[0] ? f[3] * 0.72 : cle === "cahier" ? f[3] * rc : (f[3] - 44) * rc + 40) + "px";   // (la feuille a 22 px / 20 px de marge autour du dessin ; le carnet, aucune)
  el.style.setProperty("--a", f[4] + "deg");
  el.style.zIndex = ++z;
  // decoding="sync" : Safari ne dessine plus les grands croquis « plus tard », un par un ; ils apparaissent tous en même temps
  el.innerHTML = (f[0] ? '<img src="' + f[0] + '" alt="Croquis de Rose" draggable="false" decoding="sync">' : "") +
    f[5].map(function (p, k) {
      var c = p.indexOf(":") > 0 ? p.split(":")[1] : couleurs[qc++];   // "hg:bleu" = couleur choisie
      p = p.split(":")[0];
      return '<img class="scotch ' + p.split(" ")[0] + " " + c + '" src="img/ruban-' + c + '.png" alt="" draggable="false" decoding="sync" style="--t:' + ((i * 7 + k * 13) % 11 - 5) + 'deg">';
    }).join("");
  monde.appendChild(el);
  if (f[0]) feuilleEl[f[0].replace(/.*\//, "").replace(".png", "")] = el;
});





/* ---------- 1d. les petites notes à la main (idée de carte mentale) ----------
   [croquis, x, y (fractions de la feuille), texte, angle, taille, flèche : [angle, miroir] ou 0, cercle ?]
   Elles restent accrochées à leur feuille quand on la déplace. À valider avec Rose. */

var NOTES_EN = ["formal research", "relations, flows, siting", "human scale, atmosphere", "construction principle", "axonometry: reading the volumes", "rhythm of the arcade", "section, light", "furniture: use studies", "plan: organizing spaces", "structure + façade, modular grid", "massing, profiles"];   // les mêmes notes, en anglais (même ordre)
var NOTES = [
  // à gauche (flèche vers la droite)
  ["008l", -0.30, 0.22, "recherche formelle", -5, 1, [-15, 0, 1], 1],
  ["013r", -0.36, 0.55, "relations, flux, implantation", -3, 1, [-25, 0, 0], 0],
  ["019f", -0.30, 0.45, "échelle humaine, ambiance", 3, 1, [-20, 0, 2], 0],
  // en haut (flèche vers le bas)
  ["010l", 0.45, -0.22, "principe constructif", 2, 1, [60, 0, 3], 0],
  ["012f", 0.50, -0.26, "axonométrie : lecture des volumes", -2, 1, [60, 0, 0], 0],
  ["011r", 0.55, -0.15, "rythme de l’arcade", 3, 1, [55, 0, 4], 1],
  // à droite (flèche vers la gauche)
  ["009r", 1.32, 0.35, "coupe, lumière", 4, 1, [20, 1, 2], 0],
  ["016r", 1.34, 0.25, "mobilier : études d’usage", -3, 1, [25, 1, 5], 0],
  ["005f", 1.30, 0.50, "plan : organisation des espaces", 3, 1, [20, 1, 1], 0],
  // en bas
  ["009l", 0.50, 1.10, "structure + façade, trame modulaire", 2, 1, 0, 0],
  ["011l", 0.50, 1.10, "gabarits, profils", -2, 1, 0, 0]
];

var TRAITS = [
  // 0 : flèche courbe
  '<path d="M4 8 C 30 2, 62 14, 80 46" fill="none"/><path d="M66 44 L81 49 L82 33" fill="none"/>',
  // 1 : ligne droite, sans flèche
  '<path d="M3 5 L 38 24 L 82 46" fill="none"/>',
  // 2 : ligne courbe, sans flèche
  '<path d="M4 10 C 14 46, 52 58, 84 40" fill="none"/>',
  // 3 : flèche droite
  '<path d="M3 6 L 40 26 L 80 46" fill="none"/><path d="M64 48 L81 47 L74 31" fill="none"/>',
  // 4 : ligne en S, finie par un point
  '<path d="M4 6 C 40 -2, 30 40, 70 40 C 76 40, 80 44, 82 48" fill="none"/><circle cx="83" cy="49" r="3" fill="currentColor"/>',
  // 5 : ligne droite courte avec petit coude
  '<path d="M3 8 L 30 8 L 70 50" fill="none"/>'
];
function dessinTrait(t) {
  return '<svg class="fleche" viewBox="0 0 90 60" style="transform:rotate(' + t[0] + 'deg) scaleX(' + (t[1] ? -1 : 1) + ')" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + TRAITS[t[2] || 0] + '</svg>';
}
var calqueNotes = document.createElement("div");
calqueNotes.className = "notes";
monde.appendChild(calqueNotes);
var TRAITS_BLEUS = [0, 3, 6];   // quelques lignes en bleu (les autres restent noires)
NOTES.forEach(function (n, i) {
  var d = document.createElement("div");
  d.className = "note main" + (n[2] > 1 ? " sous-croquis" : "") + (n[7] ? " ronde" : "") + (TRAITS_BLEUS.indexOf(i) >= 0 ? " trait-bleu" : "");
  d.style.setProperty("--r", n[4] + "deg");
  d.innerHTML = '<span>' + (window.LANG === "en" ? NOTES_EN[i] : n[3]).replace(/ ([:;!?])/g, "\u00a0$1") + '</span>' + (n[6] ? dessinTrait(n[6]) : "");   // « : » jamais seul en début de ligne
  calqueNotes.appendChild(d);
  n.el = d;
});

/* VERSION 7 : les flèches, les lignes et les cercles des notes, redessinés au crayon bleu,
   comme le trait qui souligne les mots du menu : une ligne qui tremble un peu, puis un petit retour plus fin */
var graineCrayon = 29;
function hasardCrayon() { graineCrayon = (graineCrayon * 16807) % 2147483647; return (graineCrayon - 1) / 2147483646; }
function lisse(pts) {                 // une courbe douce qui passe par les points
  var s = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
  for (var i = 1; i < pts.length - 1; i++) {
    var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    s += " Q" + pts[i][0].toFixed(1) + "," + pts[i][1].toFixed(1) + " " + mx.toFixed(1) + "," + my.toFixed(1);
  }
  var z = pts[pts.length - 1];
  return s + " L" + z[0].toFixed(1) + "," + z[1].toFixed(1);
}
function tremble(pts, amp) {          // un tremblement doux (pas un zigzag) : chaque écart suit un peu le précédent
  var e = 0;
  return pts.map(function (p, i) {
    e = e * 0.6 + (hasardCrayon() - 0.5) * amp;
    var a = pts[Math.min(i + 1, pts.length - 1)], b = pts[Math.max(i - 1, 0)];
    var dx = a[0] - b[0], dy = a[1] - b[1], L = Math.hypot(dx, dy) || 1;
    return [p[0] - dy / L * e, p[1] + dx / L * e];
  });
}
function auCrayon(svg) {
  [].slice.call(svg.querySelectorAll("path")).forEach(function (p) {
    var L = p.getTotalLength(), n = Math.max(6, Math.round(L / 2.2)), pts = [];
    for (var i = 0; i <= n; i++) { var q = p.getPointAtLength(L * i / n); pts.push([q.x, q.y]); }
    p.setAttribute("d", lisse(tremble(pts, 1.1)));
    if (L > 22) {                      // le retour : repart de la fin, plus fin, à peine décalé
      var r = pts.slice(Math.round(n * 0.45)).reverse().map(function (q) { return [q[0] + 0.7, q[1] + 0.9]; });
      var p2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p2.setAttribute("class", "retour");
      p2.setAttribute("d", lisse(tremble(r, 1.4)));
      p.parentNode.insertBefore(p2, p.nextSibling);
    }
  });
}
// le cercle autour d'une note : une boucle à main levée (même crayon, même épaisseur que les flèches), qui dépasse un peu son départ ;
// redessiné à la taille réelle du mot (sans étirement), chaque fois que la taille des notes change
function cercleAuCrayon(n, k) {
  var span = n.el.querySelector("span");
  var w = span.offsetWidth, h = span.offsetHeight, F = parseFloat(getComputedStyle(n.el).fontSize) || 74;
  if (!w || !h) return;
  var g = 97 + k * 31;
  function rnd() { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646; }
  var pts = [], tours = 1.1, m = 72, d0 = 2.4 + rnd() * 1.2, rx = w / 2 * 1.05, ry = h / 2 * 1.16, e = 0;
  for (var i = 0; i <= m; i++) {
    var t = i / m, a = d0 + t * tours * 6.283;
    e = e * 0.7 + (rnd() - 0.5) * 0.05;
    var r = 1 + e + t * 0.06;                              // la fin repasse un peu à côté du début, comme à la main
    pts.push([w / 2 + rx * r * Math.cos(a), h / 2 + ry * r * Math.sin(a)]);
  }
  var ep = (F * 0.045).toFixed(2);
  var svg = span.querySelector(".cercle");
  if (!svg) { span.insertAdjacentHTML("beforeend", '<svg class="cercle" aria-hidden="true"></svg>'); svg = span.querySelector(".cercle"); }
  svg.setAttribute("viewBox", "0 0 " + w + " " + h);
  svg.innerHTML = '<path style="stroke-width:' + ep + 'px;vector-effect:none" d="' + lisse(pts) + '"/>';
}
NOTES.forEach(function (n) {
  var f = n.el.querySelector(".fleche");
  if (f) auCrayon(f);

});

function poserNotes() {
  // VERSION 7 : les notes sont plus grandes ; on les pousse juste assez pour qu'elles restent à côté de leur croquis, sans le couvrir
  var gap = (parseFloat(monde.style.getPropertyValue("--note")) || 74) * 0.3;
  NOTES.forEach(function (n, k) { if (n[7]) cercleAuCrayon(n, k); });
  NOTES.forEach(function (n) {
    var f = feuilleEl[n[0]];
    if (!f) { n.el.style.display = "none"; return; }
    var x = f.offsetLeft + n[1] * f.offsetWidth, y = f.offsetTop + n[2] * f.offsetHeight;
    var w2 = n.el.offsetWidth / 2, h2 = n.el.offsetHeight / 2;
    if (n[1] < 0) x = Math.min(x, f.offsetLeft - gap - w2);
    if (n[1] > 1) x = Math.max(x, f.offsetLeft + f.offsetWidth + gap + w2);
    if (n[2] < 0) y = Math.min(y, f.offsetTop - gap - h2);
    if (n[2] > 1) y = Math.max(y, f.offsetTop + f.offsetHeight + gap + h2);
    n.el.style.left = x + "px";
    n.el.style.top = y + "px";
    n.x = x; n.y = y; n.w2 = w2; n.h2 = h2;
  });
  // deux notes qui se touchent : on les écarte doucement l'une de l'autre (de côté)
  var vis = NOTES.filter(function (n) { return n.el.style.display !== "none"; });
  for (var tour = 0; tour < 6; tour++) {
    for (var i = 0; i < vis.length; i++) for (var j = i + 1; j < vis.length; j++) {
      var a = vis[i], b = vis[j];
      var ox = a.w2 + b.w2 + gap * 0.6 - Math.abs(a.x - b.x), oy = a.h2 + b.h2 + gap * 0.3 - Math.abs(a.y - b.y);
      if (ox > 0 && oy > 0) {
        var s = a.x <= b.x ? 1 : -1;
        a.x -= s * ox / 2; b.x += s * ox / 2;
        a.el.style.left = a.x + "px"; b.el.style.left = b.x + "px";
      }
    }
  }
}
poserNotes();


/* ---------- 1c. on centre le groupe de croquis au milieu de la table ---------- */

function recentrer() {
  // VERSION 7 : le groupe = les croquis ET leurs notes (les notes ne sortent jamais de l'écran) ;
  // on recalcule 3 fois, parce que la taille des notes dépend du zoom, et le zoom de la place qu'elles prennent
  var els = monde.querySelectorAll(".calque");
  for (var passe = 0; passe < 3; passe++) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    els.forEach(function (el) {
      x0 = Math.min(x0, el.offsetLeft); y0 = Math.min(y0, el.offsetTop);
      x1 = Math.max(x1, el.offsetLeft + el.offsetWidth); y1 = Math.max(y1, el.offsetTop + el.offsetHeight);
    });
    NOTES.forEach(function (n) {
      if (n.el.style.display === "none") return;
      var l = n.el.offsetLeft - n.el.offsetWidth / 2, t = n.el.offsetTop - n.el.offsetHeight / 2;
      x0 = Math.min(x0, l); y0 = Math.min(y0, t);
      x1 = Math.max(x1, l + n.el.offsetWidth); y1 = Math.max(y1, t + n.el.offsetHeight);
    });
    var pad = 60;
    els.forEach(function (el) {
      el.style.left = (el.offsetLeft - x0 + pad) + "px";
      el.style.top = (el.offsetTop - y0 + pad) + "px";
    });
    W = x1 - x0 + 2 * pad; H = y1 - y0 + 2 * pad;
    monde.style.width = W + "px"; monde.style.height = H + "px";
    poserNotes();
    vueDEnsemble();
  }
  cam.x = vise.x; cam.y = vise.y; cam.s = vise.s;
  if (window.MOBILE()) lancerIntro();
}


/* ---------- 2. la caméra : position + zoom, qui rejoint doucement sa cible ---------- */

var cam = { x: 0, y: 0, s: 1 }, vise = { x: 0, y: 0, s: 1 };
var zMin = 0.1, zMax = 1.6;

function vueDEnsemble() {
  var s = Math.min((innerWidth - 40) / W, (innerHeight - 110) / H), mob = window.MOBILE();
  if (mob) s = Math.min((innerWidth - 24) / W * 2.3, (innerHeight - 130) / H);   // téléphone : plus proche ; on glisse pour voir le reste
  monde.style.setProperty("--note", ((mob ? 13 : 24) / s).toFixed(1) + "px");   // VERSION 7 : notes = même taille que « Plan rez-de-chaussée » (légendes des projets)
  poserNotes();
  zMin = s * 0.38;
  vise.s = s;          // VERSION 7 : les croquis remplissent mieux l'écran (plus grands, mieux répartis)
  vise.x = (innerWidth - W * vise.s) / 2;
  vise.y = (innerHeight - H * vise.s) / 2 + 22;     // un peu plus bas : rien ne touche le nom ni le menu
  if (mob) {
    // TÉLÉPHONE : la vue de loin = toute la carte mentale (croquis + notes) dans l'écran, au centre, avec un peu de marge
    var sl = Math.min((innerWidth - 28) / W, (innerHeight - 150) / H);
    vueProche = { x: vise.x, y: vise.y, s: vise.s };
    vueLoin = { s: sl, x: (innerWidth - W * sl) / 2, y: (innerHeight - H * sl) / 2 + 22 };
    zMin = Math.min(zMin, sl * 0.8);
    if (!introFaite) { vise.x = vueLoin.x; vise.y = vueLoin.y; vise.s = vueLoin.s; }
  }
}
var vueProche = null, vueLoin = null, introFaite = false, introEnCours = null;
recentrer();          // les tailles des croquis sont déjà connues (RATIO_CROQUIS) : la table est centrée tout de suite, rien ne bouge quand les images arrivent
cam.x = vise.x; cam.y = vise.y; cam.s = vise.s;

// TÉLÉPHONE : on voit toute la carte de loin, puis après 1 seconde elle s'approche doucement de nous
function lancerIntro() {
  if (introFaite || !vueProche) return;
  introFaite = true;
  (function attendre() {                                   // on compte la seconde à partir du moment où l'accueil est apparu
    if (document.body.classList.contains("page-cache")) { setTimeout(attendre, 50); return; }
    demarrer();
  })();
  function demarrer() {
  setTimeout(function () {
    var a = { x: cam.x, y: cam.y, s: cam.s }, b = vueProche, t0 = performance.now(), duree = 2200;
    introEnCours = function () { introEnCours = null; };
    (function pas(t) {
      if (!introEnCours) return;                                   // on a touché l'écran : on arrête, on laisse la main
      var k = Math.min(1, (t - t0) / duree);
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;   // lent au départ, lent à l'arrivée
      // le zoom se fait « en proportion » (régulier à l'œil), la position suit le même point de la carte
      var s = a.s * Math.pow(b.s / a.s, e);
      var cx = innerWidth / 2, cy = innerHeight / 2;
      var wa = (cx - a.x) / a.s, wb = (cx - b.x) / b.s, ha = (cy - a.y) / a.s, hb = (cy - b.y) / b.s;
      var wx = wa + (wb - wa) * e, wy = ha + (hb - ha) * e;
      cam.s = vise.s = s; cam.x = vise.x = cx - wx * s; cam.y = vise.y = cy - wy * s;
      if (k < 1) requestAnimationFrame(pas); else introEnCours = null;
    })(t0);
  }, 1000);
  }
}

function borner() {
  // VERSION 7 : la table paraît sans fin — on peut se promener bien au-delà des croquis, dans le vide, de tous les côtés
  var sw = W * vise.s, sh = H * vise.s, mx = innerWidth * 1.3, my = innerHeight * 1.3;
  vise.x = Math.max(innerWidth - sw - mx, Math.min(mx, vise.x));
  vise.y = Math.max(innerHeight - sh - my, Math.min(my, vise.y));
}

function zoomer(f, cx, cy) {
  var s = Math.max(zMin, Math.min(zMax, vise.s * f));
  f = s / vise.s;
  vise.x = cx - (cx - vise.x) * f;
  vise.y = cy - (cy - vise.y) * f;
  vise.s = s;
  borner();
}

(function boucle() {
  cam.x += (vise.x - cam.x) * 0.18;
  cam.y += (vise.y - cam.y) * 0.18;
  cam.s += (vise.s - cam.s) * 0.18;
  monde.style.transform = "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.s + ")";
  requestAnimationFrame(boucle);
})();

addEventListener("resize", vueDEnsemble);

// quand toutes les images sont chargées, on connaît la vraie taille du groupe : on le centre
(function () {
  var imgs = [].slice.call(monde.querySelectorAll(".calque > img:not(.scotch)")), n = imgs.length;
  function un() { if (--n <= 0) recentrer(); }
  imgs.forEach(function (im) { if (im.complete) un(); else { im.addEventListener("load", un); im.addEventListener("error", un); } });
})();

// molette = toujours zoom : vers le bas on s'éloigne (dézoom), vers le haut on s'approche
zone.addEventListener("wheel", function (e) {
  e.preventDefault();
  var d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  zoomer(Math.exp(-d * (e.ctrlKey ? 0.01 : 0.0035)), e.clientX, e.clientY);
}, { passive: false });

zone.addEventListener("dblclick", function (e) { zoomer(2, e.clientX, e.clientY); });
pincer(zone, function (f, cx, cy, dx, dy) {
  if (prise && prise.el) prise.el.classList.remove("tenu");
  prise = null;
  zoomer(f, cx, cy); vise.x += dx; vise.y += dy; borner();
});


/* ---------- 3. glisser : une feuille = on la déplace ; le fond = on se promène ---------- */

var prise = null;

zone.addEventListener("pointerdown", function (e) {
  if (introEnCours) introEnCours();          // on touche pendant l'approche : elle s'arrête là où elle est
  var el = e.target.closest(".calque");
  prise = { el: el, x: e.clientX, y: e.clientY, l: el ? el.offsetLeft : 0, t: el ? el.offsetTop : 0 };
  if (el) { el.style.zIndex = ++z; el.classList.add("tenu"); }
  else zone.classList.add("tire");
  zone.setPointerCapture(e.pointerId);
});

zone.addEventListener("pointermove", function (e) {
  if (!prise || zone.dataset.pince) return;
  var dx = e.clientX - prise.x, dy = e.clientY - prise.y;
  if (prise.el) {
    prise.el.style.left = (prise.l + dx / cam.s) + "px";
    prise.el.style.top = (prise.t + dy / cam.s) + "px";
    poserNotes();
  } else {
    vise.x += e.clientX - (prise.px || prise.x); vise.y += e.clientY - (prise.py || prise.y);
    borner();
    cam.x = vise.x; cam.y = vise.y;
    prise.px = e.clientX; prise.py = e.clientY;
  }
});

// VERSION 7 : on passe la souris sur un croquis = il vient doucement au premier plan (sans cliquer)
zone.addEventListener("pointerover", function (e) {
  if (prise) return;
  var el = e.target.closest(".calque");
  if (!el || +el.style.zIndex === z) return;
  el.style.zIndex = ++z;
  el.classList.remove("devant"); void el.offsetWidth; el.classList.add("devant");
});

zone.addEventListener("pointerup", function () {
  if (prise && prise.el) prise.el.classList.remove("tenu");
  zone.classList.remove("tire");
  prise = null;
});
}


/* ============================================================
   LES PAGES : afficher la bonne page selon l’adresse (#/projets, #/inspire…)
   ============================================================ */
/* PAGES PROJET : un titre sur deux lignes précises — on réduit la taille juste assez pour que chaque ligne tienne */
function initTitres() {
  var t = document.querySelector(".projet-titre.deux-lignes");
  if (!t) return;
  function ajuster() {
    t.style.fontSize = "";
    var base = parseFloat(getComputedStyle(t).fontSize), largeur = t.clientWidth, max = 0;
    t.querySelectorAll(".ligne").forEach(function (l) {
      var r = document.createRange(); r.selectNodeContents(l);
      max = Math.max(max, r.getBoundingClientRect().right - t.getBoundingClientRect().left);
    });
    if (max > largeur) t.style.fontSize = Math.floor(base * largeur / max * 0.98) + "px";
  }
  ajuster();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajuster);
  addEventListener("resize", ajuster);
}
var PAGES_INIT = [initCommun, initMenu, initProjets, initAccueil, initTitres];
(function () {
  // tout ce qu'une page installe (écouteurs, minuteries, animations) est arrêté quand on change de page
  var W = window, D = document;
  var addW = W.addEventListener.bind(W), addD = D.addEventListener.bind(D);
  var rawTimeout = W.setTimeout.bind(W), rawInterval = W.setInterval.bind(W), rawRAF = W.requestAnimationFrame.bind(W);
  var ctrl = new AbortController(), gen = 0;
  function avecSignal(add) {
    return function (type, fn, opt) {
      var o = (typeof opt === "object" && opt) ? Object.assign({}, opt) : { capture: !!opt };
      if (!o.signal) o.signal = ctrl.signal;
      return add(type, fn, o);
    };
  }
  W.addEventListener = avecSignal(addW);
  D.addEventListener = avecSignal(addD);
  W.setTimeout = function (fn, t) { var g = gen, a = [].slice.call(arguments, 2); return rawTimeout(function () { if (g === gen) fn.apply(null, a); }, t); };
  W.setInterval = function (fn, t) { var g = gen, id = rawInterval(function () { if (g === gen) fn(); else clearInterval(id); }, t); return id; };
  W.requestAnimationFrame = function (fn) { var g = gen; return rawRAF(function (ts) { if (g === gen) fn(ts); }); };

  var poses = [];
  function routeActuelle() {
    var h = location.hash;
    if (h.indexOf("#/") !== 0) return null;          // #ch-1, etc. : un simple lien dans la page
    return h.slice(2) || "accueil";
  }
  var positions = {}, routeAffichee = null, retourArriere = false;
  function afficher(route) {
    if (routeAffichee) positions[routeAffichee] = W.scrollY;   // on garde la hauteur où on était sur la page qu'on quitte
    var reprendre = retourArriere && positions[route] > 0 ? positions[route] : 0;
    retourArriere = false; routeAffichee = route;
    var choix = W.LANG === "en" ? '[data-lang="en"]' : ':not([data-lang])';
    var t = D.querySelector('template[data-page="' + route + '"]' + choix) || D.querySelector('template[data-page="accueil"]' + choix) || D.querySelector('template[data-page="accueil"]');
    ctrl.abort(); ctrl = new AbortController(); gen++;
    poses.forEach(function (n) { n.remove(); });
    var frag = t.content.cloneNode(true);
    // VERSION HORIZONTALE : les croquis du projet réunis dans une petite galerie
    if (D.documentElement.dataset.pli === "horizontal" && CROQUIS[t.dataset.page]) poserGalerieCroquis(frag, CROQUIS[t.dataset.page]);
    // la fiche (Professeur, Collaboration…) : « et » / « and » ne reste jamais seul en fin de ligne, il passe à la ligne avec le nom qui suit
    [].forEach.call(frag.querySelectorAll(".fiche dd"), function (dd) {
      var it = D.createTreeWalker(dd, NodeFilter.SHOW_TEXT), n;
      while ((n = it.nextNode())) n.nodeValue = n.nodeValue.replace(/ (et|and) /g, " $1\u00A0");
    });
    // LE PIED DE PAGE : sur toutes les pages, sauf l'accueil
    if (t.dataset.page !== "accueil") {
      var vieux = frag.querySelector(".pied-discret"); if (vieux) vieux.remove();
      frag.appendChild(piedDuSite());
    }
    if (W.PETIT) {
      [].forEach.call(frag.querySelectorAll("img"), function (im, k) {
        var s = im.getAttribute("src") || "";
        if (IMG_M[s]) im.setAttribute("src", "img/m/" + s.slice(4));
        if (k > 1 && !im.hasAttribute("loading")) im.setAttribute("loading", "lazy");   // les images plus bas se chargent quand on arrive
        im.setAttribute("decoding", "async");
      });
    }
    poses = [].slice.call(frag.childNodes);
    D.body.className = t.dataset.classe;
    D.body.classList.add("page-cache");          // la nouvelle page reste cachée le temps que ses premières images soient prêtes
    D.body.insertBefore(frag, D.body.firstChild);
    rawRAF(function () {});
    // la nouvelle page s'ouvre en haut, d'un coup et sans qu'on la voie défiler (avant : elle remontait du bas vers le haut)
    var html = D.documentElement;
    html.style.scrollBehavior = "auto";
    try { W.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (err) { W.scrollTo(0, 0); }
    rawTimeout(function () { html.style.scrollBehavior = ""; }, 80);
    PAGES_INIT.forEach(function (init) { init(); });
    // retour en arrière (bouton du navigateur ou glissement) : la page revient là où on l'avait laissée
    if (reprendre) {
      html.style.scrollBehavior = "auto"; W.scrollTo(0, reprendre);
      [60, 300, 900].forEach(function (t) { rawTimeout(function () { if (routeAffichee === route && Math.abs(W.scrollY - reprendre) > 4 && D.documentElement.scrollHeight > reprendre) { html.style.scrollBehavior = "auto"; W.scrollTo(0, reprendre); } }, t); });
    }
    ajusterTitres();
    rawTimeout(ajusterTitres, 350); rawTimeout(ajusterTitres, 1200);   // une fois les polices bien chargées
    ajusterNomPied();
    if (W.poserTraits) { rawRAF(W.poserTraits); rawTimeout(W.poserTraits, 400); rawTimeout(W.poserTraits, 1300); }   // les soulignements au crayon, à la bonne taille
    initCroquis();
    revelerQuandPrete();
  }
  /* LES TRANSITIONS : la page n'apparaît (en fondu doux) qu'une fois ses images du premier écran décodées :
     plus d'images ni de croquis qui « tombent » un par un, plus d'à-coups. (au plus 1,1 s d'attente, pour ne jamais bloquer) */
  function revelerQuandPrete() {
    var g = gen, fini = false, accueil = !!D.querySelector(".calques");
    function montrer() {
      if (fini || g !== gen) return; fini = true;
      rawRAF(function () { rawRAF(function () { if (g === gen) D.body.classList.remove("page-cache"); }); });
    }
    var h = W.innerHeight * 1.15;
    var imgs = [].filter.call(D.querySelectorAll("main img"), function (im) {
      if (im.getAttribute("loading") === "lazy") return false;
      if (accueil) return true;                                    // l'accueil : tous les croquis de la table
      var r = im.getBoundingClientRect();
      return r.top < h && r.bottom > -10;                          // ailleurs : celles du premier écran
    });
    var attente = imgs.map(function (im) {
      if (im.complete && im.naturalWidth) return im.decode ? im.decode().catch(function () {}) : Promise.resolve();
      return new Promise(function (ok) {
        im.addEventListener("load", function () { (im.decode ? im.decode() : Promise.resolve()).catch(function () {}).then(ok); }, { once: true });
        im.addEventListener("error", ok, { once: true });
      });
    });
    Promise.all(attente).then(montrer);
    rawTimeout(montrer, accueil ? 5000 : 900);   // l'accueil : on attend que TOUS les croquis soient là (5 s au plus) ; ils apparaissent ensemble, jamais un par un
  }
  /* LES CROQUIS de chaque projet : seulement des images DÉJÀ dans la page du projet (des dessins, pas de maquettes 3D ni de photos) ;
     la galerie prend la place du premier, les autres quittent leur place pour la rejoindre */
  var CROQUIS = {};   // (galerie retirée : chaque projet garde la suite continue de ses images, dans l'ordre du texte de Rose)
  function poserGalerieCroquis(frag, liste) {
    var en = W.LANG === "en";
    var figs = [];
    liste.forEach(function (nom) {
      [].some.call(frag.querySelectorAll("figure"), function (f) {
        var im = f.querySelector("img");
        if (im && (im.getAttribute("src") || "").split("/").pop() === nom) { figs.push(f); return true; }
      });
    });
    if (figs.length < 2) return;                                  // une galerie : au moins deux croquis
    var c = { images: liste.map(function (nom) { return IM("img/" + nom); }) }, n = c.images.length;
    var legendes = figs.map(function (f) { var fc = f.querySelector("figcaption"); return fc ? fc.textContent.trim() : ""; });
    function deux(k) { return (k < 10 ? "0" : "") + k; }
    var s = D.createElement("section");
    s.className = "croquis-galerie";
    var items = "", vign = "";
    c.images.forEach(function (src, k) {
      var r = ((k * 37) % 9 - 4) * 0.2;                       // chaque feuille un tout petit peu de travers, comme posée à la main
      items += '<figure class="cg-item"><div class="cg-feuille" style="--r:' + r.toFixed(1) + 'deg"><img src="' + src + '" alt="' + (en ? "Sketch " : "Croquis ") + (k + 1) + '" loading="eager" decoding="async" draggable="false"></div></figure>';
      vign += '<button type="button" class="cg-vignette' + (k ? "" : " on") + '" aria-label="' + (en ? "Sketch " : "Croquis ") + (k + 1) + '"><img src="' + src + '" alt="" loading="eager" decoding="async" draggable="false"></button>';
    });
    var fl = function (sens) {
      return sens > 0
        ? '<svg class="fleche" viewBox="0 0 44 28" aria-hidden="true"><path d="M3 15.5 C12 13.8 24 14.6 39 13.2 M29.5 5 C33 8.5 36.5 11 40.5 13.4 C36 16 32.5 19.5 30 23.5"/></svg>'
        : '<svg class="fleche" viewBox="0 0 44 28" aria-hidden="true"><path d="M41 12.5 C32 14.2 20 13.4 5 14.8 M14.5 23 C11 19.5 7.5 17 3.5 14.6 C8 12 11.5 8.5 14 4.5"/></svg>';
    };
    s.innerHTML =
      '<div class="cg-scene"><div class="cg-piste">' + items + "</div></div>" +
      '<aside class="cg-cote">' +
        '<span class="cg-titre main">' + (en ? "Sketches" : "Croquis") + "</span>" +
        '<div class="cg-vignettes">' + vign + "</div>" +
        '<div class="cg-bas"><span class="cg-compte">01 / ' + deux(n) + "</span>" +
          '<span class="cg-fleches"><button type="button" class="cg-prec" aria-label="' + (en ? "Previous" : "Précédent") + '">' + fl(-1) + "</button>" +
          '<button type="button" class="cg-suiv" aria-label="' + (en ? "Next" : "Suivant") + '">' + fl(1) + "</button></span></div>" +
      "</aside>";
    s.dataset.legendes = JSON.stringify(legendes);
    s.querySelector(".cg-scene").insertAdjacentHTML("beforeend", '<p class="cg-legende main">' + (legendes[0] || "") + "</p>");
    figs[0].parentNode.replaceChild(s, figs[0]);                  // la galerie prend la place du premier croquis
    figs.slice(1).forEach(function (f) { f.parentNode.removeChild(f); });
  }
  // la galerie : on glisse (téléphone) ou on clique sur les vignettes / les flèches (ordinateur) ; le compteur suit
  function initCroquis() {
    var g = D.querySelector(".croquis-galerie"); if (!g) return;
    var piste = g.querySelector(".cg-piste"), items = g.querySelectorAll(".cg-item"), vigs = g.querySelectorAll(".cg-vignette");
    var compte = g.querySelector(".cg-compte"), n = items.length, actuel = 0;
    function deux(k) { return (k < 10 ? "0" : "") + k; }
    var legs = []; try { legs = JSON.parse(g.dataset.legendes || "[]"); } catch (e) {}
    var leg = g.querySelector(".cg-legende");
    function marquer(k) {
      if (leg && k !== actuel) { leg.style.opacity = 0; rawTimeout(function () { leg.textContent = legs[k] || ""; leg.style.opacity = 1; }, 220); }
      actuel = k;
      compte.textContent = deux(k + 1) + " / " + deux(n);
      [].forEach.call(vigs, function (v, j) { v.classList.toggle("on", j === k); });
    }
    function aller(k) {
      k = (k + n) % n;
      piste.scrollTo({ left: items[k].offsetLeft - piste.offsetLeft - (piste.clientWidth - items[k].offsetWidth) / 2, behavior: "smooth" });
      marquer(k);
    }
    var attente = null;
    piste.addEventListener("scroll", function () {
      clearTimeout(attente);
      attente = rawTimeout(function () {
        var milieu = piste.scrollLeft + piste.clientWidth / 2, best = 0, d = 1e9;
        [].forEach.call(items, function (it, j) { var c = it.offsetLeft - piste.offsetLeft + it.offsetWidth / 2, e = Math.abs(c - milieu); if (e < d) { d = e; best = j; } });
        if (best !== actuel) marquer(best);
      }, 80);
    }, { passive: true });
    [].forEach.call(vigs, function (v, j) { v.addEventListener("click", function () { aller(j); }); });
    g.querySelector(".cg-prec").addEventListener("click", function () { aller(actuel - 1); });
    g.querySelector(".cg-suiv").addEventListener("click", function () { aller(actuel + 1); });
  }
  /* le pied de page : le menu, le contact, son nom en grand (écrit à sa main, bleu = retour à l'accueil), puis le © et les crédits */
  function piedDuSite() {
    var en = W.LANG === "en";
    var f = D.createElement("footer");
    f.className = "pied-site";
    f.innerHTML =
      '<div class="ps-haut">' +
        '<div class="ps-bloc"><nav class="ps-liens">' +
          '<a href="#/projets">' + (en ? "Projects" : "Projets") + "</a>" +
          '<a href="#/a-propos">' + (en ? "About" : "À propos") + "</a>" +
          '<button type="button" class="ps-langue"><span' + (en ? "" : ' class="on"') + ">Fr</span> / <span" + (en ? ' class="on"' : "") + ">En</span></button>" +
        "</nav></div>" +
        '<div class="ps-bloc"><span class="ps-titre">Contact</span><nav class="ps-liens">' +
          '<a href="mailto:roboe1@ulaval.ca">roboe1@ulaval.ca</a>' +
          '<a href="tel:+14185648532">418 564 8532</a>' +
        "</nav></div>" +
      "</div>" +
      '<a class="ps-nom main" href="#/" aria-label="' + (en ? "Home" : "Accueil") + '"><span>Rose Boucher-Emond</span></a>' +
      '<div class="ps-bas">' +
        '<span class="ps-copyright">© Rose Boucher-Emond 2026</span>' +
        '<a class="ps-credits" href="https://victoriahalipa.com" target="_blank" rel="noopener">' + (en ? "Site credits" : "Crédits du site") + "</a>" +
      "</div>";
    f.querySelector(".ps-langue").addEventListener("click", function () { if (W.changerLangue) W.changerLangue(); });
    return f;
  }
  // son nom remplit toute la largeur du pied de page (comme une grande signature)
  function ajusterNomPied() {
    return;   // la taille du nom est maintenant calculée par le CSS (toujours entier, sur tous les écrans)
    var a = D.querySelector(".ps-nom"); if (!a) return;
    var s = a.firstChild; a.style.fontSize = "100px";
    var w = s.getBoundingClientRect().width, dispo = a.clientWidth;
    if (w > 0 && dispo > 0) a.style.fontSize = (100 * dispo / w * 0.995).toFixed(2) + "px";
  }
  W.addEventListener("resize", ajusterNomPied);
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(ajusterNomPied);
  // téléphone : un sous-titre trop long pour l'écran a le droit de passer à la ligne (les courts restent entiers)
  function ajusterTitres() {
    // téléphone : l'année sort du groupe « (sous-titre) » ; elle reste sur la même ligne s'il y a la place, sinon elle passe dessous
    if (W.MOBILE()) D.querySelectorAll(".projet-titre .nowrap > .annee-titre").forEach(function (a) {
      var s = a.parentNode; s.parentNode.insertBefore(a, s.nextSibling); s.parentNode.insertBefore(D.createTextNode(" "), a);
    });
    D.querySelectorAll(".projet-titre .nowrap").forEach(function (s) {
      s.classList.remove("coupe");
      var h = s.closest(".projet-titre");
      if (W.MOBILE() && s.getBoundingClientRect().right > h.getBoundingClientRect().right + 1) s.classList.add("coupe");
    });
    // téléphone : si l'année tombe seule sur une ligne, le titre se resserre un tout petit peu (au plus 13 %) pour la garder sur la même ligne
    if (W.MOBILE()) D.querySelectorAll(".projet-titre").forEach(function (h) {
      var a = h.querySelector(".annee-titre"); if (!a) return;
      h.style.fontSize = "";
      function memeLigne() {
        var n = a.previousSibling; while (n && !(n.textContent || "").trim()) n = n.previousSibling;
        if (!n) return true;
        var r = D.createRange(); r.selectNodeContents(n); var rs = r.getClientRects(); if (!rs.length) return true;
        return Math.abs(rs[rs.length - 1].bottom - a.getBoundingClientRect().bottom) < 12;
      }
      if (memeLigne()) return;
      var base = parseFloat(getComputedStyle(h).fontSize), t = base;
      while (!memeLigne() && t > base * 0.87) { t -= 0.5; h.style.fontSize = t + "px"; }
      if (!memeLigne()) h.style.fontSize = "";                     // vraiment trop long : l'année passe dessous, le titre garde sa taille
    });
  }
  W.addEventListener("resize", ajusterTitres);
  if (D.fonts && D.fonts.addEventListener) D.fonts.addEventListener("loadingdone", ajusterTitres);
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(ajusterTitres);
  // un lien vers une autre page : petit fondu, puis on change de page
  addD("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    var cible = a.getAttribute("href");
    if (cible === location.hash || (cible === "#/" && !routeActuelle())) { afficher(routeActuelle() || "accueil"); return; }
    D.body.classList.add("part");
    parClic = true;
    rawTimeout(function () { location.hash = cible; }, 480);
  });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";   // chaque page s'ouvre en haut
  // retour / avance du navigateur : le même fondu doux qu'avec un clic
  var parClic = false;
  addW("hashchange", function () {
    var r = routeActuelle(); if (!r) return;
    if (parClic) { parClic = false; afficher(r); return; }
    retourArriere = true;                          // pas un clic sur un lien : c'est le bouton retour / avance du navigateur
    D.body.classList.add("part");
    rawTimeout(function () { afficher(r); }, 420);
  });
  // changer de langue : un fondu, puis la même page dans l'autre langue, à la même hauteur
  W.changerLangue = function () {
    W.LANG = W.LANG === "en" ? "fr" : "en";
    D.documentElement.lang = W.LANG;
    var y = W.scrollY;
    D.body.classList.add("part");
    rawTimeout(function () {
      afficher(routeActuelle() || "accueil");
      if (y) { D.documentElement.style.scrollBehavior = "auto"; W.scrollTo(0, y); rawTimeout(function () { D.documentElement.style.scrollBehavior = ""; }, 80); }
    }, 420);
  };
  afficher(routeActuelle() || "accueil");
})();
