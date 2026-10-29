import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Receipt,
  ShieldCheck,
  History,
  Sparkles,
  ArrowRight,
  Radio,
  Zap,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Filter,
  Info,
  Clock,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import {
  fetchOperatorsAndCircles,
  lookupMobileNumber,
  fetchPlans,
  createRechargeOrder,
  verifyPaymentAndRecharge,
  fetchRechargeHistory,
  recordDemoOrderLocally,
  TelecomOperator,
  TelecomCircle,
  RechargePlan,
  PlanCategorySummary,
  RechargeHistoryItem,
} from '../../services/rechargeService.ts';

export const RechargePage: React.FC = () => {
  const { user } = useAuth();

  // Tab State: 'recharge' | 'history'
  const [activeTab, setActiveTab] = useState<'recharge' | 'history'>('recharge');

  // Master Data
  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [circles, setCircles] = useState<TelecomCircle[]>([]);
  const [loadingMasterData, setLoadingMasterData] = useState(true);

  // Form State
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('JIO');
  const [selectedCircle, setSelectedCircle] = useState('MAHARASHTRA_GOA');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL');
  const [validityFilter, setValidityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoDetected, setAutoDetected] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Plans State
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [categories, setCategories] = useState<PlanCategorySummary[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Checkout & Simulation State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [simulationMode, setSimulationMode] = useState<'SUCCESS' | 'PAYMENT_FAILED' | 'RECHARGE_FAILED'>('SUCCESS');
  const [customerName, setCustomerName] = useState(user?.name || 'Maha Citizen');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'citizen@maharesilience.org');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Payment Processing Screen State
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [paymentStep, setPaymentStep] = useState<'PENDING' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'>('PENDING');
  const [paymentStatusMsg, setPaymentStatusMsg] = useState('');
  const [fulfillmentResult, setFulfillmentResult] = useState<any | null>(null);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<RechargeHistoryItem | null>(null);

  // History State
  const [historyItems, setHistoryItems] = useState<RechargeHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  // Mask phone utility
  const maskPhone = (phone: string): string => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `${clean.substring(0, 2)}XXXXX${clean.substring(7)}`;
    }
    return phone;
  };

  // Load operators and circles on mount
  useEffect(() => {
    const loadMaster = async () => {
      setLoadingMasterData(true);
      try {
        const data = await fetchOperatorsAndCircles();
        setOperators(data.operators);
        setCircles(data.circles);
      } catch (err) {
        console.error('Failed to load operators:', err);
      } finally {
        setLoadingMasterData(false);
      }
    };
    loadMaster();
  }, []);

  // Fetch plans whenever operator, circle, or category changes
  useEffect(() => {
    if (!selectedOperator || !selectedCircle) return;
    const loadPlanCatalog = async () => {
      setLoadingPlans(true);
      try {
        const data = await fetchPlans(selectedOperator, selectedCircle, selectedCategory);
        setPlans(data.plans);
        setCategories(data.categories);
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlanCatalog();
  }, [selectedOperator, selectedCircle, selectedCategory]);

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const items = await fetchRechargeHistory();
      setHistoryItems(items);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle phone input with 10-digit validation & auto-detection
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(rawVal);

    if (rawVal.length === 10) {
      if (/^[6-9]\d{9}$/.test(rawVal)) {
        setIsLookingUp(true);
        try {
          const detected = await lookupMobileNumber(rawVal);
          if (detected.operator) {
            setSelectedOperator(detected.operator);
          }
          if (detected.circle) {
            setSelectedCircle(detected.circle);
          }
          setAutoDetected(true);
        } catch (err) {
          console.warn('Auto-lookup fallback:', err);
        } finally {
          setIsLookingUp(false);
        }
      }
    } else {
      setAutoDetected(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory('ALL');
    setPriceFilter('ALL');
    setValidityFilter('ALL');
    setSearchQuery('');
  };

  // Filter plans by search, price, and validity
  const filteredPlans = plans.filter((plan) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        plan.price.toString().includes(q) ||
        plan.data.toLowerCase().includes(q) ||
        plan.validity.toLowerCase().includes(q) ||
        plan.description.toLowerCase().includes(q) ||
        plan.category.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Price filter
    if (priceFilter === 'UNDER_200' && plan.price >= 200) return false;
    if (priceFilter === '200_500' && (plan.price < 200 || plan.price > 500)) return false;
    if (priceFilter === '500_1000' && (plan.price < 500 || plan.price > 1000)) return false;
    if (priceFilter === 'OVER_1000' && plan.price <= 1000) return false;

    // Validity filter
    if (validityFilter === 'UNDER_28' && plan.validityDays >= 28) return false;
    if (validityFilter === '28_30' && (plan.validityDays < 28 || plan.validityDays > 30)) return false;
    if (validityFilter === '56_84' && (plan.validityDays < 56 || plan.validityDays > 84)) return false;
    if (validityFilter === '365' && plan.validityDays < 365) return false;

    return true;
  });

  // Handle Plan Click
  const handleSelectPlan = (plan: RechargePlan) => {
    setSelectedPlan(plan);
    setOrderError(null);
    setSimulationMode('SUCCESS');
    setShowCheckoutModal(true);
  };

  // Copy transaction ID
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(text);
    setTimeout(() => setCopiedTx(null), 2500);
  };

  // Initiate Simulated Demo Checkout
  const handleProceedToPayment = async () => {
    if (!selectedPlan) return;
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setOrderError('Please enter a valid 10-digit Indian prepaid mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setIsProcessingOrder(true);
    setOrderError(null);

    try {
      // 1. Create Demo Recharge Order
      const orderData = await createRechargeOrder({
        mobileNumber,
        operator: selectedOperator,
        circle: selectedCircle,
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        customerName: customerName || 'Citizen User',
        customerEmail: customerEmail || 'citizen@maharesilience.org',
        idempotencyKey: `demo_${Date.now()}_${mobileNumber}_${selectedPlan.id}`,
      });

      setActiveOrder(orderData);
      setPaymentStep('PENDING');
      setPaymentStatusMsg('Initiating Simulated Demo UPI Gateway...');

      // 2. Simulated payment flow with state transitions
      setTimeout(async () => {
        setPaymentStep('VERIFYING');
        setPaymentStatusMsg('Simulating UPI Authorization & Checking Telecom Switch...');

        setTimeout(async () => {
          try {
            const verifyData = await verifyPaymentAndRecharge({
              orderId: orderData.orderId,
              transactionReference: orderData.transactionReference,
              gatewayOrderId: orderData.gatewayOrder.orderId,
              gatewayPaymentId: `demo_pay_${Date.now()}`,
              gatewaySignature: 'demo_simulated_valid_signature',
              paymentMethod: 'SIMULATED_UPI',
              simulationType: simulationMode,
            });

            if (verifyData.success) {
              setPaymentStep('SUCCESS');
              setFulfillmentResult(verifyData);
              setPaymentStatusMsg('Demo recharge activated! Illustrative receipt generated.');

              // Record in local history
              recordDemoOrderLocally({
                id: orderData.orderId,
                transactionReference: orderData.transactionReference,
                transactionId: orderData.transactionReference,
                mobileNumber,
                operator: selectedOperator,
                circle: selectedCircle,
                description: selectedPlan.description,
                validity: selectedPlan.validity,
                amount: selectedPlan.price,
                status: 'SUCCESS',
                operatorRef: verifyData.operatorReference,
                paymentGateway: 'SIMULATED_UPI',
                receiptSent: true,
                createdAt: new Date().toISOString(),
                isDemo: true,
              });
            } else if (verifyData.refundInitiated || simulationMode === 'RECHARGE_FAILED') {
              setPaymentStep('REFUNDED');
              setFulfillmentResult(verifyData);
              setPaymentStatusMsg(verifyData.message || 'Operator simulated rejection. Full demo refund recorded.');

              recordDemoOrderLocally({
                id: orderData.orderId,
                transactionReference: orderData.transactionReference,
                transactionId: orderData.transactionReference,
                mobileNumber,
                operator: selectedOperator,
                circle: selectedCircle,
                description: selectedPlan.description,
                validity: selectedPlan.validity,
                amount: selectedPlan.price,
                status: 'REFUND_COMPLETED',
                operatorRef: 'SIMULATED_REJECTED',
                paymentGateway: 'SIMULATED_UPI',
                receiptSent: false,
                createdAt: new Date().toISOString(),
                isDemo: true,
              });
            } else {
              setPaymentStep('FAILED');
              setOrderError(verifyData.error || 'Simulated payment failed.');

              recordDemoOrderLocally({
                id: orderData.orderId,
                transactionReference: orderData.transactionReference,
                transactionId: orderData.transactionReference,
                mobileNumber,
                operator: selectedOperator,
                circle: selectedCircle,
                description: selectedPlan.description,
                validity: selectedPlan.validity,
                amount: selectedPlan.price,
                status: 'PAYMENT_FAILED',
                operatorRef: null,
                paymentGateway: 'SIMULATED_UPI',
                receiptSent: false,
                createdAt: new Date().toISOString(),
                isDemo: true,
              });
            }
          } catch (err: any) {
            setPaymentStep('FAILED');
            setOrderError(err.message || 'Simulation processing error.');
          } finally {
            setIsProcessingOrder(false);
          }
        }, 1200);
      }, 1000);
    } catch (err: any) {
      console.error('Demo order creation failed:', err);
      setOrderError(err.message || 'Failed to initiate demo order');
      setIsProcessingOrder(false);
    }
  };

  const handleResetFlow = () => {
    setShowCheckoutModal(false);
    setActiveOrder(null);
    setPaymentStep('PENDING');
    setFulfillmentResult(null);
    setSelectedPlan(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* DEMO MODE OFFICIAL DISCLAIMER BANNER */}
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-yellow-500/20 border-2 border-amber-500/40 rounded-2xl p-4 shadow-sm text-amber-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-amber-500/30 text-amber-300 font-extrabold text-xs uppercase tracking-wider flex-shrink-0">
              DEMO MODE
            </span>
            <div>
              <h2 className="text-sm font-bold text-amber-100 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                Prepaid Mobile Recharge Simulator & Illustrative Plan Catalog
              </h2>
              <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                This feature operates in <strong>Simulated Demo Mode</strong> for project demonstration. 
                No real payments are collected, no banking credentials are required, and all recharge plans are sample illustrative data.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 whitespace-nowrap self-start sm:self-auto">
            Zero Real Financial Charges
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl border border-sky-800/40">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-sky-400/20">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Maharashtra Telecom Utility Demo
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Prepaid Mobile Recharge & UPI Simulation
              </h1>
              <p className="text-sky-200/80 text-sm md:text-base mt-1 max-w-2xl">
                Browse realistic sample packs for Jio, Airtel, Vi, and BSNL, test payment state machine transitions, and inspect simulated tax invoices.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('recharge')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'recharge'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Smartphone className="w-4 h-4" /> Demo Recharge
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <History className="w-4 h-4" /> History & Receipts
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'recharge' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Number Input & Operator Settings (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-400" /> Enter Mobile Details
              </h2>

              {/* Mobile Number Input */}
              <div className="space-y-2 mb-5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Prepaid Mobile Number</span>
                  <span className="text-[10px] text-sky-400 font-normal">10 Digits (India)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={handlePhoneChange}
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    className="w-full pl-12 pr-10 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 font-mono text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  />
                  {isLookingUp ? (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                    </div>
                  ) : autoDetected ? (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : null}
                </div>
                {mobileNumber.length > 0 && mobileNumber.length < 10 && (
                  <p className="text-xs text-amber-400/90 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Enter full 10 digits (e.g. 9822012345)
                  </p>
                )}
                {autoDetected && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3.5 h-3.5" /> Operator & Circle auto-detected!
                  </p>
                )}
              </div>

              {/* Operator Selector */}
              <div className="space-y-2 mb-5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Telecom Operator
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {operators.map((op) => {
                    const isSelected = selectedOperator === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setSelectedOperator(op.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-sky-950/60 border-sky-500 text-white ring-1 ring-sky-500'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight flex items-center justify-between">
                          <span>{op.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">{op.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Circle Selector */}
              <div className="space-y-2 mb-5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Telecom Circle
                </label>
                <select
                  value={selectedCircle}
                  onChange={(e) => setSelectedCircle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Filters: Price & Validity */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-sky-400" /> Filter Options
                  </span>
                  {(priceFilter !== 'ALL' || validityFilter !== 'ALL' || searchQuery || selectedCategory !== 'ALL') && (
                    <button
                      onClick={handleClearFilters}
                      className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Price Range</label>
                    <select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      <option value="ALL">All Prices</option>
                      <option value="UNDER_200">&lt; ₹200</option>
                      <option value="200_500">₹200 - ₹500</option>
                      <option value="500_1000">₹500 - ₹1000</option>
                      <option value="OVER_1000">&gt; ₹1000</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Validity</label>
                    <select
                      value={validityFilter}
                      onChange={(e) => setValidityFilter(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      <option value="ALL">All Validity</option>
                      <option value="UNDER_28">&lt; 28 Days</option>
                      <option value="28_30">28 - 30 Days</option>
                      <option value="56_84">56 - 84 Days</option>
                      <option value="365">365 Days (Annual)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Demo Notice */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Zero real billing. Simulated state machine with automated demo receipts and refunds.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Plans Catalog & Categories (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Category Filter Pills & Search */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {selectedOperator} Sample Prepaid Catalog
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Illustrative plans for demo • Showing {filteredPlans.length} plan{filteredPlans.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {/* Plan Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search GB, validity, price..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plans List Grid */}
            {loadingPlans ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center">
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading illustrative sample plans for {selectedOperator}...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <p className="text-white font-semibold text-base">No sample plans match current filters</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Try clearing the search query or resetting category and price filters.
                  </p>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Show All {selectedOperator} Plans
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="relative bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 shadow-sm transition-all hover:shadow-lg flex flex-col justify-between group"
                  >
                    {/* Demo Sample Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                        DEMO SAMPLE
                      </span>
                      {plan.popular && (
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                          Popular
                        </span>
                      )}
                    </div>

                    <div>
                      {/* Price & Validity Row */}
                      <div className="flex items-baseline justify-between mb-3 border-b border-slate-800/80 pb-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-semibold text-slate-400">₹</span>
                          <span className="text-2xl font-extrabold text-white tracking-tight">{plan.price}</span>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-sky-300 border border-slate-700">
                          {plan.validity}
                        </span>
                      </div>

                      {/* Benefits Highlights */}
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Data</span>
                          <span className="text-xs font-bold text-white">{plan.data}</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Voice</span>
                          <span className="text-xs font-bold text-emerald-400">{plan.calling}</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">SMS</span>
                          <span className="text-xs font-bold text-white">{plan.sms}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-sky-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 group-hover:bg-sky-600 shadow-sm"
                    >
                      <span>Select ₹{plan.price} (Demo)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History & Tax Receipts Tab */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-bold text-white">Recharge History & Demo Receipts</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEMO LEDGER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Audited ledger of simulated transactions with printable electronic receipts.
              </p>
            </div>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading simulated transaction ledger...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <p className="text-white font-semibold">No demo recharge transactions recorded yet</p>
                <p className="text-slate-400 text-xs mt-1">
                  Complete a simulated recharge from the "Demo Recharge" tab to view your payment confirmation and receipt here.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('recharge')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" /> Start First Demo Recharge
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Mobile No.</th>
                    <th className="pb-3 px-3">Operator</th>
                    <th className="pb-3 px-3">Pack Details</th>
                    <th className="pb-3 px-3 text-right">Amount</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 px-3 text-right">Receipt & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historyItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-medium text-white whitespace-nowrap">
                        +91 {maskPhone(item.mobileNumber)}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-200">
                        {item.operator}
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate">
                        {item.description || `${item.validity} Pack`}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white text-right whitespace-nowrap">
                        ₹{item.amount}.00
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {item.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> SUCCESS
                          </span>
                        ) : item.status === 'REFUND_COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30">
                            <RefreshCw className="w-3 h-3" /> REFUNDED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingReceipt(item)}
                            className="px-2.5 py-1 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white text-[11px] font-semibold border border-sky-500/30 transition-all flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" /> View Receipt
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.transactionReference)}
                            title="Copy Reference"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Checkout & Simulated Payment Modal */}
      {showCheckoutModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-900 to-blue-900 p-5 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Simulated Prepaid Checkout</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                    DEMO
                  </span>
                </div>
                <p className="text-xs text-sky-200 mt-0.5">MahaResilience Civic Platform Payment Simulator</p>
              </div>
              {paymentStep !== 'VERIFYING' && (
                <button
                  onClick={handleResetFlow}
                  className="p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {paymentStep === 'PENDING' ? (
                <>
                  {/* Order Summary */}
                  <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Mobile Number:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        +91 {mobileNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Operator & Circle:</span>
                      <span className="font-semibold text-sky-300">
                        {selectedOperator} • {selectedCircle}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Pack Validity:</span>
                      <span className="font-semibold text-white">{selectedPlan.validity}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Data Allocation:</span>
                      <span className="font-semibold text-white">{selectedPlan.data}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Voice & SMS:</span>
                      <span className="font-semibold text-emerald-400">{selectedPlan.calling}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Total Payable Amount:</span>
                      <span className="text-xl font-extrabold text-white">₹{selectedPlan.price}.00</span>
                    </div>
                  </div>

                  {/* Controlled Test Simulation Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                      Choose Simulation Outcome (For Examiner / Viva Testing)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSimulationMode('SUCCESS')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          simulationMode === 'SUCCESS'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Success</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Recharge credited OK</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSimulationMode('PAYMENT_FAILED')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          simulationMode === 'PAYMENT_FAILED'
                            ? 'bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Pay Failed</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Gateway decline test</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSimulationMode('RECHARGE_FAILED')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          simulationMode === 'RECHARGE_FAILED'
                            ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Auto-Refund</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Switch error & refund</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Information for Demo Receipt */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Citizen Information (For Demo Receipt)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Citizen Name"
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="citizen@maharesilience.org"
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  {orderError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Checkout CTA Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleProceedToPayment}
                      disabled={isProcessingOrder}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessingOrder ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processing Simulation...</span>
                        </>
                      ) : (
                        <>
                          <span>Execute Demo Payment (₹{selectedPlan.price})</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : paymentStep === 'VERIFYING' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-sky-950/80 border-2 border-sky-500/60 flex items-center justify-center mx-auto">
                    <RefreshCw className="w-7 h-7 text-sky-400 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Processing Simulated Transaction...</h4>
                    <p className="text-slate-400 text-xs mt-1">{paymentStatusMsg}</p>
                  </div>
                </div>
              ) : paymentStep === 'SUCCESS' ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Demo Recharge Successful!</h4>
                    <p className="text-emerald-400 text-xs mt-1 font-medium">{paymentStatusMsg}</p>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Demo Reference:</span>
                      <span className="font-mono font-bold text-white">{activeOrder?.transactionReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Operator Ref:</span>
                      <span className="font-mono font-bold text-sky-400">{fulfillmentResult?.operatorReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mobile Number:</span>
                      <span className="font-bold text-white">+91 {maskPhone(mobileNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Settled:</span>
                      <span className="font-bold text-white">₹{selectedPlan.price}.00 (Simulated)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        handleResetFlow();
                        setActiveTab('history');
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5 text-sky-400" />
                      <span>View in History</span>
                    </button>
                    <button
                      onClick={handleResetFlow}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : paymentStep === 'REFUNDED' ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-950/80 border-2 border-amber-500/60 flex items-center justify-center mx-auto">
                    <RefreshCw className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Simulated Recharge Failure & Refund</h4>
                    <p className="text-amber-400 text-xs mt-1 font-medium">{paymentStatusMsg}</p>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Refund Status:</span>
                      <span className="font-bold text-amber-400">100% REFUNDED (SIMULATED)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Refund Reference:</span>
                      <span className="font-mono text-white">{fulfillmentResult?.refundId || 'DEMO-RFND-AUTOCREDITED'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Returned:</span>
                      <span className="font-bold text-white">₹{selectedPlan.price}.00</span>
                    </div>
                  </div>

                  <button
                    onClick={handleResetFlow}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
                  >
                    Close & Try Another Plan
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-950/80 border-2 border-rose-500/60 flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Simulated Payment Decline</h4>
                    <p className="text-rose-400 text-xs mt-1">{orderError || 'Payment authorization was declined in simulation.'}</p>
                  </div>
                  <button
                    onClick={handleResetFlow}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewing Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-sky-900 to-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-400" /> Official Demo Electronic Receipt
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">MahaResilience Civic Management Engine</p>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Reconciled Amount</span>
                <span className="text-2xl font-extrabold text-white">₹{viewingReceipt.amount}.00</span>
                <div className="mt-1">
                  {viewingReceipt.status === 'SUCCESS' ? (
                    <span className="text-[11px] font-bold text-emerald-400">✓ 100% FULFILLED (DEMO)</span>
                  ) : viewingReceipt.status === 'REFUND_COMPLETED' ? (
                    <span className="text-[11px] font-bold text-amber-400">✓ FULLY REFUNDED (DEMO)</span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-400">DECLINED</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-slate-800 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-white">{viewingReceipt.transactionReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operator Reference:</span>
                  <span className="font-mono text-sky-300">{viewingReceipt.operatorRef || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mobile Number:</span>
                  <span className="font-bold text-white">+91 {maskPhone(viewingReceipt.mobileNumber)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telecom Operator:</span>
                  <span className="font-semibold text-white">{viewingReceipt.operator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Circle:</span>
                  <span className="text-slate-300">{viewingReceipt.circle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pack Validity:</span>
                  <span className="text-slate-300">{viewingReceipt.validity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Timestamp:</span>
                  <span className="text-slate-300">{new Date(viewingReceipt.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" /> Print Receipt
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RechargePage;
