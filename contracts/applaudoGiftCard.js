"use strict";

const TokenERC721Contract = require("../lib/tokenERC721");

const NFT_TPLT = {
    tokenId: "",
    owner: "",
    redeemed: false,
    activated: true,
    image: "https://testgerardo.infura-ipfs.io/ipfs/QmdZXSLnZ2xtjx6cFfMAXLex1fmLAmvhL6Z3LmCCGrdQGr",
    value: 100,
};

class ApplaudoGiftCardToken extends TokenERC721Contract {
    // constructor() {
    //     super("applaudoGiftCardToken");
    // }

    /**
     * Mint a new non-fungible token
     *
     * @param {Context} ctx the transaction context
     * @param {String} tokenId Unique ID of the non-fungible token to be minted
     * @param {String} tokenURI URI containing metadata of the minted non-fungible token
     * @returns {Object} Return the non-fungible token object
     */
    async MintGiftCard(ctx, tokenId) {
        this.Mint(tokenId, {
            owner: "",
            redeemed: false,
            activated: true,
            image: "https://testgerardo.infura-ipfs.io/ipfs/QmdZXSLnZ2xtjx6cFfMAXLex1fmLAmvhL6Z3LmCCGrdQGr",
            value: 100,
        });

        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        // Check minter authorization - this sample assumes Org1 is the issuer with privilege to mint a new token
        const clientMSPID = ctx.clientIdentity.getMSPID();
        if (clientMSPID !== this.centralBanKer) {
            throw new Error("client is not authorized to mint new tokens");
        }

        // Get ID of submitting client identity
        const minter = ctx.clientIdentity.getID();

        // Check if the token to be minted does not exist
        const exists = await this._nftExists(ctx, tokenId);

        if (exists) {
            throw new Error(`The token ${tokenId} is already minted.`);
        }

        // Add a non-fungible token
        const tokenIdInt = parseInt(tokenId);
        if (isNaN(tokenIdInt)) {
            throw new Error(
                `The tokenId ${tokenId} is invalid. tokenId must be an integer`
            );
        }

        const nft = Object.assign(NFT_TPLT, {
            tokenId: tokenIdInt,
            owner: minter,
        });

        const nftKey = ctx.stub.createCompositeKey(this.nftPrefix, [tokenId]);
        await ctx.stub.putState(nftKey, Buffer.from(JSON.stringify(nft)));

        // A composite key would be balancePrefix.owner.tokenId, which enables partial
        // composite key query to find and count all records matching balance.owner.*
        // An empty value would represent a delete, so we simply insert the null character.
        const balanceKey = ctx.stub.createCompositeKey(this.balancePrefix, [
            minter,
            tokenId,
        ]);
        await ctx.stub.putState(balanceKey, Buffer.from("\u0000"));

        // Emit the Transfer event
        const transferEvent = { from: "0x0", to: minter, tokenId: tokenIdInt };
        ctx.stub.setEvent(
            "Transfer",
            Buffer.from(JSON.stringify(transferEvent))
        );

        return nft;
    }

    /**
     * change token status to redeemed
     *
     * @param {context} ctx the transaction context
     * @param {string} tokenid unique id of the non-fungible token to be minted
     */
    async Redeem(ctx, tokenId) {
        //No sé si debemos filtrar que el sendr sea el owner o el admin
        //const sender = ctx.clientIdentity.getID();
        const nft = await this._readNFT(ctx, tokenId);
        if (nft.activated == false) {
            throw new Error("The NFT is not activated");
        }

        if (nft.redeemed == true) {
            throw new Error("The NFT is not activatedwas already redeemed");
        }

        nft.redeemed = true;

        const nftKey = ctx.stub.createCompositeKey(this.nftPrefix, [tokenId]);
        await ctx.stub.putState(nftKey, Buffer.from(JSON.stringify(nft)));
    }

    /**
     * change token status to deactivated
     *
     * @param {context} ctx the transaction context
     * @param {string} tokenid unique id of the non-fungible token to be minted
     */
    async Deactivate(ctx, tokenId) {
        const nft = await this._readNFT(ctx, tokenId);

        // if (nft.owner.role !== admin) {
        //     throw new Error("You do nt have permission to deactivate this NFT");
        // }

        if (nft.activated === false) {
            throw new Error("The NFT is not activated");
        }

        nft.activated = false;
        const nftKey = ctx.stub.createCompositeKey(this.nftPrefix, [tokenId]);
        await ctx.stub.putState(nftKey, Buffer.from(JSON.stringify(nft)));
    }
}

module.exports = ApplaudoGiftCardToken;
