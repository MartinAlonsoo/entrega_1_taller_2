// Deploy de Entrega 3.
// Usa PAYMENT_TOKEN_ADDRESS si se provee un ERC-20 existente.
// Si no hay token configurado, despliega MockERC20 para demo/testnet.

require("dotenv").config();
const { ethers } = require("hardhat");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function isPlaceholder(value) {
  if (!value) return true;

  const address = value.trim();
  return (
    address === "" ||
    address === ZERO_ADDRESS ||
    address.includes("...") ||
    address.includes("Direccion") ||
    address.includes("Token")
  );
}

function getUsableAddress(value, envName) {
  if (isPlaceholder(value)) return undefined;

  const address = value.trim();
  if (!ethers.utils.isAddress(address)) {
    throw new Error(`${envName} no es una direccion Ethereum valida: ${address}`);
  }

  return address;
}

async function deployMockToken(deployer) {
  console.log("PAYMENT_TOKEN_ADDRESS no definido. Desplegando MockERC20...\n");

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Mock USD", "MUSD");
  await token.deployed();

  const initialSupply = ethers.utils.parseEther(
    process.env.MOCK_TOKEN_INITIAL_SUPPLY || "1000000"
  );

  // Esperar el minado evita reutilizar el nonce del mint en el siguiente deploy.
  const mintTx = await token.mint(deployer.address, initialSupply);
  await mintTx.wait();

  console.log(`MockERC20 desplegado en: ${token.address}`);
  console.log(
    `Mint inicial para deployer: ${ethers.utils.formatEther(initialSupply)} MUSD\n`
  );

  return token.address;
}

async function main() {
  console.log("Desplegando JobMarketplace...\n");

  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH\n`);

  let paymentTokenAddress = getUsableAddress(
    process.env.PAYMENT_TOKEN_ADDRESS,
    "PAYMENT_TOKEN_ADDRESS"
  );

  if (paymentTokenAddress) {
    console.log(`Usando ERC-20 existente: ${paymentTokenAddress}\n`);
  } else {
    paymentTokenAddress = await deployMockToken(deployer);
  }

  const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
  const marketplace = await JobMarketplace.deploy(paymentTokenAddress);
  const deployReceipt = await marketplace.deployTransaction.wait();

  console.log(`JobMarketplace desplegado en: ${marketplace.address}`);
  console.log(
    `Bloque de deploy: ${deployReceipt.blockNumber}`
  );
  console.log(`Payment token: ${paymentTokenAddress}\n`);

  const exampleReason = ethers.utils.formatBytes32String("approved");
  const exampleCalldata = marketplace.interface.encodeFunctionData("complete", [
    0,
    exampleReason,
  ]);

  const multisigAddress =
    getUsableAddress(process.env.VITE_MULTISIG_ADDRESS, "VITE_MULTISIG_ADDRESS") ||
    getUsableAddress(process.env.VITE_CONTRACT_ADDRESS, "VITE_CONTRACT_ADDRESS");

  console.log("Variables para .env:");
  console.log(`PAYMENT_TOKEN_ADDRESS=${paymentTokenAddress}`);
  console.log(`VITE_MARKETPLACE_ADDRESS=${marketplace.address}`);
  console.log(
    `VITE_MARKETPLACE_DEPLOYMENT_BLOCK=${deployReceipt.blockNumber}`
  );
  console.log(`VITE_PAYMENT_TOKEN_ADDRESS=${paymentTokenAddress}`);

  if (multisigAddress) {
    console.log(`VITE_MULTISIG_ADDRESS=${multisigAddress}`);
    console.log(`VITE_CONTRACT_ADDRESS=${multisigAddress}`);
  } else {
    console.log("VITE_MULTISIG_ADDRESS=0xDireccionDelMultiSig");
    console.log("VITE_CONTRACT_ADDRESS=0xDireccionDelMultiSig");
  }

  console.log("\nCalldata de ejemplo para MultiSig:");
  console.log("Funcion: JobMarketplace.complete(uint256 jobId, bytes32 reason)");
  console.log("Ejemplo con jobId=0 y reason='approved':");
  console.log(exampleCalldata);
  console.log("\nNota: cambiar jobId y reason para una prueba real.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en despliegue:", error);
    process.exit(1);
  });
