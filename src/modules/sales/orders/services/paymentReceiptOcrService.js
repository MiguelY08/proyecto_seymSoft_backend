import { createWorker } from 'tesseract.js';

const MIN_AMOUNT_CONFIDENCE = 0.55;
const MAX_TEXT_LENGTH = 12000;

let workerPromise;

const getWorker = () => {
  if (!workerPromise) {
    workerPromise = createWorker('spa').catch((error) => {
      workerPromise = null;
      throw error;
    });
  }

  return workerPromise;
};

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const normalizeText = (text) =>
  String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);

const normalizeOcrNumber = (value) => {
  const raw = String(value || '').replace(/[^\d.,]/g, '');
  if (!raw) return null;

  const lastDot = raw.lastIndexOf('.');
  const lastComma = raw.lastIndexOf(',');
  const decimalSeparator =
    lastDot >= 0 && lastComma >= 0
      ? lastDot > lastComma
        ? '.'
        : ','
      : null;

  let normalized = raw;

  if (decimalSeparator) {
    const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
    normalized = raw
      .replaceAll(thousandsSeparator, '')
      .replace(decimalSeparator, '.');
  } else if (raw.includes('.') || raw.includes(',')) {
    const separator = raw.includes('.') ? '.' : ',';
    const parts = raw.split(separator);
    normalized =
      parts.length === 2 && parts[1].length <= 2
        ? `${parts[0]}.${parts[1]}`
        : parts.join('');
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : null;
};

const AMOUNT_CONTEXT_LABELS =
  /(valor|monto|total|enviado|recibido|consignado|transferencia|cu[aá]nto|pago|importe|abono|deposit[oó])/i;
const NON_AMOUNT_CONTEXT_LABELS =
  /(referencia|transacci[oó]n|aprobaci[oó]n|comprobante|tel[eé]fono|celular|n[uú]mero nequi|cuenta|c[oó]digo|fecha|hora|qr|saldo|disponible)/i;

const getAmountMatches = (line) => {
  const matches = [];
  const pattern =
    /(?:[$€]\s*)?\d[\d\s.,]*/g;

  for (const match of line.matchAll(pattern)) {
    const raw = match[0]
      .trim()
      .replace(/[.,]+$/, '');
    const digits = raw.replace(/\D/g, '');

    if (!digits || digits.length < 2) continue;

    const amount = normalizeOcrNumber(raw);
    if (!amount) continue;

    const hasCurrencySymbol = /[$€]/.test(raw);
    const hasThousandsSeparator =
      /\d[.,]\d{3}(?:[.,]\d{1,2})?$/.test(raw) ||
      /\d\s+\d{3}/.test(raw);
    const isPlainLargeNumber = /^\d{4,}$/.test(digits) && !hasCurrencySymbol;

    matches.push({
      amount,
      raw,
      hasCurrencySymbol,
      hasThousandsSeparator,
      isPlainLargeNumber,
    });
  }

  return matches;
};

export const getAmountCandidates = (text) => {
  const candidates = [];
  const lines = text.split('\n').map((line) => line.trim());

  lines.forEach((line, index) => {
    if (!line) return;

    const nearbyLines = lines
      .slice(Math.max(0, index - 2), Math.min(lines.length, index + 3))
      .filter(Boolean)
      .join(' ');
    const hasAmountLabel = AMOUNT_CONTEXT_LABELS.test(nearbyLines);
    const hasNonAmountLabel = NON_AMOUNT_CONTEXT_LABELS.test(line);

    getAmountMatches(line).forEach((match) => {
      let score = 0;

      if (match.hasCurrencySymbol) score += 6;
      if (match.hasThousandsSeparator) score += 4;
      if (match.isPlainLargeNumber) score += 1;
      if (hasAmountLabel) score += 5;
      if (AMOUNT_CONTEXT_LABELS.test(line)) score += 3;
      if (hasNonAmountLabel) score -= 8;

      // A standalone short number is more likely to be an identifier than a price.
      if (!match.hasCurrencySymbol && !match.hasThousandsSeparator && match.amount < 1000) {
        score -= 4;
      }

      candidates.push({
        ...match,
        line,
        lineIndex: index,
        score,
      });
    });
  });

  return candidates.sort((first, second) => second.score - first.score);
};

const extractReference = (text) => {
  const match = text.match(
    /(referencia|transacci[oó]n|aprobaci[oó]n|comprobante)\s*[:#-]?\s*([A-Z0-9-]{5,})/i
  );

  return match?.[2] || null;
};

const extractDate = (text) => {
  const match = text.match(
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/
  );

  return match?.[1] || null;
};

const extractBank = (text) => {
  const banks = [
    'Bancolombia',
    'Nequi',
    'Daviplata',
    'Davivienda',
    'Banco de Bogotá',
    'BBVA',
    'Banco Caja Social',
    'Nu',
  ];
  const normalized = text.toLowerCase();

  return banks.find((bank) => normalized.includes(bank.toLowerCase())) || null;
};

const buildWarnings = ({ text, amount, ocrConfidence }) => {
  const warnings = [];

  if (!text) {
    warnings.push('No se pudo extraer texto del comprobante.');
  }

  if (!amount) {
    warnings.push('No se pudo identificar un monto asociado a la operación.');
  } else if (ocrConfidence < MIN_AMOUNT_CONFIDENCE) {
    warnings.push('La confianza del texto OCR es baja; verificar el monto manualmente.');
  }

  if (!extractReference(text)) {
    warnings.push('No se identificó una referencia o número de transacción.');
  }

  return warnings;
};

export const analyzePaymentReceipt = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError('El contenido del comprobante no es válido para OCR.');
  }

  const worker = await getWorker();
  const result = await worker.recognize(buffer);
  const text = normalizeText(result?.data?.text);
  const ocrConfidence = Math.max(
    0,
    Math.min(1, Number(result?.data?.confidence || 0) / 100)
  );
  const amountCandidate = getAmountCandidates(text)[0] || null;
  const amountConfidence = amountCandidate
    ? ocrConfidence >= MIN_AMOUNT_CONFIDENCE
      ? ocrConfidence
      : ocrConfidence
    : 0;
  const warnings = buildWarnings({
    text,
    amount: amountCandidate?.amount,
    ocrConfidence: amountConfidence,
  });

  return {
    status: amountCandidate && amountConfidence >= MIN_AMOUNT_CONFIDENCE
      ? 'Completado'
      : 'Completado con baja confianza',
    analyzedAt: new Date(),
    model: 'tesseract.js-spa',
    confidence: amountConfidence,
    amount: amountCandidate?.amount || null,
    currency: amountCandidate ? 'COP' : null,
    transactionReference: extractReference(text),
    transactionDate: extractDate(text),
    transactionTime: null,
    bank: extractBank(text),
    senderName: null,
    recipientName: null,
    statusText: /exitosa|exitoso|aprobada|aprobado/i.test(text)
      ? 'Exitoso'
      : null,
    warnings,
    error: null,
    rawText: text || null,
  };
};
