/* app.js - logika utama */

// ---------- Utilities ----------
const STORAGE_KEYS = {
  books: 'app_books',
  members: 'app_members',
  loans: 'app_loans',
  returns: 'app_returns',
  shelves: 'app_shelves'   // baris terakhir tidak boleh pakai koma
};

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function load(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}
function download(filename, content, mime='text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// convert array of objects to CSV (simple)
function toCSV(arr) {
  if (!arr || arr.length === 0) return '';
  const keys = Object.keys(arr[0]);
  const lines = [keys.join(',')];
  arr.forEach(obj => {
    const row = keys.map(k => {
      let v = obj[k] === undefined || obj[k] === null ? '' : String(obj[k]);
      // escape quotes
      if (v.includes('"') || v.includes(',') || v.includes('\n')) {
        v = '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    }).join(',');
    lines.push(row);
  });
  return lines.join('\n');
}

// parse simple CSV to array of objects (first row header)
function parseCSV(text) {
  const rows = text.split(/\r\n|\n/).filter(r => r.trim() !== '');
  if (rows.length === 0) return [];
  const header = rows[0].split(',').map(h => h.replace(/^"|"$/g,'').trim());
  const data = [];
  for (let i=1;i<rows.length;i++){
    const cols = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const obj = {};
    header.forEach((h, idx) => {
      let val = (cols[idx] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1,-1).replace(/""/g,'"');
      obj[h] = val;
    });
    data.push(obj);
  }
  return data;
}

// ---------- UI Helpers ----------
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('-translate-x-64');
}

function toggleMenu(id) {
  const menu = document.getElementById(id);
  const icon = document.getElementById('icon-' + id);
  if (!menu) return;
  if (menu.classList.contains('max-h-0')) {
    menu.classList.remove('max-h-0');
    menu.classList.add('max-h-96');
    if (icon) icon.classList.add('rotate-180');
  } else {
    menu.classList.remove('max-h-96');
    menu.classList.add('max-h-0');
    if (icon) icon.classList.remove('rotate-180');
  }
}


// showPage keeps old behavior: show element with id="page-" + page
function showPage(page) {
  document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.remove('hidden');
  // update dashboard stats & charts if needed
  renderAll();
}

// ---------- Render Functions ----------
// ---------- Pagination Variables ----------
let currentBookPage = 1;
let currentMemberPage = 1;
const pageSize = 50;        // buku per halaman
const memberPageSize = 50;  // anggota per halaman

// ---------- Render Buku ----------
function renderBooks(page = currentBookPage) {
  const tb = document.getElementById('tbody-books');
  const arr = load(STORAGE_KEYS.books) || [];

  const q = (document.getElementById('searchBuku')?.value || '').toLowerCase();
  const filtered = arr.filter(item =>
    String(item.kode || '').toLowerCase().includes(q) ||
    String(item.judul || '').toLowerCase().includes(q)
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  if (page > totalPages) page = totalPages;
  currentBookPage = page;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const dataPage = filtered.slice(start, end);

  tb.innerHTML = '';
  dataPage.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.innerHTML = `
      <td class="p-2">${start + idx + 1}</td>
      <td class="p-2">${item.judul || ''}</td>
      <td class="p-2">${item.pengarang || ''}</td>
      <td class="p-2">${item.kodeBarang || ''}</td>
      <td class="p-2">${item.penerbit || ''}</td>
      <td class="p-2">${item.tahun || ''}</td>
      <td class="p-2">${item.tempat || ''}</td>
      <td class="p-2">${item.edisi || ''}</td>
      <td class="p-2">${item.kategori || ''}</td>
      <td class="p-2">${item.isbn || ''}</td>
      <td class="p-2">${item.ddc || ''}</td>
      <td class="p-2">${item.halaman || ''}</td>
      <td class="p-2">${item.ukuran || ''}</td>
      <td class="p-2">${item.kataKunci || ''}</td>
      <td class="p-2">${item.sumber || ''}</td>
      <td class="p-2">${item.jumlah || ''}</td>
      <td class="p-2">${item.noInventaris || ''}</td>
      <td class="p-2">${item.rak || ''}</td>
      <td class="p-2">${item.asal || ''}</td>
      <td class="p-2">${item.sekolah || ''}</td>
      <td class="p-2">${item.harga || ''}</td>
      <td class="p-2">
        <button onclick="editBuku('${item.noInventaris}')" class="text-blue-600">Edit</button>
        <button onclick="hapusBuku('${item.noInventaris}')" class="text-red-600 ml-2">Hapus</button>
      </td>
    `;
    tb.appendChild(tr);
  });

  const pagDiv = document.getElementById('book-pagination');
  if (pagDiv) {
    pagDiv.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = `px-2 py-1 rounded ${i === page ? 'bg-indigo-700 text-white' : 'bg-gray-200'}`;
      btn.onclick = () => renderBooks(i);
      pagDiv.appendChild(btn);
    }
  }

  document.getElementById('stat-total-buku').innerText = arr.length;
}

// ---------- Render Anggota ----------
function renderMembers(page = currentMemberPage) {
  const tb = document.getElementById('tbody-members');
  const arr = load(STORAGE_KEYS.members) || [];

  const q = (document.getElementById('searchAnggota')?.value || '').toLowerCase();
  const filtered = arr.filter(item =>
    String(item.id || '').toLowerCase().includes(q) ||
    String(item.nama || '').toLowerCase().includes(q)
  );

  const totalPages = Math.ceil(filtered.length / memberPageSize) || 1;
  if (page > totalPages) page = totalPages;
  currentMemberPage = page;

  const start = (page - 1) * memberPageSize;
  const end = start + memberPageSize;
  const dataPage = filtered.slice(start, end);

  tb.innerHTML = '';
  dataPage.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.innerHTML = `
      <td class="p-2">${start + idx + 1}</td>
      <td class="p-2">${item.id || ''}</td>
      <td class="p-2">${item.nama || ''}</td>
      <td class="p-2">${item.kelamin || ''}</td>
      <td class="p-2">${item.kelas || ''}</td>
      <td class="p-2">${item.alamat || ''}</td>
      <td class="p-2">${item.hp || ''}</td>
      <td class="p-2">${item.status || ''}</td>
      <td class="p-2">
        <button onclick="editAnggota('${item.id}')" class="text-blue-600">Edit</button>
        <button onclick="hapusAnggota('${item.id}')" class="text-red-600 ml-2">Hapus</button>
      </td>
    `;
    tb.appendChild(tr);
  });

  // tombol pagination anggota
  const pagDiv = document.getElementById('member-pagination');
  if (pagDiv) {
    pagDiv.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = `px-2 py-1 rounded ${i === page ? 'bg-indigo-700 text-white' : 'bg-gray-200'}`;
      btn.onclick = () => renderMembers(i);
      pagDiv.appendChild(btn);
    }
  }

  // update statistik total anggota kalau ada elemen stat-total-anggota
  const stat = document.getElementById('stat-total-anggota');
  if (stat) stat.innerText = arr.length;
}

