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

let accessToken: string = '';   // ← changed type
let tokenExpiry: number = 0;

// ── Get OAuth token ────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiry > Date.now() + 120_000) {
    return accessToken;
  }

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

  try {
    const { data } = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    if (!data.access_token) {
      console.error('❌ No access_token in response');
      throw new Error('No access_token received');
    }

    accessToken = data.access_token as string;   // ← cast to string
    tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000 - 120_000;

    console.log('✅ Token obtained. Expires in:', data.expires_in, 's');
    return accessToken;
  } catch (error: any) {
    console.error('❌ Failed to get M-Pesa access token:', error.response?.data || error.message);
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

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: process.env.MPESA_CALLBACK_URL!,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

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