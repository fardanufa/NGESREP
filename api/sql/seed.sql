-- Seed satu kali untuk database baru: 5 kategori, 15 resep, 6 tips.
-- Jangan jalankan ulang; skrip ini tidak idempoten.
-- Jalankan setelah schema.sql di Supabase SQL Editor.

insert into categories (name) values
  ('Sarapan'),
  ('Lauk Hemat'),
  ('Khas Semarang'),
  ('Camilan'),
  ('Minuman');

insert into recipes (name, description, ingredients, steps, image_url, cost_estimate, cook_time, category_id) values

('Tahu Gimbal Semarang',
 'Kuliner khas Semarang berisi tahu goreng, gimbal udang, kol segar, dan bumbu kacang petis yang gurih manis. Porsinya pas untuk makan siang bersama teman kos.',
 $$2 buah tahu putih, potong dadu
4 sdm tepung terigu
50 gram udang kecil, cuci bersih
1 genggam kol, rajang halus
1 genggam tauge, rebus sebentar
1 butir telur, rebus lalu belah dua
3 sdm kacang tanah goreng, tumbuk
1 sdm petis udang
2 sdm kecap manis
1 siung bawang putih
3 buah cabai rawit (sesuai selera)
Minyak goreng secukupnya$$,
 $$Goreng tahu dadu di minyak panas sampai berkulit keemasan, lalu tiriskan.
Campur tepung terigu, udang kecil, sedikit garam, dan air secukupnya. Goreng sesendok demi sesendok sampai gimbal krispi, lalu tiriskan.
Ulek bawang putih, cabai, dan sedikit garam. Tambahkan kacang tanah, petis, kecap manis, dan air hangat sedikit demi sedikit sampai saus kental.
Tata tahu dan gimbal di piring, tambahkan kol dan tauge. Siram bumbu petis, lalu lengkapi dengan telur rebus.
Sajikan segera. Sisa bahan sebaiknya disimpan di wadah tertutup dalam kulkas dan dipanaskan kembali sebelum dimakan.$$,
 'images/tahu-gimbal.jpg', 12000, 30,
 (select id from categories where name = 'Khas Semarang')),

('Soto Ayam Khas Semarang',
 'Soto kuah bening dengan suwiran ayam, bihun, dan taburan bawang goreng. Bumbu dasarnya sederhana sehingga bisa dipakai untuk kuah lain.',
 $$250 gram ayam (dada atau paha)
1,5 liter air
1 batang serai, memarkan
2 lembar daun salam
2 lembar daun jeruk
3 siung bawang merah
2 siung bawang putih
1 sdt merica butir
1 sdt garam
100 gram bihun, rendam air hangat
1 genggam kol, rajang
1 batang seledri, rajang
2 sdm bawang goreng$$,
 $$Rebus ayam bersama air, serai, daun salam, dan daun jeruk sampai ayam matang, sekitar 20 menit.
Haluskan bawang merah, bawang putih, dan merica, lalu tumis sampai harum. Masukkan tumisan ke dalam kuah.
Tambahkan garam, masak lagi 5 menit, lalu angkat ayam dan suwir-suwir dagingnya.
Tata bihun, kol, dan ayam suwir di mangkuk, siram kuah panas, taburi seledri dan bawang goreng.
Kuah sisa bisa disimpan di wadah tertutup dan didihkan lagi sebelum disajikan.$$,
 'images/soto-ayam-semarang.jpg', 15000, 35,
 (select id from categories where name = 'Khas Semarang')),

('Lumpia Semarang Rumahan',
 'Lumpia isi rebung dan ayam dengan kulit siap pakai. Cocok dibuat sekaligus banyak untuk camilan atau bekal.',
 $$10 lembar kulit lumpia
150 gram ayam fillet, potong kecil
100 gram rebung, iris halus (bisa diganti wortel)
2 siung bawang putih, cincang
1 sdm saus tiram
1 sdt kecap manis
1/2 sdt merica bubuk
1 sdt tepung maizena, larutkan dengan sedikit air
Minyak goreng secukupnya$$,
 $$Tumis bawang putih sampai harum, masukkan ayam dan rebung, masak sampai ayam matang.
Bumbui dengan saus tiram, kecap manis, dan merica. Kentalkan dengan larutan maizena, angkat, lalu dinginkan.
Letakkan isian di kulit lumpia, lipat rapat, dan rekatkan ujungnya dengan sedikit air.
Goreng di minyak panas sampai keemasan, lalu tiriskan.
Lumpia yang belum digoreng bisa disimpan di wadah tertutup dalam freezer.$$,
 'images/lumpia-rumahan.jpg', 10000, 40,
 (select id from categories where name = 'Khas Semarang')),