// ---------- Render Peminjaman ----------
let currentLoanPage = 1;
const loanPageSize = 20;

function renderLoans(page = currentLoanPage) {
  const tb = document.getElementById('tbody-loans');
  const arr = load(STORAGE_KEYS.loans) || [];
  const members = load(STORAGE_KEYS.members) || [];
  tb.innerHTML = '';

  // --- Tambahkan pencarian ---
  const q = (document.getElementById('searchLoan')?.value || '').toLowerCase();

  const filtered = arr.filter(item => {
    const anggota = members.find(m =>
      String(m.id || '').trim().toLowerCase() === String(item.idAnggota || '').trim().toLowerCase()
    );
    const nama = anggota ? anggota.nama.toLowerCase() : '';
    return String(item.idAnggota || '').toLowerCase().includes(q) || nama.includes(q);
  });

  const totalPages = Math.ceil(filtered.length / loanPageSize) || 1;
  if (page > totalPages) page = totalPages;
  currentLoanPage = page;

  const start = (page - 1) * loanPageSize;
  const end = start + loanPageSize;
  const dataPage = filtered.slice(start, end);

  dataPage.forEach((item, idx) => {
    const anggota = members.find(m =>
      String(m.id || '').trim().toLowerCase() === String(item.idAnggota || '').trim().toLowerCase()
    );
    const nama = anggota ? anggota.nama : "-";

    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.innerHTML = `
      <td class="p-2">${start + idx + 1}</td>
      <td class="p-2">${item.idAnggota || ''}</td>
      <td class="p-2">${nama}</td>
      <td class="p-2">${item.tglPinjam || ''}</td>
      <td class="p-2">${item.tglKembali || ''}</td>
      <td class="p-2">
        <button onclick="hapusLoan(${start + idx})" class="text-red-600">Hapus</button>
      </td>
    `;
    tb.appendChild(tr);
  });

  // --- Pagination ---
  const pagDiv = document.getElementById('loan-pagination');
  if (pagDiv) {
    pagDiv.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = `px-2 py-1 rounded ${i === page ? 'bg-indigo-700 text-white' : 'bg-gray-200'}`;
      btn.onclick = () => renderLoans(i);
      pagDiv.appendChild(btn);
    }
  }

  const stat = document.getElementById('stat-total-peminjaman');
  if (stat) stat.innerText = arr.length;
}



