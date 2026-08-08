# BayiQ

Prototype aplikasi imunisasi anak dwibahasa (Indonesia/Inggris) — HTML, CSS, dan JavaScript murni, tanpa build step.

A bilingual (Indonesian/English) child immunization prototype — plain HTML, CSS, and JavaScript, no build step.

## Menjalankan / Running

Buka langsung `index.html` di browser, atau sajikan dengan server statis:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Fitur prototype / Prototype features

- **Autentikasi (mock)**: tombol "Lanjutkan dengan Google" (sekali klik) atau daftar/masuk dengan email. Sesi tersimpan di `localStorage`.
- **Multi anak**: tambah/ubah/hapus data anak (nama, tanggal lahir, jenis kelamin), berpindah antar anak.
- **Jadwal imunisasi interaktif 0–18 tahun**: replika tabel IDAI 2024 (`docs/imunisasi/jadwal-vaksin.jpg`) — 18 vaksin × 26 kolom umur dengan warna per vaksin. Sel bisa di-hover (tooltip status) dan di-klik.
- **Pencatatan vaksin**: tanggal pemberian, merk/tipe vaksin, dan catatan per dosis; status sel otomatis (selesai / jatuh tempo / terlambat / akan datang) berdasarkan umur anak.
- **Penjelasan vaksin**: ringkasan manfaat tiap vaksin dari `docs/imunisasi/penjelasan-vaksin.jpg`, dwibahasa.
- **Notifikasi in-app**: lonceng dengan badge berisi dosis terlambat, jatuh tempo, dan akan datang untuk semua anak; klik item membuka detail dosis.
- **Ganti bahasa**: tombol ID ⇄ EN di header.

## Struktur / Structure

```
index.html      — shell aplikasi (auth + tampilan utama + modal)
css/style.css   — gaya, grid jadwal (kolom label sticky), status warna
js/data.js      — data jadwal (umur, vaksin, dosis, warna, penjelasan) + string i18n
js/i18n.js      — ganti bahasa & helper terjemahan
js/app.js       — auth, anak, render tabel, modal, catatan, notifikasi
docs/imunisasi/ — gambar referensi jadwal & penjelasan vaksin
```

Data disimpan seluruhnya di `localStorage` browser (kunci berprefix `bq_`). Hapus lewat DevTools → Application → Local Storage untuk mereset.
