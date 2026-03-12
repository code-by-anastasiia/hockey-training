// ============================================
// FIREBASE INITIALISIERUNG
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC7CLKiHc2IUccBS6CVRfcUISNxLNBGFq8",
    authDomain: "hockey-training-b1458.firebaseapp.com",
    projectId: "hockey-training-b1458",
    storageBucket: "hockey-training-b1458.firebasestorage.app",
    messagingSenderId: "559354946029",
    appId: "1:559354946029:web:e472adeec221ed5f1187e4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// ЧАСТЬ 1: Получаем элементы из HTML
// ============================================
const datumInput = document.getElementById('datum-input');
const datumAnzeige = document.getElementById('datum-anzeige');
const datumSpeichern = document.getElementById('datum-speichern');
const trainingSpalte = document.getElementById('training-spalte');
const notiz = document.getElementById('notiz');
const notizSpeichern = document.getElementById('notiz-speichern');
const spielerListe = document.getElementById('spieler-liste');
const spielerHinzufuegen = document.getElementById('spieler-hinzufuegen');
const zuruecksetzen = document.getElementById('zuruecksetzen');

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
async function getDaten() {
    const snap = await getDoc(doc(db, 'training', 'daten'));
    return snap.exists() ? snap.data() : { datum: '', notiz: '', spieler: [] };
}

async function saveDaten(daten) {
    await setDoc(doc(db, 'training', 'daten'), daten);
}

function spielerAnzeigen(spieler) {
    spielerListe.innerHTML = '';
    spieler.forEach(function(s, index) {
        const zeile = document.createElement('tr');
        zeile.innerHTML = `
            <td>${s.name}</td>
            <td>
                <button class="ja-btn ${s.antwort === 'ja' ? 'aktiv' : ''}"
                        onclick="antwortSetzen(${index}, 'ja')">Ja</button>
                <button class="nein-btn ${s.antwort === 'nein' ? 'aktiv' : ''}"
                        onclick="antwortSetzen(${index}, 'nein')">Nein</button>
                <button onclick="spielerLoeschen(${index})"
                        style="background:none; border:none; color:#1a3a6b; cursor:pointer; font-size:18px; margin-left:10px;">🗑️</button>
            </td>
        `;
        spielerListe.appendChild(zeile);
    });
}

function antwortSetzen(index, antwort) {
    const text = antwort === 'ja' ? 'Anwesenheit mit Ja bestätigen?' : 'Abwesenheit mit Nein bestätigen?';
    ausstehende_aktion = async function() {
        const daten = await getDaten();
        daten.spieler[index].antwort = antwort;
        await saveDaten(daten);

        const bestaetigung = document.getElementById('antwort-bestaetigung');
        bestaetigung.style.opacity = '1';
        setTimeout(function() { bestaetigung.style.opacity = '0'; }, 2000);
    };
    document.getElementById('modal-bestaetigung-text').textContent = text;
    document.getElementById('modal-bestaetigung').style.display = 'block';
}

function spielerLoeschen(index) {
    getDaten().then(function(daten) {
        ausstehende_aktion = async function() {
            daten.spieler.splice(index, 1);
            await saveDaten(daten);
        };
        document.getElementById('modal-bestaetigung-text').textContent = daten.spieler[index].name + ' wirklich löschen?';
        document.getElementById('modal-bestaetigung').style.display = 'block';
    });
}

// Делаем функции глобальными для onclick в HTML
window.antwortSetzen = antwortSetzen;
window.spielerLoeschen = spielerLoeschen;

// ============================================
// ЧАСТЬ 2: Слушаем изменения в реальном времени
// ============================================
onSnapshot(doc(db, 'training', 'daten'), function(snap) {
    if (!snap.exists()) return;
    const daten = snap.data();

    if (daten.datum) {
        datumAnzeige.textContent = daten.datum;
        trainingSpalte.textContent = 'Training am ' + daten.datum;
    } else {
        datumAnzeige.textContent = '__.__.____';
        trainingSpalte.textContent = 'Training am __.__.____';
    }

    if (daten.notiz !== undefined) {
        notiz.value = daten.notiz;
        notiz.style.height = 'auto';
        notiz.style.height = notiz.scrollHeight + 'px';
    }

    spielerAnzeigen(daten.spieler || []);
});

// ============================================
// ЧАСТЬ 3: Сохраняем дату
// ============================================
datumSpeichern.addEventListener('click', async function() {
    const datum = datumInput.value;
    if (!datum) { alert('Bitte ein Datum eingeben!'); return; }

    const teile = datum.split('-');
    const formatiert = teile[2] + '.' + teile[1] + '.' + teile[0];

    const daten = await getDaten();
    daten.datum = formatiert;
    await saveDaten(daten);

    const datumBestaetigung = document.getElementById('datum-bestaetigung');
    datumBestaetigung.style.opacity = '1';
    setTimeout(function() { datumBestaetigung.style.opacity = '0'; }, 2000);
});

// ============================================
// ЧАСТЬ 4: Сохраняем заметку
// ============================================
notizSpeichern.addEventListener('click', async function() {
    const daten = await getDaten();
    daten.notiz = notiz.value;
    await saveDaten(daten);

    const bestaetigung = document.getElementById('speicher-bestaetigung');
    bestaetigung.style.opacity = '1';
    setTimeout(function() { bestaetigung.style.opacity = '0'; }, 2000);
});

notiz.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// ============================================
// ЧАСТЬ 5: Добавление игрока
// ============================================
spielerHinzufuegen.addEventListener('click', function() {
    document.getElementById('modal-spieler').style.display = 'block';
    document.getElementById('modal-spieler-input').value = '';
    document.getElementById('modal-spieler-input').focus();
});

document.getElementById('modal-spieler-ok').addEventListener('click', async function() {
    const name = document.getElementById('modal-spieler-input').value.trim();
    if (!name) return;
    document.getElementById('modal-spieler').style.display = 'none';

    const daten = await getDaten();
    daten.spieler = daten.spieler || [];
    daten.spieler.push({ name: name, antwort: null });
    await saveDaten(daten);
});

document.getElementById('modal-spieler-abbrechen').addEventListener('click', function() {
    document.getElementById('modal-spieler').style.display = 'none';
});

// ============================================
// ЧАСТЬ 6: Модалы подтверждения
// ============================================
let ausstehende_aktion = null;

document.getElementById('modal-bestaetigung-ja').addEventListener('click', async function() {
    document.getElementById('modal-bestaetigung').style.display = 'none';
    if (ausstehende_aktion) { await ausstehende_aktion(); ausstehende_aktion = null; }
});

document.getElementById('modal-bestaetigung-nein').addEventListener('click', function() {
    document.getElementById('modal-bestaetigung').style.display = 'none';
    ausstehende_aktion = null;
});

// ============================================
// ЧАСТЬ 7: Zurücksetzen
// ============================================
zuruecksetzen.addEventListener('click', function() {
    document.getElementById('modal').style.display = 'block';
});

document.getElementById('modal-ja').addEventListener('click', async function() {
    document.getElementById('modal').style.display = 'none';

    const daten = await getDaten();
    daten.spieler.forEach(function(s) { s.antwort = null; });
    daten.datum = '';
    await saveDaten(daten);

    datumInput.value = '';
});

document.getElementById('modal-nein').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});
