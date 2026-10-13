import React, { useState } from 'react';
import {
  Zap,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Droplets,
  Check,
  Coins,
  SunMedium,
  Layers,
  ChevronDown
} from 'lucide-react';
import { getApiUrl } from '../../config/api.config.ts';

export type BillingCategory = 'OVERDUE' | 'NORMAL' | 'OVERPAY' | 'SUBSIDIZED';

interface BillingWorkflowSimulatorProps {
  defaultEmail?: string;
  defaultConsumerName?: string;
}

export const BillingWorkflowSimulator: React.FC<BillingWorkflowSimulatorProps> = ({
  defaultEmail = 'sanskardhat6@gmail.com',
  defaultConsumerName = 'Sanskar Dhat',
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [consumerName, setConsumerName] = useState(defaultConsumerName);
  const [selectedUtility, setSelectedUtility] = useState<'ELECTRICITY' | 'WATER'>('ELECTRICITY');
  const [scenario, setScenario] = useState<BillingCategory>('OVERDUE');

  // Simulation Workflow Execution State
  const [workflowStep, setWorkflowStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{
    success: boolean;
    txnId: string;
    totalAmount: number;
    category: string;
    emailSent: boolean;
    timestamp: string;
    message: string;
  } | null>(null);

  // Computed values based on utility and category
  const isWater = selectedUtility === 'WATER';
  const lastMonthAmt = isWater ? 380 : 1450;
  const currentMonthBase = isWater ? 460 : 1580;
  const consumerNumber = isWater ? 'WTR-94281' : '012345678910';

  // Category specific calculations
  let adjustmentAmt = 0;
  let adjustmentLabel = 'No Surcharge';
  let adjustmentColor = 'text-slate-400';
  let totalPayable = currentMonthBase;

  if (scenario === 'OVERDUE') {
    adjustmentAmt = isWater ? 50 : 170;
    adjustmentLabel = 'Late Surcharge (+DPC)';
    adjustmentColor = 'text-red-400';
    totalPayable = currentMonthBase + adjustmentAmt;
  } else if (scenario === 'OVERPAY') {
    adjustmentAmt = isWater ? 140 : 420;
    adjustmentLabel = 'Advance Deposit (+Credit)';
    adjustmentColor = 'text-sky-400';
    totalPayable = currentMonthBase + adjustmentAmt;
  } else if (scenario === 'SUBSIDIZED') {
    adjustmentAmt = isWater ? 100 : 300;
    adjustmentLabel = 'Solar / Green Subsidy';
    adjustmentColor = 'text-emerald-400';
    totalPayable = Math.max(0, currentMonthBase - adjustmentAmt);
  } else {
    // NORMAL
    adjustmentAmt = 0;
    adjustmentLabel = 'Timely Payment Rebate';
    adjustmentColor = 'text-emerald-400';
    totalPayable = currentMonthBase;
  }

  const categoryDescriptions: Record<BillingCategory, { name: string; desc: string; icon: any }> = {
    OVERDUE: {
      name: 'Overdue Bill (+Late Surcharge)',
      desc: `Bill is 30 days overdue. Includes +₹${isWater ? 50 : 170} Delayed Payment Charge (DPC) & statutory interest.`,
      icon: AlertTriangle,
    },
    NORMAL: {
      name: 'Normal Bill (On-Time Due)',
      desc: 'Standard monthly billing cycle settled within due date with ₹0 late penalty.',
      icon: Check,
    },
    OVERPAY: {
      name: 'Overpay / Advance Deposit',
      desc: `Citizen pays an excess advance of +₹${isWater ? 140 : 420}. Surplus is credited to next month's consumer ledger.`,
      icon: Coins,
    },
    SUBSIDIZED: {
      name: 'Subsidized Bill (Solar / Green)',
      desc: `PM Surya Ghar & Green Generation tariff credit of -₹${isWater ? 100 : 300} applied directly.`,
      icon: SunMedium,
    },
  };

  const currentCategoryInfo = categoryDescriptions[scenario];

  const handleRunWorkflow = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    setIsRunning(true);
    setDeliveryResult(null);
    setWorkflowStep(1); // Step 1: Calculating Tariff

    // Progress to Step 2 after 700ms
    setTimeout(() => {
      setWorkflowStep(2); // Step 2: Authorizing Payment
    }, 700);

    // Progress to Step 3 and call API after 1400ms
    setTimeout(async () => {
      setWorkflowStep(3); // Step 3: Dispatching Email via Brevo

      const txn = `${isWater ? 'TXN-WTR' : 'TXN-MSE'}-${Math.floor(100000 + Math.random() * 900000)}`;

      try {
        const response = await fetch(getApiUrl('/api/sms/send-bill-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: recipientEmail,
            consumerName,
            consumerNumber,
            utilityType: selectedUtility,
            category: scenario,
            lastMonthAmount: lastMonthAmt,
            currentMonthAmount: currentMonthBase,
            penaltyAmount: scenario === 'OVERDUE' ? adjustmentAmt : 0,
            overpayAmount: scenario === 'OVERPAY' ? adjustmentAmt : 0,
            subsidyAmount: scenario === 'SUBSIDIZED' ? adjustmentAmt : 0,
            totalPaidAmount: totalPayable,
            transactionId: txn,
          }),
        });

        const data = await response.json();
        const now = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setWorkflowStep(4); // Step 4: Finished
        setIsRunning(false);

        setDeliveryResult({
          success: response.ok,
          txnId: txn,
          totalAmount: totalPayable,
          category: scenario,
          emailSent: !!data.emailSent,
          timestamp: now,
          message: data.message || 'Official digital receipt dispatched via Brevo Server',
        });
      } catch (err: any) {
        setWorkflowStep(4);
        setIsRunning(false);
        setDeliveryResult({
          success: false,
          txnId: txn,
          totalAmount: totalPayable,
          category: scenario,
          emailSent: false,
          timestamp: 'Just now',
          message: err.message || 'Dispatch error',
        });
      }
    }, 1400);
  };

  const handleReset = () => {
    setWorkflowStep(0);
    setDeliveryResult(null);
    setIsRunning(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-2xl space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-xl font-black shadow-md flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Billing Simulation & Live Email Dispatch Workflow
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Brevo Live
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Run an end-to-end civic billing workflow: choose your demo billing category (Overdue, Normal, Overpay, Subsidized), inspect multi-month ledger adjustments, simulate digital settlement, and dispatch an official tax receipt straight to Sanskar's email.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Brevo Delivery
          </span>
        </div>
      </div>

      {/* Control Deck: Utility Type, Dropdown Category List, and Recipient Email */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs">
        {/* 1. Utility Selector (Col 3) */}
        <div className="lg:col-span-3 space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            1. Civic Utility
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedUtility('ELECTRICITY');
                handleReset();
              }}
              className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedUtility === 'ELECTRICITY'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" /> Electricity
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedUtility('WATER');
                handleReset();
              }}
              className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                selectedUtility === 'WATER'
                  ? 'bg-sky-500 text-white shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Droplets className="w-4 h-4" /> Water
            </button>
          </div>
        </div>

        {/* 2. DEMO DROP LIST: Category Selector (Col 5) */}
        <div className="lg:col-span-5 space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              2. Demo Drop List: Billing Category
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase">Select Scenario</span>
          </label>

          {/* Interactive Styled Select Dropdown */}
          <div className="relative">
            <select
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value as BillingCategory);
                handleReset();
              }}
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 hover:border-indigo-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 rounded-xl font-bold text-xs text-white outline-none cursor-pointer shadow-inner appearance-none transition-all"
            >
              <option value="OVERDUE">⚠️ Overdue Category — Late Surcharge Penalty (+₹{isWater ? 50 : 170})</option>
              <option value="NORMAL">✅ Normal Category — Regular On-Time Due (₹0 Surcharge)</option>
              <option value="OVERPAY">💎 Overpay Category — Advance Deposit Credit (+₹{isWater ? 140 : 420})</option>
              <option value="SUBSIDIZED">☀️ Subsidized Category — Solar / Green Rebate (-₹{isWater ? 100 : 300})</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Quick Category Chips for Single-Click Selection */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => { setScenario('OVERDUE'); handleReset(); }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                scenario === 'OVERDUE'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-300" /> Overdue
            </button>
            <button
              type="button"
              onClick={() => { setScenario('NORMAL'); handleReset(); }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                scenario === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Check className="w-3 h-3" /> Normal
            </button>
            <button
              type="button"
              onClick={() => { setScenario('OVERPAY'); handleReset(); }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                scenario === 'OVERPAY'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Coins className="w-3 h-3 text-sky-200" /> Overpay
            </button>
            <button
              type="button"
              onClick={() => { setScenario('SUBSIDIZED'); handleReset(); }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                scenario === 'SUBSIDIZED'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <SunMedium className="w-3 h-3 text-amber-200" /> Subsidy
            </button>
          </div>
        </div>

        {/* 3. Recipient Email Customizer (Col 4) */}
        <div className="lg:col-span-4 space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>3. Recipient Email</span>
            <span className="text-[10px] text-emerald-400 font-mono">Live Target</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="sanskardhat6@gmail.com"
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white outline-none focus:border-indigo-400"
            />
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Target Citizen: <span className="text-white font-semibold">{consumerName}</span>
          </div>
        </div>
      </div>

      {/* Selected Category Banner Details */}
      <div className="p-3.5 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl flex items-center gap-3 text-xs">
        <div className="p-2 bg-indigo-900/60 rounded-xl text-amber-400 shrink-0">
          <currentCategoryInfo.icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-white flex items-center gap-2">
            <span>Active Demo Category: {currentCategoryInfo.name}</span>
            <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-mono uppercase">
              {scenario}
            </span>
          </div>
          <div className="text-slate-300 text-[11px] mt-0.5">
            {currentCategoryInfo.desc}
          </div>
        </div>
      </div>

      {/* Multi-Month Ledger Display Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Previous Month */}
        <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>Previous Month</span>
            <span className="text-emerald-400 font-bold">✓ PAID</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-white">₹{lastMonthAmt.toLocaleString('en-IN')}.00</div>
          <div className="text-[10px] text-slate-400">Settled via UPI / BBPS</div>
        </div>

        {/* Current Month Base */}
        <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>Current Month</span>
            <span className="text-amber-400 font-bold">Base Tariff</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-300">₹{currentMonthBase.toLocaleString('en-IN')}.00</div>
          <div className="text-[10px] text-slate-400">{isWater ? 'Standard Water Consumption' : 'Domestic LT-1 Tiered Units'}</div>
        </div>

        {/* Dynamic Category Adjustment */}
        <div
          className={`p-3.5 rounded-2xl border space-y-1 ${
            scenario === 'OVERDUE'
              ? 'bg-red-500/10 border-red-500/30 text-red-200'
              : scenario === 'OVERPAY'
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
              : scenario === 'SUBSIDIZED'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>Category Adjustment</span>
            <span>{scenario}</span>
          </div>
          <div className={`text-lg sm:text-xl font-black ${adjustmentColor}`}>
            {scenario === 'OVERDUE'
              ? `+ ₹${adjustmentAmt}.00`
              : scenario === 'OVERPAY'
              ? `+ ₹${adjustmentAmt}.00`
              : scenario === 'SUBSIDIZED'
              ? `- ₹${adjustmentAmt}.00`
              : '₹0.00'}
          </div>
          <div className="text-[10px] text-slate-400">
            {adjustmentLabel}
          </div>
        </div>

        {/* Net Total Payable / Settled */}
        <div className="p-3.5 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl border border-indigo-400/40 space-y-1">
          <div className="text-[10px] font-bold text-indigo-300 uppercase">
            Total Settled on Receipt
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">₹{totalPayable.toLocaleString('en-IN')}.00</div>
          <div className="text-[10px] text-indigo-200/80 font-mono">
            Consumer CAN: {consumerNumber}
          </div>
        </div>
      </div>

      {/* Workflow Step Tracker (Live Animated Bar) */}
      {isRunning && (
        <div className="bg-indigo-950/80 border border-indigo-500/40 p-4 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
            <span>Executing Workflow for Category: {scenario}...</span>
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Step {workflowStep}/3
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div
              className={`p-2 rounded-xl text-center font-bold transition-all ${
                workflowStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              1. Compute Category Tariff
            </div>
            <div
              className={`p-2 rounded-xl text-center font-bold transition-all ${
                workflowStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              2. Settlement Ledger Entry
            </div>
            <div
              className={`p-2 rounded-xl text-center font-bold transition-all ${
                workflowStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              3. Dispatch Brevo Email
            </div>
          </div>
        </div>
      )}

      {/* Main Send Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40 p-4 rounded-2xl border border-white/10">
        <div className="space-y-0.5">
          <div className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>Ready to Dispatch Category Receipt</span>
            <span className="text-xs text-amber-400 font-mono font-bold">Total: ₹{totalPayable}.00</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Dispatches an official tax invoice receipt ({currentCategoryInfo.name}) straight to <strong>{recipientEmail}</strong> via Brevo.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunWorkflow}
          disabled={isRunning}
          className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2.5 shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Simulating & Sending Email...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-slate-950" />
              <span>🚀 Simulate Workflow & Send {scenario} Receipt</span>
            </>
          )}
        </button>
      </div>

      {/* Real-time Delivery Report Result Card */}
      {deliveryResult && (
        <div className="bg-emerald-950/80 border border-emerald-400/40 p-5 rounded-2xl space-y-3 animate-fadeIn text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/40 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-sm text-emerald-200">
                Official {deliveryResult.category} Bill Receipt Delivered Successfully!
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono bg-emerald-900/60 px-2 py-0.5 rounded">
              Timestamp: {deliveryResult.timestamp}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Recipient</span>
              <span className="font-bold text-white font-mono">{recipientEmail}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Category Sent</span>
              <span className="font-bold text-white uppercase">{deliveryResult.category}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Amount Settled</span>
              <span className="font-extrabold text-emerald-300">₹{deliveryResult.totalAmount}.00</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Brevo Delivery</span>
              <span className="font-extrabold text-emerald-300">✓ Delivered to Inbox</span>
            </div>
          </div>

          <p className="text-[11px] text-emerald-300/80 italic pt-1">
            {deliveryResult.message}. Please check your Gmail inbox (`{recipientEmail}`) for the official tax invoice receipt from MahaResilience.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 rounded-xl font-bold text-xs transition-all"
            >
              Test Another Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingWorkflowSimulator;
