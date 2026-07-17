# ClaudeDeck Desktop — Ürün Gereksinimleri Dokümanı (PRD)

## 1. Doküman Bilgileri

- **Ürün adı:** ClaudeDeck Desktop
- **Ürün türü:** Windows masaüstü Claude Code kontrol uygulaması
- **Hedef platform:** Windows 10 ve Windows 11
- **Önerilen teknoloji:** Tauri 2 + React + TypeScript + Rust + xterm.js
- **Belge sürümü:** 1.0
- **Durum:** Geliştirmeye hazır ürün tanımı

---

## 2. Ürün Vizyonu

ClaudeDeck Desktop, fiziksel bir masaüstü kontrol cihazının görünümünü dijital ortamda birebir yaşatan, Claude Code kullanımını fare, klavye ve sesli komutlarla kolaylaştıran bir Windows uygulamasıdır.

Uygulama; metal gövdeli, arkadan aydınlatmalı tuşlara, bilgi ekranına, model seçim düğmesine, LOW/HIGH çalışma seviyesi anahtarına ve kablo yerine konumlandırılmış mini telsiz modülüne sahip olacaktır.

Tasarımda temel hedef, mevcut cihaz görünümünü değiştirmeden onu tamamen işlevsel bir masaüstü yazılımına dönüştürmektir.

---

## 3. Temel Amaçlar

1. Claude Code işlemlerini tek bir görsel kontrol panelinden yönetmek.
2. Kullanıcının terminal komutlarını ezberleme ihtiyacını azaltmak.
3. Tüm temel işlemleri hem fare hem klavye ile çalıştırmak.
4. Klavye kısayollarını doğrudan ilgili tuşların üzerinde göstermek.
5. Claude Code durumlarını cihaz ekranına gerçek zamanlı yansıtmak.
6. Sesli komutlar için mini telsiz biçiminde bir bas-konuş arayüzü sağlamak.
7. Terminal, sohbet, görev durumu ve proje seçimini tek uygulamada birleştirmek.
8. Uygulamayı düşük sistem kaynağı tüketen, hızlı açılan ve Windows ile uyumlu bir masaüstü aracı olarak sunmak.

---

## 4. Hedef Kullanıcılar

- Claude Code kullanan yazılım geliştiriciler
- Terminal komutlarını görsel arayüz üzerinden yönetmek isteyen kullanıcılar
- Birden fazla projede çalışan geliştiriciler
- Kodlama sırasında sesli komut kullanmak isteyen kişiler
- Claude Code model, görev ve çalışma seviyesini hızlı değiştirmek isteyen kullanıcılar
- Fiziksel kontrol paneli hissi veren masaüstü araçlarını tercih eden kullanıcılar

---

## 5. Ürün Kapsamı

### 5.1 Kapsama dahil

- Claude Code sürecini başlatma ve kapatma
- Claude Code terminalini uygulama içinde çalıştırma
- Proje klasörü seçme
- Model değiştirme
- LOW/HIGH çalışma seviyesi seçme
- Güncelleme kontrolü
- Ayar ve proje eşitleme
- Son komutu yeniden çalıştırma
- Son değişiklikleri güvenli biçimde geri alma
- Sohbet panelini açma
- Terminal panelini açma
- Mini telsiz üzerinden sesli komut gönderme
- Claude yanıtlarını sesli okuma
- Klavye ve fare desteği
- Sistem tepsisi
- Kompakt telsiz modu
- Gerçek zamanlı durum ekranı
- Uygulama içi günlük kayıtları
- Windows kurulum paketi

### 5.2 İlk sürümde kapsam dışı

- macOS ve Linux desteği
- Mobil uygulama
- Bulut tabanlı kullanıcı hesabı
- Takım yönetimi
- Uzaktan başka bilgisayarı kontrol etme
- Fiziksel USB donanım üretimi
- Çoklu kullanıcı oturumu
- Claude dışındaki ajanların tam entegrasyonu

---

## 6. Ana Kullanım Senaryosu

1. Kullanıcı uygulamayı açar.
2. Cihaz ekranında `STATUS: OFF` görünür.
3. Kullanıcı POWER tuşuna tıklar veya `F1` tuşuna basar.
4. Uygulama Claude Code kullanılabilirliğini kontrol eder.
5. Claude Code süreci başlatılır.
6. Ekranda sırasıyla:
   - `STATUS: STARTING`
   - `STATUS: ON`
7. Kullanıcı proje klasörü seçer.
8. Model düğmesiyle modeli seçer.
9. LOW/HIGH çalışma seviyesini belirler.
10. İstemini sohbet panelinden, terminalden veya mini telsizden gönderir.
11. Claude Code çıktıları terminal paneline ve cihaz ekranına yansır.
12. Görev tamamlandığında ekran:
   - `TASK: COMPLETED`
   - `PROGRESS: 100%`
