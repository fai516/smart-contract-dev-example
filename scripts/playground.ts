import { Wallet } from "ethers";
import { privateToAddress } from "ethereumjs-util";

async function main() {
  const wallet = Wallet.createRandom();
  const signingKey: any = wallet._signingKey();
  console.log("address: ", wallet.address);
  console.log("priKey: ", signingKey["privateKey"]);
}

// We recommend this pattern to be able to use asy nc/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
