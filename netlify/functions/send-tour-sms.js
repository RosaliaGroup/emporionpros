// Add cosigner link if needed
if (needsCosigner) {
  message += `

💡 FREE Cosigner Pre-Approval:
https://app.theguarantors.com/referral/sign-up/ad295b820fb11b34ee2f5cc96f1acf659032ce4fd9280a9fa1f380582aeda1a2

Get approved at no cost!`;
}
```

**This means:**
- ✅ If `needsCosigner` is `true` → Cosigner link is included in SMS
- ✅ If `needsCosigner` is `false` or not set → No cosigner link in SMS

---

## 🤖 How It Works:

1. During the call, **Aria determines** if the lead needs a cosigner (based on budget/income)
2. This gets saved in `structuredData.needsCosigner` (true or false)
3. The webhook passes this to the SMS function
4. SMS **only includes the cosigner link if** `needsCosigner = true`

---

## 📋 Example Outputs:

**If lead QUALIFIES (doesn't need cosigner):**
```
Hi John! This is Aria from Iron 65.

Your tour is confirmed for Tuesday at 2pm.

📍 Iron 65 Apartments
65 Lincoln Park, Newark, NJ 07102

Book or reschedule:
https://calendly.com/ana-rosaliagroup/65-iron-tour

Questions? Reply to this text!

See you soon! 🏢
```

**If lead NEEDS COSIGNER:**
```
Hi Sarah! This is Aria from Iron 65.

Your tour is confirmed for Wednesday at 10am.

📍 Iron 65 Apartments
65 Lincoln Park, Newark, NJ 07102

Book or reschedule:
https://calendly.com/ana-rosaliagroup/65-iron-tour

💡 FREE Cosigner Pre-Approval:
https://app.theguarantors.com/referral/sign-up/ad295b820fb11b34ee2f5cc96f1acf659032ce4fd9280a9fa1f380582aeda1a2

Get approved at no cost!

Questions? Reply to this text!

See you soon! 🏢
