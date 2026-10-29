// -*- coding: utf-8 -*-
import fetch from 'node-fetch';
import express from 'express';
import billRoutesModule from './dist/routes/billRoutes.js';
import smsRoutesModule from './dist/routes/smsRoutes.js';

const billRoutes = billRoutesModule.default || billRoutesModule;
const smsRoutes = smsRoutesModule.default || smsRoutesModule;

const app = express();
app.use(express.json());
app.use('/api/bills', billRoutes);
app.use('/api/sms', smsRoutes);

const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  const server = app.listen(PORT, async () => {
    console.log(`[TEST SUITE] Test server listening on ${BASE_URL}\n`);
    let passed = 0;
    let failed = 0;

    try {
      // -------------------------------------------------------------
      // TEST 1: Electricity Bill Fetch
      // -------------------------------------------------------------
      console.log('--- TEST 1: Fetch Electricity Bill ---');
      const fetchElecRes = await fetch(`${BASE_URL}/api/bills/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utilityType: 'ELECTRICITY',
          consumerNumber: '012345678910',
          district: 'Pune',
        }),
      });
      const elecBillData = await fetchElecRes.json();
      if (fetchElecRes.ok && elecBillData.success && elecBillData.data.billNumber) {
        console.log('✅ TEST 1 PASSED: Electricity bill generated successfully.');
        console.log(`   Bill No: ${elecBillData.data.billNumber}, Amount Due: ₹${elecBillData.data.amountDue}, Units: ${elecBillData.data.unitsConsumed} kWh`);
        passed++;
      } else {
        console.error('❌ TEST 1 FAILED:', elecBillData);
        failed++;
      }

      // -------------------------------------------------------------
      // TEST 2: Process Electricity Bill Payment & Receipt Email
      // -------------------------------------------------------------
      console.log('\n--- TEST 2: Electricity Bill Payment & Receipt Email Delivery ---');
      const elecPayRes = await fetch(`${BASE_URL}/api/bills/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sanskardhat6@gmail.com',
          consumerName: elecBillData.data.consumerName || 'Rajesh S. Patil',
          consumerNumber: elecBillData.data.consumerNumber,
          billNumber: elecBillData.data.billNumber,
          billDate: elecBillData.data.billDate,
          billingPeriod: 'October 2026',
          utilityType: 'ELECTRICITY',
          provider: elecBillData.data.provider,
          district: 'Pune',
          category: 'NORMAL',
          unitsConsumed: elecBillData.data.unitsConsumed,
          unitLabel: elecBillData.data.unitLabel,
          currentMonthAmount: elecBillData.data.amountDue,
          totalPaidAmount: elecBillData.data.amountDue,
          transactionId: `TXN-MSE-TEST-${Date.now()}`,
        }),
      });
      const elecPayData = await elecPayRes.json();
      if (elecPayRes.ok && elecPayData.success && elecPayData.paymentSuccess && elecPayData.emailSent) {
        console.log('✅ TEST 2 PASSED: Electricity payment processed and receipt email delivered via Brevo!');
        console.log(`   Txn ID: ${elecPayData.transactionId}, Paid: ₹${elecPayData.totalPaidAmount}, Email Sent: ${elecPayData.emailSent}`);
        passed++;
      } else {
        console.error('❌ TEST 2 FAILED:', elecPayData);
        failed++;
      }

      // -------------------------------------------------------------
      // TEST 3: Water Bill Fetch
      // -------------------------------------------------------------
      console.log('\n--- TEST 3: Fetch Municipal Water Bill ---');
      const fetchWaterRes = await fetch(`${BASE_URL}/api/bills/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utilityType: 'WATER',
          consumerNumber: 'WTR-94281',
          district: 'Kolhapur',
        }),
      });
      const waterBillData = await fetchWaterRes.json();
      if (fetchWaterRes.ok && waterBillData.success && waterBillData.data.billNumber) {
        console.log('✅ TEST 3 PASSED: Water bill generated successfully.');
        console.log(`   Bill No: ${waterBillData.data.billNumber}, Amount Due: ₹${waterBillData.data.amountDue}, Units: ${waterBillData.data.unitsConsumed} kL`);
        passed++;
      } else {
        console.error('❌ TEST 3 FAILED:', waterBillData);
        failed++;
      }

      // -------------------------------------------------------------
      // TEST 4: Process Water Bill Payment & Receipt Email
      // -------------------------------------------------------------
      console.log('\n--- TEST 4: Water Bill Payment & Receipt Email Delivery ---');
      const waterPayTxn = `TXN-WTR-TEST-${Date.now()}`;
      const waterPayRes = await fetch(`${BASE_URL}/api/bills/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sanskardhat6@gmail.com',
          consumerName: waterBillData.data.consumerName || 'Sunita V. Deshmukh',
          consumerNumber: waterBillData.data.consumerNumber,
          billNumber: waterBillData.data.billNumber,
          billDate: waterBillData.data.billDate,
          billingPeriod: 'October 2026',
          utilityType: 'WATER',
          provider: 'Kolhapur Municipal Corporation (Water Works)',
          district: 'Kolhapur',
          category: 'OVERDUE',
          unitsConsumed: waterBillData.data.unitsConsumed,
          unitLabel: waterBillData.data.unitLabel,
          currentMonthAmount: waterBillData.data.amountDue,
          penaltyAmount: 50,
          totalPaidAmount: waterBillData.data.amountDue + 50,
          transactionId: waterPayTxn,
        }),
      });
      const waterPayData = await waterPayRes.json();
      if (waterPayRes.ok && waterPayData.success && waterPayData.paymentSuccess && waterPayData.emailSent) {
        console.log('✅ TEST 4 PASSED: Water payment processed and receipt email delivered via Brevo!');
        console.log(`   Txn ID: ${waterPayData.transactionId}, Paid: ₹${waterPayData.totalPaidAmount}, Email Sent: ${waterPayData.emailSent}`);
        passed++;
      } else {
        console.error('❌ TEST 4 FAILED:', waterPayData);
        failed++;
      }

      // -------------------------------------------------------------
      // TEST 5: Idempotency & Duplicate Email Prevention on Retry
      // -------------------------------------------------------------
      console.log('\n--- TEST 5: Duplicate Payment Request Idempotency Check ---');
      const retryRes = await fetch(`${BASE_URL}/api/bills/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sanskardhat6@gmail.com',
          consumerNumber: waterBillData.data.consumerNumber,
          transactionId: waterPayTxn, // Exact same transactionId as Test 4
        }),
      });
      const retryData = await retryRes.json();
      if (retryRes.ok && retryData.isDuplicate === true && retryData.paymentSuccess === true) {
        console.log('✅ TEST 5 PASSED: Duplicate request detected! Email re-dispatch was successfully suppressed.');
        console.log(`   Message: "${retryData.message}"`);
        passed++;
      } else {
        console.error('❌ TEST 5 FAILED: Duplicate was not prevented:', retryData);
        failed++;
      }

      // -------------------------------------------------------------
      // TEST 6: Invalid Email Address Validation
      // -------------------------------------------------------------
      console.log('\n--- TEST 6: Invalid Email Address Rejection ---');
      const invalidEmailRes = await fetch(`${BASE_URL}/api/bills/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-a-valid-email',
          consumerNumber: '012345678910',
          totalPaidAmount: 500,
        }),
      });
      const invalidEmailData = await invalidEmailRes.json();
      if (invalidEmailRes.status === 400 && invalidEmailData.success === false && invalidEmailData.error) {
        console.log('✅ TEST 6 PASSED: Invalid email format rejected with 400 Bad Request.');
        console.log(`   Error: "${invalidEmailData.error}"`);
        passed++;
      } else {
        console.error('❌ TEST 6 FAILED: Expected 400 Bad Request, got:', invalidEmailRes.status, invalidEmailData);
        failed++;
      }

      // -------------------------------------------------------------
      // TEST 7: Backward Compatibility via /api/sms/send-bill-email
      // -------------------------------------------------------------
      console.log('\n--- TEST 7: Backward Compatibility Route (/api/sms/send-bill-email) ---');
      const compatRes = await fetch(`${BASE_URL}/api/sms/send-bill-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sanskardhat6@gmail.com',
          consumerName: 'Backward Compat Test',
          consumerNumber: 'MSE-9921',
          utilityType: 'ELECTRICITY',
          totalPaidAmount: 1200,
          transactionId: `TXN-COMPAT-${Date.now()}`,
        }),
      });
      const compatData = await compatRes.json();
      if (compatRes.ok && compatData.paymentSuccess && compatData.emailSent) {
        console.log('✅ TEST 7 PASSED: /api/sms/send-bill-email route functions cleanly with upgraded receipt engine!');
        passed++;
      } else {
        console.error('❌ TEST 7 FAILED:', compatData);
        failed++;
      }

    } catch (testErr) {
      console.error('Unexpected error in test runner:', testErr);
      failed++;
    } finally {
      server.close();
      console.log(`\n=============================================================`);
      console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests.`);
      console.log(`=============================================================\n`);
      process.exit(failed > 0 ? 1 : 0);
    }
  });
}

runTests();