13. Kullanıcı değişiklikleri kabul eder, yeniden dener veya geri alır.

---

## 7. Görsel Tasarım İlkeleri

### 7.1 Ana tasarım

Uygulama, referans cihazın genel görünümünü korumalıdır:

- Fırçalanmış alüminyum ön yüz
- Koyu gri veya siyah alt gövde
- Hafif eğimli masaüstü cihaz formu
- Üst bölümde yatay durum ekranı
- Arkadan aydınlatmalı tuşlar
- Sağ üstte döner model düğmesi
- Sol tarafta LOW/HIGH anahtarı
- Kablo yerine mini telsiz
- Ahşap masa veya şeffaf pencere seçeneği
- Gerçekçi gölgeler
- Fiziksel tuş basma animasyonu
- Beyaz, mavi, yeşil ve kırmızı ışık vurguları

### 7.2 Tasarım bozulmaması gereken unsurlar

- Tuşların ana yerleşimi
- Cihazın yatay oranı
- Üst ekranın yeri
- Döner düğmenin sağ üst konumu
- LOW/HIGH anahtarının sol konumu
- Büyük merkez tuş
- Metalik yüzey karakteri
- Minimal endüstriyel görünüm

### 7.3 Ölçeklenebilirlik

Arayüz aşağıdaki pencere boyutlarına uyum sağlamalıdır:

- Minimum: 900 × 520
- Önerilen: 1200 × 720
- Geniş: 1600 × 900
- Tam ekran
- Kompakt telsiz modu: yaklaşık 260 × 420

---

## 8. Tuşlar ve Üzerlerinde Gösterilecek Kısayollar

Her fiziksel görünümlü tuşun üstünde ana işlev adı, altında veya sağ alt köşesinde klavye kısayolu bulunmalıdır.

Kısayollar tuş tasarımına gömülü görünmeli, sonradan eklenmiş etiket gibi durmamalıdır.

### 8.1 POWER

- **Ana etiket:** POWER
- **Kısayol etiketi:** F1
- **Görev:** Claude Code sürecini açar veya kapatır.
- **Durumlar:**
  - OFF
  - STARTING
  - ON
  - STOPPING
  - ERROR
- **Uzun basma:** Zorla sonlandırma onayı

Tuş görünümü:

```text
POWER
F1
```

### 8.2 UPDATE

- **Ana etiket:** UPDATE
- **Kısayol etiketi:** F4
- **Görev:** Claude Code ve uygulama güncellemelerini kontrol eder.
- **Durumlar:**
  - READY
  - CHECKING
  - AVAILABLE
  - DOWNLOADING
  - INSTALLING
  - RESTART REQUIRED
  - FAILED

Tuş görünümü:

```text
UPDATE
F4
```

### 8.3 SYNC

- **Ana etiket:** SYNC
- **Kısayol etiketi:** F5
- **Görev:** Proje, model, ayar, skill, MCP ve profil bilgilerini eşitler.
- **Renk:** Kırmızı vurgulu
- **Başarılı durumda:** Kısa yeşil ışık animasyonu
- **Hata durumunda:** Kırmızı yanıp sönme

Tuş görünümü:

```text
SYNC
F5
```

### 8.4 RUN CLAUDE CODE

- **Ana etiket:** RUN CLAUDE CODE
- **Kısayol etiketi:** CTRL+ENTER
- **Görev:** Seçili proje klasöründe Claude Code oturumunu çalıştırır.
- **Proje seçilmemişse:** Klasör seçme penceresi açılır.
- **Oturum açıksa:** Aktif terminale odaklanır.

Tuş görünümü:

```text
RUN CLAUDE CODE
CTRL+ENTER
```

### 8.5 DISCARD

- **Ana etiket:** DISCARD
- **Kısayol etiketi:** DELETE
- **Görev:** Son değişiklikleri geri alma sürecini başlatır.
- **Güvenlik:** Doğrudan işlem yapmaz; etkilenecek dosyaları gösterir.
- **Onay seçenekleri:**
  - İptal
  - Seçili dosyaları geri al
  - Tüm son değişiklikleri geri al

Tuş görünümü:

```text
DISCARD
DEL
```

### 8.6 RETRY

- **Ana etiket:** RETRY
- **Kısayol etiketi:** CTRL+R
- **Görev:** Son istemi veya başarısız komutu tekrar çalıştırır.
- **Koruma:** Aynı komut çalışıyorsa ikinci kez başlatmaz.

Tuş görünümü:

```text
RETRY
CTRL+R
```

### 8.7 MİKROFON

