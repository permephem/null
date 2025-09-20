# Null Protocol Scanner PWA

A lightweight React Progressive Web App that scans/inputs ticket payloads and calls the relayer's `/tickets/verify` endpoint.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Create .env file
   echo "VITE_VERIFY_URL=https://relay.null.xyz/tickets/verify" > .env
   ```

3. **Run the scanner:**
   ```bash
   # Development
   npm run dev
   
   # Production build
   npm run build
   npm run preview
   ```

## Features

- Manual ticket payload input (paste QR code data)
- Holder proof input (OTP or signature)
- Real-time verification via relayer API
- Clean, mobile-friendly interface

## Future Enhancements

- QR camera integration using `html5-qrcode`
- Offline mode with signed Merkle allowlist snapshots
- Push notifications for verification results
- Batch verification for multiple tickets

## Usage

1. Scan or paste ticket payload (format: `TICKET:0xabc...:session123`)
2. Enter holder proof (OTP or signature)
3. Click "Verify" to check ticket validity
4. View decision, reason, and Canon transaction reference
