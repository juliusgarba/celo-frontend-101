// This is the main page of the app

// Import the AddProductModal, ProductList, Dashboard, and DisplayBalance components
import AddProductModal from "@/components/AddProductModal";
import ProductList from "@/components/ProductList";

// Export the Home component
export default function Home() {
  return (
    <div>
      <AddProductModal/>
      <ProductList/>
    </div>
  )
}