('Nasi Ayam Semarang Sederhana',
 'Nasi dengan ayam kecap gurih dan kuah kaldu ringan. Bumbunya tidak banyak, tetapi rasanya tetap memuaskan.',
 $$2 porsi nasi putih
300 gram ayam, potong sesuai selera
3 siung bawang putih
2 siung bawang merah
2 sdm kecap manis
1 sdm saus tiram
1/2 sdt merica
1 batang daun bawang, rajang
1 sdt garam
200 ml air
Minyak untuk menumis$$,
 $$Tumis bawang merah dan bawang putih sampai harum.
Masukkan ayam, masak sampai berubah warna.
Tambahkan kecap manis, saus tiram, merica, garam, dan air. Masak sampai kuah menyusut dan ayam matang.
Taburi daun bawang, masak sebentar, lalu angkat.
Sajikan ayam bersama nasi hangat dan irisan timun bila ada.$$,
 'images/nasi-ayam.jpg', 14000, 40,
 (select id from categories where name = 'Khas Semarang')),

('Nasi Goreng Kos',
 'Nasi goreng sederhana dengan telur dan bumbu dapur sehari-hari. Cepat dibuat untuk sarapan sebelum kuliah.',
 $$1 porsi nasi putih (sebaiknya nasi sisa yang sudah didinginkan)
1 butir telur
2 siung bawang merah
1 siung bawang putih
1 sdm kecap manis
1/2 sdt garam
1/4 sdt merica
1 batang daun bawang, rajang
1 sdm minyak goreng$$,
 $$Tumis bawang merah dan bawang putih sampai harum.
Masukkan telur, orak-arik sampai setengah matang.
Masukkan nasi, kecap manis, garam, dan merica. Aduk rata dengan api besar.
Tambahkan daun bawang, aduk sebentar, lalu angkat.
Sajikan hangat. Nasi sisa sebaiknya tidak dibiarkan di suhu ruang lebih dari 2 jam.$$,
 'images/nasi-goreng-kos.jpg', 7000, 15,
 (select id from categories where name = 'Sarapan')),

('Mi Telur Kuah Sayur',
 'Mi kuah ringan berisi telur dan sayur. Cocok untuk makan malam cepat saat stok bahan tinggal sedikit.',
 $$1 keping mi telur
1 butir telur
1 genggam sayur (sawi atau kol)
1 batang daun bawang
1 siung bawang putih, cincang
500 ml air
1/2 sdt garam
1/4 sdt merica
1 sdt minyak untuk menumis$$,
 $$Tumis bawang putih sampai harum, tuang air, lalu didihkan.
Masukkan mi dan sayur, masak sampai mi lunak.
Ceplok telur di kuah, masak sampai matang sesuai selera.
Bumbui garam dan merica, taburi daun bawang.
Sajikan segera agar mi tidak terlalu lembek.$$,
 'images/mi-telur-sayur.jpg', 6000, 10,
 (select id from categories where name = 'Sarapan')),

('Bubur Ayam Rice Cooker',
 'Bubur nasi dengan ayam suwir yang dimasak memakai rice cooker. Praktis untuk sarapan tanpa harus mengaduk terus.',
 $$100 gram beras, cuci bersih
1 liter air
100 gram ayam, rebus lalu suwir
1 siung bawang putih, cincang
1/2 sdt garam
1/4 sdt merica
1 batang seledri, rajang
1 sdm bawang goreng
Kecap manis dan kerupuk (opsional)$$,
 $$Masukkan beras dan air ke panci rice cooker, nyalakan mode cook.
Setelah mendidih, aduk sesekali agar tidak lengket di dasar.
Masukkan ayam suwir, bawang putih, garam, dan merica. Lanjutkan memasak sampai beras menjadi bubur.
Jika terlalu kental, tambahkan air panas sedikit demi sedikit.
Sajikan dengan seledri, bawang goreng, kecap manis, dan kerupuk.$$,
 'images/bubur-ayam-rice-cooker.jpg', 9000, 30,
 (select id from categories where name = 'Sarapan')),

