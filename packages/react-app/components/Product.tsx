/* eslint-disable @next/next/no-img-element */
// This component displays and enables the purchase of a product

// Importing the dependencies
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
// Import ethers to format the price of the product correctly
import { ethers } from "ethers";
// Import the useConnectModal hook to trigger the wallet connect modal
import { useConnectModal } from "@rainbow-me/rainbowkit";
// Import the useAccount hook to get the user's address
import { useAccount } from "wagmi";
// Import the toast library to display notifications
import { toast } from "react-toastify";
// Import our custom identicon template to display the owner of the product
import { identiconTemplate } from "@/helpers";
// Import our custom hooks to interact with the smart contract
import { useContractApprove } from "@/hooks/contract/useApprove";
import { useContractCall } from "@/hooks/contract/useContractRead";
import { useContractSend } from "@/hooks/contract/useContractWrite";
import CommentModal from "./CommentModal";

// Define the interface for the product, an interface is a type that describes the properties of an object
interface Product {
  name: string;
  price: number;
  owner: string;
  image: string;
  description: string;
  location: string;
  sold: boolean;
  likes: number;
}

// Define the Product component which takes in the id of the product and some functions to display notifications
const Product = ({ id, setError, setLoading, clear }: any) => {
  // Use the useAccount hook to store the user's address
  const { address } = useAccount();
  // Use the useContractCall hook to read the data of the product with the id passed in, from the marketplace contract
  const { data: rawProduct }: any = useContractCall("readProduct", [id], true);
  // Use the useContractSend hook to purchase the product with the id passed in, via the marketplace contract
  const { writeAsync: purchase } = useContractSend("buyProduct", [Number(id)]);
  const [product, setProduct] = useState<Product | null>(null);
  // Use the useContractApprove hook to approve the spending of the product's price, for the ERC20 cUSD contract
  const { writeAsync: approve } = useContractApprove(
    product?.price?.toString() || "0"
  );
  // use the usecontractSend hook to like a product
  const {writeAsync: like} = useContractSend("like", [Number(id)]);
  // use the usecontractSend hook to unlike a product
  const {writeAsync: unlike} = useContractSend("unlike", [Number(id)]);
  // use the usecontractCall hook to like check if a product is liked
  const {data: likedProduct} = useContractCall("likedProduct", [id], true, address)
  // Use the useConnectModal hook to trigger the wallet connect modal
  const { openConnectModal } = useConnectModal();
  // Format the product data that we read from the smart contract
  const getFormatProduct = useCallback(() => {
    if (!rawProduct) return null;
    setProduct({
      owner: rawProduct[0],
      name: rawProduct[1],
      image: rawProduct[2],
      description: rawProduct[3],
      location: rawProduct[4],
      price: Number(rawProduct[5]),
      sold: rawProduct[6].toString(),
      likes: Number(rawProduct[7])
    });
  }, [rawProduct]);

  // Call the getFormatProduct function when the rawProduct state changes
  useEffect(() => {
    getFormatProduct();
  }, [getFormatProduct]);

  // Define the handlePurchase function which handles the purchase interaction with the smart contract
  const handlePurchase = async () => {
    if (!approve || !purchase) {
      throw "Failed to purchase this product";
    }
    // Approve the spending of the product's price, for the ERC20 cUSD contract
    const approveTx = await approve();
    // Wait for the transaction to be mined, (1) is the number of confirmations we want to wait for
    await approveTx.wait(1);
    setLoading("Purchasing...");
    // Once the transaction is mined, purchase the product via our marketplace contract buyProduct function
    const res = await purchase();
    // Wait for the transaction to be mined
    await res.wait();
  };
 
  // Define the purchaseProduct function that is called when the user clicks the purchase button
  const purchaseProduct = async () => {
    setLoading("Approving ...");
    clear();

    try {
      // If the user is not connected, trigger the wallet connect modal
      if (!address && openConnectModal) {
        openConnectModal();
        return;
      }
      // If the user is connected, call the handlePurchase function and display a notification
      await toast.promise(handlePurchase(), {
        pending: "Purchasing product...",
        success: "Product purchased successfully",
        error: "Failed to purchase product",
      });
      // If there is an error, display the error message
    } catch (e: any) {
      console.log({ e });
      setError(e?.reason || e?.message || "Something went wrong. Try again.");
      // Once the purchase is complete, clear the loading state
    } finally {
      setLoading(null);
    }
  };

  // Define a function to like a product
  const likeProduct = async () => {
    setLoading("Liking product");
    try {
      // If the user is not connected, trigger the wallet connect modal
      if (!address && openConnectModal) {
        openConnectModal();
        return;
      }
       // If the user is connected, like the product and display notification
       await toast.promise(async () => {
        if (!like) {
          throw "Failed to like product"
        }
        setLoading("Liking product")
        const likeTx = await like();
        await likeTx.wait();
      }, {
        pending: "Liking product...",
        success: "Liked successfully",
        error: "Failed to like product",
      });
      // If there is an error, display the error message
    } catch (e: any) {
      setError(e?.reason || e?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(null)
    }
  }

  // Define a function to unlike a product
  const unlikeProduct = async () => {
    setLoading("Unliking product");
    try {
      // If the user is not connected, trigger the wallet connect modal
      if (!address && openConnectModal) {
        openConnectModal();
        return;
      }
       // If the user is connected, unlike the product and display notification
       await toast.promise(async () => {
        if (!unlike) {
          throw "Failed to like product"
        }
        setLoading("Liking product")
        const unlikeTx = await unlike();
        await unlikeTx.wait();
      }, {
        pending: "Unliking product...",
        success: "Unliked successfully",
        error: "Failed to unlike product",
      });
      // If there is an error, display the error message
    } catch (e: any) {
      setError(e?.reason || e?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(null)
    }
  }

  // If the product cannot be loaded, return null
  if (!product) return null;

  // Format the price of the product from wei to cUSD otherwise the price will be way too high
  const productPriceFromWei = ethers.utils.formatEther(
    product.price.toString()
  );

  // Return the JSX for the product component
  return (
    <div className={"shadow-lg relative w-[22rem] rounded-b-lg"}>
      <p className="group">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-white xl:aspect-w-7 xl:aspect-h-8 ">
          {/* Show the number of products sold */}
          <span
            className={
              "absolute z-10 right-0 mt-4 bg-amber-400 text-black p-1 rounded-l-lg px-4"
            }
          >
            {product.sold} sold
          </span>
          {/* Show the product image */}
          <img
            src={product.image}
            alt={"image"}
            className="w-full h-80 rounded-t-md  object-cover object-center group-hover:opacity-75"
          />
          {/* Show the address of the product owner as an identicon and link to the address on the Celo Explorer */}
          <Link
            href={`https://explorer.celo.org/alfajores/address/${product.owner}`}
            className={"absolute -mt-7 ml-6 h-16 w-16 rounded-full"}
          >
            {identiconTemplate(product.owner)}
          </Link>
        </div>

        <div className={"m-5"}>
          <div className={"pt-1 h-40"}>
            {/* Show the product name */}
            <p className="mt-4 text-2xl font-bold">{product.name}</p>
            <div className={"h-40 overflow-y-hidden scrollbar-hide"}>
              {/* Show the product description */}
              <h3 className="mt-4 text-sm text-gray-700">
                {product.description}
              </h3>
            </div>
          </div>
          {/* Like/Unlike/Comment on a product */}
          <div className="flex justify-around gap-3">
            {likedProduct? (
                <div className="border border-black px-4 py-2 rounded-md w-1/2 flex item-center justify-center cursor-pointer hover:bg-white hover:border-white" onClick={unlikeProduct}> 
                  <svg className="w-6 h-6 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 18">
                    <path d="M3 7H1a1 1 0 0 0-1 1v8a2 2 0 0 0 4 0V8a1 1 0 0 0-1-1Zm12.954 0H12l1.558-4.5a1.778 1.778 0 0 0-3.331-1.06A24.859 24.859 0 0 1 6 6.8v9.586h.114C8.223 16.969 11.015 18 13.6 18c1.4 0 1.592-.526 1.88-1.317l2.354-7A2 2 0 0 0 15.954 7Z"/>
                  </svg>({product.likes})
                </div>
            ) : ( 
              <div className="border border-black px-4 py-2 rounded-md w-1/2 flex item-center justify-center cursor-pointer hover:bg-white hover:border-white" onClick={likeProduct}> 
                <svg className="w-6 h-6 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.008 8.714c1-.097 1.96-.45 2.792-1.028a25.112 25.112 0 0 0 4.454-5.72 1.8 1.8 0 0 1 .654-.706 1.742 1.742 0 0 1 1.65-.098 1.82 1.82 0 0 1 .97 1.128c.075.248.097.51.065.767l-1.562 4.629M4.008 8.714H1v9.257c0 .273.106.535.294.728a.99.99 0 0 0 .709.301h1.002a.99.99 0 0 0 .71-.301c.187-.193.293-.455.293-.728V8.714Zm8.02-1.028h4.968c.322 0 .64.08.925.232.286.153.531.374.716.645a2.108 2.108 0 0 1 .242 1.883l-2.36 7.2c-.288.813-.48 1.354-1.884 1.354-2.59 0-5.39-1.06-7.504-1.66"/>
                </svg>({product.likes})
               </div>) 
            }
            <CommentModal id={id} name={product.name}/>
          </div>

          <div className="mt-8">
            <div className={"flex flex-row"}>
              {/* Show the product location */}
              <img src={"/location.svg"} alt="Location" className={"w-6"} />
              <h3 className="pt-1 text-sm text-gray-700">{product.location}</h3>
            </div>

            {/* Buy button that calls the purchaseProduct function on click */}
            <button
              onClick={purchaseProduct}
              className="mt-4 h-14 w-full border-[1px] border-gray-500 text-black p-2 rounded-lg hover:bg-black hover:text-white"
            >
              {/* Show the product price in cUSD */}
              Buy for {productPriceFromWei} cUSD
            </button>
          </div>
        </div>
      </p>
    </div>
  );
};

export default Product;