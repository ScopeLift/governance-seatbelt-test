import { StructuredSimulationReport, SimulationCheck, SimulationStateChange, SimulationEvent, FrontendData } from '../types';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import mdToPdf from 'md-to-pdf';

// Test DAOs with real governor addresses
const TEST_DAOS = [
  {
    name: 'Uniswap',
    governorAddress: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
    proposalIds: ['42', '43', '44']
  },
  {
    name: 'Compound',
    governorAddress: '0xc0Da02939E1441F497fd74F78cE7Decb17B66529',
    proposalIds: ['120', '121', '122']
  },
  {
    name: 'ENS',
    governorAddress: '0x323A76393544d5ecca80cd6ef2A560C6a395b7E3',
    proposalIds: ['15', '16', '17']
  }
];

function generateRandomChecks(): SimulationCheck[] {
  const slitherReport = `Slither report for Uni (Uniswap) at \`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984\`
\`\`\`
'solc --standard-json --allow-paths /home/runner/work/governance-seatbelt/governance-seatbelt' running
Warning: crytic-export/etherscan-contracts/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984-Uni.sol:6:1: Warning: Experimental features are turned on. Do not use experimental features on live deployments.
pragma experimental ABIEncoderV2;
^-------------------------------^

INFO:Detectors:
Uni._writeCheckpoint(address,uint32,uint96,uint96) (crytic-export/etherscan-contracts/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984-Uni.sol#543-554) uses a dangerous strict equality:
\t- nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlock == blockNumber (crytic-export/etherscan-contracts/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984-Uni.sol#546)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#dangerous-strict-equalities

INFO:Detectors:
Uni.constructor(address,address,uint256).minter_ (crytic-export/etherscan-contracts/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984-Uni.sol#272) lacks a zero-check on :
\t\t- minter = minter_ (crytic-export/etherscan-contracts/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984-Uni.sol#277)
Uni.setMinter(address).minter_ (crytic-export/etherscan-contracts/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984-Uni.sol#286) lacks a zero-check on :
\t\t- minter = minter_ (crytic-export/etherscan-contracts/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984-Uni.sol#289)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#missing-zero-address-validation

INFO:Detectors:
Version constraint ^0.5.16 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
solc-0.5.16 is an outdated solc version. Use a more recent version (at least 0.8.0), if possible.
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity

INFO:Slither:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984 analyzed (2 contracts with 100 detectors), 8 result(s) found
\`\`\``;

  const checkTypes = [
    {
      title: 'Reports all state changes from the proposal',
      status: 'passed' as const,
      details: '**Info**: KeeperRegistry at `0x02777053d6764996e594c3E88AF1D58D5363a2e6`\n\n**Info**:     Slot `0x0501829a2098dcd24ef0e30c5f88882a2714e55fb810652c8592bc4a0915fbaf` changed from `"0x00000025e35f9ca303bf6b5d9efa0a617c0552f1558c95993aa8b8a68b3e709c"` to `"0x00000025e3fb2b7d24cd2dbe9efa0a617c0552f1558c95993aa8b8a68b3e709c"`\n\n**Info**: Uni (Uniswap) at `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`\n\n**Info**:     Slot `0x78a95558fb04b554a95e8e6733a662913f8df94755af3b70a1060a00d317f6bd` changed from `"0x000000000000000000000000000000000000000000006aae30f51b48b191c400"` to `"0x00000000000000000000000000000000000000000000757ae822b9b40b71c400"`',
      info: [
        'KeeperRegistry at `0x02777053d6764996e594c3E88AF1D58D5363a2e6`',
        '    Slot `0x0501829a2098dcd24ef0e30c5f88882a2714e55fb810652c8592bc4a0915fbaf` changed from `"0x00000025e35f9ca303bf6b5d9efa0a617c0552f1558c95993aa8b8a68b3e709c"` to `"0x00000025e3fb2b7d24cd2dbe9efa0a617c0552f1558c95993aa8b8a68b3e709c"`',
        'Uni (Uniswap) at `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`',
        '    Slot `0x78a95558fb04b554a95e8e6733a662913f8df94755af3b70a1060a00d317f6bd` changed from `"0x000000000000000000000000000000000000000000006aae30f51b48b191c400"` to `"0x00000000000000000000000000000000000000000000757ae822b9b40b71c400"`'
      ]
    },
    {
      title: 'Decodes target calldata into a human-readable format',
      status: 'passed' as const,
      details: '**Info**: `0x1a9c8182c09f50c8318d769245bea52c32be35bc` calls `transfer(0x3B59C6d0034490093460787566dc5D6cE17F2f9C, 51000000000000000000000)` on Uni (Uniswap) at `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` (decoded from ABI)',
      info: [
        '`0x1a9c8182c09f50c8318d769245bea52c32be35bc` calls `transfer(0x3B59C6d0034490093460787566dc5D6cE17F2f9C, 51000000000000000000000)` on Uni (Uniswap) at `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` (decoded from ABI)'
      ]
    },
    {
      title: 'Reports all events emitted from the proposal',
      status: 'passed' as const,
      details: '**Info**: Uni (Uniswap) at `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`\n\n**Info**:     `Transfer(from: 0x1a9c8182c09f50c8318d769245bea52c32be35bc, to: 0x3b59c6d0034490093460787566dc5d6ce17f2f9c, amount: 51000000000000000000000)`\n\n**Info**: KeeperRegistry at `0x02777053d6764996e594c3E88AF1D58D5363a2e6`\n\n**Info**:     `UpkeepPerformed(id: 70674896803373309280938685131993977254155230537119778021708067126423115539033, success: true, from: 0x33512418380f170e5752fc233f1326f3e805ea62, payment: 43785688898716257, performData: 0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000059)`',
      info: [
        'Uni (Uniswap) at `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`',
        '    `Transfer(from: 0x1a9c8182c09f50c8318d769245bea52c32be35bc, to: 0x3b59c6d0034490093460787566dc5d6ce17f2f9c, amount: 51000000000000000000000)`',
        'KeeperRegistry at `0x02777053d6764996e594c3E88AF1D58D5363a2e6`',
        '    `UpkeepPerformed(id: 70674896803373309280938685131993977254155230537119778021708067126423115539033, success: true, from: 0x33512418380f170e5752fc233f1326f3e805ea62, payment: 43785688898716257, performData: 0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000059)`'
      ]
    },
    {
      title: 'Check all targets are verified on Etherscan',
      status: 'passed' as const,
      details: '**Info**: [`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`](https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984): Contract (verified)',
      info: [
        '[`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`](https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984): Contract (verified)'
      ]
    },
    {
      title: 'Check all touched contracts are verified on Etherscan',
      status: 'passed' as const,
      details: '**Info**: [`0x33512418380F170e5752Fc233F1326f3e805eA62`](https://etherscan.io/address/0x33512418380F170e5752Fc233F1326f3e805eA62): Contract (not verified)\n\n**Info**: [`0x02777053D6764996e594C3e88aF1D58d5363a2E6`](https://etherscan.io/address/0x02777053D6764996e594C3e88aF1D58d5363a2E6): Contract (verified)\n\n**Info**: [`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`](https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984): Contract (verified)',
      info: [
        '[`0x33512418380F170e5752Fc233F1326f3e805eA62`](https://etherscan.io/address/0x33512418380F170e5752Fc233F1326f3e805eA62): Contract (not verified)',
        '[`0x02777053D6764996e594C3e88aF1D58d5363a2E6`](https://etherscan.io/address/0x02777053D6764996e594C3e88aF1D58d5363a2E6): Contract (verified)',
        '[`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`](https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984): Contract (verified)'
      ]
    },
    {
      title: 'Check all targets do not contain selfdestruct',
      status: 'passed' as const,
      details: '**Info**: [`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`](https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984): Contract (looks safe)',
      info: [
        '[`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`](https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984): Contract (looks safe)'
      ]
    },
    {
      title: 'Check all touched contracts do not contain selfdestruct',
      status: 'warning' as const,
      details: '**Warning**: [`0x33512418380F170e5752Fc233F1326f3e805eA62`](https://etherscan.io/address/0x33512418380F170e5752Fc233F1326f3e805eA62): EOA (may have code later)\n\n**Info**: [`0x02777053D6764996e594C3e88aF1D58d5363a2E6`](https://etherscan.io/address/0x02777053D6764996e594C3e88aF1D58d5363a2E6): Contract (looks safe)\n\n**Info**: [`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`](https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984): Contract (looks safe)',
      info: [
        '[`0x02777053D6764996e594C3e88aF1D58d5363a2E6`](https://etherscan.io/address/0x02777053D6764996e594C3e88aF1D58d5363a2E6): Contract (looks safe)',
        '[`0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`](https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984): Contract (looks safe)'
      ]
    },
    {
      title: 'Reports on whether the caller needs to send ETH with the call',
      status: 'passed' as const,
      details: '**Info**: No ETH is required to be sent by the account that executes this proposal.',
      info: [
        'No ETH is required to be sent by the account that executes this proposal.'
      ]
    },
    {
      title: 'Slither static analysis',
      status: 'passed' as const,
      details: slitherReport,
      info: [slitherReport]
    }
  ];
  
  return checkTypes.slice(0, Math.floor(Math.random() * 4) + 6);
}

