import { task } from "hardhat/config";
import { config } from "../config";

task("redeemOrder", "Redeem part of the order")
  .addParam("id", "Id of order")
  .addParam("amount", "Amount of tokens of the order")
  .addParam("ether", "Amount of ether to redeem 'amount' of tokens from order")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const { id, amount, ether } = taskArgs;
    const platform = await hre.ethers.getContractAt(
      "TradePlatform",
      config.PLATFORM
    );

    await platform.redeemOrder(id, amount, {
      value: hre.ethers.utils.parseEther(`${ether}`),
    });
    console.log(
      `${signer.address} redeemed ${amount} tokens from the order with ${id} id`
    );
  });