- **Ana simge:** Mikrofon
- **Kısayol etiketi:** V HOLD
- **Görev:** Basılı tutarak konuşmayı başlatır.
- **Alternatif kısayol:** CTRL+M ile mikrofon aç/kapat
- **Durumlar:**
  - IDLE
  - LISTENING
  - TRANSCRIBING
  - SENDING
  - ERROR

Tuş görünümü:

```text
🎙
V HOLD
```

### 8.8 ENTER

- **Ana etiket:** ENTER
- **Kısayol etiketi:** ENTER
- **Görev:** Aktif terminale Enter tuşu gönderir.

Tuş görünümü:

```text
ENTER
↵
```

### 8.9 OPEN CHAT

- **Ana etiket:** OPEN CHAT
- **Kısayol etiketi:** CTRL+SHIFT+C
- **Görev:** Sağ taraftan açılan sohbet panelini gösterir veya gizler.

Tuş görünümü:

```text
OPEN CHAT
CTRL+SHIFT+C
```

### 8.10 MODEL SWITCHER

- **Ana etiket:** MODEL SWITCHER
- **Kısayol etiketi:** F3
- **Kontrol biçimleri:**
  - Fare tekerleği
  - Tıklayıp sürükleme
  - F3 ile sıradaki modele geçme
  - SHIFT+F3 ile önceki modele dönme
- **Model seçenekleri:** Uygulama çalışırken Claude Code ortamından dinamik okunmalıdır.
- **Varsayılan gösterim:**
  - DEFAULT
  - HAIKU
  - SONNET
  - OPUS

### 8.11 MODEL LOW/HIGH

- **Ana etiket:** MODEL LOW/HIGH
- **Kısayol etiketi:** F2
- **Görev:** Çalışma yoğunluğu profilini değiştirir.
- **Fare kontrolü:** Yukarı ve aşağı sürükleme
- **Klavye kontrolü:** F2

---

## 9. Kısayol Sistemi

### 9.1 Varsayılan kısayollar

| İşlem | Kısayol |
|---|---|
| Claude Code aç/kapat | F1 |
| LOW/HIGH değiştir | F2 |
| Model değiştir | F3 |
| Güncelleme kontrol et | F4 |
| Senkronize et | F5 |
| Claude Code çalıştır | Ctrl+Enter |
| Mikrofon bas-konuş | V basılı tut |
| Mikrofon aç/kapat | Ctrl+M |
| Yeniden dene | Ctrl+R |
| Son değişiklikleri geri al | Delete |
| Sohbet paneli | Ctrl+Shift+C |
| Terminal paneli | Ctrl+T |
| Proje seç | Ctrl+O |
| Ayarlar | Ctrl+, |
| Kompakt telsiz modu | Ctrl+Shift+M |
| Uygulamayı küçült | Ctrl+Shift+H |
| Görevi durdur | Esc |
| Önceki model | Shift+F3 |
| Sonraki model | F3 |

### 9.2 Kısayol özelleştirme

Ayarlar ekranında kullanıcı:

- Kısayolları değiştirebilir.
- Çakışan kısayolları görebilir.
- Varsayılan ayarlara dönebilir.
- Genel sistem kısayollarını açıp kapatabilir.
- Uygulama odakta değilken çalışacak tuşları belirleyebilir.

### 9.3 Kısayol doğrulama

- Aynı kısayol iki işleme atanamaz.
- Windows sistem kısayollarıyla çakışma halinde uyarı gösterilir.
- Sadece değiştirici tuşlardan oluşan kısayollar kabul edilmez.
- `Ctrl+Alt+Delete` gibi sistem tarafından ayrılmış kombinasyonlar engellenir.

---

## 10. Üst Durum Ekranı

### 10.1 Ekran içeriği

Ekran iki ana satır ve bir ilerleme çubuğundan oluşmalıdır.

Örnek:

```text
TASK: CODE REFACTOR       STATUS: ON
MODEL: SONNET   LEVEL: HIGH   UPDATE: READY
████████████████░░░░ 78%
```

### 10.2 Gösterilecek bilgiler

- Aktif görev
- Claude Code durumu
- Aktif model
- LOW/HIGH seviyesi
- Güncelleme durumu
- İlerleme yüzdesi
- Aktif proje adı
- Sesli komut durumu
- Hata kodu
- İzin bekleme durumu

### 10.3 Ekran durumları

#### Kapalı

```text
TASK: IDLE               STATUS: OFF
MODEL: DEFAULT   LEVEL: LOW   UPDATE: READY
```

#### Başlatılıyor

```text
TASK: STARTING CLAUDE    STATUS: STARTING
MODEL: SONNET   LEVEL: HIGH   UPDATE: READY
```

#### Çalışıyor

```text
TASK: REFACTORING        STATUS: WORKING
MODEL: SONNET   LEVEL: HIGH   PROGRESS: 60%
```

