import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import {
  ACDMPlatform,
  ACDMPlatform__factory,
  ACDMToken,
  ACDMToken__factory,
} from "../typechain-types";

describe("ACDMPlatform", function () {
  let signer: SignerWithAddress;
  let platform: ACDMPlatform;
  let adcmToken: ACDMToken;
  const ROUND_TIME = 60;
  const SALE = 0;

  beforeEach(async () => {
    [signer] = await ethers.getSigners();
    adcmToken = await new ACDMToken__factory(signer).deploy(
      "ACDM TOkEN",
      "ACDM"
    );
    platform = await new ACDMPlatform__factory(signer).deploy(
      adcmToken.address,
      BigNumber.from(ROUND_TIME)
    );
    await adcmToken.setRoleTo(
      utils.formatBytes32String("MINTER_ROLE"),
      platform.address
    );
    expect(
      await adcmToken.hasRole(
        utils.formatBytes32String("MINTER_ROLE"),
        platform.address
      )
    );
    await adcmToken.setRoleTo(
      utils.formatBytes32String("BURNER_ROLE"),
      platform.address
    );
  });

  describe("deploy", () => {
    it("should deploy ACDMPlatform", async () => {
      expect(platform.address).to.be.properAddress;
      expect(await platform._ACDMToken()).to.eq(adcmToken.address);
      expect(await platform._roundTime()).to.eq(ROUND_TIME);
      expect(await platform.ACDM_AMOUNT()).to.eq(10 ** 5);
      expect(await platform._roundStatus()).to.eq(SALE);
    });
  });
});