('Telur Dadar Gulung Sayur',
 'Telur dadar tebal berisi wortel dan daun bawang, digulung lalu dipotong. Murah dan cepat untuk lauk makan siang.',
 $$3 butir telur
1 buah wortel kecil, serut halus
1 batang daun bawang, rajang
2 sdm air
1/4 sdt garam
1/4 sdt merica
1 sdm minyak goreng$$,
 $$Kocok telur bersama air, garam, dan merica sampai rata.
Masukkan wortel dan daun bawang, aduk.
Panaskan minyak di wajan anti lengket, tuang adonan dan ratakan.
Masak dengan api kecil sampai bagian bawah matang, lalu gulung perlahan.
Potong-potong dan sajikan hangat.$$,
 'images/telur-dadar-gulung.jpg', 8000, 15,
 (select id from categories where name = 'Lauk Hemat')),

('Tumis Kangkung Terasi Pedas',
 'Tumis kangkung dengan terasi dan cabai. Cepat matang dan cocok dimakan bersama nasi hangat.',
 $$1 ikat kangkung, petik dan cuci bersih
3 buah cabai rawit, iris
2 siung bawang merah, iris
1 siung bawang putih, iris
1/2 sdt terasi bakar
1/2 sdt garam
1/4 sdt gula
50 ml air
1 sdm minyak untuk menumis$$,
 $$Panaskan minyak, tumis bawang merah, bawang putih, cabai, dan terasi sampai harum.
Masukkan kangkung, aduk cepat.
Tambahkan garam, gula, dan air, lalu tutup wajan sebentar.
Masak sampai kangkung layu tetapi masih hijau, sekitar 3 menit.
Angkat dan sajikan segera agar tidak terlalu lembek.$$,
 'images/tumis-kangkung.jpg', 6000, 10,
 (select id from categories where name = 'Lauk Hemat')),

('Tempe Orek Basah',
 'Tempe goreng yang dimasak lagi dengan kecap dan sedikit air. Rasanya manis gurih dan bisa disimpan beberapa hari di kulkas.',
 $$200 gram tempe, potong kecil
3 siung bawang merah, iris
1 siung bawang putih, iris
2 buah cabai merah, iris (sesuai selera)
2 sdm kecap manis
1 lembar daun salam
1/2 sdt garam
50 ml air
Minyak goreng secukupnya$$,
 $$Goreng tempe sampai setengah kering, angkat dan tiriskan.
Tumis bawang merah, bawang putih, cabai, dan daun salam sampai harum.
Masukkan tempe, kecap manis, garam, dan air.
Aduk sampai air menyusut dan bumbu meresap.
Simpan di wadah tertutup dan masukkan kulkas setelah dingin.$$,
 'images/tempe-orek.jpg', 5000, 20,
 (select id from categories where name = 'Lauk Hemat')),

('Sayur Sop Sederhana',
 'Sop bening berisi sayur dan bakso atau ayam. Kuahnya ringan dan bisa dipakai untuk beberapa kali makan.',
 $$1 buah wortel, potong bulat
1 buah kentang, potong dadu
1 genggam buncis, potong
1 genggam kol, potong kasar
5 butir bakso atau 100 gram ayam
1 batang seledri, ikat
2 siung bawang putih
1/2 sdt merica
1 sdt garam
1 liter air
1 sdm bawang goreng$$,
 $$Didihkan air, masukkan bawang putih yang sudah dihaluskan dan merica.
Masukkan wortel, kentang, dan bakso atau ayam, masak sampai setengah empuk.
Tambahkan buncis dan kol, masak sampai semua sayur matang.
Bumbui garam, masukkan seledri, lalu angkat.
Taburi bawang goreng sebelum disajikan.$$,
 'images/sayur-sop.jpg', 7000, 25,
 (select id from categories where name = 'Lauk Hemat')),

