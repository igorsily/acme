import type { AppRouter } from "@acme/api";
import type { ListParams } from "@acme/types/schemas/common.schema";
import type { QueryKey } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import { useMemo } from "react";
import {
	serializeSortingStateForApi,
	useTableSearchParams,
} from "@/components/data-table/lib/table-state-parsers";

type ListQueryError = TRPCClientErrorLike<AppRouter>;
type UseListQueryOptions<
	TQueryFnData extends ListQueryResponse<unknown>,
	TError,
	TData extends ListQueryResponse<unknown>,
	TQueryKey extends QueryKey,
> = Parameters<typeof useQuery<TQueryFnData, TError, TData, TQueryKey>>[0];

export type ListQueryResponse<TData> = {
	data: TData[];
	pageCount: number;
	total: number;
};

export type UseListQueryResult<
	TOutput extends ListQueryResponse<unknown>,
	TError = ListQueryError,
> = {
	data: TOutput["data"] | undefined;
	error: TError | null;
	isError: boolean;
	isFetching: boolean;
	isLoading: boolean;
	pageCount: number;
	total: number;
};

export function useListQuery<
	TQueryFnData extends ListQueryResponse<unknown>,
	TError = ListQueryError,
	TOutput extends ListQueryResponse<unknown> = TQueryFnData,
	TQueryKey extends QueryKey = QueryKey,
>(
	queryOptions: (
		input: ListParams
	) => UseListQueryOptions<TQueryFnData, TError, TOutput, TQueryKey>
): UseListQueryResult<TOutput, TError> {
	const [urlState] = useTableSearchParams();
	const { filters, pageIndex, pageSize, search, sort } = urlState;

	const input = useMemo(
		() => ({
			filters: filters.length > 0 ? filters : undefined,
			limit: pageSize,
			page: pageIndex + 1,
			search: search.trim() || undefined,
			sort: serializeSortingStateForApi(sort),
		}),
		[filters, pageIndex, pageSize, search, sort]
	);

	const query = useQuery(queryOptions(input));

	return {
		data: query.data?.data,
		error: query.error,
		isError: query.isError,
		isFetching: query.isFetching,
		isLoading: query.isLoading,
		pageCount: query.data?.pageCount ?? -1,
		total: query.data?.total ?? 0,
	};
}
