import { PrivateKey } from '../libraries/PrivateKey'
import { OasisdexContract } from '../libraries/OasisdexContract'
import { providers, Wallet } from 'ethers'
import BN = require("bn.js");

// TODO: read off Maker from env
const DAI_ADDRESS = "0x8c915bd2c0df8ba79a7d28538500a97bd15ea985";
const WETH_ADDRESS = "0xfcaf25bf38e7c86612a25ff18cb8e09ab07c9885";

const ZERO = new BN(0);
const ETHER = new BN(10).pow(new BN(18));

function getEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined) throw new Error(`${name} environment variable required`);
	return value;
}

async function doStuff() {
	// gather/validate inputs
	const jsonRpcAddress = getEnv('ETHEREUM_HTTP');
	const gasPriceInNanoeth = parseInt(getEnv('ETHEREUM_GAS_PRICE_IN_NANOETH'), 10);
	const oasisAddress = getEnv('ETHEREUM_OASIS_ADDRESS');
	const privateKey = PrivateKey.fromHexString(getEnv('ETHEREUM_PRIVATE_KEY'))

	const provider = new providers.JsonRpcProvider(jsonRpcAddress, { chainId: 4173, ensAddress: '', name: 'instaseal' })
	const wallet = new Wallet(privateKey.toHexStringWithPrefix(), provider)

	// TODO: arguments/env
	const payAmount = new BN(600).mul(ETHER);
	const buyAmount = new BN(1).mul(ETHER);

	const od = new OasisdexContract(oasisAddress, wallet, gasPriceInNanoeth);

	// TODO: check approvals/approve
	console.log("Sending offer...")
	console.log(await od.offer(payAmount, DAI_ADDRESS, buyAmount, WETH_ADDRESS, ZERO));
	console.log("Sent")
}

doStuff().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