#### Kullanıcı izni bekliyor

```text
TASK: PERMISSION         STATUS: WAITING
ACTION REQUIRED: OPEN CHAT
```

#### Hata

```text
TASK: FAILED             STATUS: ERROR
ERROR: PROCESS EXIT 1
```

#### Güncelleme

```text
TASK: UPDATING           STATUS: BUSY
UPDATE: INSTALLING 65%
```

---

## 11. Mini Telsiz Modülü

### 11.1 Konum

Kablo yerine cihazın üst veya sol tarafında küçük masaüstü telsiz modülü bulunacaktır.

### 11.2 Görsel özellikler

- Koyu gri gövde
- Küçük anten
- Üstte durum LED'i
- Küçük monokrom ekran
- Büyük PUSH TO TALK düğmesi
- Ses seviyesi göstergesi
- Hoparlör ızgarası
- Mikrofon açıklığı

### 11.3 Telsiz ekranı

Örnek durumlar:

```text
CLAUDE RADIO
CONNECTED
```

```text
LISTENING...
```

```text
TRANSCRIBING...
```

```text
CLAUDE WORKING
```

```text
SPEAKING...
```

### 11.4 Fare kontrolü

- Telsiz düğmesine basılı tutunca kayıt başlar.
- Fare bırakılınca kayıt tamamlanır.
- Sağ tık ile kayıt iptal edilir.
- Tekerlek ile ses seviyesi değiştirilir.

### 11.5 Klavye kontrolü

- `V` basılı tut: konuş
- `V` bırak: gönder
- `Esc`: kaydı iptal et
- `Ctrl+M`: mikrofonu sessize al
- `Ctrl+Shift+M`: kompakt telsiz modu

### 11.6 Ses işleme akışı

```text
Mikrofon
→ Ses yakalama
→ Gürültü azaltma
→ Konuşmadan metne dönüştürme
→ Metni önizleme
→ Claude Code'a gönderme
→ Yanıtı alma
→ Metinden sese dönüştürme
→ Telsiz hoparlöründen oynatma
```

### 11.7 Ses motorları

İlk sürümde desteklenebilecek seçenekler:

- Windows Speech Recognition
- Windows SAPI TTS
- Yerel Whisper modeli
- Kullanıcının ekleyeceği harici STT servisi
- Kullanıcının ekleyeceği harici TTS servisi

### 11.8 Gizlilik

- Ses kayıtları varsayılan olarak diske kaydedilmez.
- Yerel STT seçeneği bulunur.
- Harici servis kullanıldığında kullanıcı bilgilendirilir.
- Mikrofon açıkken görünür durum ışığı zorunludur.
- Arka planda izinsiz kayıt yapılamaz.

---

## 12. Terminal Paneli

### 12.1 Genel özellikler

- xterm.js tabanlı terminal
- ANSI renk desteği
- Kopyala ve yapıştır
- Arama
- Font boyutu değiştirme
- Tam ekran terminal
- Terminal geçmişi
- Hata çıktılarının vurgulanması
- Otomatik aşağı kaydırma
- Çok satırlı giriş desteği

### 12.2 Terminal bağlantısı

Claude Code etkileşimli terminal uygulaması olduğu için normal process çıktısı yerine PTY kullanılmalıdır.

Önerilen yapı:

- Frontend: xterm.js
- Tauri backend: Rust
- PTY: portable-pty veya ayrı node-pty sidecar
- Süreç: Claude Code CLI
- Mesajlaşma: Tauri event sistemi

### 12.3 Terminal durumları

- Disconnected
- Starting
- Connected
- Busy
- Waiting for input
- Permission required
- Completed
- Failed
- Terminated

---

## 13. Sohbet Paneli

### 13.1 Yerleşim

- Sağdan kayan panel
- Pencere genişliğinin yaklaşık %35'i
- İstenirse ayrılabilir pencere
- Cihaz görünümünü kapatmadan kullanılabilir

### 13.2 Özellikler

- Kullanıcı mesajları
- Claude yanıtları
- Kod blokları
- Dosya referansları
- Kopyalama düğmesi
- Tekrar gönderme
- Mesaj düzenleme
- Göreve dönüştürme
- Terminal çıktısına gitme
- Konuşarak mesaj gönderme

### 13.3 Mesaj durumları

- Taslak
- Gönderiliyor
- İşleniyor
- Tamamlandı
- Hata
- İzin bekliyor

---

## 14. LOW ve HIGH Profilleri

### 14.1 LOW profil

Amaç:

- Hızlı görevler
- Küçük kod değişiklikleri
- Düşük maliyet
- Daha az araç kullanımı
- Kısa açıklama

Önerilen davranış:

