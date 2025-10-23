#!/usr/bin/env node

/**
 * Interactive Injection Tester
 * 
 * This script lets you test various injection payloads interactively
 * to understand how they transform the Airtable query.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Simulates the vulnerable code
function buildQuery(email) {
  return `{Email} = '${email}'`;
}

// Secure version for comparison
function buildSecureQuery(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return "❌ REJECTED: Invalid email format";
  }
  
  if (email.includes("'") || email.includes('"') || email.includes('\\')) {
    return "❌ REJECTED: Dangerous characters detected";
  }
  
  if (email.includes('(') || email.includes(')')) {
    return "❌ REJECTED: Parentheses not allowed in email";
  }
  
  return `{Email} = '${email}'`;
}

// Example payloads
const examples = [
  "user@example.com (legitimate)",
  "') OR TRUE() OR ({Email} = 'x (always true)",
  "') OR ({Verification Status} = 'Eligible (field extraction)",
  "test' OR '1'='1 (quote escape)",
  "') OR LEN({Email}) > 0 OR ({Email} = 'x (enumerate all)",
  "') OR NOT(FALSE()) OR ({Email} = 'x (negation attack)"
];

console.log("\n╔════════════════════════════════════════════════════════════════════════════╗");
console.log("║                   Interactive Injection Tester                             ║");
console.log("╚════════════════════════════════════════════════════════════════════════════╝\n");

console.log("This tool demonstrates how user input is transformed into Airtable queries.\n");
console.log("Example payloads to try:");
examples.forEach((ex, i) => {
  console.log(`  ${i + 1}. ${ex}`);
});

console.log("\nEnter 'q' to quit, 'help' for examples\n");

function prompt() {
  rl.question('Enter email/payload: ', (input) => {
    if (input.toLowerCase() === 'q' || input.toLowerCase() === 'quit') {
      console.log("\nGoodbye!\n");
      rl.close();
      return;
    }
    
    if (input.toLowerCase() === 'help') {
      console.log("\nExample payloads:");
      examples.forEach((ex, i) => {
        console.log(`  ${i + 1}. ${ex}`);
      });
      console.log();
      prompt();
      return;
    }
    
    if (!input.trim()) {
      prompt();
      return;
    }
    
    console.log("\n" + "─".repeat(80));
    console.log("Input:", input);
    console.log("─".repeat(80));
    
    // Show vulnerable version
    const vulnQuery = buildQuery(input);
    console.log("\n🔴 VULNERABLE CODE (current):");
    console.log("  " + vulnQuery);
    
    // Analyze the query
    const hasQuote = input.includes("'");
    const hasParens = input.includes("(") || input.includes(")");
    const hasOr = input.toUpperCase().includes(" OR ");
    const hasTrue = input.toUpperCase().includes("TRUE()");
    const hasFalse = input.toUpperCase().includes("FALSE()");
    const hasField = input.includes("{");
    
    if (hasQuote || hasParens || hasOr || hasTrue || hasFalse || hasField) {
      console.log("\n⚠️  INJECTION DETECTED:");
      if (hasQuote) console.log("  • Contains quotes (') - can break out of string context");
      if (hasParens) console.log("  • Contains parentheses - can inject functions");
      if (hasOr) console.log("  • Contains OR operator - can bypass filters");
      if (hasTrue) console.log("  • Contains TRUE() function - always evaluates to true");
      if (hasFalse) console.log("  • Contains FALSE() function - can be negated");
      if (hasField) console.log("  • Contains field reference - can access other fields");
      
      console.log("\n💥 IMPACT:");
      if (hasTrue || (hasOr && hasQuote)) {
        console.log("  CRITICAL - Could return ALL records from database");
      } else if (hasField) {
        console.log("  HIGH - Could access unauthorized fields");
      } else if (hasQuote || hasOr) {
        console.log("  HIGH - Could bypass email filter");
      }
    } else {
      console.log("\n✅ No obvious injection detected (legitimate email)");
    }
    
    // Show secure version
    const secureQuery = buildSecureQuery(input);
    console.log("\n🛡️  SECURE CODE (with validation):");
    console.log("  " + secureQuery);
    
    console.log("\n" + "─".repeat(80) + "\n");
    
    prompt();
  });
}

// Start the interactive session
prompt();
