import { constants } from "ethers";
import { task } from "hardhat/config";
import { config } from "../config";

task("register", "Registers a user")
  .addParam("referer", "Referer of user")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const { referer } = taskArgs;
    const platform = await hre.ethers.getContractAt(
      "TradePlatform",
      config.PLATFORM
    );

    await platform.register(referer);
    if (referer === constants.AddressZero) {
      console.log(`${signer} became a referer`);
    } else {
      console.log(`${signer} is a referer of ${referer}`);
    }
  });
