import { getSetQuestions } from '../data/sets';
import questions from '../data/questions';

// Opens a new tab with the printable answer sheet and triggers print
export const openPrintableSheet = (selectedSet) => {
  const setQuestions = getSetQuestions(selectedSet, questions);

  // Split into two columns
  const leftColumn = setQuestions.slice(0, 30);
  const rightColumn = setQuestions.slice(30, 60);

  // Generate question HTML
  const generateQuestionHTML = (q, num) => `
    <div class="question">
      <span class="num">${num}.</span>
      <div class="choices">
        ${q.choices.map(choice => `<span class="choice">&#9744; ${choice}</span>`).join('')}
      </div>
    </div>
  `;

  // Build the full HTML document
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Phonics Competition - Set ${selectedSet}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 6mm 8mm;
    }

    html, body {
      width: 210mm;
      height: 297mm;
      font-family: Arial, sans-serif;
      background: white;
      color: black;
    }

    .container {
      width: 100%;
      height: 100%;
      padding: 4mm 6mm;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .header {
      text-align: center;
      padding-bottom: 3mm;
      border-bottom: 2px solid black;
      flex-shrink: 0;
    }

    .header h1 {
      font-size: 20px;
      font-weight: 900;
      margin-bottom: 1px;
      letter-spacing: 1px;
    }

    .header h2 {
      font-size: 26px;
      font-weight: 900;
      margin-bottom: 3mm;
    }

    .fields {
      display: flex;
      justify-content: center;
      gap: 40px;
      font-size: 14px;
      font-weight: bold;
    }

    .field-line {
      display: inline-block;
      border-bottom: 2px solid black;
      min-width: 140px;
      margin-left: 6px;
    }

    .field-line.short {
      min-width: 60px;
    }

    /* Instructions */
    .instructions {
      text-align: center;
      padding: 2mm 0;
      margin: 2mm 0;
      border: 1px solid #666;
      font-size: 11px;
      flex-shrink: 0;
    }

    /* Two-column grid - takes remaining space */
    .grid {
      display: flex;
      gap: 6mm;
      flex: 1;
      min-height: 0;
    }

    .column {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .column:first-child {
      border-right: 1px solid #999;
      padding-right: 5mm;
    }

    .column:last-child {
      padding-left: 5mm;
    }

    /* Questions - evenly distributed */
    .question {
      display: flex;
      align-items: center;
      flex: 1;
      border-bottom: 1px solid #ddd;
    }

    .question:last-child {
      border-bottom: none;
    }

    .num {
      font-weight: 900;
      width: 24px;
      text-align: right;
      margin-right: 8px;
      font-size: 13px;
    }

    .choices {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .choice {
      font-weight: 700;
      font-size: 13px;
      white-space: nowrap;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding-top: 2mm;
      border-top: 1px solid #999;
      font-size: 10px;
      color: #666;
      flex-shrink: 0;
    }

    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PHONICS COMPETITION</h1>
      <h2>SET ${selectedSet}</h2>
      <div class="fields">
        <div>Name: <span class="field-line"></span></div>
        <div>No: <span class="field-line short"></span></div>
      </div>
    </div>

    <div class="instructions">
      <strong>Instructions:</strong> Listen carefully to each word. Mark the correct spelling.
    </div>

    <div class="grid">
      <div class="column">
        ${leftColumn.map((q, idx) => generateQuestionHTML(q, idx + 1)).join('')}
      </div>
      <div class="column">
        ${rightColumn.map((q, idx) => generateQuestionHTML(q, idx + 31)).join('')}
      </div>
    </div>

    <div class="footer">
      60 Questions &bull; 4 Minutes
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  // Open new tab and write the content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

export default openPrintableSheet;
