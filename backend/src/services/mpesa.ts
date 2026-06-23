// backend/src/services/mpesa.ts
import axios from 'axios';
import crypto from 'crypto';

// ── Validate environment variables early ──────────────────────────
if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
  console.error('❌ Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET in .env');
  process.exit(1);
}

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';

const BASE_URL = ENVIRONMENT === 'sandbox'
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

// ── Get OAuth token ────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiry > Date.now() + 120_000) {
    return accessToken;
  }

  // ── Debug: check for hidden characters ─────────────────
  console.log('🔍 Consumer Key length:', CONSUMER_KEY.length, '| Secret length:', CONSUMER_SECRET.length);
  console.log('🔍 Consumer Key:', JSON.stringify(CONSUMER_KEY));
  console.log('🔍 Consumer Secret:', JSON.stringify(CONSUMER_SECRET));

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  console.log('🔍 Base64 Auth:', auth);

  try {
    const { data } = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    // ⚠️ Log the full response to see what Safaricom actually returns
    console.log('🔎 OAuth response data:', JSON.stringify(data, null, 2));

    if (!data.access_token) {
      console.error('❌ No access_token in response');
      throw new Error('No access_token received');
    }

    // Check if token looks like a JWT
    if (!data.access_token.startsWith('eyJ')) {
      console.warn('⚠️ Token does NOT start with "eyJ" – it may be invalid!');
    }

    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000 - 120_000;

    console.log('✅ Token obtained. Expires in:', data.expires_in, 's');
    console.log('🔑 Full token:', accessToken);
    return accessToken;
  } catch (error: any) {
    const safError = error.response?.data;
    console.error('❌ Failed to get M-Pesa access token:', safError || error.message);
    throw new Error('Token generation failed');
  }
}

// ── Generate timestamp and password ────────────────────────────────
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const str = shortcode + passkey + timestamp;
  return crypto.createHash('sha256').update(str).digest('hex');
}

// ── STK Push ────────────────────────────────────────────────────────
interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc?: string;
}

export async function stkPush({ phoneNumber, amount, accountReference, transactionDesc = 'FashionWorld Payment' }: StkPushRequest) {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = generatePassword(SHORTCODE!, PASSKEY!, timestamp);

  // 🔎 Debug: log the credentials used for password generation
  console.log('🔑 Shortcode:', SHORTCODE, '(length:', SHORTCODE?.length, ')');
  console.log('🔑 Passkey:', PASSKEY, '(length:', PASSKEY?.length, ')');
  console.log('🔑 Generated Password:', password);

  // 🧪 TEMPORARY FIX: Use a public callback URL to test if the issue is the callback reachability
  const callbackUrl = 'https://httpbin.org/post'; // remove this line after testing
  // const callbackUrl = process.env.MPESA_CALLBACK_URL!; // restore this line once fixed

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  // 👁️‍🗨️ Log everything before the call
  console.log('\n📦 STK Push payload:', JSON.stringify(payload, null, 2));
  console.log('🔐 Using token:', token);

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('STK Push error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'STK push failed');
  }
}

// ── Query STK status ───────────────────────────────────────────────
export async function queryStkStatus(checkoutRequestID: string) {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = generatePassword(SHORTCODE!, PASSKEY!, timestamp);

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestID,
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('STK status query error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Status query failed');
  }
}