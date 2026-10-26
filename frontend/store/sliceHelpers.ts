import type {
  ActionReducerMapBuilder,
  AsyncThunk,
  Draft,
} from "@reduxjs/toolkit";

type BooleanKey<State> = {
  [Key in keyof State]: State[Key] extends boolean ? Key : never;
}[keyof State];

type ErrorKey<State> = {
  [Key in keyof State]: State[Key] extends string | null
    ? null extends State[Key]
      ? Key
      : never
    : never;
}[keyof State];

/** Keep request status transitions consistent while each slice owns its payload. */
export function addAsyncCases<
  State extends object,
  Returned,
  ThunkArg,
  LoadingKey extends BooleanKey<State>,
  FailureKey extends ErrorKey<State>,
>(
  builder: ActionReducerMapBuilder<State>,
  thunk: AsyncThunk<Returned, ThunkArg, object>,
  options: {
    loadingKey: LoadingKey;
    errorKey: FailureKey;
    fallbackError: string;
    onFulfilled: (state: Draft<State>, payload: Returned) => void;
    onPending?: (state: Draft<State>) => void;
    onRejected?: (state: Draft<State>) => void;
  }
): void {
  const setStatus = (
    state: Draft<State>,
    loading: boolean,
    error: string | null
  ) => {
    const loadingState = state as unknown as Record<LoadingKey, boolean>;
    const errorState = state as unknown as Record<FailureKey, string | null>;
    loadingState[options.loadingKey] = loading;
    errorState[options.errorKey] = error;
  };

  builder
    .addCase(thunk.pending, (state) => {
      setStatus(state, true, null);
      options.onPending?.(state);
    })
    .addCase(thunk.fulfilled, (state, action) => {
      options.onFulfilled(state, action.payload);
      setStatus(state, false, null);
    })
    .addCase(thunk.rejected, (state, action) => {
      setStatus(state, false, action.error.message || options.fallbackError);
      options.onRejected?.(state);
    });
}
