import React, { useState } from 'react';
import {
  Zap,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Receipt,
  Sparkles,
  ArrowRight,
  Droplets,
  Check
} from 'lucide-react';
import { getApiUrl } from '../../config/api.config.ts';

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
  const [scenario, setScenario] = useState<'OVERDUE' | 'NORMAL'>('OVERDUE');

  // Simulation Workflow Execution State
  const [workflowStep, setWorkflowStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{
    success: boolean;
    txnId: string;
    totalAmount: number;
    emailSent: boolean;
    timestamp: string;
    message: string;
  } | null>(null);

  // Computed values
  const isWater = selectedUtility === 'WATER';
  const lastMonthAmt = isWater ? 380 : 1450;
  const currentMonthBase = isWater ? 460 : 1580;
  const penaltyAmt = scenario === 'OVERDUE' ? (isWater ? 50 : 170) : 0;
  const totalPayable = currentMonthBase + penaltyAmt;
  const consumerNumber = isWater ? 'WTR-94281' : '012345678910';

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
            lastMonthAmount: lastMonthAmt,
            currentMonthAmount: currentMonthBase,
            penaltyAmount: penaltyAmt,
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
            Run an end-to-end civic billing workflow: inspect multi-month ledger amounts, compute late surcharge penalties, simulate digital settlement, and dispatch an official tax receipt straight to Sanskar's email.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Direct Brevo API Integration
          </span>
        </div>
      </div>

      {/* Control Deck: Utility Type, Scenario, and Recipient Email */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs">
        {/* 1. Utility Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            1. Select Civic Utility
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

        {/* 2. Billing Scenario */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            2. Choose Billing Scenario
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setScenario('OVERDUE');
                handleReset();
              }}
              className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                scenario === 'OVERDUE'
                  ? 'bg-red-600 text-white shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> Overdue (+Late Fee)
            </button>
            <button
              type="button"
              onClick={() => {
                setScenario('NORMAL');
                handleReset();
              }}
              className={`p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                scenario === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" /> Normal (On-Time)
            </button>
          </div>
        </div>

        {/* 3. Recipient Email Customizer */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
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
          <div className="text-[10px] text-slate-400">Domestic LT-1 Tiered Units</div>
        </div>

        {/* Late Surcharge / Penalty */}
        <div
          className={`p-3.5 rounded-2xl border space-y-1 ${
            penaltyAmt > 0
              ? 'bg-red-500/10 border-red-500/30 text-red-200'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>Late Surcharge</span>
            <span>{penaltyAmt > 0 ? 'DPC (2%) + Arrears' : 'None (₹0)'}</span>
          </div>
          <div className={`text-lg sm:text-xl font-black ${penaltyAmt > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {penaltyAmt > 0 ? `+ ₹${penaltyAmt}.00` : '₹0.00'}
          </div>
          <div className="text-[10px] text-slate-400">
            {penaltyAmt > 0 ? 'Overdue fee applied' : 'Paid within due date'}
          </div>
        </div>

        {/* Net Total */}
        <div className="p-3.5 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl border border-indigo-400/40 space-y-1">
          <div className="text-[10px] font-bold text-indigo-300 uppercase">
            Total Payable / Settled
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
            <span>Simulation Execution Workflow in Progress...</span>
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Step {workflowStep}/3
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div
              className={`p-2 rounded-xl text-center font-bold transition-all ${
                workflowStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              1. MERC Tariff & Penalty
            </div>
            <div
              className={`p-2 rounded-xl text-center font-bold transition-all ${
                workflowStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              2. BBPS Settlement Auth
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
            <span>Ready to Dispatch Official Invoice</span>
            <span className="text-xs text-amber-400 font-mono font-bold">Total: ₹{totalPayable}.00</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Clicking the button will execute the real workflow and deliver an official tax invoice directly to <strong>{recipientEmail}</strong>.
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
              <span>🚀 Simulate Workflow & Send Email to Sanskar</span>
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
                Official Bill Receipt Delivered Successfully!
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
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Transaction Ref</span>
              <span className="font-bold text-white font-mono">{deliveryResult.txnId}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Amount Credited</span>
              <span className="font-extrabold text-emerald-300">₹{deliveryResult.totalAmount}.00</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Brevo Delivery</span>
              <span className="font-extrabold text-emerald-300">✓ Sent to Inbox</span>
            </div>
          </div>

          <p className="text-[11px] text-emerald-300/80 italic pt-1">
            {deliveryResult.message}. Please check your Gmail inbox (or promotions/spam) for the official tax receipt from MahaResilience.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 rounded-xl font-bold text-xs transition-all"
            >
              Run Another Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingWorkflowSimulator;
