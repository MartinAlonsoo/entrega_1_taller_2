import React, { useState } from "react";
import { zeroHash, type Hex } from "viem";
import type { StoredDeliverable } from "../lib/deliverables";
import { shortenAddr } from "./JobCard";

interface Props {
  deliverableRef: Hex;
  deliverable: StoredDeliverable | null;
}

function externalUrl(content: string) {
  try {
    const url = new URL(content);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

const DeliverableDetail: React.FC<Props> = ({
  deliverableRef,
  deliverable,
}) => {
  const [copied, setCopied] = useState(false);

  if (deliverableRef === zeroHash) {
    return (
      <div className="deliverable-panel">
        <span className="text-muted text-xs">Entrega off-chain</span>
        <p className="text-muted text-sm mt-1">Sin entrega registrada.</p>
      </div>
    );
  }

  const url = deliverable ? externalUrl(deliverable.content) : null;

  const copyRef = async () => {
    await navigator.clipboard.writeText(deliverableRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="deliverable-panel">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted text-xs">Entrega off-chain</span>
        <span
          className={`badge ${
            deliverable?.status === "confirmed"
              ? "badge-executed"
              : "badge-pending"
          }`}
        >
          {deliverable
            ? deliverable.status === "confirmed"
              ? "Disponible"
              : "Pendiente"
            : "No disponible"}
        </span>
      </div>

      <div className="deliverable-ref">
        <span className="font-mono text-xs" title={deliverableRef}>
          {shortenAddr(deliverableRef)}
        </span>
        <button className="btn btn-ghost btn-sm" type="button" onClick={copyRef}>
          {copied ? "Copiado" : "Copiar hash"}
        </button>
      </div>

      {deliverable ? (
        <>
          <pre className="deliverable-content">{deliverable.content}</pre>
          {url && (
            <a
              className="text-cyan text-sm"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir enlace de la entrega ↗
            </a>
          )}
          <div className="deliverable-meta">
            <span>Proveedor: {shortenAddr(deliverable.provider)}</span>
            <span>
              Guardado: {new Date(deliverable.createdAt).toLocaleString("es-UY")}
            </span>
          </div>
        </>
      ) : (
        <p className="text-muted text-sm mt-2">
          La entrega existe on-chain, pero su contenido no está disponible en
          este navegador.
        </p>
      )}

      <p className="text-muted text-xs mt-2">
        localStorage no sincroniza contenido entre navegadores o dispositivos.
      </p>
    </div>
  );
};

export default DeliverableDetail;
