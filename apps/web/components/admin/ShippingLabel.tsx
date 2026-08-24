'use client';

import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  Tag,
  Package,
  Layers,
  ZoomIn,
  ZoomOut,
  Info,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Code 128 (Subset B) ISO/IEC 15417 Pure SVG Barcode Generator
// ─────────────────────────────────────────────────────────────────────────────

const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

export function BarcodeSvg({
  text,
  height = 36,
  className = '',
  showLabel = true,
}: {
  text: string;
  height?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const { bars, totalWidth } = useMemo(() => {
    const clean = (text || '').replace(/[^\x20-\x7E]/g, '') || 'ORDER';
    const codes = [104]; // Start Code B
    for (let i = 0; i < clean.length; i++) {
      codes.push(clean.charCodeAt(i) - 32);
    }
    let sum = 104;
    for (let i = 1; i < codes.length; i++) {
      sum += codes[i] * i;
    }
    codes.push(sum % 103);
    codes.push(106); // Stop pattern

    const barList: { x: number; width: number }[] = [];
    let currentX = 0;
    for (const code of codes) {
      const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
      for (let p = 0; p < pattern.length; p++) {
        const width = parseInt(pattern[p], 10);
        const isBar = p % 2 === 0;
        if (isBar) {
          barList.push({ x: currentX, width });
        }
        currentX += width;
      }
    }
    return { bars: barList, totalWidth: currentX };
  }, [text]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto max-h-[38px] overflow-visible"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={0}
            width={bar.width}
            height={height}
            fill="#000000"
          />
        ))}
      </svg>
      {showLabel && (
        <span className="font-mono text-[9px] font-bold text-black tracking-widest mt-0.5 leading-none select-all">
          {text}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pure SVG QR Code Matrix Generator
// ─────────────────────────────────────────────────────────────────────────────

function createQrMatrix(text: string) {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else if (code < 2048) {
      bytes.push((code >> 6) | 192, (code & 63) | 128);
    } else {
      bytes.push((code >> 12) | 224, ((code >> 6) & 63) | 128, (code & 63) | 128);
    }
  }

  let version = 2;
  if (bytes.length > 32) version = 3;
  if (bytes.length > 52) version = 4;
  if (bytes.length > 78) version = 5;

  const size = version * 4 + 17;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isReserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r: number, c: number, val: boolean, reserved = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (reserved) isReserved[r][c] = true;
    }
  }

  function addFinder(startR: number, startC: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = startR + r;
        const nc = startC + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(nr, nc, isBlack);
        } else {
          setModule(nr, nc, false);
        }
      }
    }
  }

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  const alignmentPositions: Record<number, number[]> = {
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30]
  };
  const aligns = alignmentPositions[version] || [6, 18];

  if (version >= 2) {
    for (const r of aligns) {
      for (const c of aligns) {
        if (isReserved[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            setModule(r + dr, c + dc, isBlack);
          }
        }
      }
    }
  }

  for (let i = 8; i < size - 8; i++) {
    if (!isReserved[6][i]) setModule(6, i, i % 2 === 0);
    if (!isReserved[i][6]) setModule(i, 6, i % 2 === 0);
  }

  setModule(4 * version + 9, 8, true);

  for (let i = 0; i < 9; i++) {
    if (!isReserved[8][i]) isReserved[8][i] = true;
    if (!isReserved[i][8]) isReserved[i][8] = true;
    if (i < 8) {
      if (!isReserved[8][size - 1 - i]) isReserved[8][size - 1 - i] = true;
      if (!isReserved[size - 1 - i][8]) isReserved[size - 1 - i][8] = true;
    }
  }

  const totalDataCodewords = ({ 2: 28, 3: 44, 4: 64, 5: 86 } as any)[version] || 28;
  const ecCodewords = ({ 2: 16, 3: 26, 4: 36, 5: 48 } as any)[version] || 16;

  const bits: number[] = [0, 1, 0, 0];
  const countBits = 8;
  for (let b = countBits - 1; b >= 0; b--) {
    bits.push((bytes.length >> b) & 1);
  }
  for (const byte of bytes) {
    for (let b = 7; b >= 0; b--) {
      bits.push((byte >> b) & 1);
    }
  }
  while (bits.length < totalDataCodewords * 8 && bits.length % 8 !== 0) bits.push(0);
  while (bits.length < 4 || (bits.length < totalDataCodewords * 8 && bits.length < totalDataCodewords * 8 - 4)) {
    if (bits.length >= totalDataCodewords * 8) break;
    bits.push(0);
  }
  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataCodewords * 8) {
    const p = padBytes[padIdx % 2];
    for (let b = 7; b >= 0; b--) bits.push((p >> b) & 1);
    padIdx++;
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < totalDataCodewords; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i * 8 + b];
    }
    dataCodewords.push(byte);
  }

  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    exp[i + 255] = x;
    log[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }

  function gfMul(a: number, b: number) {
    if (a === 0 || b === 0) return 0;
    return exp[log[a] + log[b]];
  }

  let gen = [1];
  for (let i = 0; i < ecCodewords; i++) {
    const nextGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      nextGen[j] ^= gfMul(gen[j], exp[i]);
      nextGen[j + 1] ^= gen[j];
    }
    gen = nextGen;
  }

  const ec = new Array(ecCodewords).fill(0);
  for (const b of dataCodewords) {
    const factor = b ^ ec[0];
    ec.shift();
    ec.push(0);
    for (let j = 0; j < ecCodewords; j++) {
      ec[j] ^= gfMul(gen[j], factor);
    }
  }

  const allCodewords = [...dataCodewords, ...ec];
  const allBits: number[] = [];
  for (const c of allCodewords) {
    for (let b = 7; b >= 0; b--) allBits.push((c >> b) & 1);
  }

  let bitIdx = 0;
  let upwards = true;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--;
    for (let r = 0; r < size; r++) {
      const row = upwards ? size - 1 - r : r;
      for (const col of [c, c - 1]) {
        if (!isReserved[row][col]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = (bit ^ (mask ? 1 : 0)) === 1;
        }
      }
    }
    upwards = !upwards;
  }

  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] === 1;
    if (i < 6) setModule(8, i, bit);
    else if (i < 8) setModule(8, i + 1, bit);
    else setModule(8 - (14 - i), 8, bit);

    if (i < 8) setModule(size - 1 - i, 8, bit);
    else setModule(8, size - (15 - i), bit);
  }

  return { matrix, size };
}

