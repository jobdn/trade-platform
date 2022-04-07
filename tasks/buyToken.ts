import { task } from "hardhat/config";
import { config } from "../config";

task("buyToken", "Byes token from platform")
  .addParam("amount", "Amount of tokens sold")
  .addParam("ether", "Amount of ether to buy 'amount' of tokens")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const { amount, ether } = taskArgs;
    const platform = await hre.ethers.getContractAt(
      "TradePlatform",
      config.PLATFORM
    );

    await platform.buyToken(amount, {
      value: hre.ethers.utils.parseEther(`${ether}`),
    });
    console.log(`${signer.address} bought ${amount} tokens`);
  });