function generateRandomStateChanges(): SimulationStateChange[] {
  const contractNames = ['KeeperRegistry', 'Uni (Uniswap)', 'GovernorBravo'];
  const contractAddresses = [
    '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    '0x408ED6354d4973f66138C91495F2f2FCbd8724C3'
  ];
  
  const changes: SimulationStateChange[] = [];
  const numChanges = Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < numChanges; i++) {
    const contractIndex = Math.floor(Math.random() * contractNames.length);
    changes.push({
      contract: contractNames[contractIndex],
      contractAddress: contractAddresses[contractIndex],
      key: `0x${Math.random().toString(16).substr(2, 64)}`,
      oldValue: `0x${Math.random().toString(16).substr(2, 64)}`,
      newValue: `0x${Math.random().toString(16).substr(2, 64)}`
    });
  }
  
  return changes;
}

function generateRandomEvents(): SimulationEvent[] {
  // Real governance-seatbelt has empty events array in many cases
  return [];
}

function generateStructuredReport(daoName: string, governorAddress: string, proposalId: string): StructuredSimulationReport {
  const statuses = ['success', 'warning', 'error'] as const;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const titles = [
    'Scaling V4 and Supporting Unichain',
    'Protocol Fee Changes',
    'Treasury Allocation Proposal', 
    'Governance Parameter Updates',
    'Emergency Action Proposal'
  ];
  
  const proposalTexts = [
    `# ${titles[0]}\nPGOV is submitting the proposal on GFX Labs' behalf because GFX no longer has sufficient voting power to submit.\n\nGFX Labs proposes that the ${daoName} DAO allocate funding to support the integration of new protocol features and enhance the ecosystem's capabilities.`,
    `# ${titles[1]}\nThis proposal adjusts protocol fees to optimize the system's economic incentives while maintaining competitive advantages in the market.`,
    `# ${titles[2]}\nThe ${daoName} community proposes allocating treasury funds for strategic initiatives that will drive long-term growth and adoption.`
  ];
  
  const selectedTitle = titles[Math.floor(Math.random() * titles.length)];
  const selectedText = proposalTexts[Math.floor(Math.random() * proposalTexts.length)];
  
  return {
    title: selectedTitle,
    proposalText: selectedText,
    status,
    summary: status === 'success' 
      ? `Simulation completed successfully for proposal: "${selectedTitle}".`
      : status === 'warning'
      ? `Simulation completed with warnings for proposal: "${selectedTitle}".`
      : `Simulation completed with errors for proposal: "${selectedTitle}".`,
    checks: generateRandomChecks(),
    stateChanges: generateRandomStateChanges(),
    events: generateRandomEvents(),
    metadata: {
      proposalId,
      proposer: `0x${Math.random().toString(16).substr(2, 40)}`,
      governorAddress,
      executor: Math.random() > 0.5 ? `0x${Math.random().toString(16).substr(2, 40)}` : undefined,
      simulationBlockNumber: (22000000 + Math.floor(Math.random() * 500000)).toString(),
      simulationTimestamp: Math.floor(Date.now() / 1000).toString(),
      proposalCreatedAtBlockNumber: (22000000 + Math.floor(Math.random() * 400000)).toString(),
      proposalCreatedAtTimestamp: (Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 100000)).toString(),
      proposalExecutedAtBlockNumber: Math.random() > 0.3 ? (22000000 + Math.floor(Math.random() * 450000)).toString() : undefined,
      proposalExecutedAtTimestamp: Math.random() > 0.3 ? (Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 50000)).toString() : undefined
    }
  };
}

