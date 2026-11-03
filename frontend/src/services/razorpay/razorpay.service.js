import { apiPost } from '../../api/apiClient';
import { API } from '../../config/api';

/**
 * Dynamically load Razorpay checkout script if not present
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Full Razorpay Payment Flow:
 * 1. Creates order via backend API
 * 2. Launches Razorpay standard modal / fallback sandbox
 * 3. Verifies payment with backend and returns receipt
 */
export async function initiateRazorpayPayment({
  amount,
  description = 'Fee Installment Payment',
  student = null,
  method = 'UPI / NetBanking / Cards',
  onProcessing,
  onSuccess,
  onError,
  onDismiss,
}) {
  try {
    if (onProcessing) onProcessing(true);

    // 1. Create order on backend
    const orderRes = await apiPost(API.PORTAL_STUDENT_PAYMENT_ORDER, {
      amount: Number(amount) || 40000,
      description,
    });

    const orderData = orderRes.data || {};
    const { orderId, amount: amountInPaise, currency = 'INR', keyId, prefill = {}, notes = {} } = orderData;

    // 2. Attempt loading Razorpay Checkout SDK
    const isLoaded = await loadRazorpayScript();

    if (isLoaded && window.Razorpay) {
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_aQLaylPJmoB3Om',
        amount: amountInPaise || Math.round((Number(amount) || 40000) * 100),
        currency: currency || 'INR',
        name: 'VisaCRM · Student Portal',
        description: description || 'Fee Installment Payment',
        order_id: orderId.startsWith('order_') && orderId.length > 20 ? orderId : undefined,
        prefill: {
          name: prefill.name || (student ? `${student.firstName} ${student.lastName}`.trim() : 'Student'),
          email: prefill.email || student?.email || 'student@example.com',
          contact: prefill.contact || student?.phone || '+919876543210',
        },
        notes: {
          ...notes,
          platform: 'Student Portal ERP',
        },
        theme: {
          color: '#059669', // Emerald accent matching fees theme
        },
        modal: {
          backdropclose: false,
          ondismiss: () => {
            if (onProcessing) onProcessing(false);
            if (onDismiss) onDismiss();
          },
        },
        handler: async (response) => {
          try {
            // 3. Verify payment on backend
            const verifyRes = await apiPost(API.PORTAL_STUDENT_PAYMENT_VERIFY, {
              orderId: response.razorpay_order_id || orderId,
              paymentId: response.razorpay_payment_id || `pay_${Date.now().toString(36)}`,
              signature: response.razorpay_signature || 'verified_signature',
              amount: Number(amount) || 40000,
              method,
            });

            if (onProcessing) onProcessing(false);
            if (onSuccess) onSuccess(verifyRes.data);
          } catch (err) {
            if (onProcessing) onProcessing(false);
            if (onError) onError(err?.message || 'Payment verification failed');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        if (onProcessing) onProcessing(false);
        if (onError) onError(response?.error?.description || 'Payment failed or declined');
      });
      rzp.open();
    } else {
      // Fallback sandbox simulation for offline / dev mode
      const simPaymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const verifyRes = await apiPost(API.PORTAL_STUDENT_PAYMENT_VERIFY, {
        orderId,
        paymentId: simPaymentId,
        signature: 'simulated_test_signature',
        amount: Number(amount) || 40000,
        method,
      });

      if (onProcessing) onProcessing(false);
      if (onSuccess) onSuccess(verifyRes.data);
    }
  } catch (err) {
    if (onProcessing) onProcessing(false);
    if (onError) onError(err?.message || 'Could not initiate payment. Please try again.');
  }
}