- Sınırlı dosya taraması
- Hızlı yanıt
- Testleri sadece gerekli olduğunda çalıştırma
- Kısa özet
- Kullanıcı onayını daha sık isteme

### 14.2 HIGH profil

Amaç:

- Kapsamlı analiz
- Büyük refactor
- Birden çok dosya
- Test ve doğrulama
- Daha ayrıntılı raporlama

Önerilen davranış:

- Proje yapısını inceleme
- İlgili testleri çalıştırma
- Hata senaryolarını değerlendirme
- Değişiklik sonrası doğrulama
- Ayrıntılı sonuç raporu

### 14.3 Profil ayarları

Kullanıcı LOW ve HIGH profillerini düzenleyebilmelidir:

- Sistem istemi eki
- Maksimum görev süresi
- Test çalıştırma davranışı
- Dosya tarama sınırı
- Onay modu
- Çıktı ayrıntı seviyesi
- Otomatik commit davranışı
- TTS açık/kapalı

---

## 15. Model Yönetimi

### 15.1 Model seçimi

Model düğmesi şu yöntemlerle kontrol edilir:

- Fare tekerleği
- Tıklayıp sürükleme
- F3
- Shift+F3
- Açılır model listesi

### 15.2 Dinamik model listesi

Model listesi uygulamaya sabit yazılmamalıdır.

Uygulama:

1. Claude Code sürümünü kontrol eder.
2. Mevcut model seçme seçeneklerini okur.
3. Kullanıcının yapılandırmasını inceler.
4. Desteklenen modelleri arayüze yansıtır.
5. Kullanılamayan modeli seçime kapatır.

### 15.3 Model değişimi

- Yeni oturumdan önce model seçilebilir.
- Aktif oturum model değişimini destekliyorsa anında uygulanır.
- Desteklemiyorsa kullanıcıya yeniden başlatma uyarısı gösterilir.
- Model değiştiğinde ekran anında güncellenir.

---

## 16. Güncelleme Sistemi

### 16.1 Uygulama güncellemesi

- Tauri updater
- İmzalı güncelleme paketi
- Sürüm notları
- İndirme yüzdesi
- Kurulum onayı
- Otomatik yeniden başlatma seçeneği

### 16.2 Claude Code güncellemesi

- Yüklü sürümü tespit etme
- Yeni sürüm kontrolü
- Kullanıcının kurulum yöntemine uygun güncelleme
- Başarısız güncellemede geri alma
- Güncelleme günlüğü

### 16.3 Güvenlik

- Güncelleme kaynağı doğrulanmalıdır.
- Paket bütünlüğü kontrol edilmelidir.
- Kullanıcı onayı olmadan yönetici yetkisi istenmemelidir.
- Güncelleme sırasında aktif görev varsa önce uyarı verilmelidir.

---

## 17. Senkronizasyon

SYNC düğmesi aşağıdaki bileşenleri eşitleyebilir:

- Aktif proje
- Son kullanılan projeler
- Model ayarı
- LOW/HIGH profilleri
- Claude Code ayarları
- Kullanıcı komutları
- Skill klasörleri
- MCP yapılandırmaları
- Hook yapılandırmaları
- Kısayollar
- Tema ayarları
- Ses ayarları

### 17.1 Senkronizasyon hedefleri

İlk sürüm:

- Yerel uygulama ayarları
- Claude Code yerel yapılandırması
- Proje bazlı ayarlar

Gelecek sürüm:

- Şifreli bulut eşitleme
- Birden fazla bilgisayar
- Takım profilleri

---

## 18. Değişiklikleri Geri Alma

DISCARD düğmesi güvenli çalışmalıdır.

### 18.1 Ön kontrol

- Git deposu var mı?
- Çalışma alanında önceden var olan değişiklikler var mı?
- Claude oturumu hangi dosyaları değiştirdi?
- Dosyalar kaydedilmiş mi?
- Yeni oluşturulan dosyalar var mı?

### 18.2 Geri alma ekranı

Gösterilecek bilgiler:

- Değişen dosya sayısı
- Yeni dosya sayısı
- Silinen dosya sayısı
- Satır farkları
- Son işlem zamanı
- Geri alınacak görev adı

### 18.3 Güvenlik kuralları

- `git reset --hard` varsayılan yöntem olmamalıdır.
- Kullanıcının önceden var olan değişiklikleri korunmalıdır.
- Claude oturumundan önce snapshot alınmalıdır.
- Geri alma öncesi ikinci snapshot oluşturulmalıdır.
- İşlem geri döndürülebilir olmalıdır.

---

## 19. Proje Yönetimi

### 19.1 Proje seçme

- Ctrl+O
- Son projeler listesi
- Sürükle-bırak
- Klasörü uygulama simgesine bırakma
- Windows Explorer sağ tık menüsü

