import type { CreateAuth } from "@convex-dev/better-auth";
import { httpRouter } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutesLazy(http, createAuth as unknown as CreateAuth<DataModel>);

export default http;
