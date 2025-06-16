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
  const checkTypes = [
    { name: 'State Change Analysis', status: 'success' as const, description: 'All state changes look reasonable' },
    { name: 'Access Control Check', status: 'warning' as const, description: 'Some functions require elevated permissions' },
    { name: 'Gas Usage Analysis', status: 'success' as const, description: 'Gas usage within expected bounds' },
    { name: 'External Call Safety', status: 'error' as const, description: 'Detected potentially unsafe external call' },
    { name: 'Token Balance Check', status: 'success' as const, description: 'Token balances preserved correctly' }
  ];
  
  return checkTypes.slice(0, Math.floor(Math.random() * 4) + 2);
}

function generateRandomStateChanges(): SimulationStateChange[] {
  const changes: SimulationStateChange[] = [];
  const numChanges = Math.floor(Math.random() * 5) + 1;
  
  for (let i = 0; i < numChanges; i++) {
    changes.push({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      slot: `0x${Math.random().toString(16).substr(2, 64)}`,
      before: `0x${Math.random().toString(16).substr(2, 64)}`,
      after: `0x${Math.random().toString(16).substr(2, 64)}`,
      description: `Storage slot ${i + 1} updated`
    });
  }
  
  return changes;
}

function generateRandomEvents(): SimulationEvent[] {
  const events: SimulationEvent[] = [];
  const numEvents = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < numEvents; i++) {
    events.push({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      topics: [
        `0x${Math.random().toString(16).substr(2, 64)}`,
        `0x${Math.random().toString(16).substr(2, 64)}`
      ],
      data: `0x${Math.random().toString(16).substr(2, 128)}`,
      decoded: {
        name: ['Transfer', 'Approval', 'ProposalExecuted'][Math.floor(Math.random() * 3)],
        signature: 'Transfer(address,address,uint256)',
        args: {
          from: `0x${Math.random().toString(16).substr(2, 40)}`,
          to: `0x${Math.random().toString(16).substr(2, 40)}`,
          value: (Math.random() * 1000000).toFixed(0)
        }
      }
    });
  }
  
  return events;
}

function generateStructuredReport(daoName: string, governorAddress: string, proposalId: string): StructuredSimulationReport {
  const statuses = ['success', 'warning', 'error'] as const;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    title: `${daoName} Proposal ${proposalId}: Protocol Upgrade`,
    proposalText: `This proposal aims to upgrade the ${daoName} protocol with new features and bug fixes. The proposal includes contract upgrades, parameter changes, and treasury allocations.`,
    status,
    summary: status === 'success' 
      ? 'All checks passed successfully. The proposal appears safe to execute.'
      : status === 'warning'
      ? 'Some warnings detected. Please review before execution.'
      : 'Critical issues found. Do not execute without addressing concerns.',
    checks: generateRandomChecks(),
    stateChanges: generateRandomStateChanges(),
    events: generateRandomEvents(),
    metadata: {
      blockNumber: (18000000 + Math.floor(Math.random() * 100000)).toString(),
      timestamp: new Date().toISOString(),
      proposalId,
      proposer: `0x${Math.random().toString(16).substr(2, 40)}`
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

${report.checks.map(check => `### ${check.name}
- **Status**: ${check.status}
- **Description**: ${check.description}
${check.details ? `- **Details**: ${check.details}` : ''}
`).join('\n')}

## State Changes

${report.stateChanges.map((change, i) => `### Change ${i + 1}
- **Address**: ${change.address}
- **Slot**: ${change.slot}
- **Before**: ${change.before}
- **After**: ${change.after}
${change.description ? `- **Description**: ${change.description}` : ''}
`).join('\n')}

## Events Emitted

${report.events.map((event, i) => `### Event ${i + 1}
- **Address**: ${event.address}
- **Topics**: ${event.topics.join(', ')}
- **Data**: ${event.data}
${event.decoded ? `- **Decoded**: ${event.decoded.name} - ${JSON.stringify(event.decoded.args)}` : ''}
`).join('\n')}

## Metadata
- **Block Number**: ${report.metadata.blockNumber}
- **Timestamp**: ${report.metadata.timestamp}
- **Proposal ID**: ${report.metadata.proposalId}
- **Proposer**: ${report.metadata.proposer}

---
*Generated by governance-seatbelt-test*
`;
}

function generateFrontendData(daoName: string, governorAddress: string, proposalId: string, report: StructuredSimulationReport, markdownReport: string): FrontendData {
  return {
    proposalData: {
      id: proposalId,
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