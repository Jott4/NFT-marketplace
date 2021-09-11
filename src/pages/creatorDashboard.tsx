import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftMarketAddress, nftAddress } from "../../config";

import Market from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import { Box, Grid, Image, Text } from "@chakra-ui/react";

export default function CreatorDashboard() {
  const [nfts, setNfts] = useState([]);
  const [sold, setSold] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  useEffect(() => {
    loadNFTs();
  }, []);
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const marketContract = new ethers.Contract(
      nftMarketAddress,
      Market.abi,
      signer
    );
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const data = await marketContract.fetchItemsCreated();

    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          sold: i.sold,
          image: meta.data.image,
        };
        return item;
      })
    );
    /* create a filtered array of items that have been sold */
    const soldItems = items.filter((i: any) => i.sold);
    setSold(soldItems);
    setNfts(items);
    setLoadingState("loaded");
  }
  if (loadingState === "loaded" && !nfts.length)
    return <h1>No assets created</h1>;
  return (
    <Box>
      <Box p={4}>
        <Text fontSize="2xl" py={2}>
          Items Created
        </Text>
        <Grid gridColumn={[1, 2, 4]} gap={4} pt={4}>
          {nfts.map((nft, i) => (
            <Box
              key={i}
              border="1px"
              shadow="md"
              rounded="xl"
              overflow="hidden"
            >
              <Image src={nft.image} rounded="md" />
              <Box p={4} bg="black" color="#FFF">
                <Text fontSize="2xl" fontWeight="bold">
                  Price - {nft.price} Eth
                </Text>
              </Box>
            </Box>
          ))}
        </Grid>
      </Box>
      <Box px={4}>
        {Boolean(sold.length) && (
          <Box>
            <Text fontSize="2xl" py={2}>
              Items sold
            </Text>
            <Grid gridColumn={[1, 2, 4]} gap={4} pt={4}>
              {sold.map((nft, i) => (
                <Box
                  key={i}
                  border="1px"
                  shadow="md"
                  rounded="xl"
                  overflow="hidden"
                >
                  <Image src={nft.image} rounded="md" />
                  <Box p={4} bg={"black"} color="#FFF">
                    <Text fontSize="2xl" fontWeight="bold">
                      Price - {nft.price} Eth
                    </Text>
                  </Box>
                </Box>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
}
