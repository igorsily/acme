import { createSearchParamsCache, createSerializer } from "nuqs/server";

import { paginationParsers } from "./table-state-parsers";

export const tableCache = createSearchParamsCache(paginationParsers);
export const serializeTableState = createSerializer(paginationParsers);