// ---------- Render Pengembalian ----------
function renderReturns() {
  const tb = document.getElementById('tbody-returns');
  const arr = load(STORAGE_KEYS.returns) || [];
  const members = load(STORAGE_KEYS.members) || []; // ambil data anggota
  tb.innerHTML = '';
  let terlambat = 0;

  arr.forEach((item, idx) => {
    // cari anggota sesuai id
    const anggota = members.find(m =>
      String(m.id || '').trim().toLowerCase() === String(item.idAnggota || '').trim().toLowerCase()
    );
    const nama = anggota ? anggota.nama : "-";

    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.innerHTML = `
      <td class="p-2">${idx + 1}</td>
      <td class="p-2">${item.idAnggota || ''}</td>
      <td class="p-2">${nama}</td>
      <td class="p-2">${item.tglKembali || ''}</td>
      <td class="p-2 text-red-600">${item.denda ? 'Rp ' + item.denda : 'Rp 0'}</td>
    `;
    tb.appendChild(tr);

    if (item.denda && Number(item.denda) > 0) terlambat++;
  });

  const statTerlambat = document.getElementById('stat-total-terlambat');
  if (statTerlambat) statTerlambat.innerText = terlambat;
}



// ---------- Render Riwayat ----------
function renderHistory() {
  const loans = load(STORAGE_KEYS.loans);
  const returns = load(STORAGE_KEYS.returns);
  const members = load(STORAGE_KEYS.members);
  const tb = document.getElementById('tbody-history');
  if (!tb) return;
  tb.innerHTML = '';

  loans.forEach((loan, i) => {
    const anggota = members.find(m => 
  String(m.id).trim().toLowerCase() === String(loan.idAnggota).trim().toLowerCase()
);
const nama = anggota ? anggota.nama : "-";
    const ret = returns.find(r => r.idAnggota === loan.idAnggota);

    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.innerHTML = `
      <td class="p-2">${i+1}</td>
      <td class="p-2">${loan.idAnggota}</td>
      <td class="p-2">${nama}</td>
      <td class="p-2">${loan.noInventaris}</td>
      <td class="p-2">${loan.tglPinjam}</td>
      <td class="p-2">${ret ? ret.tglKembali : '-'}</td>
    `;
    tb.appendChild(tr);
  });
}

// laporan renderers
function renderReports() {
  // laporan denda
  const rptD = document.getElementById('tbody-laporan-denda'); rptD.innerHTML='';
  load(STORAGE_KEYS.returns).forEach((r, idx) => {
    if (r.denda && Number(r.denda) > 0) {
      const tr = document.createElement('tr'); tr.className='border';
      tr.innerHTML = `<td class="p-2">${idx+1}</td>
                      <td class="p-2">${r.id||''}</td>
                      <td class="p-2 text-red-600">Rp ${r.denda}</td>`;
      rptD.appendChild(tr);
    }
  });

  // laporan buku hilang (we keep empty unless you import or mark)
  const rptH = document.getElementById('tbody-laporan-hilang'); rptH.innerHTML='';

  // laporan anggota aktif
  const rptA = document.getElementById('tbody-laporan-anggota-aktif'); rptA.innerHTML='';
  const members = load(STORAGE_KEYS.members);
  const loans = load(STORAGE_KEYS.loans);
  members.forEach((m, idx) => {
    const total = loans.filter(l => l.idAnggota === m.id).length;
    const tr = document.createElement('tr'); tr.className = 'border';
    tr.innerHTML = `<td class="p-2">${idx+1}</td>
                    <td class="p-2">${m.id||''}</td>
                    <td class="p-2">${m.nama||''}</td>
                    <td class="p-2">${total}</td>`;
    rptA.appendChild(tr);
  });
}

// render all combos
function renderAll() {
  renderBooks();
  renderMembers();
  renderLoans();
  renderReturns();
  renderHistory();
  renderReports();
  updateCharts();
}

