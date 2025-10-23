# Developer Remediation Checklist

## Pre-Fix Verification

- [ ] I have read POC_REPORT.md and understand the vulnerability
- [ ] I have run `node demo-injection.js` and seen the proof of concept
- [ ] I understand why the current code is vulnerable
- [ ] I have backed up the current codebase

## Implementation Checklist

### File 1: src/pages/api/slack/vouch.ts

- [ ] Added `import validator from 'validator';` at the top
- [ ] Added email format validation using `validator.isEmail(email)`
- [ ] Added check for single quotes in email
- [ ] Added check for double quotes in email  
- [ ] Added check for parentheses in email
- [ ] Added email length limit (max 255 characters)
- [ ] Tested with legitimate email - should work ✅
- [ ] Tested with injection payload - should be blocked ❌
- [ ] Code compiles without errors
- [ ] TypeScript types are correct

### File 2: src/pages/api/slack/lookup.ts

- [ ] Added `import validator from 'validator';` at the top
- [ ] Added email format validation using `validator.isEmail(email)`
- [ ] Added check for single quotes in email
- [ ] Added check for double quotes in email
- [ ] Added check for parentheses in email
- [ ] Added email length limit (max 255 characters)
- [ ] Tested with legitimate email - should work ✅
- [ ] Tested with injection payload - should be blocked ❌
- [ ] Code compiles without errors
- [ ] TypeScript types are correct

### File 3: src/lib/slack.ts

- [ ] Added `import validator from 'validator';` at the top
- [ ] Added email format validation using `validator.isEmail(email)`
- [ ] Added check for single quotes in email
- [ ] Added check for double quotes in email
- [ ] Added check for parentheses in email
- [ ] Added email length limit (max 255 characters)
- [ ] Updated error messages to use Slack ephemeral messages
- [ ] Tested with legitimate email - should work ✅
- [ ] Tested with injection payload - should be blocked ❌
- [ ] Code compiles without errors
- [ ] TypeScript types are correct

## Testing Checklist

### Build and Compile

- [ ] Run `yarn build` - no errors
- [ ] Run `yarn lint` - no errors
- [ ] TypeScript compilation successful
- [ ] No new warnings introduced

### Functional Testing - Legitimate Use Cases

- [ ] `/vouch user@example.com reason` - should work
- [ ] `/lookup user@example.com` - should work
- [ ] Grant creation with verified email - should work
- [ ] Normal email formats (john.doe@example.com) - should work
- [ ] Email with + (user+tag@example.com) - should work
- [ ] Email with numbers (user123@example.com) - should work

### Security Testing - Injection Attempts

- [ ] `/lookup ') OR TRUE() OR ({Email} = 'x` - should be blocked
- [ ] `/vouch test' OR '1'='1 reason` - should be blocked
- [ ] `/lookup ') OR ({Verification Status} = 'Eligible` - should be blocked
- [ ] `/vouch test()@example.com reason` - should be blocked
- [ ] Email with quotes: `test"quote@example.com` - should be blocked
- [ ] Email with backslash: `test\@example.com` - should be blocked

### Error Message Testing

- [ ] Injection attempts show helpful error (not internal details)
- [ ] Error messages don't leak database structure
- [ ] Error messages guide users to correct format
- [ ] Slack ephemeral messages work correctly

## Code Review Checklist

- [ ] All three files updated consistently
- [ ] Validation logic is identical across files
- [ ] No code duplication (consider extracting to helper function)
- [ ] Error handling is appropriate
- [ ] No console.log statements left in code
- [ ] Comments added where necessary
- [ ] Code follows project style guide

## Deployment Checklist

### Pre-Deployment

- [ ] All changes committed to version control
- [ ] Pull request created with description
- [ ] Code reviewed by another developer
- [ ] All tests passing
- [ ] No merge conflicts

### Deployment

- [ ] Deploy to staging environment first
- [ ] Test in staging with real Slack workspace
- [ ] Verify legitimate users can still use commands
- [ ] Verify injection attempts are blocked
- [ ] Monitor logs for errors
- [ ] Deploy to production
- [ ] Verify production deployment

### Post-Deployment

- [ ] Monitor application logs for 1 hour
- [ ] Check for any error spikes
- [ ] Verify Slack commands still work
- [ ] Test a few commands manually
- [ ] Document deployment in changelog
- [ ] Update team on deployment status

## Verification Checklist

### Run the PoC Again

- [ ] Run `node security-poc/demo-injection.js`
- [ ] Confirm all 5 attack vectors would now be blocked
- [ ] Legitimate emails would still work

### Manual Testing

Test these exact commands in Slack:

```bash
# Should work ✅
/lookup user@example.com
/vouch student@university.edu Good student

# Should be blocked ❌
/lookup ') OR TRUE() OR ({Email} = 'x
/vouch test' OR '1'='1 reason
```

- [ ] Legitimate commands work
- [ ] Malicious commands blocked
- [ ] Error messages are appropriate

## Documentation Checklist

- [ ] Update CHANGELOG.md with security fix
- [ ] Update deployment notes
- [ ] Document any API changes
- [ ] Update internal security documentation
- [ ] Notify team of deployment

## Long-Term Checklist (Optional)

- [ ] Extract validation logic to shared helper function
- [ ] Add unit tests for email validation
- [ ] Add integration tests for API endpoints
- [ ] Consider using Airtable record IDs instead of email queries
- [ ] Implement rate limiting on Slack commands
- [ ] Add security logging for blocked attempts
- [ ] Set up monitoring alerts for injection attempts
- [ ] Schedule security audit for other endpoints

## Sign-Off

I confirm that:

- [ ] I have completed all items in this checklist
- [ ] I have tested the changes thoroughly
- [ ] I understand the security implications
- [ ] I am confident the vulnerability is fixed
- [ ] I have documented my changes

**Developer Name**: _________________  
**Date**: _________________  
**Time Spent**: _______ hours  
**Deployment Date**: _________________  

## Emergency Rollback Plan

If issues arise after deployment:

1. [ ] Identify the specific issue
2. [ ] Check if it's related to email validation
3. [ ] Review error logs
4. [ ] If critical, rollback to previous version
5. [ ] Fix issue in separate branch
6. [ ] Re-test and re-deploy

**Rollback Command**: `git revert <commit-hash>`  
**Previous Version**: _________________  

## Questions?

If you have questions while implementing:

1. Review `QUICK_FIX.md` for code examples
2. Review `TECHNICAL_ANALYSIS.md` for detailed explanation
3. Run `node interactive-tester.js` to test specific cases
4. Contact security team if unsure

---

**Status**: ⏳ In Progress  
**Priority**: 🔴 CRITICAL  
**Deadline**: 24 hours from discovery
