// This component is used to add comment to a product in the marketplace

// Importing the dependencies
import { useEffect, useState, useCallback } from "react";
// Import the toast library to display notifications
import { toast } from "react-toastify";
// Import the useDebounce hook to debounce the input fields
import { useDebounce } from "use-debounce";
// Import our custom useContractSend hook to write a product to the marketplace contract
import { useContractSend } from "@/hooks/contract/useContractWrite";
import { useContractCall } from "@/hooks/contract/useContractRead";
import { identiconTemplate } from "@/helpers";
import Link from "next/link";

// Define the CommentModal component
const CommentModal = ({id, name}:any) => {
  // The visible state is used to toggle the visibility of the modal
  const [visible, setVisible] = useState(false);
  // State used to store current comment to be saved
  const [comment, setComment] = useState("");
  // State used to store all the comments being fetched from the blockchain
  const [comments, setComments] = useState<any>();
  // The following states are used to debounce the input fields
  const [debouncedComment] = useDebounce(comment, 500);
  // State used to control the loading state of the app
  const [loading, setLoading] = useState("");

  // Use the useContractSend hook to use our makeComment function on the marketplace contract and add a comment to a product
  const { writeAsync: makeComment } = useContractSend("makeComment", [
    id,
    debouncedComment
  ]);
  // Use the useContractCAll hook to get all comments on a product from the smart contract
  const {data: allComments} = useContractCall("getComments", [id], true);
  // Define function that handles adding a comment to a product
  const addComment = async (e: any) => {
    e.preventDefault();
    setComment("")
    try {
      // Display a notification while the comment is added to the product
      await toast.promise(async () => {
        if (!makeComment) {
            throw "Failed to create product";
          }
          setLoading("Sending...");
          // Create the comment by calling the makeComment function on the marketplace contract
          const tx = await makeComment();
          setLoading("Waiting...");
          // Wait for the transaction to be mined
          await tx.wait();
      }, {
        pending: "Adding your comment...",
        success: "Comment added  successfully",
        error: "Something went wrong. Try again.",
      });
      // Display an error message if something goes wrong
    } catch (e: any) {
      console.log({ e });
      toast.error(e?.message || "Something went wrong. Try again.");
      // Clear the loading state after a comment is added to a product
    } finally {
      setLoading("");
    }
  };

  // Define a callback function to get all comments on a product when new comments is added to the product
  const getAllComments = useCallback(() => {
    if (!allComments) return null;
    setComments(allComments);
  }, [allComments]);

  useEffect(() => {
    getAllComments();
  }, [getAllComments]);

  // Define the JSX that will be rendered
  return (
      <div className={"flex flex-row w-full justify-between"}>
         {/* Button to toggle the comments modal  */}
         <div className="border border-black px-4 py-2 rounded-md w-full flex gap-1 item-center justify-center cursor-pointer hover:bg-white hover:border-white" onClick={() => setVisible(true)}>
            <svg className="w-6 h-6 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.5 6.5h.01m4.49 0h.01m4.49 0h.01M18 1H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3v5l5-5h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"/>
            </svg><span className="">({comments?.length})</span>
        </div>
        {/* Comments Modal */}
        {visible && (
          <div
            className="fixed z-40 overflow-y-auto top-0 w-full h-full left-0"
            id="modal"
          >

            {/* Form to use for adding comment to the product */}
            <form onSubmit={addComment}>
              <div className="flex items-center justify-center min-height-100vh pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity">
                  <div className="absolute inset-0 bg-gray-900 opacity-75" />
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                  &#8203;
                </span>
                <div
                  className="inline-block align-center bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-headline"
                >
                  {/* Modal view */}
                <p className="text-2xl text-center m-4">Comments on "{name}"</p>
                <div className="flex flex-col gap-4 m-4">
                  {/* List of all comments */}
                  {comments?.map((comment: { commenter: string; timeStamp: string; comment: string }) => (
                      <div className="border rounded-lg flex gap-3 px-4 py-2">
                        <Link href={`https://alfajores.celoscan.io/address/${comment.commenter}`}>{identiconTemplate(comment.commenter)}</Link>
                          <div className="flex flex-col">
                              <div className="italic underline text-sm font-mono">{new Date(Number(comment.timeStamp.toString())*1000).toLocaleString()}</div>
                              <div className="w-[20rem] wrap">{comment.comment}</div>
                          </div>
                      </div>
                  ))}
                </div>
                  {/* Input field for making comment */}
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <textarea onChange={(e) => setComment(e.target.value)} rows={4} required className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="Leave a comment..."></textarea>
                  </div>
                  {/* Button to close the modal */}
                  <div className="bg-gray-200 px-4 py-3 text-right">
                    <button
                      type="button"
                      className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700 mr-2"
                      onClick={() => setVisible(false)}
                    >
                      <i className="fas fa-times"></i> Close
                    </button>
                    {/* Button to add comment to the product */}
                    <button
                      type="submit"
                      disabled={!!loading || !makeComment}
                      className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      {loading ? loading : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
  );
};

export default CommentModal;