function renderKlasifikasi() {
  const tb = document.getElementById('tbody-klasifikasi');
  const arr = load(STORAGE_KEYS.shelves);
  tb.innerHTML = '';
  arr.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.innerHTML = `
      <td class="p-2">${idx + 1}</td>
      <td class="p-2">${item.kode || ''}</td>
      <td class="p-2">${item.nama || ''}</td>
      <td class="p-2">
        <button onclick="editRak('${item.kode}')" class="text-blue-600">Edit</button>
        <button onclick="hapusRak('${item.kode}')" class="text-red-600 ml-2">Hapus</button>
      </td>
    `;
    tb.appendChild(tr);
  });
}

function hapusSemuaRak() {
  if (confirm("Yakin ingin menghapus semua rak?")) {
    save(STORAGE_KEYS.shelves, []);
    renderKlasifikasi();
  }
}

function hapusRak(kode) {
  let arr = load(STORAGE_KEYS.shelves);
  arr = arr.filter(r => r.kode !== kode);
  save(STORAGE_KEYS.shelves, arr);
  renderKlasifikasi();
}

function editRak(kode) {
  let arr = load(STORAGE_KEYS.shelves);
  const index = arr.findIndex(r => r.kode === kode);
  if (index === -1) return;
  const rak = arr[index];
  const namaBaru = prompt("Ubah Nama Rak:", rak.nama || "");
  if (namaBaru === null) return;
  arr[index].nama = namaBaru;
  save(STORAGE_KEYS.shelves, arr);
  renderKlasifikasi();
}


// ---------- Form Handlers ----------
document.addEventListener('DOMContentLoaded', function() {
  // initial render
  renderAll();

// Books form
const formBuku = document.getElementById('form-buku');
if (formBuku) {
  formBuku.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = new FormData(this);
    const obj = {};
    for (const [k,v] of data.entries()) obj[k]=v;
    const arr = load(STORAGE_KEYS.books);
    arr.push(obj);
    save(STORAGE_KEYS.books, arr);
    this.reset();
    renderBooks(); updateCharts();
    alert('Buku tersimpan!');
  });
}

  // Members form
  const formMember = document.getElementById('form-member');
  if (formMember) {
    formMember.addEventListener('submit', function(e) {
      e.preventDefault();
      const data = new FormData(this);
      const obj = {};
      for (const [k,v] of data.entries()) obj[k]=v;
      const arr = load(STORAGE_KEYS.members);
      arr.push(obj);
      save(STORAGE_KEYS.members, arr);
      this.reset();
      renderMembers(); updateCharts();
      alert('Anggota tersimpan!');
    });
  }

// ---------- Form Peminjaman ----------
document.getElementById("form-loan").addEventListener("submit", function(e) {
  e.preventDefault();
  const form = e.target;
  const loans = load(STORAGE_KEYS.loans) || [];

  const newLoan = {
    idAnggota: form.idAnggota.value.trim(),
    noInventaris: form.noInventaris.value.trim(),
    tglPinjam: form.tglPinjam.value,
    tglKembali: form.tglKembali.value
  };

  loans.push(newLoan);
  save(STORAGE_KEYS.loans, loans);

  form.reset();
  renderLoans();
  renderHistory();
  renderReports();
  updateCharts();
  alert("Peminjaman berhasil disimpan!");
});


// Returns (pengembalian)
document.getElementById("form-return").addEventListener("submit", function(e) {
  e.preventDefault();
  const form = e.target;
  const returns = load(STORAGE_KEYS.returns) || [];

  const newReturn = {
    idAnggota: form.idAnggota.value.trim(),
    tglKembali: form.tglKembali.value,
    denda: form.denda.value
  };

  returns.push(newReturn);
  save(STORAGE_KEYS.returns, returns);

  // --- HAPUS pinjaman yang sesuai dari loans ---
  let loans = load(STORAGE_KEYS.loans) || [];
  loans = loans.filter(l => String(l.idAnggota).trim() !== newReturn.idAnggota.trim());
  save(STORAGE_KEYS.loans, loans);

  form.reset();
  renderLoans();
  renderReturns();
  renderHistory();
  renderReports();
  updateCharts();
  alert("Pengembalian berhasil disimpan!");
});


