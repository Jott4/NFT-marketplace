import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAddress, nftMarketAddress } from "../../config";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
import { Box, Flex, Grid, Text } from "@chakra-ui/layout";
import { Button } from "@chakra-ui/react";

interface MarketItem {
  tokenId: any;
  price: number;
  seller: any;
  owner: any;
}

const Index = () => {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    const provider = new ethers.providers.JsonRpcProvider(
      "https://polygon-mumbai.infura.io/v3/your-project-url"
    );
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftMarketAddress,
      Market.abi,
      provider
    );

    const data: MarketItem[] = await marketContract.fetchMarketItems();

    const items = await Promise.all(
      data.map(async (marketItem: MarketItem) => {
        const tokenUri = await tokenContract.tokenURI(marketItem.tokenId);
        const meta = await axios.get(tokenUri); //call ipfs url
        let price = ethers.utils.formatUnits(
          marketItem.price.toString(),
          "ether"
        );
        let item = {
          price,
          tokenId: marketItem.tokenId.toNumber(),
          seller: marketItem.seller,
          owner: marketItem.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };
        return item;
      })
    );
    setNfts(items);
    setLoadingState(true);
  };
  if (loadingState === true && !nfts.length)
    return (
      <Text p={20} py={10} fontSize={"3xl"}>
        No items in marketplace
      </Text>
    );

  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftMarketAddress, Market.abi, signer);

    /* user will be prompted to pay the asking process to complete the transaction */
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");
    const transaction = await contract.createMarketSale(
      nftAddress,
      nft.tokenId,
      {
        value: price,
      }
    );
    await transaction.wait();
    loadNFTs();
  }

  return (
    <Flex justify="center">
      <Box px={10} maxW={"1600px"}>
        <Grid gridColumn={[1, 2, 4]} gap={4} pt={4}>
          {nfts.map((nft, i) => (
            <Box
              key={i}
              border="1px"
              borderColor="gray"
              boxShadow="sm"
              rounded="xl"
              overflow="hidden"
            >
              <img src={nft.image} />
              <Box p={4}>
                <Text
                  style={{ height: "64px" }}
                  fontSize="2xl"
                  fontWeight="bold"
                >
                  {nft.name}
                </Text>
                <Box style={{ height: "70px", overflow: "hidden" }}>
                  <Text color="gray.400">{nft.description}</Text>
                </Box>
              </Box>
              <Box p={4} bg="black">
                <Text fontSize="2xl" mb={4} fontWeight="bold" color="white">
                  {nft.price} ETH
                </Text>
                <Button
                  w="full"
                  rounded="xl"
                  colorScheme="pink"
                  py={2}
                  px={12}
                  onClick={() => buyNft(nft)}
                >
                  Buy
                </Button>
              </Box>
            </Box>
          ))}
        </Grid>
      </Box>
    </Flex>
  );
};

export default Index;
