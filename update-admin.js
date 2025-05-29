const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./dev.db');

// Kullanıcıyı admin yap
db.run(
  'UPDATE User SET isAdmin = 1, role = ? WHERE email = ?',
  ['ADMIN', 'fevziyenurksbr1@gmail.com'],
  function(err) {
    if (err) {
      console.error('Hata:', err);
    } else {
      console.log('✅ Kullanıcı admin yapıldı. Etkilenen satır sayısı:', this.changes);
      
      // Kontrol et
      db.get(
        'SELECT id, email, name, role, isAdmin FROM User WHERE email = ?',
        ['fevziyenurksbr1@gmail.com'],
        (err, row) => {
          if (err) {
            console.error('Kontrol hatası:', err);
          } else {
            console.log('Güncel kullanıcı durumu:', row);
          }
          db.close();
        }
      );
    }
  }
); 