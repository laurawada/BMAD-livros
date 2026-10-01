"use client";

import { useActionState } from "react";
import { SHELF_STATUSES, SHELF_STATUS_FORM_FIELD } from "@/domain/shelf";
import type { ShelfStatus } from "@/domain/shelf";
import {
  addBookToShelf,
  changeShelfStatus,
} from "@/app/actions/shelf";
import type { ShelfActionState } from "@/app/actions/shelf";
import styles from "./shelf-action.module.css";

const initialState: ShelfActionState = { kind: "idle", message: "" };

export function ShelfActionClient({
  signedSnapshot,
}: {
  signedSnapshot: string;
}) {
  const [state, action, pending] = useActionState(
    addBookToShelf.bind(null, signedSnapshot),
    initialState,
  );

  return (
    <form action={action} className={styles.action}>
      <button className={styles.primary} disabled={pending} type="submit">
        {pending ? "Adicionando..." : "Adicionar à estante"}
      </button>
      <p aria-live="polite" className={styles[state.kind]}>
        {state.message}
      </p>
    </form>
  );
}

export function ShelfStatusAction({
  bookId,
  status,
}: {
  bookId: string;
  status: ShelfStatus;
}) {
  const [state, action, pending] = useActionState(
    changeShelfStatus.bind(null, bookId),
    initialState,
  );

  return (
    <form action={action} className={styles.statusForm}>
      <label className={styles.visuallyHidden} htmlFor={`status-${bookId}`}>
        Status de leitura
      </label>
      <select
        defaultValue={status}
        id={`status-${bookId}`}
        name={SHELF_STATUS_FORM_FIELD}
      >
        {SHELF_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button disabled={pending} type="submit">
        {pending ? "Salvando..." : "Salvar"}
      </button>
      <p aria-live="polite" className={styles[state.kind]}>
        {state.message}
      </p>
    </form>
  );
}