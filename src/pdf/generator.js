// pdfmake est charge via CDN dans index.html -> window.pdfMake disponible globalement
import { APP_CONFIG } from '../config.js';
import { getLignesDeListe } from '../api/listes.js';
import { getProjet } from '../api/projets.js';

// ── Entrée publique ─────────────────────────────────────────────
export async function genererPDF(liste, projet) {
  const lignes = await getLignesDeListe(liste.id);
  const grouped = grouperParCategorie(lignes);
  const logoBase64 = await chargerLogo(APP_CONFIG.user.logoUrl);
  const docDef = buildDocDef(liste, projet, grouped, logoBase64);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nomFichier = [
    'Matos',
    slugify(projet.nom),
    'V' + liste.version,
    dateStr
  ].join('_') + '.pdf';

  await partagerOuTelecharger(docDef, nomFichier);
}

// ── Groupage lignes par catégorie ───────────────────────────────

function grouperParCategorie(lignes) {
  const map = new Map();
  lignes.forEach(ligne => {
    const cat = ligne.objets_catalogue.categories;
    if (!map.has(cat.id)) map.set(cat.id, { cat, lignes: [] });
    map.get(cat.id).lignes.push(ligne);
  });
  return [...map.values()].sort((a, b) => a.cat.sort_order - b.cat.sort_order);
}

// ── Définition du document pdfmake ──────────────────────────────

function buildDocDef(liste, projet, grouped, logoBase64) {
  const { user } = APP_CONFIG;

  const fmt = (d) => {
    if (!d) return '—';
    const [y, m, j] = d.slice(0, 10).split('-');
    return j + '/' + m + '/' + y.slice(2);
  };

  // ── Entête ──────────────────────────────────────────────────────
  const header = (currentPage, pageCount) => ({
    margin: [30, 15, 30, 0],
    stack: [
      {
        columns: [
          logoBase64
            ? { image: logoBase64, width: 55, margin: [0, 0, 8, 0] }
            : { text: '', width: 55 },
          {
            stack: [
              {
                text: 'Liste Materiel Lumiere  —  Version ' + liste.version +
                      '  du  ' + fmt(new Date().toISOString()),
                style: 'headerTitle'
              },
              {
                text: 'Projet : ' + projet.nom +
                      (projet.realisateur ? '   Real. ' + projet.realisateur : '') +
                      (projet.producteur  ? '   Prod. ' + projet.producteur  : ''),
                style: 'headerSub'
              },
              {
                text: 'Sortie Matos : ' + fmt(liste.date_sortie) +
                      '      Rendu Matos : ' + fmt(liste.date_rendu),
                style: 'headerSub'
              }
            ],
            alignment: 'center'
          },
          {
            stack: [
              { text: user.name,  style: 'headerRight' },
              { text: user.email, style: 'headerRight' },
              { text: user.phone, style: 'headerRight' }
            ],
            width: 'auto',
            alignment: 'right'
          }
        ],
        columnGap: 10
      },
      {
        canvas: [{
          type: 'line',
          x1: 0, y1: 4, x2: 515, y2: 4,
          lineWidth: 0.5,
          lineColor: '#94a3b8'
        }],
        margin: [0, 6, 0, 0]
      }
    ]
  });

  // ── Bas de page ─────────────────────────────────────────────────
  const footer = (currentPage, pageCount) => ({
    margin: [30, 0, 30, 10],
    text: currentPage + ' / ' + pageCount,
    alignment: 'right',
    fontSize: 8,
    color: '#94a3b8'
  });

  // ── Corps ───────────────────────────────────────────────────────
  const content = [];

  if (grouped.length === 0) {
    content.push({
      text: 'Liste vide.',
      style: 'empty',
      margin: [0, 20, 0, 0]
    });
  }

  grouped.forEach(({ cat, lignes }, idx) => {
    content.push({
      text: cat.name,
      style: 'catTitle',
      margin: [0, idx === 0 ? 10 : 18, 0, 4]
    });

    const rows = [
      [
        { text: 'Qte',       style: 'tableHeader' },
        { text: 'Objet',     style: 'tableHeader' },
        { text: 'Remarques', style: 'tableHeader' }
      ],
      ...lignes.map((ligne, i) => [
        {
          text: String(ligne.quantite),
          style: 'tableCell',
          alignment: 'center',
          fillColor: i % 2 === 0 ? '#f8fafc' : null
        },
        {
          text: ligne.objets_catalogue.libelle,
          style: 'tableCell',
          fillColor: i % 2 === 0 ? '#f8fafc' : null
        },
        {
          text: ligne.remarques || '',
          style: 'tableCellLight',
          fillColor: i % 2 === 0 ? '#f8fafc' : null
        }
      ])
    ];

    content.push({
      table: {
        headerRows: 1,
        widths: [30, '*', '*'],
        body: rows
      },
      layout: {
        hLineWidth: (i) => i === 0 || i === 1 ? 1 : 0.3,
        vLineWidth: () => 0.3,
        hLineColor: () => '#cbd5e1',
        vLineColor: () => '#cbd5e1',
        paddingLeft:   () => 6,
        paddingRight:  () => 6,
        paddingTop:    () => 4,
        paddingBottom: () => 4
      }
    });
  });

  // ── Styles ──────────────────────────────────────────────────────
  const styles = {
    headerTitle: {
      fontSize: 10,
      bold: true,
      color: '#0f172a'
    },
    headerSub: {
      fontSize: 8,
      color: '#475569',
      margin: [0, 1, 0, 0]
    },
    headerRight: {
      fontSize: 7,
      color: '#64748b',
      margin: [0, 1, 0, 0]
    },
    catTitle: {
      fontSize: 11,
      bold: true,
      color: '#b45309',
      decoration: 'underline'
    },
    tableHeader: {
      fontSize: 8,
      bold: true,
      color: '#0f172a',
      fillColor: '#e2e8f0'
    },
    tableCell: {
      fontSize: 9,
      color: '#1e293b'
    },
    tableCellLight: {
      fontSize: 8,
      color: '#64748b',
      italics: true
    },
    empty: {
      fontSize: 10,
      color: '#94a3b8',
      italics: true
    }
  };

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [30, 90, 30, 30],
    header,
    footer,
    content,
    styles,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9
    }
  };
}

// ── Partage natif mobile / téléchargement desktop ───────────────

async function partagerOuTelecharger(docDef, nomFichier) {
  return new Promise((resolve, reject) => {
    const pdfDoc = window.pdfMake.createPdf(docDef);

    pdfDoc.getBlob(async (blob) => {
      try {
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        const file = new File([blob], nomFichier, { type: 'application/pdf' });

        if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: nomFichier });
        } else {
          // Desktop : lien de téléchargement
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = nomFichier;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        resolve();
      } catch (e) {
        if (e.name === 'AbortError') resolve();
        else reject(e);
      }
    });
  });
}

// ── Logo base64 ─────────────────────────────────────────────────

async function chargerLogo(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Logo non charge:', e);
    return null;
  }
}

// ── Slugify nom de fichier ──────────────────────────────────────

function slugify(str) {
  return (str || 'projet')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30);
}