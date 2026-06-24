// ABI del contrato MultiSig
// Generado por Hardhat al compilar contracts/MultiSig.sol
// Si modificás el contrato, corré: npx hardhat compile
// y reemplazá este archivo con artifacts/contracts/MultiSig.sol/MultiSig.json

const MultiSigABI = [
  //  Constructor 
  {
    "inputs": [
      { "internalType": "address[]", "name": "_signers", "type": "address[]" },
      { "internalType": "uint256", "name": "_threshold", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  //  Eventos 
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "proposer", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" },
      { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "ProposalCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "signer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "approvalCount", "type": "uint256" }
    ],
    "name": "ProposalApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "executor", "type": "address" }
    ],
    "name": "ProposalExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "proposer", "type": "address" }
    ],
    "name": "ProposalCancelled",
    "type": "event"
  },

  //  Funciones de escritura 
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "propose",
    "outputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "name": "execute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "name": "cancel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  //  Funciones de lectura 
  {
    "inputs": [],
    "name": "getSigners",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllProposals",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "value", "type": "uint256" },
          { "internalType": "bytes", "name": "data", "type": "bytes" },
          { "internalType": "address", "name": "proposer", "type": "address" },
          { "internalType": "uint256", "name": "approvalCount", "type": "uint256" },
          { "internalType": "bool", "name": "executed", "type": "bool" },
          { "internalType": "bool", "name": "cancelled", "type": "bool" }
        ],
        "internalType": "struct MultiSig.Proposal[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "name": "getProposal",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "value", "type": "uint256" },
          { "internalType": "bytes", "name": "data", "type": "bytes" },
          { "internalType": "address", "name": "proposer", "type": "address" },
          { "internalType": "uint256", "name": "approvalCount", "type": "uint256" },
          { "internalType": "bool", "name": "executed", "type": "bool" },
          { "internalType": "bool", "name": "cancelled", "type": "bool" }
        ],
        "internalType": "struct MultiSig.Proposal",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }, { "internalType": "address", "name": "signer", "type": "address" }],
    "name": "hasApproved",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "threshold",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "isSigner",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  { "stateMutability": "payable", "type": "receive" },
  { "stateMutability": "payable", "type": "fallback" }
] as const;

export default MultiSigABI;