function generateMarkdownReport(report: StructuredSimulationReport): string {
  return `# ${report.title}

## Summary
${report.summary}

## Status: ${report.status.toUpperCase()}

## Proposal Description
${report.proposalText}

## Checks Performed

${report.checks.map(check => `### ${check.title}
- **Status**: ${check.status}
- **Details**: ${check.details}
- **Info**: 
${check.info.map(info => `  - ${info}`).join('\n')}
`).join('\n')}

## State Changes

${report.stateChanges.map((change, i) => `### Change ${i + 1}
- **Contract**: ${change.contract}
- **Address**: ${change.contractAddress}
- **Key**: ${change.key}
- **Old Value**: ${change.oldValue}
- **New Value**: ${change.newValue}
`).join('\n')}

## Events Emitted

${report.events.map((event, i) => `### Event ${i + 1}
- **Address**: ${event.address}
- **Topics**: ${event.topics.join(', ')}
- **Data**: ${event.data}
${event.decoded ? `- **Decoded**: ${event.decoded.name} - ${JSON.stringify(event.decoded.args)}` : ''}
`).join('\n')}

## Metadata
- **Proposal ID**: ${report.metadata.proposalId}
- **Proposer**: ${report.metadata.proposer}
- **Governor Address**: ${report.metadata.governorAddress}
${report.metadata.executor ? `- **Executor**: ${report.metadata.executor}` : ''}
- **Simulation Block Number**: ${report.metadata.simulationBlockNumber}
- **Simulation Timestamp**: ${report.metadata.simulationTimestamp}
${report.metadata.proposalCreatedAtBlockNumber ? `- **Proposal Created At Block**: ${report.metadata.proposalCreatedAtBlockNumber}` : ''}
${report.metadata.proposalCreatedAtTimestamp ? `- **Proposal Created At Timestamp**: ${report.metadata.proposalCreatedAtTimestamp}` : ''}
${report.metadata.proposalExecutedAtBlockNumber ? `- **Proposal Executed At Block**: ${report.metadata.proposalExecutedAtBlockNumber}` : ''}
${report.metadata.proposalExecutedAtTimestamp ? `- **Proposal Executed At Timestamp**: ${report.metadata.proposalExecutedAtTimestamp}` : ''}

---
*Generated by governance-seatbelt-test*
`;
}

