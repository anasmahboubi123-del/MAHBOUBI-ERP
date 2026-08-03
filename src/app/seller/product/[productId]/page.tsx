import { redirect, notFound } from "next/navigation";

const productRoutes: Record<string, string> = {
  "gp-khamiya": "/seller/khamiya",
  "gp-salon": "/seller/salon",
  "gp-tapis": "/seller/tapis",
  "gp-bois": "/seller/bois",
};

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ productId: string }> 
}) {
  const { productId } = await params;
  const route = productRoutes[productId];
  
  if (route) {
    redirect(route);
  }
  
  notFound();
}