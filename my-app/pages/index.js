import{Contract, providers, utils} from "ethers";
import Head from 'next/head';
import Web3Modal from "web3modal";
import styles from '../styles/Home.module.css';
import React, {useEffect, useRef, useState} from 'react';
import {NFT_CONTRACT_ADDRESS, abi} from '../constants';



export default function Home() {
    // keep track of whether wallet is connected
    const [walletConnected, setWalletConnected] = useState(false);

    // keep track of whether presale has started
    const [presaleStarted, setPresaleStarted] = useState(false);

    // keep track of whether presale has ended
    const [presaleEnded, setPresaleEnded] = useState(false);

    // loading is set to true when transactions are pending
    const [loading, setLoading] = useState(false);

    //  check if connected wallet is the owner of the contract
    const [isOwner, setIsOwner] = useState(false);

    // keeps track of the number of tokens minted
    const [tokenIdsMinted, setTokensIdMinted] = useState("0");

    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    const web3ModalRef = useRef();

    

    // presale mint
    const presaleMint = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
            const txn = await whitelistContract.presaleMint({
                // cost of one NFT
                value: utils.parseEther("0.01"),
            });
            setLoading(true)
            await txn.wait();
            setLoading(false);
            window.alert("You have successfully minted a BtsNft!");
    
        }   catch(err) {
            console.error(err);
        }
    };

    // mint after presale has ended (normal mint)
    const publicMint = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const whitelistContract = new Contract( NFT_CONTRACT_ADDRESS, abi, signer);
            const txn = await whitelistContract.mint({value: utils.parseEther("0.01")});
            setLoading(true);
            await txn.wait();
            setLoading(false);
            window.alert("You have successfully minted a BtsNft!")
        }   catch(err) {
            console.error(err)
        }
    };

    // connect wallet

    const connectWallet = async () => {
        try {
            await getProviderOrSigner();
            setWalletConnected(true);
        }   catch(err) {
            console.error(err);
        }
    };

    // start presale 
    const startPresale = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
            const txn = await whitelistContract.startPresale();
            setLoading(true);
            await txn.wait();
            setLoading(false);
        }   catch(err){
            console.error(err);
        }
    };

    // check if presale has started
    const checkIfPresaleStarted = async () => {
        try{
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
            const txn = await nftContract.presaleStarted();
            if (!txn) {
                await getOwner();
            }
            setPresaleStarted(txn);
        }   catch(err) {
            console.error(err);
            return false;
        }
    };

    // check if presale has ended
    const checkIfPresaleEnded = async () => {
        try {
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
            const txn = await nftContract.presaleEnded();
            const hasEnded = txn.lt(Math.floor(Date.now() / 1000));
            if (hasEnded) {
                setPresaleEnded(true);
            }   else {
                setPresaleEnded(false)
            }
            return hasEnded;
        }   catch(err) {
            console.error(err);
            return false;
        }  
    };

    // call the contract to retrieve the owner
    const getOwner = async () => {
        try {
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
            const _owner = await nftContract.owner();
            const signer = await getProviderOrSigner(true);
            const address = await signer.getAddress();
            if (address.toLowerCase() === _owner.toLowerCase()) {
                setIsOwner(true);
            }
        }   catch(err) {
            console.error(err.message);
        }
    };

    // retrieve the number of tokens that have been minted so far
    const getTokenIdsMinted = async () => {
        try {
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
            const _tokenIds = await nftContract.tokenIds();
            setTokensIdMinted(_tokenIds.toString());
        }   catch(err) {
            console.error(err);
        }
    };

    // Get provider or signer
    const getProviderOrSigner = async (needSigner = false) => {
        // connect to wallet
       const provider = await web3ModalRef.current.connect();
       const web3Provider = new providers.Web3Provider(provider);

        // making sure it's rinkeby
        const {chainId} = await web3Provider.getNetwork();
        if (chainId !==4) {
            window.alert("Change the network to Rinkeby");
            throw new Error("Change to Rinkeby");
        }

        if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }
        return web3Provider;
    };

    useEffect(() => {
         // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "rinkeby",
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet();
            
            // check if presale has started or ended
            const _presaleStarted = checkIfPresaleStarted();
            if (_presaleStarted) {
                checkIfPresaleEnded();
            }

            getTokenIdsMinted();

            // check every 10 seconds to see if presale has ended
            const presaleEndedInterval = setInterval(async function () {
                const _presaleStarted = await checkIfPresaleStarted();
                if (_presaleStarted) {
                    const _presaleEnded = await checkIfPresaleEnded();
                    if (_presaleEnded) {
                        clearInterval(presaleEndedInterval)
                    }
                }
            }, 10 * 1000);
        }
    }, [walletConnected]);

    const renderButton = () => {
        // If wallet is not connected, return a button which allows them to connect their wllet
        if (!walletConnected) {
          return (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          );
        }
    
        // If we are currently waiting for something, return a loading button
        if (loading) {
          return <button className={styles.button}>Loading...</button>;
        }
    
        // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
        if (isOwner && !presaleStarted) {
          return (
            <button className={styles.button} onClick={startPresale}>
              Start Presale!
            </button>
          );
        }
    
        // If connected user is not the owner but presale hasn't started yet, tell them that
        if (!presaleStarted) {
          return (
            <div>
              <div className={styles.description}>Presale hasnt started!</div>
            </div>
          );
        }
    
        // If presale started, but hasn't ended yet, allow for minting during the presale period
        if (presaleStarted && !presaleEnded) {
          return (
            <div>
              <div className={styles.description}>
                Presale has started!!! If your address is whitelisted, Mint a
                Crypto Dev 🥳
              </div>
              <button className={styles.button} onClick={presaleMint}>
                Presale Mint 🚀
              </button>
            </div>
          );
        }
    
        // If presale started and has ended, its time for public minting
        if (presaleStarted && presaleEnded) {
          return (
            <button className={styles.button} onClick={publicMint}>
              Public Mint 🚀
            </button>
          );
        }
    };
    
    return (
        <div>
          <Head>
            <title>Crypto Devs</title>
            <meta name="description" content="Whitelist-Dapp" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <div className={styles.main}>
            <div>
              <h1 className={styles.title}>Welcome to Bts NFTs!</h1>
              <div className={styles.description}>
                Just a sample project - Its an NFT collection for developers in Crypto.
              </div>
              <div className={styles.description}>
                {tokenIdsMinted}/20 have been minted
              </div>
              {renderButton()}
            </div>
            <div>
              <img className={styles.image} src="./cryptodevs/0.svg" />
            </div>
          </div>
    
          <footer className={styles.footer}>
            Made with &#10084; @iykethe1st
          </footer>
        </div>
    );

}