function generateFrontendData(daoName: string, governorAddress: string, proposalId: string, report: StructuredSimulationReport, markdownReport: string): FrontendData {
  return {
    proposalData: {
      id: proposalId,
      governorAddress,
      targets: [`0x${Math.random().toString(16).substr(2, 40)}` as `0x${string}`],
      values: ['0'],
      signatures: ['upgrade(address)'],
      calldatas: [`0x${Math.random().toString(16).substr(2, 64)}` as `0x${string}`],
      description: report.proposalText
    },
    report: {
      status: report.status,
      summary: report.summary,
      markdownReport,
      structuredReport: report
    }
  };
}

async function generateReportsForDAO(dao: typeof TEST_DAOS[0]) {
  console.log(`Generating reports for ${dao.name}...`);
  
  const daoDir = join('reports', dao.name, dao.governorAddress);
  mkdirSync(daoDir, { recursive: true });
  
  const frontendData: FrontendData[] = [];
  
  for (const proposalId of dao.proposalIds) {
    console.log(`  Generating proposal ${proposalId}...`);
    
    // Generate structured report
    const structuredReport = generateStructuredReport(dao.name, dao.governorAddress, proposalId);
    
    // Generate markdown
    const markdownReport = generateMarkdownReport(structuredReport);
    
    // Generate frontend data
    const proposalFrontendData = generateFrontendData(dao.name, dao.governorAddress, proposalId, structuredReport, markdownReport);
    frontendData.push(proposalFrontendData);
    
    // Write JSON file
    writeFileSync(
      join(daoDir, `${proposalId}.json`),
      JSON.stringify(structuredReport, null, 2)
    );
    
    // Write Markdown file
    writeFileSync(
      join(daoDir, `${proposalId}.md`),
      markdownReport
    );
    
    // Generate HTML (simple conversion)
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>${structuredReport.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        .status-success { color: #22c55e; }
        .status-warning { color: #f59e0b; }
        .status-error { color: #ef4444; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
    </style>
</head>
<body>
    ${markdownReport.replace(/\n/g, '<br>').replace(/### /g, '<h3>').replace(/## /g, '<h2>').replace(/# /g, '<h1>')}
</body>
</html>`;
    
    writeFileSync(
      join(daoDir, `${proposalId}.html`),
      htmlContent
    );
    
    // Generate PDF
    try {
      const pdf = await mdToPdf({ content: markdownReport });
      if (pdf) {
        writeFileSync(join(daoDir, `${proposalId}.pdf`), pdf.content);
      }
    } catch (error) {
      console.warn(`Failed to generate PDF for ${dao.name} proposal ${proposalId}:`, error);
    }
    
    // Write simulation-results.json for this proposal (matching PR #38)
    writeFileSync(
      join(daoDir, `${proposalId}-simulation-results.json`),
      JSON.stringify(proposalFrontendData, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2)
    );
  }
  
  return frontendData;
}

export async function generateAllReports() {
  console.log('Starting report generation...');
  
  // Create base directories
  mkdirSync('reports', { recursive: true });
  mkdirSync('frontend/public', { recursive: true });
  
  const allFrontendData: FrontendData[] = [];
  
  // Generate reports for each DAO
  for (const dao of TEST_DAOS) {
    const daoFrontendData = await generateReportsForDAO(dao);
    allFrontendData.push(...daoFrontendData);
  }
  
  // Write combined frontend data (with BigInt serialization)
  writeFileSync(
    'frontend/public/simulation-results.json',
    JSON.stringify(allFrontendData, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2)
  );
  
  console.log('Report generation complete!');
  console.log(`Generated ${allFrontendData.length} total reports across ${TEST_DAOS.length} DAOs`);
}

if (import.meta.main) {
  generateAllReports().catch(console.error);
}