/**********************************************************************
 * FLEET P&L — DATE BRIDGE  (Google Apps Script Web App)
 *
 * Kaam: Dashboard se start/end date aati hai -> ye script sheet ke
 * "Start Date" / "End Date" cells me daal deta hai -> sheet recompute
 * hoti hai -> recomputed data CSV bana kar dashboard ko wapas bhejta hai.
 *
 * ===================  SETUP (ek hi baar)  ===========================
 * 1. Apni Google Sheet kholo.
 * 2. Menu: Extensions > Apps Script
 * 3. Saara default code hata kar ye poora code paste karo.
 * 4. Save (disk icon).
 * 5. Deploy > New deployment > type: "Web app"
 *      - Description: Fleet date bridge
 *      - Execute as:  Me  (tumhara account)
 *      - Who has access:  Anyone
 *    Deploy dabao, permissions allow karo.
 * 6. Jo "/exec" URL milega use copy karo aur dashboard HTML me
 *    APPS_SCRIPT_URL = "" wali line me paste kar do.
 *
 * NOTE: Agar baad me code badlo to "Manage deployments" se SAME
 * deployment ko edit/new-version karna, warna URL badal jaayega.
 *********************************************************************/

// Jis tab par P&L summary hai uska gid (URL me gid=... wala number)
var SUMMARY_GID = 1023893960;

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheetByGid(ss, SUMMARY_GID) || ss.getSheets()[0];

    var start = e && e.parameter ? e.parameter.start : '';  // "YYYY-MM-DD"
    var end   = e && e.parameter ? e.parameter.end   : '';

    // Agar dono dates aayi hain to sheet ke Start/End Date cells set karo
    if (start && end) {
      setDateCells_(sheet, parseISO_(start), parseISO_(end));
      SpreadsheetApp.flush();   // formulas recompute hone do
    }

    // Recomputed data ko display values (₹, comma, date format) ke saath CSV banao
    var values = sheet.getDataRange().getDisplayValues();
    var csv = toCsv_(values);

    return ContentService
      .createTextOutput(csv)
      .setMimeType(ContentService.MimeType.CSV);

  } catch (err) {
    return ContentService
      .createTextOutput('ERROR: ' + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/* "Start Date" / "End Date" label cell dhoondh kar uske RIGHT wali cell me
   date set karta hai. Sirf tab set karta hai jab value alag ho (extra
   recompute se bachne ke liye). */
function setDateCells_(sheet, startDate, endDate) {
  var data = sheet.getDataRange().getValues();
  var maxRows = Math.min(data.length, 6);   // sirf top summary rows
  for (var r = 0; r < maxRows; r++) {
    for (var c = 0; c < data[r].length; c++) {
      var label = String(data[r][c]).trim().toLowerCase();
      if (label === 'start date') {
        writeIfDifferent_(sheet, r + 1, c + 2, startDate);
      } else if (label === 'end date') {
        writeIfDifferent_(sheet, r + 1, c + 2, endDate);
      }
    }
  }
}

function writeIfDifferent_(sheet, row, col, dateVal) {
  var cell = sheet.getRange(row, col);
  var cur = cell.getValue();
  var same = (cur instanceof Date) &&
             cur.getFullYear() === dateVal.getFullYear() &&
             cur.getMonth()    === dateVal.getMonth() &&
             cur.getDate()     === dateVal.getDate();
  if (!same) cell.setValue(dateVal);
}

function getSheetByGid(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) return sheets[i];
  }
  return null;
}

// "YYYY-MM-DD" -> local Date (no timezone shift)
function parseISO_(s) {
  var p = String(s).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function toCsv_(rows) {
  return rows.map(function (row) {
    return row.map(function (cell) {
      var s = (cell === null || cell === undefined) ? '' : String(cell);
      if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');
  }).join('\n');
}