export function QrCodeSvg({
  text,
  size = 56,
  className = '',
}: {
  text: string;
  size?: number;
  className?: string;
}) {
  const { matrix, size: qrSize } = useMemo(() => createQrMatrix(text), [text]);

  return (
    <svg
      viewBox={`0 0 ${qrSize} ${qrSize}`}
      width={size}
      height={size}
      className={`shape-crisp ${className}`}
      shapeRendering="crispEdges"
    >
      <rect width={qrSize} height={qrSize} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#000000" /> : null
        )
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Postal Code Box Grid (۱۰ رقمی تفکیک‌شده)
// ─────────────────────────────────────────────────────────────────────────────

function PostalCodeBoxes({ postalCode }: { postalCode?: string }) {
  const raw = (postalCode || '').replace(/\D/g, '');
  const digits = raw.padEnd(10, ' ').slice(0, 10).split('');

  return (
    <div className="flex items-center gap-0.5 dir-ltr justify-end">
      {digits.map((digit, idx) => (
        <span
          key={idx}
          className="w-3.5 h-4.5 border border-black flex items-center justify-center font-mono text-[10px] font-bold text-black bg-white"
        >
          {digit.trim() ? digit : ''}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Single 80mm x 120mm Shipping Label Sheet
// ─────────────────────────────────────────────────────────────────────────────

export interface ShippingLabelOrder {
  id: string;
  order_number: string;
  tracking_code?: string;
  status: string;
  shipping_method?: string;
  payment_method?: string;
  payment_status?: string;
  total_irr?: number;
  total_toman?: number;
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  address: {
    recipient_name: string;
    recipient_phone: string;
    province: string;
    city: string;
    postal_code: string;
    postal_address: string;
  };
  items?: Array<{
    product_title: string;
    variant_title?: string;
    quantity: number;
    unit_price_irr?: number;
    subtotal_irr?: number;
  }>;
}

export function ShippingLabelSheet({
  order,
  showSender = true,
  showItems = true,
  showQr = true,
}: {
  order: ShippingLabelOrder;
  showSender?: boolean;
  showItems?: boolean;
  showQr?: boolean;
}) {
  const recipient = order.address || {
    recipient_name: 'نامشخص',
    recipient_phone: '',
    province: '',
    city: '',
    postal_code: '',
    postal_address: '',
  };

  const orderDate = useMemo(() => {
    try {
      const d = new Date(order.created_at);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '—';
    }
  }, [order.created_at]);

  const trackingQrUrl = `https://iran-moringa.ir/track?ord=${encodeURIComponent(order.order_number)}&p=${encodeURIComponent(recipient.recipient_phone || '')}`;

  return (
    <div
      className="shipping-label-page bg-white text-black font-sans leading-tight border border-black select-none box-border flex flex-col justify-between"
      style={{
        width: '80mm',
        height: '120mm',
        maxWidth: '80mm',
        maxHeight: '120mm',
        minWidth: '80mm',
        minHeight: '120mm',
        padding: '2.5mm',
        fontSize: '9px',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* ── TOP HEADER: Store Name & Shipping Badge ── */}
      <div className="border-b border-black pb-1 mb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-black text-black">🌿 ایران مورینگا</span>
            <span className="text-[8px] font-mono font-bold tracking-tight text-black border border-black px-1 rounded-xs">
              IRAN MORINGA
            </span>
          </div>
          <div className="text-left">
            <span className="inline-block bg-black text-white px-1.5 py-0.5 text-[8.5px] font-black tracking-tighter rounded-xs">
              {order.shipping_method?.includes('تیپاکس') ? 'تیپاکس / ویژه' : 'پست پیشتاز سراسری'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[7.5px] text-black mt-0.5">
          <span>سایت: iran-moringa.ir • ۰۹۱۳۲۳۹۱۸۴۳</span>
          <span>تاریخ: {orderDate}</span>
        </div>
      </div>

      {/* ── BARCODE & TRACKING SECTION ── */}
      <div className="border border-black p-1 mb-1 bg-white flex items-center justify-between gap-1">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between px-1 text-[8px] font-bold">
            <span>شماره سفارش: <strong className="font-mono text-[9px]">{order.order_number}</strong></span>
            {order.tracking_code ? (
              <span>رهگیری: <strong className="font-mono text-[9px]">{order.tracking_code}</strong></span>
            ) : null}
          </div>
          <div className="w-full px-1 mt-0.5">
            <BarcodeSvg
              text={order.tracking_code || order.order_number}
              height={26}
              showLabel={false}
            />
          </div>
          <span className="font-mono text-[8px] font-black tracking-widest mt-0.5">
            *{order.tracking_code || order.order_number}*
          </span>
        </div>

        {showQr && (
          <div className="border-r border-black pr-1 pl-0.5 flex flex-col items-center justify-center">
            <QrCodeSvg text={trackingQrUrl} size={38} />
            <span className="text-[6.5px] font-bold mt-0.5 text-center">اسکن رهگیری</span>
          </div>
        )}
      </div>

      {/* ── RECIPIENT SECTION (PROMINENT / بزرگ و مشخص) ── */}
      <div className="border-2 border-black p-1 mb-1 flex-1 flex flex-col justify-between">
        <div>
          <div className="bg-black text-white text-[9px] font-black px-1 py-0.5 flex items-center justify-between mb-1">
            <span>👤 گیرنده (مشتری):</span>
            <span className="font-mono font-bold text-[10px]">{recipient.recipient_phone}</span>
          </div>

          <div className="grid grid-cols-2 gap-1 mb-1 text-[9.5px]">
            <div>
              <span className="text-[8px] text-gray-700">نام گیرنده:</span>{' '}
              <strong className="text-[10.5px] font-black block">{recipient.recipient_name}</strong>
            </div>
            <div>
              <span className="text-[8px] text-gray-700">استان و شهر:</span>{' '}
              <strong className="text-[9.5px] font-black block">
                {recipient.province} - {recipient.city}
              </strong>
            </div>
          </div>

          <div className="text-[9px] leading-tight mb-1">
            <span className="text-[8px] text-gray-700 font-bold">نشانی پستی:</span>{' '}
            <span className="font-medium text-black">
              {recipient.postal_address || '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-black pt-1 mt-0.5">
          <span className="text-[8px] font-black">کد پستی ۱۰ رقمی:</span>
          <PostalCodeBoxes postalCode={recipient.postal_code} />
        </div>
      </div>

      {/* ── SENDER SECTION ── */}
      {showSender && (
        <div className="border border-black p-1 mb-1 text-[7.5px] bg-white">
          <div className="flex items-center justify-between font-bold text-[8px] border-b border-gray-400 pb-0.5 mb-0.5">
            <span>🏢 فرستنده: شرکت زیست فرآورده ایران مورینگا</span>
            <span>تلفن: ۰۹۱۳۲۳۹۱۸۴۳</span>
          </div>
          <p className="leading-none">
            اصفهان، چهارباغ بالا، مجتمع کوثر، واحد ۳۰۲ • کد پستی: ۸۱۷۳۸۹۴۵۶۱
          </p>
        </div>
      )}

      {/* ── PACKAGE CONTENTS & FINANCIAL SUMMARY ── */}
      {showItems && (
        <div className="border border-black p-1 mb-1 text-[7.5px] bg-white">
          <div className="flex items-center justify-between font-bold mb-0.5 text-[8px]">
            <span>📦 محتویات مرسوله:</span>
            <span className="font-mono">
              {order.payment_status === 'paid' || order.status !== 'pending_payment'
                ? '✅ تسویه آنلاین'
                : '⚠️ پرداخت در محل'}
            </span>
          </div>
          <p className="line-clamp-2 leading-tight text-[8px] font-medium text-black">
            {order.items && order.items.length > 0
              ? order.items.map((it) => `${it.product_title} (${it.quantity} عدد)`).join(' • ')
              : 'فرآورده‌های گیاهی و ارگانیک مورینگا اولیفرا'}
          </p>
        </div>
      )}

      {/* ── FOOTER: CAUTION & FRAGILE NOTICE ── */}
      <div className="border-t border-black pt-0.5 flex items-center justify-between text-[7px] font-black text-black">
        <span>🌿 ارگانیک و طبیعی • شکستنی</span>
        <span className="border border-black px-1 rounded-xs">با احتیاط حمل شود</span>
        <span>سامانه ایران مورینگا</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Interactive Modal & Print Manager
// ─────────────────────────────────────────────────────────────────────────────

export interface ShippingLabelModalProps {
  orders: ShippingLabelOrder[];
  initialIndex?: number;
  onClose: () => void;
}

export function ShippingLabelModal({
  orders,
  initialIndex = 0,
  onClose,
}: ShippingLabelModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isBulkPrint, setIsBulkPrint] = useState(orders.length > 1);
  const [showSender, setShowSender] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [zoomScale, setZoomScale] = useState(1.15);

  const currentOrder = orders[currentIndex] || orders[0];

  const handlePrint = () => {
    window.print();
  };

  if (!currentOrder) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        
        {/* ── Modal Header (Hidden in Print) ── */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>چاپ برچسب پستی مرسوله</span>
                <span className="text-[10px] font-mono font-normal bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  سایز ۸ × ۱۲ سانتی‌متر (300 DPI)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تنظیم‌شده برای پرینترهای حرارتی و لیبل‌زن <strong>Rongta RPF413</strong> و استاندارد شرکت پست / تیپاکس
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isBulkPrint && orders.length > 1
                  ? `چاپ همه برچسب‌ها (${orders.length} لیبل)`
                  : 'چاپ برچسب (Print)'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Controls & Options Bar (Hidden in Print) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-xs no-print">
          {/* Order Navigator when multiple orders */}
          {orders.length > 1 && (
            <div className="sm:col-span-4 flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-300">سفارش {currentIndex + 1} از {orders.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentIndex === orders.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(orders.length - 1, prev + 1))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Toggle Switches */}
          <div className={`${orders.length > 1 ? 'sm:col-span-8' : 'sm:col-span-12'} flex flex-wrap items-center justify-between sm:justify-end gap-3`}>
            {orders.length > 1 && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300">
                <input
                  type="checkbox"
                  checked={isBulkPrint}
                  onChange={(e) => setIsBulkPrint(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>چاپ گروهی همه ({orders.length} عدد)</span>
              </label>
            )}

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={showSender}
                onChange={(e) => setShowSender(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>بخش فرستنده</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={showItems}
                onChange={(e) => setShowItems(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>لیست اقلام</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={showQr}
                onChange={(e) => setShowQr(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>کد QR رهگیری</span>
            </label>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.8, z - 0.15))}
                className="p-0.5 hover:text-emerald-400 text-slate-400 cursor-pointer"
                title="کوچک‌نمایی"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] text-slate-300 px-1">{Math.round(zoomScale * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(1.8, z + 0.15))}
                className="p-0.5 hover:text-emerald-400 text-slate-400 cursor-pointer"
                title="بزرگ‌نمایی"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Printer Instructions Banner (Hidden in Print) ── */}
        <div className="bg-emerald-950/40 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>راهنمای پرینتر Rongta RPF413:</strong> در پنجره پرینت مرورگر، گزینه <strong>Paper Size</strong> را روی <strong>80×120mm</strong> (یا 80mm Custom) و <strong>Margins</strong> را روی <strong>None</strong> قرار دهید.
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400/80 shrink-0">80mm × 120mm (300 DPI)</span>
        </div>

        {/* ── Interactive Label Preview & Printable Container ── */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/60 min-h-[460px]">
          
          {/* Active Container that prints cleanly */}
          <div id="shipping-label-printable" className="flex flex-col items-center gap-6">
            {isBulkPrint ? (
              // Bulk mode: Render all selected orders sequentially
              orders.map((ord, idx) => (
                <div
                  key={ord.id || idx}
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top center',
                    marginBottom: `${(zoomScale - 1) * 120}mm`,
                  }}
                  className="shadow-2xl rounded-sm transition-transform duration-150"
                >
                  <ShippingLabelSheet
                    order={ord}
                    showSender={showSender}
                    showItems={showItems}
                    showQr={showQr}
                  />
                </div>
              ))
            ) : (
              // Single mode: Render currently active order
              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'center center',
                }}
                className="shadow-2xl rounded-sm transition-transform duration-150"
              >
                <ShippingLabelSheet
                  order={currentOrder}
                  showSender={showSender}
                  showItems={showItems}
                  showQr={showQr}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Modal Footer (Hidden in Print) ── */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400 no-print">
          <div className="flex items-center gap-2">
            <span>شماره سفارش: <strong className="text-white font-mono">{currentOrder.order_number}</strong></span>
            <span>•</span>
            <span>تحویل‌گیرنده: <strong className="text-white">{currentOrder.address?.recipient_name}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
            >
              بستن
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ (Print)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
