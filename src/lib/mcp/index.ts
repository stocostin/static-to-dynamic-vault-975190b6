import { defineMcp } from "@lovable.dev/mcp-js";
import listServices from "./tools/list-services";
import listShopProducts from "./tools/list-shop-products";
import listPortfolio from "./tools/list-portfolio";
import listBlogPosts from "./tools/list-blog-posts";
import submitContactMessage from "./tools/submit-contact-message";

export default defineMcp({
  name: "shachavir-timber-mcp",
  title: "Shachavir Timber",
  version: "0.1.0",
  instructions:
    "Tools for exploring Shachavir Timber's public catalog (services, shop products, portfolio, blog) and submitting contact messages.",
  tools: [listServices, listShopProducts, listPortfolio, listBlogPosts, submitContactMessage],
});
