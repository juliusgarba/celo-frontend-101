// SPDX-License-Identifier: MIT

// Version of Solidity compiler this program was written for
pragma solidity >=0.7.0 <0.9.0;

// Interface for the ERC20 token, in our case cUSD
interface IERC20Token {
    // Transfers tokens from one address to another
    function transfer(address, uint256) external returns (bool);

    // Approves a transfer of tokens from one address to another
    function approve(address, uint256) external returns (bool);

    // Transfers tokens from one address to another, with the permission of the first address
    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    // Returns the total supply of tokens
    function totalSupply() external view returns (uint256);

    // Returns the balance of tokens for a given address
    function balanceOf(address) external view returns (uint256);

    // Returns the amount of tokens that an address is allowed to transfer from another address
    function allowance(address, address) external view returns (uint256);

    // Event for token transfers
    event Transfer(address indexed from, address indexed to, uint256 value);
    // Event for approvals of token transfers
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

// Contract for the marketplace
contract Marketplace {
    // Keeps track of the number of products in the marketplace
    uint256 internal productsLength = 0;
    // Address of the cUSDToken
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    // Structure for a product
    struct Product {
        // Address of the product owner
        address payable owner;
        // Name of the product
        string name;
        // Link to an image of the product
        string image;
        // Description of the product
        string description;
        // Location of the product
        string location;
        // Price of the product in tokens
        uint256 price;
        // Number of times the product has been sold
        uint256 sold;
        // Number of times product has been liked
        uint256 likes;
    }

    struct Comment {
        address payable commenter;
        string comment;
        uint256 timeStamp;
    }

    // Mapping of products to their index
    mapping(uint256 => Product) internal products;
    // Mapping of all comments
    mapping(uint256 => Comment[]) internal comments;
    // Mapping of all liked products
    mapping(uint256 => mapping(address => bool)) liked;

    // Writes a new product to the marketplace
    function writeProduct(
        string memory _name,
        string memory _image,
        string memory _description,
        string memory _location,
        uint256 _price
    ) public {
        // Number of times the product has been sold is initially 0 because it has not been sold yet
        uint256 _sold = 0;
        // Number of times the product has been liked. 0 by default.
        uint256 _likes = 0;
        // Adds a new Product struct to the products mapping
        products[productsLength] = Product(
            // Sender's address is set as the owner
            payable(msg.sender),
            _name,
            _image,
            _description,
            _location,
            _price,
            _sold,
            _likes
        );
        // Increases the number of products in the marketplace by 1
        productsLength++;
    }

    // Reads a product from the marketplace
    function readProduct(
        // Index of the product
        uint256 _index
    )
        public
        view
        returns (
            Product memory
        )
    {
        // Returns the details of the product
        Product memory product = products[_index];
        return product;
    }

    // Buys a product from the marketplace
    function buyProduct(
        // Index of the product
        uint256 _index
    ) public payable {
        // Transfers the tokens from the buyer to the seller
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                // Sender's address is the buyer
                msg.sender,
                // Receiver's address is the seller
                products[_index].owner,
                // Amount of tokens to transfer is the price of the product
                products[_index].price
            ),
            // If transfer fails, throw an error message
            "Transfer failed."
        );
        // Increases the number of times the product has been sold
        products[_index].sold++;
    }

    // Returns the number of products in the marketplace
    function getProductsLength() public view returns (uint256) {
        return (productsLength);
    }

    // Like a product
    function like(uint256 _index) public {
        require(liked[_index][msg.sender] == false, "Already liked product");
        liked[_index][msg.sender] = true;
        products[_index].likes++;
    } 

    // unlike a product
    function unlike(uint256 _index) public {
        require(liked[_index][msg.sender] == true, "First like product before unlike");
        liked[_index][msg.sender] = false;
        products[_index].likes--;
    }

    // Make a comment on a product
    function makeComment(uint256 _index, string memory _comment) public {
        require(_index < productsLength, "Invalid index");
        require(msg.sender != address(0), "Invalid sender");
        comments[_index].push(Comment(payable(msg.sender), _comment, block.timestamp));
    }

    // Get comments made on a product
    function getComments(uint256 _index) public view returns (Comment[] memory) {
        return comments[_index];
    }

    // Return true if caller has liked a product, false otherwise
    function likedProduct(uint256 _index) public view returns (bool) {
        return liked[_index][msg.sender];
    }
}