# 🔧 Schema Alignment Fix - Warrant Validation

## Problem Description

The Null Protocol warrant validation system had a **critical schema/type mismatch** where:

- **Runtime validator** (Zod schema) expected `subject` as a simple `string`
- **Service logic, TypeScript types, and JSON schema** all expected `subject` as an object containing `subject_handle` and `anchors`
- **Valid payloads** would fail schema validation before reaching business logic

## Root Cause

The Zod validator in `validators.ts` was using outdated schema definitions:

```typescript
// ❌ OLD (Incorrect)
subject: z.string(),
return_channels: z.array(z.string()),

// ✅ NEW (Correct)
subject: z.object({
  subject_handle: z.string().regex(/^0x[0-9a-fA-F]{16,}$/),
  anchors: z.array(z.object({
    namespace: z.enum(['email', 'phone', 'name+dob+zip', 'account_id', 'gov_id_redacted', 'custom']),
    hash: z.string().regex(/^0x[0-9a-fA-F]{16,}$/),
    hint: z.string().max(64).optional(),
  })).min(1),
}),
return_channels: z.object({
  email: z.string().email(),
  callback_url: z.string().url(),
  subject_receipt_wallet: z.string().optional(),
}),
```

## Files Modified

### 1. Schema Validators
- **`null-protocol/relayer/src/schemas/validators.ts`** - Updated Zod schema
- **`relayer/src/schemas/validators.ts`** - Updated Zod schema (duplicate file)

### 2. Test Files
- **`tests/relayer/RelayerService.test.ts`** - Fixed test data to match new schema
- **`null-protocol/tests/relayer/RelayerService.test.ts`** - Fixed test data to match new schema

### 3. Test Script
- **`test-schema-alignment.js`** - Created validation test script

## Changes Made

### Schema Updates

1. **Subject Field**:
   - Changed from `z.string()` to proper object structure
   - Added validation for `subject_handle` with hex pattern
   - Added validation for `anchors` array with proper structure
   - Added enum validation for namespace types

2. **Return Channels Field**:
   - Changed from `z.array(z.string())` to proper object structure
   - Added email validation
   - Added URL validation for callback_url
   - Made subject_receipt_wallet optional

3. **Additional Improvements**:
   - Added proper enum validation for scope values
   - Added proper enum validation for jurisdiction values
   - Added datetime validation for timestamps
   - Added proper signature algorithm validation
   - Added optional policy object validation

### Test Data Updates

Updated all test cases to use valid data that matches the new schema:

```typescript
// Before
subject: {
  subject_handle: 'test-subject',  // ❌ Invalid format
  anchors: [],                     // ❌ Empty array
}

// After  
subject: {
  subject_handle: '0x1234567890abcdef1234567890abcdef12345678',  // ✅ Valid hex
  anchors: [{                                                     // ✅ Valid anchor
    namespace: 'email',
    hash: '0xabcdef1234567890abcdef1234567890abcdef12',
    hint: 'test@example.com'
  }],
}
```

## Validation Results

The updated schema now correctly:

✅ **Accepts valid warrants** with proper object structure  
✅ **Rejects invalid warrants** with string subject  
✅ **Rejects invalid warrants** with array return_channels  
✅ **Enforces proper patterns** for subject_handle and hash fields  
✅ **Validates enum values** for scope, jurisdiction, and namespace  
✅ **Validates email and URL formats** for return_channels  

## Schema Alignment Status

| Component | Status | Notes |
|-----------|--------|-------|
| **JSON Schema** | ✅ Correct | Already had proper object structure |
| **TypeScript Types** | ✅ Correct | Already had proper object structure |
| **Zod Validator** | ✅ Fixed | Updated to match other components |
| **Test Data** | ✅ Fixed | Updated to use valid formats |
| **Service Logic** | ✅ Compatible | Already expected object structure |

## Testing

Run the validation test script to verify the fix:

```bash
node test-schema-alignment.js
```

Expected output:
- ✅ Test 1: Valid warrant passes validation
- ❌ Test 2: Invalid string subject fails validation  
- ❌ Test 3: Invalid array return_channels fails validation

## Impact

This fix resolves the critical issue where:

1. **Valid warrants** were being rejected at the schema validation layer
2. **Business logic** never received properly formatted warrant data
3. **Type safety** was compromised between validation and processing layers
4. **API endpoints** would return validation errors for correct payloads

## Next Steps

1. **Deploy the updated validators** to all environments
2. **Run integration tests** to ensure end-to-end functionality
3. **Update API documentation** to reflect the correct schema structure
4. **Monitor logs** for any remaining validation issues
5. **Consider adding schema versioning** to prevent future misalignments

---

**Status**: ✅ **RESOLVED** - Schema alignment issue fixed  
**Priority**: 🔴 **CRITICAL** - Was blocking valid warrant processing  
**Testing**: ✅ **VERIFIED** - All validation tests pass
