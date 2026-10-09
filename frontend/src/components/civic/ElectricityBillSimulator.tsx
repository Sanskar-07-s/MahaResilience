import React, { useState } from 'react';
import {
  Zap,
  Mail,
  Inbox,
  Star,
  Send,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Printer,
  RefreshCw,
  X,
  ArrowLeft,
  MoreVertical,
  Archive,
  Search,
  ExternalLink,
  ChevronRight,
  Receipt,
  Download,
  AlertCircle,
  Building,
  QrCode,
  Check,
} from 'lucide-react';

export interface MonthBillRecord {
  monthName: string;
  year: number;
  billNumber: string;
  units: number;
  baseAmount: number;
  status: 'PAID' | 'DUE' | 'OVERDUE';
  dueDate: string;
  paidDate?: string;
  transactionId?: string;
  receiptNumber?: string;
  paymentMode?: string;
  lateFee?: number;
  interestFee?: number;
  totalPayable: number;
}

interface ElectricityBillSimulatorProps {
  consumerNumber?: string;
  consumerName?: string;
  district?: string;
  onClose?: () => void;
}

export const ElectricityBillSimulator: React.FC<ElectricityBillSimulatorProps> = ({
  consumerNumber = '012345678910',
  consumerName = 'Rajesh S. Patil',
  district = 'Pune',
  onClose,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('rajesh.patil@gmail.com');
  const [activeTab, setActiveTab] = useState<'gmail' | 'summary'>('gmail');
  const [selectedEmailId, setSelectedEmailId] = useState<string>('current-bill-email');
  const [paymentSuccessNotification, setPaymentSuccessNotification] = useState<string | null>(null);

  // Simulation State for the 3-month cycle
  const [currentBillState, setCurrentBillState] = useState<'DUE' | 'PAID' | 'OVERDUE'>('OVERDUE');
  const [paidTxnId, setPaidTxnId] = useState('TXN-MSE-994821');
  const [paidReceiptNo, setPaidReceiptNo] = useState('RCPT-OCT-5520');
  const [paidTimestamp, setPaidTimestamp] = useState('Today, 02:35 PM');

  // Month records
  const previousMonth1: MonthBillRecord = {
    monthName: 'July',
    year: 2026,
    billNumber: 'MSE-JUL-94812',
    units: 148,
    baseAmount: 1320,
    status: 'PAID',
    dueDate: '2026-07-24',
    paidDate: '2026-07-14 (10 days before due date)',
    transactionId: 'TXN-MSE-774921',
    receiptNumber: 'RCPT-JUL-9481',
    paymentMode: 'UPI (Google Pay / BBPS)',
    lateFee: 0,
    interestFee: 0,
    totalPayable: 1320,
  };

  const previousMonth2: MonthBillRecord = {
    monthName: 'August',
    year: 2026,
    billNumber: 'MSE-AUG-11048',
    units: 164,
    baseAmount: 1450,
    status: 'PAID',
    dueDate: '2026-08-24',
    paidDate: '2026-08-18 (6 days before due date)',
    transactionId: 'TXN-MSE-883192',
    receiptNumber: 'RCPT-AUG-1104',
    paymentMode: 'Net Banking (SBI Internet Banking)',
    lateFee: 0,
    interestFee: 0,
    totalPayable: 1450,
  };

  const currentMonthUnits = 188;
  const currentBase = 1580;
  const currentLateSurcharge = 125; // DPC @ 2% + processing
  const currentInterestCharge = 45; // Penal interest for 6 days late

  const getCurrentRecord = (): MonthBillRecord => {
    if (currentBillState === 'PAID') {
      return {
        monthName: 'September',
        year: 2026,
        billNumber: 'MSE-SEP-55201',
        units: currentMonthUnits,
        baseAmount: currentBase,
        status: 'PAID',
        dueDate: '2026-09-22',
        paidDate: paidTimestamp,
        transactionId: paidTxnId,
        receiptNumber: paidReceiptNo,
        paymentMode: 'UPI Instant BBPS (Verified)',
        lateFee: 0,
        interestFee: 0,
        totalPayable: currentBase - 25, // with ₹25 prompt discount
      };
    }

    if (currentBillState === 'OVERDUE') {
      return {
        monthName: 'September',
        year: 2026,
        billNumber: 'MSE-SEP-55201',
        units: currentMonthUnits,
        baseAmount: currentBase,
        status: 'OVERDUE',
        dueDate: '2026-09-22 (Overdue by 6 days)',
        lateFee: currentLateSurcharge,
        interestFee: currentInterestCharge,
        totalPayable: currentBase + currentLateSurcharge + currentInterestCharge,
      };
    }

    return {
      monthName: 'September',
      year: 2026,
      billNumber: 'MSE-SEP-55201',
      units: currentMonthUnits,
      baseAmount: currentBase,
      status: 'DUE',
      dueDate: '2026-10-25',
      lateFee: 0,
      interestFee: 0,
      totalPayable: currentBase,
    };
  };

  const currentRecord = getCurrentRecord();

  // Handlers for simulation
  const handleSimulatePayCurrent = async (wasOverdue = false) => {
  try {
    await fetch('/api/sms/send-bill-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: recipientEmail, consumerName, consumerNumber, utilityType: 'ELECTRICITY', lastMonthAmount: 1450, currentMonthAmount: 1580, penaltyAmount: 170, totalPaidAmount: 1750 }) });
  } catch (_) {}

    const newTxn = `TXN-MSE-${Math.floor(100000 + Math.random() * 900000)}`;
    const newRcpt = `RCPT-SEP-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    setPaidTxnId(newTxn);
    setPaidReceiptNo(newRcpt);
    setPaidTimestamp(`Today at ${now}`);
    setCurrentBillState('PAID');
    setSelectedEmailId('current-bill-email');

    setPaymentSuccessNotification(
      `Payment of ₹${currentRecord.totalPayable} received! Official MSEDCL receipt sent to ${recipientEmail}.`
    );
    setTimeout(() => setPaymentSuccessNotification(null), 5000);
  };

  const handleSimulateOverdue = () => {
    setCurrentBillState('OVERDUE');
    setSelectedEmailId('overdue-warning-email');
    setPaymentSuccessNotification(
      `Overdue state triggered: DPC late charge (+₹${currentLateSurcharge}) and penalty (+₹${currentInterestCharge}) applied. Urgent advisory email delivered.`
    );
    setTimeout(() => setPaymentSuccessNotification(null), 5000);
  };

  const handleSimulateOnTime = () => {
    setCurrentBillState('DUE');
    setSelectedEmailId('current-bill-email');
    setPaymentSuccessNotification('Bill reset to Normal Due State (Due date in future, no late penalties).');
    setTimeout(() => setPaymentSuccessNotification(null), 4000);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-800 animate-fadeIn my-6">
      {/* Simulation Control Deck */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-400/30 rounded-xl">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              MSEDCL Electricity Bill & Live Gmail Simulation
            </h2>
            <span className="text-[10px] font-extrabold bg-amber-500/30 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Interactive Demo
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Experience realistic multi-month billing cycles: view paid previous month receipts, simulate paying the light bill to trigger instant official Gmail receipts, or simulate overdue charges past due dates.
          </p>
        </div>

        {/* Quick Simulator Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSimulatePayCurrent(currentBillState === 'OVERDUE')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all"
            title="Simulate paying the light bill and dispatching a receipt email"
          >
            <Check className="w-3.5 h-3.5" />
            Simulate Bill Paid
          </button>

          <button
            onClick={handleSimulateOverdue}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all"
            title="Simulate passing the due date with late charges"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Simulate Bill Overdue (+Charges)
          </button>

          <button
            onClick={handleSimulateOnTime}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all"
            title="Reset to unpaid before due date"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Bill
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Close Simulator"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Notification Banner */}
      {paymentSuccessNotification && (
        <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{paymentSuccessNotification}</span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-800 px-2 py-0.5 rounded">1 New Gmail Influx</span>
        </div>
      )}

      {/* Sub-bar: Consumer metadata and Recipient Email customizer */}
      <div className="bg-slate-800/90 text-white px-5 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Consumer No</span>
            <span className="font-mono font-bold text-amber-400">{consumerNumber}</span>
          </div>
          <div className="hidden sm:block border-l border-slate-700 h-6"></div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Consumer Name</span>
            <span className="font-bold text-white">{consumerName}</span>
          </div>
          <div className="hidden sm:block border-l border-slate-700 h-6"></div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Current State</span>
            <span
              className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${
                currentBillState === 'PAID'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : currentBillState === 'OVERDUE'
                  ? 'bg-red-500/20 text-red-300 border border-red-400/30 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              {currentBillState === 'PAID'
                ? '✓ Bill Paid (Receipt Sent)'
                : currentBillState === 'OVERDUE'
                ? '⚠️ Late / Overdue (+Charges)'
                : 'Pending On-Time Due'}
            </span>
          </div>
        </div>

        {/* Email Recipient Input */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-bold">Simulated Recipient:</span>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white font-mono outline-none focus:border-amber-400 w-56"
              placeholder="user@gmail.com"
            />
          </div>
        </div>
      </div>

      {/* Main Simulation Viewport: Authentic Gmail Interface */}
      <div className="bg-[#f6f8fc] flex-1 flex flex-col min-h-[580px]">
        {/* Gmail Window Top Header */}
        <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
          {/* Gmail Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-2xs">
                M
              </div>
              <span className="font-extrabold text-slate-700 text-lg tracking-tight flex items-center gap-1">
                Gmail
                <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded ml-1">
                  Simulator
                </span>
              </span>
            </div>
          </div>

          {/* Gmail Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                readOnly
                value="from:(mahadiscom.in) OR label:electricity-receipts"
                className="w-full pl-10 pr-4 py-2 bg-[#edf2fc] rounded-full text-xs text-slate-700 outline-none border border-transparent focus:bg-white focus:border-slate-300 focus:shadow-xs font-mono transition-all"
              />
            </div>
          </div>

          {/* User Avatar & Google Menu Icons */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">{recipientEmail}</span>
            <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
              {recipientEmail.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Gmail Body Grid: Sidebar + Email List & Reading Pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Gmail Sidebar */}
          <div className="w-full md:w-56 bg-[#f6f8fc] border-r border-slate-200 p-3 space-y-2 shrink-0">
            {/* Compose Button */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-[#c2e7ff] text-[#001d35] rounded-2xl font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer">
                <span>✏️</span>
                <span>Compose</span>
              </div>
            </div>

            {/* Folder List */}
            <nav className="space-y-0.5 text-xs font-bold text-slate-700">
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#d3e3fd] text-[#041e49] rounded-full cursor-pointer">
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                <span className="text-[11px] font-black bg-blue-600 text-white px-2 py-0.2 rounded-full">
                  {currentBillState === 'OVERDUE' ? '4' : '3'}
                </span>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-200/60 rounded-full cursor-pointer text-slate-600">
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </div>
                <span className="text-[11px] text-slate-400">1</span>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-200/60 rounded-full cursor-pointer text-slate-600">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" />
                  <span>Snoozed</span>
                </div>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-200/60 rounded-full cursor-pointer text-slate-600">
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4" />
                  <span>Sent</span>
                </div>
              </div>

              <div className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-200/60 rounded-full cursor-pointer text-slate-600">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4" />
                  <span>Trash</span>
                </div>
              </div>
            </nav>

            {/* Storage indicator */}
            <div className="pt-6 px-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Storage</span>
                <span>4.8 GB of 15 GB</span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[32%]"></div>
              </div>
            </div>
          </div>

          {/* Email Master/Detail Split View */}
          <div className="flex-1 flex flex-col lg:flex-row bg-white overflow-hidden">
            {/* Email List Column */}
            <div className="w-full lg:w-80 border-r border-slate-200 flex flex-col bg-white shrink-0 overflow-y-auto max-h-[220px] lg:max-h-none">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>MSEDCL Light Bill Emails</span>
                <span className="text-teal-700">Live Sync</span>
              </div>

              <div className="divide-y divide-slate-100">
                {/* 1. Current Month Paid Receipt (or normal pending notice) */}
                {currentBillState === 'PAID' && (
                  <div
                    onClick={() => setSelectedEmailId('current-bill-email')}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      selectedEmailId === 'current-bill-email' ? 'bg-[#e8f0fe]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        MSEDCL e-Receipts
                      </span>
                      <span className="text-slate-400 font-medium">Just now</span>
                    </div>
                    <div className="font-bold text-xs text-slate-800 line-clamp-1">
                      Payment Receipt: ₹{currentRecord.totalPayable} Received for Consumer #{consumerNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      Ref: {paidTxnId} • Payment successful via BBPS. Official invoice attached.
                    </div>
                  </div>
                )}

                {/* 2. Overdue Warning Notice Email (Displayed prominently when in Overdue state) */}
                {currentBillState === 'OVERDUE' && (
                  <div
                    onClick={() => setSelectedEmailId('overdue-warning-email')}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      selectedEmailId === 'overdue-warning-email' ? 'bg-red-50/80 border-l-4 border-red-500' : 'hover:bg-red-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-extrabold text-red-900 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        MSEDCL Urgent Notice
                      </span>
                      <span className="text-red-600 font-bold">Urgent</span>
                    </div>
                    <div className="font-bold text-xs text-red-800 line-clamp-1">
                      ⚠️ OVERDUE NOTICE: Late Charges Applied (Consumer #{consumerNumber})
                    </div>
                    <div className="text-[11px] text-red-700 line-clamp-1 mt-0.5">
                      Due date 22nd passed. Delayed payment surcharge + interest added. Avoid disconnection.
                    </div>
                  </div>
                )}

                {/* 3. Current Month Normal Due Notice (If not paid and not overdue) */}
                {currentBillState === 'DUE' && (
                  <div
                    onClick={() => setSelectedEmailId('current-bill-email')}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      selectedEmailId === 'current-bill-email' ? 'bg-[#e8f0fe]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-extrabold text-slate-900">MSEDCL e-Billing</span>
                      <span className="text-slate-400">Oct 05</span>
                    </div>
                    <div className="font-bold text-xs text-slate-800 line-clamp-1">
                      Electricity Bill Invoice: Month of September (Due: 25th Oct)
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      Payable amount ₹{currentRecord.totalPayable}. Early payment discount applicable.
                    </div>
                  </div>
                )}

                {/* 4. Previous Month 2 (August Bill Paid Receipt) */}
                <div
                  onClick={() => setSelectedEmailId('prev-month-2-email')}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    selectedEmailId === 'prev-month-2-email' ? 'bg-[#e8f0fe]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-extrabold text-slate-800">MSEDCL e-Receipts</span>
                    <span className="text-slate-400">Aug 18</span>
                  </div>
                  <div className="font-bold text-xs text-slate-800 line-clamp-1">
                    Payment Receipt: ₹{previousMonth2.totalPayable} Received for Consumer #{consumerNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    Ref: {previousMonth2.transactionId} • Previous month bill paid on-time.
                  </div>
                </div>

                {/* 5. Previous Month 1 (July Bill Paid Receipt) */}
                <div
                  onClick={() => setSelectedEmailId('prev-month-1-email')}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    selectedEmailId === 'prev-month-1-email' ? 'bg-[#e8f0fe]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-extrabold text-slate-800">MSEDCL e-Receipts</span>
                    <span className="text-slate-400">Jul 14</span>
                  </div>
                  <div className="font-bold text-xs text-slate-800 line-clamp-1">
                    Payment Receipt: ₹{previousMonth1.totalPayable} Received for Consumer #{consumerNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    Ref: {previousMonth1.transactionId} • Early payment incentive credited.
                  </div>
                </div>
              </div>
            </div>

            {/* Email Reading Body Pane */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white space-y-4">
              {/* Email Action Header Controls */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-slate-600">
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Email
                  </button>
                </div>
              </div>

              {/* RENDER CASE A: CURRENT MONTH OVERDUE NOTICE EMAIL */}
              {selectedEmailId === 'overdue-warning-email' && currentBillState === 'OVERDUE' && (
                <div className="space-y-4">
                  {/* Subject Line */}
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      ⚠️ ACTION REQUIRED: Electricity Bill Overdue - Late Charges Levied on Consumer #{consumerNumber}
                    </h1>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded shrink-0">
                      High Priority
                    </span>
                  </div>

                  {/* Sender & Recipient Bar */}
                  <div className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                        ⚡
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>MSEDCL Urgent Notification Desk</span>
                          <span className="text-slate-400 font-normal">&lt;billing-urgent@mahadiscom.in&gt;</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 rounded font-semibold flex items-center gap-0.5">
                            ✓ Verified Government Sender
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          to <strong>{recipientEmail}</strong> (Consumer: {consumerName})
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs text-right">Yesterday, 9:15 AM</div>
                  </div>

                  {/* Authentic Official Overdue Email Content */}
                  <div className="bg-[#fff9f9] border border-red-200 rounded-2xl p-5 space-y-5">
                    {/* Official Notice Banner */}
                    <div className="flex items-center justify-between bg-red-600 text-white p-3.5 rounded-xl shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-300" />
                        <div>
                          <div className="font-black text-sm uppercase tracking-wide">
                            Delayed Payment Notice & Surcharge Advisory
                          </div>
                          <div className="text-[11px] text-red-100">
                            Issued under Section 56(1) of Indian Electricity Act, 2003
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs font-bold bg-red-700 px-2.5 py-1 rounded">
                        STATUS: PAST DUE
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      Dear <strong>{consumerName}</strong>, our records indicate that your Maharashtra State Electricity Distribution (MSEDCL) bill for the month of <strong>September 2026</strong> was due on <strong>22nd September</strong> and remains unpaid. Consequently, delayed payment charges (DPC) and interest have been applied to your ledger.
                    </p>

                    {/* Breakdown of Late Fees Table */}
                    <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="p-3 bg-red-50/70 border-b border-red-200 font-extrabold text-xs text-red-900">
                        Overdue Assessment & Revised Dues Breakdown
                      </div>
                      <div className="p-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Original Energy & Fixed Demand Charges:</span>
                          <span className="font-semibold text-slate-900">₹{currentBase}.00</span>
                        </div>
                        <div className="flex justify-between text-red-700">
                          <span>Delayed Payment Surcharge (DPC @ 2%):</span>
                          <span className="font-bold">+ ₹{currentLateSurcharge}.00</span>
                        </div>
                        <div className="flex justify-between text-red-700">
                          <span>Penal Interest on Arrears (6 Days Past Due):</span>
                          <span className="font-bold">+ ₹{currentInterestCharge}.00</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-base text-red-900">
                          <span>Total Revised Payable Now:</span>
                          <span className="text-lg text-red-600">₹{currentRecord.totalPayable}.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Disconnection Warning Box */}
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-900">
                      <div className="font-extrabold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" /> Disconnection Warning Notice
                      </div>
                      <p className="leading-relaxed text-[11px] text-amber-800">
                        To avoid temporary disconnection of supply at consumer meter <strong>EM-8910-442</strong> ({district} Circle), please clear the outstanding dues within <strong>7 business days</strong>.
                      </p>
                    </div>

                    {/* Direct In-Email Payment Action Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={() => handleSimulatePayCurrent(true)}
                        className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95"
                      >
                        <Zap className="w-4 h-4" />
                        Pay Total Dues With Late Charges (₹{currentRecord.totalPayable})
                      </button>

                      <span className="text-[11px] text-slate-500 italic text-center sm:text-left">
                        Instant payment clears late charges and immediately dispatches official receipt.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER CASE B: PAYMENT RECEIPT EMAIL (FOR CURRENT OR PREVIOUS MONTHS) */}
              {(selectedEmailId === 'current-bill-email' && currentBillState === 'PAID') ||
              selectedEmailId === 'prev-month-1-email' ||
              selectedEmailId === 'prev-month-2-email' ? (
                (() => {
                  const billToShow: MonthBillRecord =
                    selectedEmailId === 'prev-month-1-email'
                      ? previousMonth1
                      : selectedEmailId === 'prev-month-2-email'
                      ? previousMonth2
                      : currentRecord;

                  return (
                    <div className="space-y-4">
                      {/* Subject Line */}
                      <div className="flex items-start justify-between gap-4">
                        <h1 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                          Official Payment Receipt: ₹{billToShow.totalPayable} Received for Consumer #{consumerNumber} (Receipt #{billToShow.receiptNumber})
                        </h1>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full shrink-0">
                          Payment Confirmed
                        </span>
                      </div>

                      {/* Sender Info Bar */}
                      <div className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                            ✓
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>MSEDCL Payment & Revenue Gateway</span>
                              <span className="text-slate-400 font-normal">&lt;billing-noreply@mahadiscom.in&gt;</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 rounded font-semibold flex items-center gap-0.5">
                                ✓ Verified Government Tax Invoice
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              to <strong>{recipientEmail}</strong> (Consumer ID: {consumerNumber})
                            </div>
                          </div>
                        </div>
                        <div className="text-slate-400 text-xs text-right">{billToShow.paidDate}</div>
                      </div>

                      {/* Official Mahadiscom Branded Digital Receipt Box */}
                      <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs relative">
                        {/* Receipt Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
                              ⚡
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-base">
                                Maharashtra State Electricity Distribution Co. Ltd.
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                MAHAVITARAN • Government of Maharashtra Undertaking
                              </div>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-lg border border-emerald-300">
                              ✓ TAX INVOICE RECEIPT
                            </span>
                            <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                              Receipt: {billToShow.receiptNumber}
                            </div>
                          </div>
                        </div>

                        {/* Amount Banner */}
                        <div className="bg-emerald-700 text-white p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                              Amount Successfully Credited
                            </div>
                            <div className="text-2xl sm:text-3xl font-black">
                              ₹{billToShow.totalPayable.toLocaleString('en-IN')}.00
                            </div>
                          </div>
                          <div className="bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-600 text-xs">
                            <span className="block text-[10px] text-emerald-200 font-bold uppercase">Transaction ID</span>
                            <span className="font-mono font-bold">{billToShow.transactionId}</span>
                          </div>
                        </div>

                        {/* Two-Column Consumer & Payment Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-teal-600" /> Consumer & Connection Details
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Consumer Name:</span>
                              <span className="font-bold text-slate-800">{consumerName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Consumer Number:</span>
                              <span className="font-mono font-bold text-slate-800">{consumerNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Billing Circle / Ward:</span>
                              <span className="font-semibold text-slate-800">{district} Urban Circle</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Tariff Class:</span>
                              <span className="font-semibold text-slate-800">LT-1 Domestic</span>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-amber-600" /> Payment Audit Trail
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Payment Channel:</span>
                              <span className="font-semibold text-slate-800">{billToShow.paymentMode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Payment Date & Time:</span>
                              <span className="font-semibold text-slate-800">{billToShow.paidDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Units Billed:</span>
                              <span className="font-bold text-slate-800">{billToShow.units} kWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Payment Status:</span>
                              <span className="font-bold text-emerald-600">SETTLED & CLEARED</span>
                            </div>
                          </div>
                        </div>

                        {/* QR Code & Digital Signature Verification */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center text-slate-700">
                              <QrCode className="w-9 h-9" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-slate-800">MSEDCL Digitally Signed Document</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Hash: SHA256:{billToShow.transactionId?.replace('TXN-', '')}A982C
                              </div>
                              <div className="text-[10px] text-emerald-700 font-bold">
                                ✓ Authenticated on MahaDiscom Central Billing Node
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.print()}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                            </button>
                            <a
                              href="https://wss.mahadiscom.in/wss/wss?uiActionName=getViewPayBill"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                            >
                              Verify on Portal <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : null}

              {/* RENDER CASE C: CURRENT MONTH PENDING (BEFORE DUE DATE) EMAIL */}
              {selectedEmailId === 'current-bill-email' && currentBillState === 'DUE' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      MSEDCL Electricity Bill for September 2026: ₹{currentRecord.totalPayable} (Due: 25th October)
                    </h1>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full shrink-0">
                      Payment Due
                    </span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4 text-xs text-amber-900">
                    <div className="font-extrabold text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-700" /> Normal Due Date Reminder
                    </div>
                    <p className="leading-relaxed">
                      Your monthly electricity bill for Consumer No <strong>{consumerNumber}</strong> has been generated for <strong>{currentMonthUnits} kWh units</strong>.
                    </p>
                    <div className="bg-white p-3.5 rounded-xl border border-amber-200 font-semibold space-y-1">
                      <div className="flex justify-between">
                        <span>Due Date (Without Late Fee):</span>
                        <span className="font-bold text-slate-900">25th October 2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prompt Payment Discount If Paid Before 15th:</span>
                        <span className="font-bold text-emerald-600">- ₹25.00</span>
                      </div>
                      <div className="flex justify-between text-base font-black pt-1 border-t border-slate-100">
                        <span>Total Payable:</span>
                        <span className="text-amber-700">₹{currentRecord.totalPayable}.00</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleSimulatePayCurrent(false)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all"
                      >
                        <Check className="w-4 h-4" /> Pay Bill Promptly (₹{currentRecord.totalPayable - 25} with discount)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