('Pisang Goreng Krispi',
 'Pisang goreng dengan lapisan tepung sederhana. Enak untuk camilan sore atau teman belajar.',
 $$5 buah pisang kepok atau pisang raja
100 gram tepung terigu
2 sdm tepung beras
1 sdm gula pasir
1/4 sdt garam
150 ml air
Minyak goreng secukupnya$$,
 $$Campur tepung terigu, tepung beras, gula, dan garam. Tuang air sedikit demi sedikit sampai adonan licin.
Kupas pisang, lalu celupkan ke adonan.
Goreng di minyak panas dengan api sedang sampai keemasan.
Angkat dan tiriskan di tisu dapur.
Paling enak dimakan hangat. Sisanya simpan di wadah terbuka agar tidak lembek.$$,
 'images/pisang-goreng.jpg', 6000, 20,
 (select id from categories where name = 'Camilan')),

('Wingko Babat Teflon',
 'Wingko babat versi teflon dari kelapa dan tepung ketan. Tidak perlu oven, cukup teflon anti lengket.',
 $$200 gram kelapa parut (sebaiknya kelapa agak muda)
150 gram tepung ketan
100 gram gula pasir
150 ml santan
1/4 sdt garam
1/2 sdt vanili (opsional)$$,
 $$Campur tepung ketan, gula, garam, dan vanili.
Masukkan kelapa parut dan santan, aduk sampai adonan bisa dipulung.
Panaskan teflon anti lengket dengan api kecil.
Tuang adonan, ratakan, lalu masak sampai kedua sisi kecokelatan dan bagian tengah tidak lengket.
Dinginkan sebelum dipotong agar tidak mudah hancur.$$,
 'images/wingko-teflon.jpg', 8000, 45,
 (select id from categories where name = 'Camilan')),

('Es Teh Lemon Madu',
 'Minuman segar dari teh, lemon, dan madu. Praktis dibuat untuk menemani makan siang.',
 $$1 kantong teh celup
200 ml air panas
1/2 buah lemon, peras
1 sdm madu (sesuai selera)
Es batu secukupnya$$,
 $$Seduh teh dengan air panas selama 3 sampai 5 menit, lalu angkat kantong teh.
Biarkan teh hangat, lalu tambahkan madu dan air perasan lemon.
Aduk rata, cicipi dan sesuaikan rasa.
Tuang ke gelas berisi es batu, sajikan segera.
Teh yang belum diberi lemon bisa disimpan di kulkas maksimal satu hari.$$,
 'images/es-teh-lemon.jpg', 4000, 5,
 (select id from categories where name = 'Minuman')),

('Wedang Jahe Serai',
 'Minuman hangat dari jahe dan serai. Cocok diminum saat cuaca dingin atau sore hari.',
 $$3 cm jahe, memarkan
1 batang serai, memarkan
2 sdm gula aren atau gula pasir
400 ml air
1 lembar daun pandan (opsional)$$,
 $$Didihkan air bersama jahe, serai, dan daun pandan.
Kecilkan api dan masak 5 menit agar rasanya keluar.
Tambahkan gula, aduk sampai larut.
Saring dan sajikan hangat.
Wedang bisa disimpan di termos atau kulkas lalu dihangatkan kembali.$$,
 'images/wedang-jahe.jpg', 4000, 10,
 (select id from categories where name = 'Minuman'));

insert into tips (title, content, highlight, image_url) values

