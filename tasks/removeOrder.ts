import { task } from "hardhat/config";
import { config } from "../config";

task("removeOrder", "Remove of the order")
  .addParam("id", "Id of removed order")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const { id } = taskArgs;
    const platform = await hre.ethers.getContractAt(
      "TradePlatform",
      config.PLATFORM
    );

    await platform.removeOrder(id);
    console.log(`${signer.address} removed order with ${id} id`);
  });
