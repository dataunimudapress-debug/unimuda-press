/**
 * ====================================================================
 * UNIMUDA PRESS - Google Apps Script Backend (Code.gs)
 * ====================================================================
 * Panduan Penggunaan:
 * 1. Buka Google Sheets baru di Google Drive Anda.
 * 2. Klik menu Extensi -> Apps Script.
 * 3. Hapus kode bawaan di Code.gs, lalu Salin & Tempel seluruh kode di bawah ini.
 * 4. Buat file HTML baru di Apps Script dengan nama "index" (tanpa ekstensi .html).
 * 5. Tempelkan seluruh kode dari file index.html ke file "index" di Apps Script.
 * 6. Klik "Deploy" -> "Deployment Baru" -> Pilih jenis "Aplikasi Web".
 * 7. Akses diberikan kepada: "Siapa Saja" (Anyone).
 * 8. Klik Deploy dan dapatkan URL Web App Anda!
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('Unimuda Press - Management Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheet() {
  var prop = PropertiesService.getScriptProperties();
  var sheetId = prop.getProperty('SPREADSHEET_ID');
  
  if (!sheetId) {
    var ss = SpreadsheetApp.create('Unimuda Press Database');
    sheetId = ss.getId();
    prop.setProperty('SPREADSHEET_ID', sheetId);
    
    var sheet = ss.getActiveSheet();
    sheet.setName('Transaksi');
    sheet.appendRow([
      'Order ID', 'Tanggal', 'Nama Pelanggan', 'Kategori', 'Tipe Order', 
      'Layanan', 'Panjang (m)', 'Lebar (m)', 'Qty', 'Harga/m', 'Total Amount', 
      'Status', 'Gambar URL', 'Catatan'
    ]);
    sheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#0059bb').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  return SpreadsheetApp.openById(sheetId);
}

function getTransactions() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Transaksi');
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    var transactions = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      transactions.push({
        rowIndex: i + 1,
        orderId: row[0],
        date: row[1],
        customerName: row[2],
        customerCategory: row[3],
        orderType: row[4],
        serviceType: row[5],
        lengthMeters: Number(row[6]),
        widthMeters: Number(row[7]),
        qty: Number(row[8]),
        pricePerMeter: Number(row[9]),
        totalAmount: Number(row[10]),
        status: row[11],
        imageUrl: row[12],
        notes: row[13]
      });
    }
    
    return { success: true, data: transactions };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function saveTransaction(data) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Transaksi');
    var orderId = '#UP-' + Math.floor(1000 + Math.random() * 9000);
    var now = data.date || new Date().toISOString().split('T')[0];
    
    sheet.appendRow([
      orderId,
      now,
      data.customerName || 'Anonim',
      data.customerCategory || 'Umum',
      data.orderType || 'Spanduk (Outdoor)',
      data.serviceType || 'design_print',
      Number(data.lengthMeters) || 1,
      Number(data.widthMeters) || 1,
      Number(data.qty) || 1,
      Number(data.pricePerMeter) || 25000,
      Number(data.totalAmount) || 25000,
      data.status || 'Belum Lunas',
      data.imageUrl || '',
      data.notes || ''
    ]);
    
    return { success: true, orderId: orderId, message: 'Transaksi berhasil disimpan!' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
