// Parses a scanned QR string. Supports standard UPI deep links
// (upi://pay?pa=vendor@bank&pn=Vendor+Name&am=500&tn=note) and falls
// back to treating the raw text as a vendor name for non-UPI QR codes.
export function parseUpiQr(rawText) {
  const trimmed = (rawText || '').trim();

  if (!/^upi:\/\//i.test(trimmed)) {
    return {
      isUpi: false,
      vendor: trimmed || 'Unknown Merchant',
      payeeVpa: '',
      amount: null,
      note: '',
      raw: trimmed,
    };
  }

  try {
    const url = new URL(trimmed);
    const params = url.searchParams;
    const amountParam = params.get('am');

    return {
      isUpi: true,
      vendor: params.get('pn') || params.get('pa') || 'Unknown Merchant',
      payeeVpa: params.get('pa') || '',
      amount: amountParam ? Number(amountParam) : null,
      note: params.get('tn') || '',
      raw: trimmed,
    };
  } catch (err) {
    return {
      isUpi: false,
      vendor: trimmed,
      payeeVpa: '',
      amount: null,
      note: '',
      raw: trimmed,
    };
  }
}

// Shared risk-flagging rule, used for both QR-scanned payments and the
// quick-action demo buttons so every payment path goes through one guardrail.
export function evaluateRisk({ amount, vendor, contacts }) {
  const numericAmount = Number(amount) || 0;
  const isHighValue = numericAmount > 50000;
  const isKnownVendor = contacts.includes(vendor);
  const isNotInContacts = !!vendor && !isKnownVendor;

  let reason = null;
  if (isHighValue) reason = 'High-value transaction (over ₹50,000)';
  else if (isNotInContacts) reason = 'Payment to a recipient not in your contacts';

  return {
    flagged: isHighValue || isNotInContacts,
    riskScore: isHighValue ? 90 : isNotInContacts ? 60 : 0,
    reason,
  };
}
