import { task } from "hardhat/config";
import { config } from "../config";

task("addOrder", "Byes token from platform")
  .addParam("amount", "Amount of tokens")
  .addParam("price", "Price of order in ether")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const { amount, price } = taskArgs;
    const platform = await hre.ethers.getContractAt(
      "TradePlatform",
      config.PLATFORM
    );

    const token = await hre.ethers.getContractAt("TradeToken", config.TOKEN);
    await token.approve(config.PLATFORM, amount);

    const priceETH = hre.ethers.utils.parseEther(`${price}`);
    await platform.addOrder(amount, priceETH);
    console.log(
      `${signer.address} added order with ${amount} tokens for ${priceETH} wei`
    );
  });