// Perpanjangan
const formExt = document.getElementById('form-extend');
if (formExt) {
  formExt.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = new FormData(this);
    const idLoan = data.get("idPinjam");   // dari form HTML
    const tglBaru = data.get("tglBaru");

    let loans = load(STORAGE_KEYS.loans) || [];
    console.log("Loans data detail:");
    loans.forEach((l, i) => console.log(i, JSON.stringify(l)));
    console.log("Cari ID dari form:", idLoan);

    // ?? cek semua kemungkinan field yang ada di loans
    const idx = loans.findIndex(l =>
      String(l.id) === idLoan ||
      String(l.kodeBuku) === idLoan ||
      String(l.idAnggota) === idLoan
    );

    if (idx === -1) {
      alert("Data peminjaman tidak ditemukan!");
      return;
    }

    // update tanggal kembali
    loans[idx].tglKembali = tglBaru;
    save(STORAGE_KEYS.loans, loans);

    renderLoans();
    showPage("page-loans");

    this.reset();
    alert("Perpanjangan berhasil disimpan!");
  });
}


  // Label generate
  const formLabel = document.getElementById('form-cetak-label');
  if (formLabel) {
    formLabel.addEventListener('submit', generateLabel);
  }

// --- function untuk barcode buku ---
function generateBarcode(event) {
  event.preventDefault();
  let kode = document.getElementById("kodeBarcode").value.trim();

  if (!kode) {
    alert("Masukkan kode buku terlebih dahulu!");
    return;
  }

  const kodeAsli = kode; // untuk scanner
  const kodeCetak = kode.padStart(11, "0"); // untuk tampilan teks di barcode

  const area = document.getElementById("barcodeArea");
  area.innerHTML = '<svg id="svgBarcode"></svg>';

  JsBarcode("#svgBarcode", kodeAsli, { 
    format: "CODE128",
    width: 2,
    height: 60,
    displayValue: true,
    text: kodeCetak,   // tampilkan versi 11 digit
    fontSize: 14
  });

  document.getElementById("btnPrintBarcode").classList.remove("hidden");
  document.getElementById("btnCopyBarcode").classList.remove("hidden");
}


function printBarcode() {
  const printContent = document.getElementById("barcodeArea").innerHTML;
  const win = window.open('', '', 'width=400,height=300');
  win.document.write(`
    <html>
      <head><title>Cetak Barcode</title></head>
      <body>${printContent}</body>
    </html>
  `);
  win.document.close();
  win.print();
}

function copyBarcode() {
  const kode = document.getElementById("kodeBarcode").value.trim();
  if (!kode) {
    alert("Tidak ada kode untuk disalin!");
    return;
  }
  navigator.clipboard.writeText(kode)
    .then(() => alert("Kode barcode berhasil disalin!"))
    .catch(() => alert("Gagal menyalin kode barcode"));
}

// --- listener form barcode ---
const formBarcodeBuku = document.getElementById('form-barcode-buku');
if (formBarcodeBuku) {
  formBarcodeBuku.addEventListener('submit', generateBarcode);
}


  // Kartu anggota generate
  const formKartu = document.getElementById('form-kartu');
  if (formKartu) {
    formKartu.addEventListener('submit', generateCardBarcode);
  }

}); // DOMContentLoaded end

// ---------- Barcode / Label functions ----------
function generateCardBarcode(event) {
  event.preventDefault();
  const kode = document.getElementById("kodeAnggota").value.trim();
  const members = load(STORAGE_KEYS.members);
  const m = members.find(x => String(x.id).trim() === kode);

  if (!m) {
    alert("Anggota tidak ditemukan!");
    return;
  }

 // Isi data ke kartu
document.getElementById("kartu-nama").textContent = m.nama || "-";
document.getElementById("kartu-alamat").textContent = m.alamat || "-";
document.getElementById("kartu-id").textContent = m.id || "-";

// Generate barcode
JsBarcode("#kartu-barcode", m.id, { format: "CODE128", width: 2, height: 50 });

  // Tampilkan kartu
document.getElementById("cardArea").classList.remove("hidden");
document.getElementById("btnPrintCard").classList.remove("hidden");
document.getElementById("btnCopyCard").classList.remove("hidden"); // ? tambahan
}

function salinDataKartu() {
  const kartu = document.getElementById("kartu-container");
  html2canvas(document.getElementById("kartu-container"), {
  backgroundColor: "#ffffff"  // ? paksa putih
}).then(canvas => {
    canvas.toBlob(blob => {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(() => {
          alert("Kartu berhasil disalin sebagai gambar! Tempelkan ke Word/Docs.");
        }).catch(err => {
          console.error("Clipboard gagal, fallback ke download:", err);
          downloadCanvas(canvas);
        });
      } else {
        // Browser tidak support ? langsung download
        downloadCanvas(canvas);
      }
    });
  });
}

function downloadCanvas(canvas) {
  const link = document.createElement("a");
  link.download = "kartu-anggota.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  alert("Browser tidak mendukung salin gambar. Kartu sudah diunduh sebagai PNG.");
}


