//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";



contract BtsNfts is ERC721Enumerable, Ownable {
    // tokenURI
    string _baseTokenURI;

    //price of one NFT
    uint public _price = 0.01 ether;

    //pause the contract in case of an emergency
    bool public _paused;

    //max number of nfts
    uint public maxTokenIds = 20;

    // total tokens minted
    uint public tokenIds;

    // IWhitelist contract instance
    IWhitelist whitelist;

    // keep track of presale
    bool public presaleStarted;

    // timestamp for when presale will end
    uint public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }

    constructor (string memory baseURI, address whitelistContract) ERC721("BtsToken", "Bts") {
        baseURI = _baseTokenURI;
        whitelist = IWhitelist(whitelistContract);
    }

    // presale function
    function startPresale(uint _presaleTime) public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + _presaleTime;
    }


    //  mint function during presale
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale not running!");
        require(whitelist.whiteListedAddresses(msg.sender), "You are not currently whitelisted!");
        require(tokenIds < maxTokenIds, "Exceeded maximum NFT supply!");
        require(msg.value >= _price, "Please pay the required amount!");
        tokenIds += 1;
        _safeMint((msg.sender), tokenIds);
    }

    //  mint function when presale has ended
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale not running!");
        require(tokenIds < maxTokenIds, "Exceeded maximum NFT supply!");
        require(msg.value >= _price, "Please pay the required amount!");
        tokenIds += 1;
        _safeMint((msg.sender), tokenIds);
    }

    // return baseURI
    function _baseURI() internal view virtual override returns(string memory) {
        return _baseTokenURI;
    }

    // fucntion to pause the contract
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }


    // withdraw function sends all the ether in the contract to the owner of the contract
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // function to receive ether
    receive() external payable {}

    // fallback function when msg.data is not empty
    fallback() external payable {}
} 

























