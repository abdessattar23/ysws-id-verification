# Quick Fix Guide - Airtable Formula Injection

## 🔴 CRITICAL VULNERABILITY - FIX IMMEDIATELY

Your application is vulnerable to Airtable formula injection. An attacker can extract all user data.

## 🎯 Quick Fix (5 minutes)

Add this code to the beginning of these functions:

### File 1: `src/pages/api/slack/vouch.ts`

```typescript
// Add import at top
import validator from 'validator';

// Add validation after line 8 (after email extraction)
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = req.body;
  const [email, ...reason] = data.text.split(" ") as string[];

  // === ADD THIS VALIDATION ===
  if (!validator.isEmail(email)) {
    return res.status(400).json({ 
      message: "Invalid email format" 
    });
  }
  
  if (email.includes("'") || email.includes('"') || email.includes("(") || email.includes(")")) {
    return res.status(400).json({ 
      message: "Email contains invalid characters" 
    });
  }
  
  if (email.length > 255) {
    return res.status(400).json({ 
      message: "Email too long" 
    });
  }
  // === END VALIDATION ===

  if (!email || !reason.length)
    return res.status(200).json("Request must be in the format `/vouch <email> <reason>`");
  
  // ... rest of code stays the same
}
```

### File 2: `src/pages/api/slack/lookup.ts`

```typescript
// Add import at top
import validator from 'validator';

// Add validation after line 8 (after email extraction)
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = req.body;
  const email = data.text.replaceAll("<", "").replaceAll(">", "").split("|")[0].split("mailto:")[1];
  
  // === ADD THIS VALIDATION ===
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ 
      message: "Invalid email format" 
    });
  }
  
  if (email.includes("'") || email.includes('"') || email.includes("(") || email.includes(")")) {
    return res.status(400).json({ 
      message: "Email contains invalid characters" 
    });
  }
  
  if (email.length > 255) {
    return res.status(400).json({ 
      message: "Email too long" 
    });
  }
  // === END VALIDATION ===

  if (!admins.includes(data.user_id)) return res.status(401).json({ message: "Unauthorized" });

  // ... rest of code stays the same
}
```

### File 3: `src/lib/slack.ts`

```typescript
// Add import at top
import validator from 'validator';

// Modify checkVerification function
export async function checkVerification(
  email: string,
  projectId: string,
  userId: string,
  channelId: string
) {
  // === ADD THIS VALIDATION ===
  if (!validator.isEmail(email)) {
    await web.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: `Invalid email format: ${email}`,
    });
    return false;
  }
  
  if (email.includes("'") || email.includes('"') || email.includes("(") || email.includes(")")) {
    await web.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: `Email contains invalid characters`,
    });
    return false;
  }
  
  if (email.length > 255) {
    await web.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: `Email too long`,
    });
    return false;
  }
  // === END VALIDATION ===

  const user = await base("Users")
    .select({ filterByFormula: `{Email} = '${email}'` })
    .firstPage()
    .then((records) => records[0]);

  // ... rest of code stays the same
}
```

## ✅ Verification

After applying fixes, test with:

```bash
# Should work
/lookup user@example.com

# Should be blocked
/lookup ') OR TRUE() OR ({Email} = 'x
```

Expected response: "Invalid email format"

## 📋 Checklist

- [ ] Updated `src/pages/api/slack/vouch.ts`
- [ ] Updated `src/pages/api/slack/lookup.ts`
- [ ] Updated `src/lib/slack.ts`
- [ ] Tested with legitimate email (should work)
- [ ] Tested with injection payload (should be blocked)
- [ ] Deployed to production
- [ ] Monitored logs for blocked attempts

## ⚠️ What This Fixes

Before:
```typescript
// VULNERABLE - directly concatenates user input
`{Email} = '${email}'`
```

After:
```typescript
// SECURE - validates before using
if (!validator.isEmail(email)) return error;
if (email.includes("'")) return error;
`{Email} = '${email}'`  // Now safe because input is validated
```

## 🔍 Why This Happened

The code concatenated user input directly into Airtable queries without validation:

```typescript
// User inputs: ') OR TRUE() OR ({Email} = 'x
// Query becomes: {Email} = '') OR TRUE() OR ({Email} = 'x'
// Result: Returns ALL users instead of one
```

## 📚 Learn More

- See `POC_REPORT.md` for full technical details
- Run `node demo-injection.js` to see the vulnerability in action
- Run `node interactive-tester.js` to test payloads yourself

## 🆘 Need Help?

1. Read the full report: `POC_REPORT.md`
2. See technical analysis: `TECHNICAL_ANALYSIS.md`
3. Test the fix before deploying
4. Monitor application logs after deployment

## ⏰ Timeline

- **NOW**: Apply the quick fix above
- **Today**: Test and deploy
- **This week**: Add rate limiting
- **This month**: Consider using Airtable record IDs instead of email queries

---

**Status**: Vulnerability confirmed ✅  
**Severity**: Critical (CVSS 9.1)  
**Fix time**: 5-15 minutes  
**Deploy**: Immediately