function printCard() {
  const kartu = document.getElementById("kartu-container").outerHTML;
  const win = window.open('', '', 'width=800,height=600');
  win.document.write(`
    <html>
      <head>
        <title>Cetak Kartu</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          #kartu-container {
            width: 480px;
            height: 280px;
            border: 1px solid #000;
          }
        </style>
      </head>
      <body>${kartu}</body>
    </html>
  `);
  win.document.close();
  win.print();
}

function generateLabel(e) {
  e.preventDefault();
  const kode = document.getElementById('labelKode').value.trim();
  if (!kode) { 
    alert('Masukkan kode atau no inventaris'); 
    return; 
  }

  const books = load(STORAGE_KEYS.books);
  console.log("Books di localStorage:", books);

  // cari buku (konversi semua ke string biar aman)
  const book = books.find(b => {
    const ni = String(b.noInventaris || '').trim().toLowerCase();
    const kd = String(b.kode || '').trim().toLowerCase();
    return ni === kode.toLowerCase() || kd === kode.toLowerCase();
  });

  if (!book) {
    alert("Buku tidak ditemukan untuk kode/noInventaris: " + kode);
    return;
  }

  const htmlOutput = `
    <div style="width:76mm; height:36mm; border:2px solid red; border-radius:6px; 
                padding:6px; font-family:'Times New Roman', Times, serif; 
                display:flex; flex-direction:column; justify-content:center; align-items:center;">
      <div style="font-size:15px; font-weight:bold; margin-bottom:8px; text-align:center; text-decoration: underline;">
        Perpustakaan SD Negeri 12 Padang Lua
      </div>
      <div style="font-size:14px; line-height:1.4; text-align:center; width:95%;">
        <div>${book.ddc || '-'}</div>
	<div>${book.noInventaris || '-'}</div>
        <div>${book.judul ? book.judul.substring(0,3).toUpperCase() : '-'}</div>
        <div>${book.rak || '-'}</div>
      </div>
    </div>
  `;

  document.getElementById('labelArea').innerHTML = htmlOutput;
  document.getElementById("btnPrintLabel")?.classList.remove("hidden");
  document.getElementById("btnCopyLabel")?.classList.remove("hidden");
}


function printLabel() {
  const printContent = document.getElementById("labelArea").innerHTML;
  const win = window.open('', '', 'width=600,height=400');
  win.document.write(printContent);
  win.document.close();
  win.print();
}

// --- Copy & Print Label ---
function printLabel() {
  const content = document.getElementById("labelArea").innerHTML;
  const win = window.open("", "", "width=600,height=400");
  win.document.write(`<html><head><title>Print Label</title></head><body>${content}</body></html>`);
  win.document.close();
  win.print();
}

function copyLabel() {
  const node = document.getElementById("labelArea");
  html2canvas(node).then(canvas => {
    canvas.toBlob(blob => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item])
        .then(() => alert("Label berhasil disalin ke clipboard sebagai gambar!"))
        .catch(err => alert("Gagal menyalin label: " + err));
    });
  });
}

// --- Copy & Print Barcode ---
function printBarcode() {
  const content = document.getElementById("barcodeArea").innerHTML;
  const win = window.open("", "", "width=600,height=400");
  win.document.write(`<html><head><title>Print Barcode</title></head><body>${content}</body></html>`);
  win.document.close();
  win.print();
}

function copyBarcode() {
  const node = document.getElementById("barcodeArea");
  html2canvas(node).then(canvas => {
    canvas.toBlob(blob => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item])
        .then(() => alert("Barcode berhasil disalin ke clipboard sebagai gambar!"))
        .catch(err => alert("Gagal menyalin barcode: " + err));
    });
  });
}

function printCard() {
  const area = document.getElementById("cardArea");
  const w = window.open("");
  w.document.write(area.outerHTML);
  w.document.close();   // penting biar bisa print
  w.print();
  w.close();
}

function copyCard() {
  const area = document.getElementById("cardArea");
  html2canvas(area).then(canvas => {
    canvas.toBlob(blob => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]).then(() => {
        alert("Kartu anggota berhasil disalin ke clipboard!");
      }).catch(err => {
        alert("Browser kamu tidak mendukung salin gambar ke clipboard.");
        console.error(err);
      });
    });
  });
}


// ---------- Import / Export (CSV & XLSX) ----------
function exportDataToFile(entityKey, filenamePrefix) {
  const data = load(STORAGE_KEYS[entityKey]);
  if (!data || data.length === 0) { alert('Data kosong.'); return; }
  const csv = toCSV(data);
  download(filenamePrefix + '.csv', csv, 'text/csv');
}

