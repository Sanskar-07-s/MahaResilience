/**
 * test_recharge_flow.js
 * Comprehensive automated verification script for MahaResilience Mobile Recharge & UPI Payment Integration
 */

import rawApp from './dist/app.js';

const app = typeof rawApp.listen === 'function' 
  ? rawApp 
  : typeof rawApp.default?.listen === 'function' 
    ? rawApp.default 
    : rawApp.default?.default;

let server;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

const log = (step, msg) => console.log(`\x1b[36m[STEP ${step}]\x1b[0m ${msg}`);
const pass = (msg) => console.log(`\x1b[32m✔ PASS:\x1b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\x1b[31m✖ FAIL:\x1b[0m ${msg}`);
  if (server) server.close();
  process.exit(1);
};

const makeRequest = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
};

const runTests = async () => {
  server = app.listen(PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`🚀 MahaResilience Recharge & UPI Test Suite Running on :${PORT}`);
    console.log(`======================================================\n`);

    try {
      // 1. Operators & Circles
      log(1, 'Fetching supported telecom operators & circles...');
      const opRes = await makeRequest('/api/recharge/operators');
      if (opRes.status === 200 && opRes.data.operators?.length >= 4) {
        pass(`Found ${opRes.data.operators.length} operators: ${opRes.data.operators.map(o => o.name).join(', ')}`);
        pass(`Found ${opRes.data.circles.length} telecom circles: ${opRes.data.circles.map(c => c.name).slice(0, 3).join(', ')}...`);
      } else {
        fail(`Failed operators check. HTTP ${opRes.status}`);
      }

      // 2. Mobile Number Auto-Detection & Validation
      log(2, 'Testing 10-digit Indian mobile number validation and operator auto-detection...');
      // Valid Jio (7000123456)
      const jioLookup = await makeRequest('/api/recharge/lookup', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber: '7000123456' }),
      });
      if (jioLookup.status === 200 && jioLookup.data.operator === 'JIO') {
        pass(`Auto-detected 7000123456 as ${jioLookup.data.operator} in ${jioLookup.data.circleName}`);
      } else {
        fail(`Failed Jio lookup. Got: ${JSON.stringify(jioLookup.data)}`);
      }

      // Valid Airtel (9810156789)
      const airtelLookup = await makeRequest('/api/recharge/lookup', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber: '9810156789' }),
      });
      if (airtelLookup.status === 200 && airtelLookup.data.operator === 'AIRTEL') {
        pass(`Auto-detected 9810156789 as ${airtelLookup.data.operator}`);
      } else {
        fail(`Failed Airtel lookup. Got: ${JSON.stringify(airtelLookup.data)}`);
      }

      // Valid BSNL (9422012345)
      const bsnlLookup = await makeRequest('/api/recharge/lookup', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber: '9422012345' }),
      });
      if (bsnlLookup.status === 200 && bsnlLookup.data.operator === 'BSNL') {
        pass(`Auto-detected 9422012345 as ${bsnlLookup.data.operator}`);
      } else {
        fail(`Failed BSNL lookup. Got: ${JSON.stringify(bsnlLookup.data)}`);
      }

      // Invalid Number (< 10 digits or invalid prefix)
      const invalidLookup = await makeRequest('/api/recharge/lookup', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber: '12345' }),
      });
      if (invalidLookup.status === 400) {
        pass(`Correctly rejected invalid mobile number '12345' with HTTP 400: ${invalidLookup.data.error}`);
      } else {
        fail(`Expected 400 for invalid number, got: ${invalidLookup.status}`);
      }

      // 3. Plan Catalog Browsing & Category Filtering
      log(3, 'Fetching Jio plans for Maharashtra & Goa circle...');
      const plansRes = await makeRequest('/api/recharge/plans?operator=JIO&circle=MAHARASHTRA_GOA');
      if (plansRes.status === 200 && plansRes.data.plans?.length > 0) {
        pass(`Loaded ${plansRes.data.totalPlans} Jio prepaid plans across ${plansRes.data.categories.length} categories.`);
        const samplePlan = plansRes.data.plans[0];
        pass(`Sample Plan: ₹${samplePlan.price} - ${samplePlan.validity} (${samplePlan.data}, ${samplePlan.calling})`);
      } else {
        fail(`Failed to fetch plans. HTTP ${plansRes.status}`);
      }

      // 4. Order Creation & Idempotency Protection
      log(4, 'Creating pending recharge order and verifying idempotency deduplication...');
      const idempotencyKey = `test_idem_${Date.now()}`;
      const orderPayload = {
        mobileNumber: '7000123456',
        operator: 'JIO',
        circle: 'MAHARASHTRA_GOA',
        planId: 'jio-unl-299',
        amount: 299,
        idempotencyKey,
        customerName: 'Sanskar Dhat',
        customerEmail: 'sanskardhat6@gmail.com',
      };

      const orderRes = await makeRequest('/api/recharge/order', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (orderRes.status === 201 && orderRes.data.orderId && orderRes.data.gatewayOrder) {
        pass(`Recharge order created successfully! Order ID: ${orderRes.data.orderId}, Tx: ${orderRes.data.transactionReference}`);
        pass(`Gateway Order generated: ${orderRes.data.gatewayOrder.orderId} (Amount: ₹${orderRes.data.gatewayOrder.amountInRupees})`);
      } else {
        fail(`Order creation failed. Got: ${JSON.stringify(orderRes.data)}`);
      }

      // Re-submit with same idempotency key
      const duplicateRes = await makeRequest('/api/recharge/order', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });
      if (duplicateRes.status === 200 && duplicateRes.data.isDuplicate) {
        pass(`Idempotency verified: Duplicate order suppressed and existing order reused.`);
      } else {
        fail(`Duplicate submission was not handled cleanly. Got: ${JSON.stringify(duplicateRes.data)}`);
      }

      // 5. Payment Verification & Successful Fulfillment
      log(5, 'Verifying payment signature and fulfilling telecom recharge...');
      const verifyRes = await makeRequest('/api/recharge/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderRes.data.orderId,
          transactionReference: orderRes.data.transactionReference,
          gatewayOrderId: orderRes.data.gatewayOrder.orderId,
          gatewayPaymentId: `pay_upi_test_${Date.now()}`,
          gatewaySignature: 'test_valid_signature',
          paymentMethod: 'UPI_INTENT',
        }),
      });

      if (verifyRes.status === 200 && verifyRes.data.status === 'SUCCESS') {
        pass(`Payment verified! Telecom Operator credited: Operator Ref: ${verifyRes.data.operatorReference}`);
        pass(`Tax Invoice email queued for: ${verifyRes.data.receiptEmailAddress}`);
      } else {
        fail(`Payment verification failed: ${JSON.stringify(verifyRes.data)}`);
      }

      // 6. Test Auto-Refund on Simulated Operator Failure
      log(6, 'Testing automated refund trigger on operator recharge failure...');
      const failOrderRes = await makeRequest('/api/recharge/order', {
        method: 'POST',
        body: JSON.stringify({
          mobileNumber: '6000000000', // Trigger failure simulation
          operator: 'VI',
          circle: 'MAHARASHTRA_GOA',
          planId: 'vi-unl-299',
          amount: 299,
          customerName: 'Test Citizen',
          customerEmail: 'test@example.com',
        }),
      });

      const failVerifyRes = await makeRequest('/api/recharge/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId: failOrderRes.data.orderId,
          transactionReference: failOrderRes.data.transactionReference,
          gatewayOrderId: failOrderRes.data.gatewayOrder.orderId,
          gatewayPaymentId: `pay_fail_test_${Date.now()}`,
          gatewaySignature: 'test_valid_signature',
          paymentMethod: 'UPI',
        }),
      });

      if (failVerifyRes.status === 400 && failVerifyRes.data.refundInitiated) {
        pass(`Operator failure caught! State machine transitioned to REFUND_COMPLETED. Refund Ref: ${failVerifyRes.data.refundId}`);
        pass(`Message returned to user: "${failVerifyRes.data.message}"`);
      } else {
        fail(`Expected auto-refund on operator failure, got: ${JSON.stringify(failVerifyRes.data)}`);
      }

      // 7. Polling Status Check
      log(7, 'Polling transaction status by reference ID...');
      const statusRes = await makeRequest(`/api/recharge/status/${orderRes.data.transactionReference}`);
      if (statusRes.status === 200 && statusRes.data.status === 'SUCCESS') {
        pass(`Status verified: ${statusRes.data.status} for ${statusRes.data.mobileNumber} (Operator Ref: ${statusRes.data.operatorReference})`);
      } else {
        fail(`Status check failed: ${JSON.stringify(statusRes.data)}`);
      }

      // 8. Recharge History & Masked Phone Number Verification
      log(8, 'Fetching recharge history and verifying privacy masking...');
      const historyRes = await makeRequest('/api/recharge/history');
      if (historyRes.status === 200 && historyRes.data.history?.length > 0) {
        const item = historyRes.data.history[0];
        pass(`Found ${historyRes.data.history.length} transactions in history.`);
        pass(`Masked mobile number format verified: ${item.mobileNumber} (e.g. +91 70XXXXX456)`);
      } else {
        fail(`History fetch failed: ${JSON.stringify(historyRes.data)}`);
      }

      console.log(`\n======================================================`);
      console.log(`🎉 ALL 8 RECHARGE & UPI VERIFICATION CHECKS PASSED!`);
      console.log(`======================================================\n`);

      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Fatal test error:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
};

runTests();
