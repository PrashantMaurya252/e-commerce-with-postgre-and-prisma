import { ApiProduct } from "@/types/product";

export  const getProductImage = (files: ApiProduct["files"]) => {
  if (!files || files.length === 0) {
    return "/products/placeholder.png";
  }

  const imageFile = files.find((f) => f.type === "IMAGE");
  if (imageFile) return imageFile.url;

  // if only video exists, still show placeholder
  return "/products/placeholder.png";
};