### 19.2 Proje kartı

Gösterilecek bilgiler:

- Proje adı
- Yol
- Git dalı
- Son açılma zamanı
- Claude ayarları
- Varsayılan model
- Varsayılan LOW/HIGH profili
- Son görev

### 19.3 Güvenilir proje

Kullanıcı ilk kez proje açtığında:

- Klasöre güveniyor musunuz?
- Claude Code komut çalıştırabilir.
- Dosyaları değiştirebilir.
- Proje hook'ları çalışabilir.

---

## 20. Uygulama Modları

### 20.1 Cihaz modu

- Sadece ana cihaz görünümü
- Terminal ve sohbet kapalı
- En temiz görünüm

### 20.2 Cihaz + terminal

- Cihaz üstte
- Terminal altta
- Yükseklik kullanıcı tarafından değiştirilebilir

### 20.3 Cihaz + sohbet

- Cihaz solda
- Sohbet sağda

### 20.4 Tam çalışma alanı

- Cihaz üst bölüm
- Terminal alt bölüm
- Sohbet sağ panel
- Görev geçmişi sol panel

### 20.5 Kompakt telsiz

- Küçük her zaman üstte pencere
- Sadece telsiz
- Bas-konuş
- Claude durum ışığı
- Son yanıt özeti

---

## 21. Sistem Tepsisi

Tepsi menüsü:

- ClaudeDeck'i aç
- Claude Code başlat
- Claude Code durdur
- Bas-konuş
- Son projeyi aç
- Sohbeti aç
- Sessize al
- Her zaman üstte
- Ayarlar
- Çıkış

---

## 22. Bildirimler

Windows bildirimleri şu durumlarda gösterilebilir:

- Görev tamamlandı
- İzin gerekiyor
- Hata oluştu
- Güncelleme hazır
- Claude Code bağlantısı kesildi
- Uzun görev tamamlandı
- Sesli yanıt hazır

Bildirimler ayarlardan kapatılabilir.

---

## 23. Ayarlar

### 23.1 Genel

- Windows ile başlat
- Sistem tepsisinde çalış
- Kapanınca tepsiye küçült
- Her zaman üstte
- Dil
- Ölçek
- Animasyon seviyesi

### 23.2 Claude Code

- Claude executable yolu
- Varsayılan proje
- Varsayılan model
- İzin modu
- Ortam değişkenleri
- Başlangıç argümanları
- Oturum devam ettirme

### 23.3 Ses

- Mikrofon seçimi
- Hoparlör seçimi
- STT motoru
- TTS motoru
- Ses
- Hız
- Ses düzeyi
- Gürültü azaltma
- Bas-konuş tuşu

### 23.4 Görünüm

- Koyu tema
- Metal yüzey yoğunluğu
- Tuş ışık seviyesi
- Ekran parlaklığı
- Telsiz konumu
- Cihaz ölçeği
- Arka plan şeffaflığı

### 23.5 Kısayollar

- Tüm kısayollar
- Çakışma kontrolü
- Varsayılana dön
- Global kısayollar

### 23.6 Güvenlik

- Komut onayı
- Dosya yazma onayı
- Tehlikeli komut filtresi
- Snapshot oluşturma
- Günlük temizleme
- Ses gizliliği

---

## 24. Teknik Mimari

```text
React + TypeScript UI
        │
        ├── DeviceShell
        ├── StatusDisplay
        ├── HardwareButton
        ├── RotaryKnob
        ├── LevelSwitch
        ├── RadioController
        ├── ChatPanel
        └── TerminalPanel
        │
        ▼
Zustand / Redux Store
        │
        ▼
Tauri IPC ve Event Sistemi
        │
        ├── Process Manager
        ├── PTY Manager
        ├── Shortcut Manager
        ├── Voice Manager
        ├── Update Manager
        ├── Project Manager
        └── Snapshot Manager
        │
        ▼
Claude Code CLI
```

---

## 25. Önerilen Klasör Yapısı

```text
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
├── components/
│   ├── device/
│   │   ├── DeviceShell.tsx
│   │   ├── StatusDisplay.tsx
│   │   ├── HardwareButton.tsx
│   │   ├── RotaryKnob.tsx
│   │   ├── LevelSwitch.tsx
│   │   └── ShortcutLabel.tsx
│   ├── radio/
│   │   ├── RadioController.tsx
│   │   ├── PushToTalkButton.tsx
│   │   └── AudioMeter.tsx
│   ├── terminal/
│   │   └── TerminalPanel.tsx
│   ├── chat/
│   │   └── ChatPanel.tsx
│   └── dialogs/
├── stores/
│   ├── deviceStore.ts
│   ├── terminalStore.ts
│   ├── voiceStore.ts
│   └── settingsStore.ts
├── services/
│   ├── claudeService.ts
│   ├── shortcutService.ts
│   ├── voiceService.ts
│   ├── updaterService.ts
│   └── projectService.ts
├── hooks/
├── styles/
│   ├── device.css
│   ├── radio.css
│   └── animations.css
└── types/

src-tauri/
├── src/
│   ├── main.rs
│   ├── commands/
│   ├── pty/
│   ├── process/
│   ├── voice/
│   ├── updater/
│   ├── project/
│   └── security/
├── capabilities/
└── tauri.conf.json
```

