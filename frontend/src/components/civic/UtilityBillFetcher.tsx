import React, { useState, useEffect } from 'react';
import {
  Zap, Droplets, Search, Receipt, ExternalLink,
  CheckCircle2, Clock, ShieldCheck, Printer, ArrowRight,
  HelpCircle, ChevronDown, ChevronUp, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  UtilityBill,
  fetchBillFromService,
  getSavedConsumerNumbers,
  saveConsumerNumber,
  markBillAsPaidLocally
} from '../../services/billService.ts';

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

  // Load remembered connections or auto-load first demo sample for instant presentation
  useEffect(() => {
    const list = getSavedConsumerNumbers(utilityType);
    setSavedNumbers(list);
    const initialNum = list.length > 0 ? list[0] : (isWater ? 'WTR-94281' : '012345678910');
    setConsumerNumber(initialNum);
    // Auto-fetch initial sample so the demo is immediately loaded and visible
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

      setBill(result);
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
      amountDue: 0,
    });
    setPaidSuccess(true);
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
              Enter your {isWater ? 'Connection / Meter ID' : 'Consumer Number'} to instantly check outstanding dues, meter readings, and official records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 self-start sm:self-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>No login / payment required</span>
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
                  placeholder={isWater ? 'e.g. WTR-849201 or 10928374' : 'e.g. 012345678910 or 028491738201'}
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

        {/* Quick Demo Sample Numbers & Saved Chips */}
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
                ✓ WTR-PAID01 (No Dues)
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
                ✓ 099887766554 (Zero Dues)
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
        <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-fadeIn">
          {/* Bill Top Bar */}
          <div className={`p-4 text-white bg-gradient-to-r ${theme.headerGradient} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div>
              <div className="text-[11px] font-medium text-white/80 uppercase tracking-wider">
                Official Bill Invoice • {bill.provider}
              </div>
              <div className="text-base font-extrabold flex items-center gap-2">
                <span>{bill.consumerName}</span>
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
                {bill.status === 'PAID' ? '✓ BILL PAID' : 'PAYMENT DUE'}
              </span>
            </div>
          </div>

          {/* Bill Body Details */}
          <div className="p-5 bg-white space-y-5">
            {paidSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Payment recorded successfully! Status updated to PAID.
              </div>
            )}

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Consumer No.</span>
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
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                  Total Payable Amount
                </span>
                <div className="text-3xl font-black text-amber-400 flex items-baseline gap-1 mt-0.5">
                  <span>₹{bill.amountDue.toLocaleString('en-IN')}</span>
                  {bill.amountDue > 0 && (
                    <span className="text-xs text-slate-400 font-normal">
                      (including electricity duty & cess)
                    </span>
                  )}
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
                    <span>₹{bill.amountDue}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Receipt PDF
                </button>

                {bill.status === 'DUE' && (
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Simulate Quick Pay
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
