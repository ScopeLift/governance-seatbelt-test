# GitHub App Testing Guide

This document addresses common issues and provides guidance for testing GitHub Apps against this repository.

## Potential Issues & Solutions

### 1. **Artifact Download Timing**
**Issue**: GitHub Actions artifacts are only available after workflow completion  
**Solution**: 
- Test against manually triggered workflows (`workflow_dispatch`)
- Check artifact availability via GitHub API before attempting download
- Implement retry logic with exponential backoff

### 2. **File Size Differences**
**Issue**: Real governance-seatbelt files are ~400KB, our test files are ~3-50KB  
**Why**: Real files include massive Slither security analysis reports  
**Impact**: Minimal - structure and format are identical, just less content  
**Solution**: If you need larger files for load testing, we can add more Slither output

### 3. **Artifact Naming Conventions**
**Real System**: `Uniswap`, `Compound`, etc.  
**Test System**: Identical naming - no issues expected  

### 4. **Directory Structure**
**Format**: `reports/${daoName}/${governorAddress}/${proposalId}.{json,md,html,pdf}`  
**Test Coverage**: ✅ Matches exactly

### 5. **Workflow Schedule**
**Issue**: 3-hour schedule may not trigger frequently enough for testing  
**Solution**: Use manual workflow triggers or modify schedule for faster testing

### 6. **Missing Real Proposal Data**
**Issue**: Our proposals are dummy data, not real governance proposals  
**Impact**: Structure is identical, but content is synthetic  
**Solution**: Acceptable for GitHub App testing - you're testing download/processing, not proposal analysis

## Testing Recommendations

### Phase 1: Manual Testing
```bash
# 1. Trigger workflow manually
gh workflow run governance-checks.yaml

# 2. Wait for completion and check artifacts
gh run list --limit 1
gh run download <run-id>
```

### Phase 2: Automated Testing
```typescript
// Example: Check for artifact availability
const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
  owner: 'ScopeLift',
  repo: 'governance-seatbelt-test',
  run_id: runId
});

// Verify expected artifacts exist
const expectedArtifacts = ['Uniswap', 'Compound', 'ENS', 'frontend-data'];
```

### Phase 3: Structure Validation
```typescript
// Validate JSON structure matches expectations
interface StructuredSimulationReport {
  title: string;
  proposalText: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  checks: SimulationCheck[];
  stateChanges: SimulationStateChange[];
  events: SimulationEvent[];
  metadata: {
    blockNumber: string;
    timestamp: string;
    proposalId: string;
    proposer: string;
  };
}
```

## Key Differences from Production

| Aspect | Production | Test Repo |
|--------|------------|-----------|
| File Size | ~400KB | ~3-50KB |
| Proposal Content | Real governance | Synthetic/dummy |
| Slither Reports | Full analysis | Sample content |
| Update Frequency | Live proposals | Fixed test data |
| Historical Data | Years of proposals | 9 test proposals |

## Troubleshooting

### Common Issues
1. **404 on artifact download**: Workflow may still be running
2. **Empty artifact**: Check workflow logs for generation errors  
3. **Structure mismatch**: Verify you're using latest test data format
4. **Rate limiting**: GitHub API has rate limits for artifact downloads

### Debug Commands
```bash
# Check workflow status
gh run list --repo ScopeLift/governance-seatbelt-test

# View workflow logs
gh run view <run-id> --log

# List available artifacts
gh api repos/ScopeLift/governance-seatbelt-test/actions/artifacts
```

## Production Migration Checklist

When ready to test against real governance-seatbelt:

- [ ] Update repository reference from `ScopeLift/governance-seatbelt-test` to `uniswapfoundation/governance-seatbelt`
- [ ] Adjust for larger file sizes (~400KB vs ~50KB)
- [ ] Handle real proposal IDs (incrementing numbers, not fixed test IDs)
- [ ] Account for varying proposal frequencies (not fixed 3-hour schedule)
- [ ] Test against historical data (80+ proposals available)

## Support

If you encounter issues specific to this test repository:
1. Check the [main repository](https://github.com/ScopeLift/governance-seatbelt-test) for updates
2. File an issue with reproduction steps
3. Tag @marcomariscal for governance-seatbelt questions

Happy testing! 🚀