function exportDataToXLSX(entityKey, filename='export.xlsx') {
  const data = load(STORAGE_KEYS[entityKey]);
  if (!data || data.length === 0) { alert('Data kosong.'); return; }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}

// import from file input id to corresponding storage key
function importDataFromFile(entityKey, inputElementId) {
  const input = document.getElementById(inputElementId);
  if (!input || !input.files || input.files.length === 0) {
    alert('Pilih file terlebih dahulu.');
    return;
  }
  const file = input.files[0];
  const reader = new FileReader();
  const ext = (file.name.split('.').pop() || '').toLowerCase();

  reader.onload = function(e) {
    const content = e.target.result;
    if (ext === 'csv') {
      const arr = parseCSV(content);
      const existing = load(STORAGE_KEYS[entityKey]);
      const merged = existing.concat(arr);
      save(STORAGE_KEYS[entityKey], merged);
      alert('Import CSV berhasil: ' + arr.length + ' baris.');
      renderAll();
    } else if (ext === 'xlsx' || ext === 'xls') {
      const data = new Uint8Array(content);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(firstSheet, {defval: ''});
      const existing = load(STORAGE_KEYS[entityKey]);
      const merged = existing.concat(json);
      save(STORAGE_KEYS[entityKey], merged);
      alert('Import XLSX berhasil: ' + json.length + ' baris.');
      renderAll();
    } else {
      alert('Format file tidak dikenali. Gunakan CSV atau XLSX.');
    }
    input.value = '';
  };

  if (ext === 'csv') {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

// ---------- Charts ----------
let chartInstance = null;
function updateCharts() {
  const ctx = document.getElementById('chartPeminjaman');
  if (!ctx) return;
  const loans = load(STORAGE_KEYS.loans);
  // simple monthly counts last 6 months (demo): just use count distribution
  const months = ['Mei','Jun','Jul','Agu','Sep','Okt'];
  const data = months.map((m,i) => {
    // naive: distribute by index to get sample numbers (or real data if tglPinjam parsed)
    return loans.filter((_, idx) => idx % 6 === i).length * 10 + 10;
  });
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{ label: 'Jumlah Peminjaman', data, backgroundColor: 'rgba(79,70,229,0.7)' }]
    },
    options: { responsive: true, plugins: { legend: { display: false }}}
  });
}

// initial call to chart on load:
document.addEventListener('DOMContentLoaded', () => {
  updateCharts();
});

// ---------- Hapus Semua Data ----------

// Hapus semua buku
function hapusSemuaBuku() {
  if (confirm("Apakah Anda yakin ingin menghapus semua data buku?")) {
    save(STORAGE_KEYS.books, []);
    renderBooks(); updateCharts();
    alert("Semua data buku berhasil dihapus!");
  }
}

function hapusBuku(noInv) {
  if (confirm("Yakin ingin menghapus buku dengan No Inventaris " + noInv + "?")) {
    let arr = load(STORAGE_KEYS.books) || [];
    console.log("Sebelum hapus:", arr.length);

    arr = arr.filter(b => String(b.noInventaris || "").trim() !== String(noInv).trim());

    console.log("Sesudah hapus:", arr.length);

    save(STORAGE_KEYS.books, arr);
    renderBooks();
    alert("Buku berhasil dihapus!");
  }
}


function editBuku(identifier) {
  if (typeof identifier === 'undefined' || identifier === null || String(identifier).trim() === '') {
    alert('Identifier buku kosong. Tidak dapat mengedit.');
    return;
  }

  const key = String(identifier).trim().toLowerCase();
  let arr = load(STORAGE_KEYS.books) || [];

  const idx = arr.findIndex(b => {
    const ni = String(b.noInventaris || b.NoInventaris || '').trim().toLowerCase();
    const kd = String(b.kode || '').trim().toLowerCase();
    const id = String(b.id || '').trim().toLowerCase();
    // juga cocokkan dengan judul kalau perlu (opsional)
    return ni === key || kd === key || id === key;
  });

  if (idx === -1) {
    alert('Buku tidak ditemukan untuk identifier: ' + identifier);
    console.log('Cari identifier:', identifier);
    console.log('Contoh beberapa buku:', arr.slice(0,5));
    return;
  }

  const buku = arr[idx];

  // contoh edit beberapa field singkat (ubah sesuai kebutuhan)
  const newJudul = prompt('Ubah Judul:', buku.judul || '');
  if (newJudul === null) return; // batal
  buku.judul = newJudul;

  const newPengarang = prompt('Ubah Pengarang:', buku.pengarang || '');
  if (newPengarang === null) return;
  buku.pengarang = newPengarang;

  const newTahun = prompt('Ubah Tahun:', buku.tahun || '');
  if (newTahun === null) return;
  buku.tahun = newTahun;

  const newJumlah = prompt('Ubah Jumlah:', buku.jumlah || '');
  if (newJumlah === null) return;
  buku.jumlah = newJumlah;

  // jika perlu, perbolehkan mengubah noInventaris juga (hati-hati duplikat)
  const newNoInv = prompt('Ubah No Inventaris:', buku.noInventaris || buku.NoInventaris || '');
  if (newNoInv === null) return;
  buku.noInventaris = newNoInv;

  // simpan kembali
  arr[idx] = buku;
  save(STORAGE_KEYS.books, arr);

  renderBooks();
  alert('Data buku berhasil diperbarui!');
}