('Cara Menyimpan Sayur Biar Awet di Kulkas Kosan',
 $$Sayur daun seperti kangkung, bayam, dan sawi biasanya lebih awet kalau tidak dicuci sebelum disimpan. Sisa air di permukaan daun memicu pembusukan, jadi cuci saat mau dimasak saja.

Bungkus sayur dengan tisu dapur atau kain bersih, lalu masukkan ke wadah tertutup. Tisu membantu menyerap embun dari kulkas. Periksa dan ganti tisu kalau sudah lembap.

Untuk cabai dan bawang, buang bagian yang sudah layu, lalu simpan di wadah beralas tisu kering. Simpan di bagian kulkas yang paling tidak dingin agar tidak mudah berjamur.$$,
 'Beli sayur dalam jumlah banyak biasanya lebih hemat. Bagi sayur ke porsi sekali masak, lalu simpan di wadah berbeda agar tidak semua ikut rusak saat satu bagian sudah layu.',
 'images/tips-sayur.jpg'),

('Masak Praktis Pakai Rice Cooker',
 $$Rice cooker bisa dipakai untuk lebih dari sekadar memasak nasi. Sup telur, tumis sayur, atau kukusan lauk bisa dibuat di dalamnya asalkan panci dan tutupnya bersih.

Masak berkuah dengan rice cooker sebaiknya tidak sampai penuh. Sisakan ruang sekitar sepertiga supaya tidak meluap saat mendidih.

Setelah selesai memasak, cabut colokan dan bersihkan bagian dalam panci setelah dingin. Jangan mencuci rice cooker saat masih panas.$$,
 null,
 'images/tips-rice-cooker.jpg'),

('Belanja Mingguan Hemat untuk Anak Kos',
 $$Menentukan menu seminggu lebih dulu membantu belanja lebih hemat. Tulis bahan yang dipakai di beberapa resep supaya tidak ada bahan yang terbuang.

Bahan pokok seperti beras, telur, dan minyak bisa dibeli dalam ukuran lebih besar jika penyimpanannya memadai. Untuk sayur, beli dalam jumlah yang habis dalam beberapa hari.

Sebelum belanja, cek stok di dapur dan kulkas. Daftar belanja yang ditulis berdasarkan isi kulkas biasanya lebih hemat daripada belanja berdasarkan keinginan.$$,
 null,
 'images/tips-belanja.jpg'),

('Bumbu Dasar Serbaguna',
 $$Bumbu dasar bisa menghemat waktu masak. Haluskan bawang merah, bawang putih, dan kemiri, lalu tumis sampai harum dan matang.

Simpan bumbu yang sudah ditumis di wadah tertutup, bagi per porsi sekali masak, lalu simpan di freezer. Ambil satu porsi saat akan memasak.

Bumbu yang disimpan harus benar-benar matang dan wadahnya bersih. Kalau muncul bau tidak biasa atau lapisan aneh, sebaiknya dibuang.$$,
 'Tumis bumbu sampai airnya benar-benar habis, lalu dinginkan sebelum disimpan. Bumbu yang masih basah lebih cepat berjamur.',
 'images/tips-bumbu.jpg'),

('Menyimpan Tahu dan Tempe Biar Lebih Awet',
 $$Tahu dan tempe cepat berubah rasa di suhu ruang. Setelah dibeli, sebaiknya langsung dipindahkan ke wadah bersih dan disimpan di kulkas.

Tahu bisa direndam air matang bersih di wadah tertutup, ganti airnya setiap hari. Tempe lebih baik dibungkus kertas atau plastik berlubang agar tidak lembap.

Kalau akan disimpan lebih lama, potong sesuai kebutuhan lalu simpan di freezer. Setelah dikeluarkan, masak sampai benar-benar matang dan jangan dibekukan ulang.$$,
 null,
 'images/tips-tahu-tempe.jpg'),

('Mengatur Kulkas Mini Kos',
 $$Kulkas mini ruangnya terbatas, jadi isi dan susun dengan sengaja. Letakkan makanan yang paling cepat rusak di area yang paling dingin.

Simpan bahan mentah di wadah tertutup dan taruh di bawah makanan matang supaya cairannya tidak menetes.

Bersihkan kulkas secara berkala, minimal sekali dua minggu. Buang bahan yang sudah tidak layak sebelum menambah stok baru.$$,
 'Jangan menyimpan makanan panas langsung di kulkas. Biarkan dulu di suhu ruang sebentar, karena makanan panas bisa menaikkan suhu kulkas dan membuat isi lain lebih cepat rusak.',
 'images/tips-kulkas.jpg');
