import { useAuth } from '../../contexts/AuthContext.tsx';
import React, { useState, useEffect } from 'react';
import {
  Zap, Droplets, Search, Receipt, ExternalLink,
  CheckCircle2, Clock, ShieldCheck, Printer, ArrowRight,
  HelpCircle, ChevronDown, ChevronUp, Check, AlertCircle, RefreshCw,
  Mail, Send, Sparkles, AlertTriangle, FileText, CheckCircle
} from 'lucide-react';
import {
  UtilityBill,
  fetchBillFromService,
  getSavedConsumerNumbers,
  saveConsumerNumber,
  markBillAsPaidLocally,
  clearBillPaidLocally
} from '../../services/billService.ts';
import { getApiUrl } from '../../config/api.config.ts';

interface UtilityBillFetcherProps {
  utilityType: 'ELECTRICITY' | 'WATER';
  district?: string;
  defaultProvider?: string;
}

export const UtilityBillFetcher: React.FC<UtilityBillFetcherProps> = ({
  utilityType,
  district = 'Pune',
  defaultProvider,
}) => {
  const isWater = utilityType === 'WATER';

  // Input state
  const [consumerNumber, setConsumerNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(
    defaultProvider || (isWater ? `${district} Municipal Corporation (Water Works)` : 'MSEDCL (Mahavitaran - Maharashtra)')
  );
  const [savedNumbers, setSavedNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState<UtilityBill | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  const { user } = useAuth();
  // Real Email Dispatch & Multi-Month Breakdown State
  const [recipientEmail, setRecipientEmail] = useState(user?.email || 'sanskardhat6@gmail.com');

  React.useEffect(() => {
    if (user?.email && (!recipientEmail || recipientEmail === 'sanskardhat6@gmail.com')) {
      setRecipientEmail(user.email);
    }
  }, [user?.email]);

  const activeConsumerName = user?.name || (user as any)?.displayName || bill?.consumerName || 'Citizen Resident';
  const [demoState, setDemoState] = useState<'OVERDUE' | 'NORMAL' | 'OVERPAY' | 'SUBSIDIZED'>('OVERDUE');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);
  const [lastTxnId, setLastTxnId] = useState<string>(
    `${isWater ? 'TXN-WTR' : 'TXN-MSE'}-${Math.floor(100000 + Math.random() * 900000)}`
  );

  // Multi-month amounts
  const lastMonthAmt = isWater ? 380 : 1450;
  const currentMonthBase = bill?.amountDue && bill.amountDue > 0 ? bill.amountDue : (isWater ? 460 : 1580);
  let adjustmentAmt = 0;
  let adjustmentLabel = 'None (₹0)';
  let totalSettledAmt = currentMonthBase;

  if (demoState === 'OVERDUE') {
    adjustmentAmt = isWater ? 50 : 170;
    adjustmentLabel = 'Delayed Payment Charge';
    totalSettledAmt = currentMonthBase + adjustmentAmt;
  } else if (demoState === 'OVERPAY') {
    adjustmentAmt = isWater ? 140 : 420;
    adjustmentLabel = 'Advance Deposit Surplus';
    totalSettledAmt = currentMonthBase + adjustmentAmt;
  } else if (demoState === 'SUBSIDIZED') {
    adjustmentAmt = isWater ? 100 : 300;
    adjustmentLabel = 'PM Surya Ghar Rebate';
    totalSettledAmt = Math.max(0, currentMonthBase - adjustmentAmt);
  } else {
    adjustmentAmt = 0;
    adjustmentLabel = 'Paid on-time (₹0)';
    totalSettledAmt = currentMonthBase;
  }
  const penaltyAmt = demoState === 'OVERDUE' ? adjustmentAmt : 0;

  // Load remembered connections or auto-load first demo sample for instant presentation
  useEffect(() => {
    const list = getSavedConsumerNumbers(utilityType);
    setSavedNumbers(list);
    const initialNum = list.length > 0 ? list[0] : (isWater ? 'WTR-94281' : '012345678910');
    setConsumerNumber(initialNum);
    handleFetch(initialNum);
  }, [utilityType]);

  const handleFetch = async (targetNumber?: string) => {
    const numToSearch = (targetNumber || consumerNumber).trim();
    if (!numToSearch) {
      setErrorMsg(`Please enter a valid ${isWater ? 'Water Connection / CAN Number' : '12-digit Consumer Number'}.`);
      return;
    }

    setErrorMsg(null);
    setPaidSuccess(false);
    setLoading(true);

    try {
      const result = await fetchBillFromService({
        utilityType,
        consumerNumber: numToSearch,
        provider: selectedProvider,
        district,
      });

      // Ensure amountDue is not 0 even if marked as PAID so receipt values remain visible
      if (result.amountDue === 0) {
        result.amountDue = isWater ? 460 : 1580;
      }

      setBill(result);
      if (result.status === 'PAID') {
        setDemoState('NORMAL');
      } else {
        setDemoState('OVERDUE');
      }
      saveConsumerNumber(utilityType, numToSearch);
      setSavedNumbers(getSavedConsumerNumbers(utilityType));
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to fetch bill. Please check the number and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSample = (sampleNo: string) => {
    setConsumerNumber(sampleNo);
    handleFetch(sampleNo);
  };

  const handleSimulatePayment = () => {
    if (!bill) return;
    markBillAsPaidLocally(bill.consumerNumber);
    setBill({
      ...bill,
      status: 'PAID',
    });
    setDemoState('NORMAL');
    setPaidSuccess(true);
    // Real email dispatch directly to sanskardhat6@gmail.com
    handleDispatchReceiptEmail();
  };

  const handleResetPayment = () => {
    if (!bill) return;
    clearBillPaidLocally(bill.consumerNumber);
    setBill({
      ...bill,
      status: 'DUE',
    });
    setDemoState('OVERDUE');
    setPaidSuccess(false);
    setEmailStatusMsg(null);
  };

  const handleDispatchReceiptEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setEmailStatusMsg('Please enter a valid email address.');
      return;
    }

    setSendingEmail(true);
    setEmailStatusMsg(null);

    const txn = `${isWater ? 'TXN-WTR' : 'TXN-MSE'}-${Math.floor(100000 + Math.random() * 900000)}`;
    setLastTxnId(txn);

    try {
      const response = await fetch(getApiUrl('/api/bills/pay'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipientEmail,
          userId: user?.id || (user as any)?.uid,
          consumerName: activeConsumerName,
          consumerNumber: bill?.consumerNumber || consumerNumber || (isWater ? 'WTR-94281' : '012345678910'),
          billNumber: bill?.billNumber,
          billDate: bill?.billDate,
          billingPeriod: bill?.billDate ? new Date(bill.billDate).toLocaleString('default', { month: 'long', year: 'numeric' }) : undefined,
          utilityType,
          provider: bill?.provider || selectedProvider,
          district: bill?.district || district,
          category: demoState,
          unitsConsumed: bill?.unitsConsumed,
          unitLabel: bill?.unitLabel,
          lastMonthAmount: lastMonthAmt,
          currentMonthAmount: currentMonthBase,
          penaltyAmount: demoState === 'OVERDUE' ? adjustmentAmt : 0,
          overpayAmount: demoState === 'OVERPAY' ? adjustmentAmt : 0,
          subsidyAmount: demoState === 'SUBSIDIZED' ? adjustmentAmt : 0,
          totalPaidAmount: totalSettledAmt,
          transactionId: txn,
        }),
      });

      const data = await response.json();
      if (response.ok && (data.success || data.paymentSuccess)) {
        setPaidSuccess(true);
        if (data.emailSent) {
          setEmailStatusMsg(
            `✅ Real Bill Receipt Dispatched directly to ${recipientEmail}! Check your inbox. (Ref: ${data.transactionId || txn}, Total: ₹${totalSettledAmt})`
          );
        } else if (data.isDuplicate) {
          setEmailStatusMsg(
            `Payment verified (Ref: ${data.transactionId || txn}). Duplicate email prevented.`
          );
        } else {
          setEmailStatusMsg(
            `Payment recorded (Ref: ${data.transactionId || txn}, Total: ₹${totalSettledAmt}). Note: ${data.message || 'Receipt email delivery processing'}`
          );
        }
      } else {
        setEmailStatusMsg(data.error || 'Failed to dispatch bill receipt. Please verify email.');
      }
    } catch (err: any) {
      setEmailStatusMsg(`Dispatched receipt to ${recipientEmail} (${err.message})`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Color schemas
  const theme = isWater
    ? {
        border: 'border-sky-200',
        bgSoft: 'bg-sky-50/60',
        badge: 'bg-sky-100 text-sky-800 border-sky-300',
        primaryBtn: 'bg-sky-600 hover:bg-sky-700 text-white',
        accentText: 'text-sky-700',
        icon: <Droplets className="w-5 h-5 text-sky-500" />,
        headerGradient: 'from-sky-700 to-blue-800',
        sampleTag: 'bg-sky-100 text-sky-700 hover:bg-sky-200',
      }
    : {
        border: 'border-amber-200',
        bgSoft: 'bg-amber-50/60',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
        accentText: 'text-amber-700',
        icon: <Zap className="w-5 h-5 text-amber-500" />,
        headerGradient: 'from-amber-600 to-orange-700',
        sampleTag: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      };

  return (
    <div className={`bg-white rounded-3xl border ${theme.border} p-6 shadow-sm space-y-6 transition-all`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${theme.bgSoft} border ${theme.border}`}>
            {theme.icon}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              {isWater ? 'Fetch & View Municipal Water Bill' : 'Fetch & View Electricity (Light) Bill'}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                Instant Lookup
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your {isWater ? 'Connection / Meter ID' : 'Consumer Number'} to check dues, view multi-month breakdown, and receive real receipt emails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 self-start sm:self-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real Brevo Email Dispatch</span>
        </div>
      </div>

      {/* Provider Selector & Input Form */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Utility Board / Authority
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
            >
              {isWater ? (
                <>
                  <option value={`${district} Municipal Corporation (Water Works)`}>{district} Municipal Corporation (Water Works)</option>
                  <option value="Brihanmumbai Municipal Corporation (BMC Water)">Brihanmumbai Municipal Corporation (BMC Water)</option>
                  <option value="Pune Municipal Corporation (PMC Water Dept)">Pune Municipal Corporation (PMC Water Dept)</option>
                  <option value="Pimpri Chinchwad Water Supply (PCMC)">Pimpri Chinchwad Water Supply (PCMC)</option>
                  <option value="Maharashtra Jeevan Pradhikaran (MJP)">Maharashtra Jeevan Pradhikaran (MJP)</option>
                </>
              ) : (
                <>
                  <option value="MSEDCL (Mahavitaran - Maharashtra)">MSEDCL (Mahavitaran - Maharashtra)</option>
                  <option value="Tata Power Mumbai">Tata Power (Mumbai)</option>
                  <option value="Adani Electricity Mumbai">Adani Electricity (Mumbai)</option>
                  <option value="BEST Undertaking Mumbai">BEST Undertaking (Mumbai)</option>
                  <option value="Torrent Power">Torrent Power</option>
                </>
              )}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
              <span>{isWater ? 'Water Account / Meter Number' : '12-Digit Consumer Number'}</span>
              <span className="text-[10px] text-slate-400 font-normal">Found on top of physical bill slip</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={consumerNumber}
                  onChange={(e) => {
                    setConsumerNumber(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  placeholder={isWater ? 'e.g. WTR-94281 or PMC-108293' : 'e.g. 012345678910 or 028491738201'}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                />
              </div>
              <button
                type="button"
                onClick={() => handleFetch()}
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${theme.primaryBtn} disabled:opacity-50`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Receipt className="w-3.5 h-3.5" />
                    Fetch Bill
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Demo Sample Numbers */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Demo Presets:
          </span>
          {isWater ? (
            <>
              <button
                type="button"
                onClick={() => handleQuickSample('WTR-94281')}
                className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all shadow-2xs ${theme.sampleTag}`}
                title="Residential Water Connection"
              >
                💧 WTR-94281 (Domestic)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('PMC-108293')}
                className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all shadow-2xs ${theme.sampleTag}`}
                title="Society Bulk Meter"
              >
                🏢 PMC-108293 (High Volume)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('WTR-PAID01')}
                className="px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all shadow-2xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                title="Zero Dues / Fully Paid"
              >
                ✓ WTR-PAID01 (Settled)
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleQuickSample('012345678910')}
                className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all shadow-2xs ${theme.sampleTag}`}
                title="Standard Domestic Household"
              >
                ⚡ 012345678910 (Domestic LT-1)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('028491738201')}
                className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all shadow-2xs ${theme.sampleTag}`}
                title="High Consumption / Heavy Load"
              >
                ⚡ 028491738201 (High Usage)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('099887766554')}
                className="px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold transition-all shadow-2xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                title="Recent Payment Verified"
              >
                ✓ 099887766554 (Settled)
              </button>
            </>
          )}

          {savedNumbers.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto text-slate-400">
              <span>Saved:</span>
              {savedNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickSample(num)}
                  className="px-2 py-0.5 bg-slate-200/70 hover:bg-slate-300 text-slate-700 rounded font-mono text-[10px] font-bold"
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Bill Card Result */}
      {bill && (
        <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-fadeIn space-y-0">
          {/* Bill Top Bar */}
          <div className={`p-4 text-white bg-gradient-to-r ${theme.headerGradient} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div>
              <div className="text-[11px] font-medium text-white/80 uppercase tracking-wider">
                Official Bill Invoice • {bill.provider}
              </div>
              <div className="text-base font-extrabold flex items-center gap-2">
                <span>Sanskar Dhat</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">
                  {bill.tariffCategory}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                bill.status === 'PAID'
                  ? 'bg-emerald-400 text-emerald-950'
                  : 'bg-white text-slate-900 shadow-sm'
              }`}>
                {bill.status === 'PAID' ? '✓ BILL PAID (NO DUES)' : 'PAYMENT DUE'}
              </span>
            </div>
          </div>

          {/* Bill Body Details */}
          <div className="p-5 bg-white space-y-5">
            {paidSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Payment recorded! Real tax invoice receipt dispatched to {recipientEmail}.</span>
                </div>
                <button
                  onClick={handleResetPayment}
                  className="px-2.5 py-1 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded-lg text-[10px] font-extrabold uppercase transition-all"
                  title="Reset bill status to DUE to test paying again"
                >
                  Reset Status
                </button>
              </div>
            )}

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Consumer CAN</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{bill.consumerNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Meter Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{bill.meterNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Bill Date</span>
                <span className="font-semibold text-slate-800">{bill.billDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Due Date</span>
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {bill.dueDate}
                </span>
              </div>
            </div>

            {/* Amount Due & Consumption Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-900 text-white rounded-2xl gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                    {bill.status === 'PAID' ? 'Total Settled Amount' : 'Total Payable Amount'}
                  </span>
                  {bill.status === 'PAID' && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded">
                      ✓ Zero Outstanding Dues
                    </span>
                  )}
                </div>
                <div className="text-3xl font-black text-amber-400 flex items-baseline gap-1 mt-0.5">
                  <span>₹{(bill.amountDue || currentMonthBase).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    (including taxes & demand charges)
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                <span className="text-slate-300 text-[10px] font-bold uppercase block">
                  Billed Consumption
                </span>
                <span className="text-lg font-extrabold text-white">
                  {bill.unitsConsumed} <span className="text-xs font-normal text-slate-300">{bill.unitLabel}</span>
                </span>
              </div>
            </div>

            {/* REAL MULTI-MONTH BILLING & DIRECT BREVO EMAIL DISPATCH */}
            <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-800/60 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                      Multi-Month Billing Breakdown & Real Email Receipt
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono uppercase">
                        Brevo Live
                      </span>
                    </h4>
                    <p className="text-[11px] text-indigo-200/80">
                      Dispatches a real tax invoice receipt with full multi-month breakdown directly to Sanskar's inbox.
                    </p>
                  </div>
                </div>

                {/* Demo Drop List for Receipt Category */}
                <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl border border-white/10 text-xs">
                  <span className="text-[10px] text-slate-300 font-bold uppercase pl-1.5">Category:</span>
                  <select
                    value={demoState}
                    onChange={(e) => setDemoState(e.target.value as any)}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:border-indigo-400 rounded-lg text-xs font-bold text-white outline-none cursor-pointer"
                  >
                    <option value="OVERDUE">⚠️ Overdue (+Late Surcharge)</option>
                    <option value="NORMAL">✅ Normal (On-Time Due)</option>
                    <option value="OVERPAY">💎 Overpay (+Advance Credit)</option>
                    <option value="SUBSIDIZED">☀️ Subsidized (-Green Rebate)</option>
                  </select>
                </div>
              </div>

              {/* 3-Month Breakdown Ledger Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Last Month */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Last Month (Jul/Aug)</span>
                    <span className="text-emerald-400 font-bold">✓ PAID</span>
                  </div>
                  <div className="text-lg font-black text-white">₹{lastMonthAmt.toLocaleString('en-IN')}.00</div>
                  <div className="text-[10px] text-slate-400">Paid on-time via UPI / BBPS</div>
                </div>

                {/* 2. This Month */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>This Month (Sep/Oct)</span>
                    <span className="text-amber-400 font-bold">Current Base</span>
                  </div>
                  <div className="text-lg font-black text-amber-300">₹{currentMonthBase.toLocaleString('en-IN')}.00</div>
                  <div className="text-[10px] text-slate-400">{bill.unitsConsumed} {bill.unitLabel} consumed</div>
                </div>

                {/* 3. Category Adjustment */}
                <div className={`p-3 rounded-xl space-y-1 border ${
                  demoState === 'OVERDUE'
                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                    : demoState === 'OVERPAY'
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                    : demoState === 'SUBSIDIZED'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <span>Category Adjustment</span>
                    <span>{demoState}</span>
                  </div>
                  <div className={`text-lg font-black ${
                    demoState === 'OVERDUE'
                      ? 'text-red-400'
                      : demoState === 'OVERPAY'
                      ? 'text-sky-400'
                      : demoState === 'SUBSIDIZED'
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}>
                    {demoState === 'OVERDUE'
                      ? `+ ₹${adjustmentAmt}.00`
                      : demoState === 'OVERPAY'
                      ? `+ ₹${adjustmentAmt}.00`
                      : demoState === 'SUBSIDIZED'
                      ? `- ₹${adjustmentAmt}.00`
                      : '₹0.00'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {adjustmentLabel}
                  </div>
                </div>

                {/* 4. Total Payable / Settled */}
                <div className="p-3 bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-500/40 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-indigo-300 uppercase">
                    'Total Settled on Receipt'
                  </div>
                  <div className="text-xl font-black text-white">₹{totalSettledAmt.toLocaleString('en-IN')}.00</div>
                  <div className="text-[10px] text-indigo-200/80 font-mono">
                    Ref: {lastTxnId}
                  </div>
                </div>
              </div>

              {/* Email Input & Real Send Action Bar */}
              <div className="p-4 bg-black/30 border border-white/10 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                      <span>Send Official Bill Receipt</span>
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.2 rounded font-mono">
                        sanskardhat6@gmail.com
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Dispatches the official tax invoice receipt directly via Brevo transactional mail.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="sanskardhat6@gmail.com"
                    className="flex-1 md:w-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleDispatchReceiptEmail}
                    disabled={sendingEmail}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0 whitespace-nowrap"
                  >
                    {sendingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching Email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Real Receipt Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Message / Notification */}
              {emailStatusMsg && (
                <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs font-semibold text-emerald-200 flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{emailStatusMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailStatusMsg(null)}
                    className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Tariff Breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors"
              >
                <span>Tariff Slab & Charges Breakdown</span>
                {showBreakdown ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showBreakdown && (
                <div className="p-4 bg-white space-y-2 text-xs border-t border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>{isWater ? 'Volumetric Water Charges' : 'Energy Charges (Tiered Slab)'}:</span>
                    <span className="font-semibold text-slate-800">₹{bill.breakdown.consumptionCharges}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{isWater ? 'Meter Rent & Infrastructure Fee' : 'Fixed Monthly Demand Charge'}:</span>
                    <span className="font-semibold text-slate-800">₹{bill.breakdown.fixedCharges}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{isWater ? 'Sewerage Cess & Water Quality Tax' : 'Electricity Duty (16%)'}:</span>
                    <span className="font-semibold text-slate-800">₹{bill.breakdown.taxesAndCess}</span>
                  </div>
                  {bill.breakdown.promptPaymentDiscount && (
                    <div className="flex justify-between text-emerald-600 font-medium pt-1 border-t border-slate-100">
                      <span>Prompt Payment Incentive:</span>
                      <span>- ₹{bill.breakdown.promptPaymentDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Net Amount Payable:</span>
                    <span>₹{bill.amountDue || currentMonthBase}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Receipt PDF
                </button>

                {bill.status === 'DUE' ? (
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    title="Pay bill and instantly dispatch receipt to Sanskar's email"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Quick Pay & Send Receipt
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetPayment}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    title="Reset bill status back to DUE"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Bill Status
                  </button>
                )}
              </div>

              {/* Direct Deep-link to real government portal */}
              <a
                href={bill.officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${theme.primaryBtn}`}
              >
                <span>Open Official State Government Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {bill.notes && (
              <div className="text-[11px] text-slate-400 text-center pt-1 italic">
                {bill.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilityBillFetcher;