function hapusLoan(index) {
  let loans = load(STORAGE_KEYS.loans) || [];
  if (confirm("Yakin ingin menghapus data peminjaman ini?")) {
    loans.splice(index, 1); // hapus 1 item sesuai index
    save(STORAGE_KEYS.loans, loans);
    renderLoans(); // refresh tabel
  }
}

// Hapus satu anggota
function hapusAnggota(id) {
  if (confirm("Yakin ingin menghapus anggota dengan ID " + id + "?")) {
    let arr = load(STORAGE_KEYS.members) || [];
    // buang anggota dengan id tersebut
    arr = arr.filter(m => m.id !== id);
    // simpan kembali ke localStorage
    save(STORAGE_KEYS.members, arr);
    // render ulang tabel anggota ke halaman 1
    renderMembers(1);
    alert("Anggota berhasil dihapus!");
  }
}

// Hapus semua anggota
function hapusSemuaAnggota() {
  if (confirm("Apakah Anda yakin ingin menghapus semua data anggota?")) {
    // kosongkan array anggota
    save(STORAGE_KEYS.members, []);
    // render ulang tabel anggota supaya kosong
    renderMembers(1);
    alert("Semua data anggota berhasil dihapus!");
  }
}

// Edit anggota
function editAnggota(id) {
  let arr = load(STORAGE_KEYS.members) || [];
  const index = arr.findIndex(m => m.id === id);
  if (index === -1) return;

  const anggota = arr[index];
  const namaBaru = prompt("Ubah Nama Anggota:", anggota.nama || "");
  if (namaBaru === null) return;

  arr[index].nama = namaBaru;
  save(STORAGE_KEYS.members, arr);
  renderMembers(1);
  alert("Anggota berhasil diperbarui!");
}



// Hapus semua peminjaman
function hapusSemuaPeminjaman() {
  if (confirm("Apakah Anda yakin ingin menghapus semua data peminjaman?")) {
    save(STORAGE_KEYS.loans, []);
    renderLoans(); renderHistory(); renderReports(); updateCharts();
    alert("Semua data peminjaman berhasil dihapus!");
  }
}



// Hapus semua pengembalian
function hapusSemuaPengembalian() {
  if (confirm("Apakah Anda yakin ingin menghapus semua data pengembalian?")) {
    save(STORAGE_KEYS.returns, []);
    renderReturns(); renderHistory(); renderReports(); updateCharts();
    alert("Semua data pengembalian berhasil dihapus!");
  }
}

// Hapus semua reservasi
function hapusSemuaReservasi() {
  if (confirm("Apakah Anda yakin ingin menghapus semua data reservasi?")) {
    save(STORAGE_KEYS.reservations, []);
    alert("Semua data reservasi berhasil dihapus!");
  }
}

// Hapus semua perpanjangan
function hapusSemuaPerpanjangan() {
  if (confirm("Apakah Anda yakin ingin menghapus semua data perpanjangan?")) {
    save(STORAGE_KEYS.extensions, []);
    alert("Semua data perpanjangan berhasil dihapus!");
  }
}

// Hapus semua riwayat (gabungan loans + returns)
function hapusSemuaRiwayat() {
  if (confirm("Apakah Anda yakin ingin menghapus semua data riwayat (peminjaman & pengembalian)?")) {
    save(STORAGE_KEYS.loans, []);
    save(STORAGE_KEYS.returns, []);
    renderHistory(); renderReports(); updateCharts();
    alert("Semua data riwayat berhasil dihapus!");
  }
}