---

## 26. Merkezi Durum Modeli

```ts
interface DeviceState {
  power: "off" | "starting" | "on" | "stopping" | "error";
  taskStatus:
    | "idle"
    | "starting"
    | "working"
    | "waiting"
    | "completed"
    | "failed";
  model: string;
  level: "low" | "high";
  updateStatus:
    | "ready"
    | "checking"
    | "available"
    | "downloading"
    | "installing"
    | "failed";
  syncStatus: "idle" | "syncing" | "success" | "failed";
  radioStatus:
    | "offline"
    | "connected"
    | "listening"
    | "transcribing"
    | "processing"
    | "speaking"
    | "error";
  currentTask: string;
  progress: number | null;
  activeProject: string | null;
  activeSessionId: string | null;
  permissionRequired: boolean;
  lastError: string | null;
}
```

---

## 27. Veri Saklama

İlk sürümde:

- SQLite: görev, proje ve oturum geçmişi
- JSON veya Tauri Store: kullanıcı ayarları
- İşletim sistemi güvenli kasası: API anahtarları ve hassas bilgiler
- Geçici klasör: ses ve snapshot verileri

Saklanacak veriler:

- Son projeler
- Kısayollar
- Profiller
- Model tercihleri
- Uygulama ayarları
- Görev geçmişi
- Hata günlükleri
- Snapshot kayıtları

---

## 28. Güvenlik Gereksinimleri

1. Shell komutları izin listesiyle sınırlandırılmalıdır.
2. Kullanıcı girdileri komut satırına doğrudan birleştirilmemelidir.
3. API anahtarları düz metin olarak saklanmamalıdır.
4. Güncelleme paketleri imzalanmalıdır.
5. Proje klasörü güven doğrulaması yapılmalıdır.
6. Tehlikeli geri alma komutları doğrudan çalıştırılmamalıdır.
7. Mikrofon durumu her zaman görünür olmalıdır.
8. Harici bağlantılar varsayılan tarayıcıda ve onayla açılmalıdır.
9. Uygulama günlükleri hassas verileri maskelemelidir.
10. Global kısayollar kullanıcı tarafından kapatılabilmelidir.

---

## 29. Performans Gereksinimleri

- Soğuk açılış: 3 saniyenin altında
- Arayüz tepkisi: 100 ms altında
- Tuş animasyonu: 60 FPS hedefi
- Boşta RAM: 250 MB altında
- Boşta CPU: %1 altında
- Terminal veri gecikmesi: 100 ms altında
- Kısayol tepki süresi: 100 ms altında
- Sesli komut başlangıcı: 300 ms altında
- Büyük terminal çıktısında arayüz donmamalı
- Günlükler sınırlı ve döngüsel tutulmalı

---

## 30. Erişilebilirlik

- Tüm tuşlarda tooltip
- Klavyeyle tam gezinme
- Yüksek kontrast modu
- Yazı boyutu ayarı
- Renk körlüğüne uygun durum simgeleri
- Sadece renkle durum anlatmama
- Telsiz durumları için metinsel gösterim
- Ekran okuyucu etiketleri
- Animasyon azaltma seçeneği

---

## 31. Hata Yönetimi

### 31.1 Claude Code bulunamadı

```text
Claude Code bulunamadı.
[Kurulum Yardımı] [Yolu Seç] [Tekrar Dene]
```

### 31.2 Süreç başlatılamadı

- Hata mesajı
- Çıkış kodu
- Günlüğü aç
- Tekrar dene
- Ayarlara git

### 31.3 PTY bağlantısı kesildi

- Oturumu tekrar bağla
- Yeni oturum başlat
- Terminal çıktısını kaydet

### 31.4 Mikrofon hatası

- İzin kontrolü
- Cihaz seçimi
- Mikrofon testi
- Yazılı girişe geç

### 31.5 Güncelleme hatası

- Mevcut sürüm korunur
- Kurulum geri alınır
- Günlük oluşturulur
- Manuel indirme seçeneği gösterilir

---

## 32. Test Gereksinimleri

### 32.1 Birim testleri

- Durum yönetimi
- Kısayol eşleme
- Profil seçimi
- Model geçişi
- Komut doğrulama
- Snapshot mantığı

### 32.2 Entegrasyon testleri

- Claude Code başlatma
- PTY bağlantısı
- Terminal girdi/çıktı
- Proje seçimi
- Güncelleme akışı
- Sesli komut akışı

### 32.3 Arayüz testleri

- Tüm tuşlar
- Kısayol etiketleri
- Farklı pencere boyutları
- Kompakt telsiz
- Sohbet paneli
- Terminal paneli
- Animasyonlar

### 32.4 Windows testleri

- Windows 10
- Windows 11
- %100, %125, %150 ve %200 ölçek
- Çoklu monitör
- Uyku sonrası devam
- Yönetici olmayan kullanıcı
- Türkçe ve İngilizce Windows

---

## 33. Kabul Kriterleri

İlk sürüm tamamlanmış kabul edilirken:

1. Uygulama Windows kurulum dosyasıyla kurulabilmelidir.
2. Cihaz tasarımı referans görünüme yakın olmalıdır.
3. Tüm ana tuşların üzerinde kısayollar görünmelidir.
4. Tüm tuşlar fare ve klavye ile çalışmalıdır.
5. POWER Claude Code sürecini başlatıp durdurabilmelidir.
6. RUN CLAUDE CODE seçili projede oturum açmalıdır.
7. Model düğmesi model değiştirebilmelidir.
8. F2 LOW/HIGH profilini değiştirebilmelidir.
9. Ekran gerçek zamanlı durum göstermelidir.
10. Terminal paneli gerçek Claude Code çıktısını göstermelidir.
11. Mini telsiz bas-konuş mantığıyla çalışmalıdır.
12. Sohbet paneli açılıp kapanmalıdır.
13. Hatalar kullanıcıya anlaşılır gösterilmelidir.
14. DISCARDS işlemi kullanıcı değişikliklerini yanlışlıkla silmemelidir.
15. Uygulama kapatılıp açıldığında temel ayarlar korunmalıdır.

---

## 34. Geliştirme Aşamaları

### Aşama 1 — Görsel prototip

- Cihaz gövdesi
- Tuşlar
- Kısayol etiketleri
- Ekran
- Döner düğme
- LOW/HIGH anahtarı
- Telsiz tasarımı
- Animasyonlar

### Aşama 2 — Uygulama iskeleti

- Tauri kurulumu
- React yapılandırması
- Durum yönetimi
- Ayarlar
- Sistem tepsisi
- Pencere modları

### Aşama 3 — Claude Code entegrasyonu

- CLI tespiti
- PTY
- Süreç yönetimi
- Terminal
- Proje seçimi
- Model yönetimi

### Aşama 4 — Kontroller

- Tüm tuşlar
- Klavye kısayolları
- Global kısayollar
- Döner düğme
- LOW/HIGH profilleri

### Aşama 5 — Sesli telsiz

- Mikrofon
- Bas-konuş
- STT
- TTS
- Ses seviyesi
- Kompakt mod

### Aşama 6 — Güvenlik ve geri alma

- Snapshot
- Değişiklik izleme
- Güvenli discard
- Komut doğrulama
- Günlük maskeleme

### Aşama 7 — Güncelleme ve dağıtım

- Otomatik güncelleme
- Kod imzalama
- NSIS kurulum
- Testler
- Sürüm notları

---

## 35. Gelecek Sürüm Fikirleri

- Çoklu Claude Code oturumu
- Her oturum için ayrı cihaz sekmesi
- Çoklu ajan görünümü
- Agent bağlantı diyagramı
- GitHub entegrasyonu
- Pull request oluşturma
- Görev kuyruğu
- Otomatik test paneli
- Maliyet göstergesi
- Token kullanım ekranı
- Donanım cihazıyla Bluetooth bağlantısı
- Fiziksel mini telsiz desteği
- Stream Deck entegrasyonu
- Mobil uzaktan kumanda
- Eklenti sistemi
- Tema mağazası

---

## 36. Önerilen İlk Sürüm Özeti

İlk sürüm şu çekirdek özelliklere odaklanmalıdır:

- Referans tasarıma sadık masaüstü cihaz arayüzü
- Tuşların üzerinde görünen kısayollar
- Claude Code aç/kapat
- Proje seçme
- Model değiştirme
- LOW/HIGH profili
- Gerçek terminal
- Sohbet paneli
- Mini telsiz ile bas-konuş
- Gerçek zamanlı durum ekranı
- Güvenli geri alma
- Windows kurulum paketi

Bu kapsam, ürünün önce güvenilir ve işlevsel bir Claude Code kontrol merkezi olarak çalışmasını sağlar. Daha sonra çoklu ajan, fiziksel donanım ve bulut eşitleme gibi özellikler eklenebilir.
