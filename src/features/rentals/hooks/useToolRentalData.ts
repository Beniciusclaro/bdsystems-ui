import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllSuppliers } from '../../suppliers/services/supplierService';
import type { SupplierResponse } from '../../suppliers/types/supplier';
import type { ToolResponse } from '../../tools/types/tool';
import { getAllToolRentals, getToolRentals } from '../services/toolRentalService';
import type { ToolRentalResponse } from '../types/toolRental';

export function useToolRentalData(visibleToolCount: number) {
  const [showRentalData, setShowRentalData] = useState(false);

  const [rentalData, setRentalData] = useState<ToolRentalResponse[] | null>(null);

  const [isLoadingRentals, setIsLoadingRentals] = useState(false);

  const [rentalError, setRentalError] = useState<string | null>(null);

  const [selectedTool, setSelectedTool] = useState<ToolResponse | null>(null);

  const [selectedToolRentals, setSelectedToolRentals] = useState<ToolRentalResponse[] | null>(null);

  const [selectedToolRentalError, setSelectedToolRentalError] = useState<string | null>(null);

  const [isLoadingSelectedToolRentals, setIsLoadingSelectedToolRentals] = useState(false);

  const [selectedToolRentalRevision, setSelectedToolRentalRevision] = useState(0);

  const [suppliers, setSuppliers] = useState<SupplierResponse[] | null>(null);

  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  const [supplierError, setSupplierError] = useState<string | null>(null);

  const pendingRentalsRef = useRef<Promise<ToolRentalResponse[]> | null>(null);

  const pendingSuppliersRef = useRef<Promise<SupplierResponse[]> | null>(null);

  useEffect(() => {
    if (!showRentalData || rentalData !== null || visibleToolCount === 0) return;
    let active = true;

    const request = pendingRentalsRef.current ?? getAllToolRentals();
    pendingRentalsRef.current = request;
    request
      .then((result) => {
        if (active) setRentalData(result);
      })
      .catch((cause: unknown) => {
        if (active)
          setRentalError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os registos de aluguer.',
          );
      })
      .finally(() => {
        if (pendingRentalsRef.current === request) pendingRentalsRef.current = null;
        if (active) setIsLoadingRentals(false);
      });
    return () => {
      active = false;
    };
  }, [rentalData, showRentalData, visibleToolCount]);

  useEffect(() => {
    if (!selectedTool) return;
    let active = true;
    getToolRentals(selectedTool.id)
      .then((result) => {
        if (active) setSelectedToolRentals(result);
      })
      .catch((cause: unknown) => {
        if (active)
          setSelectedToolRentalError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os registos de aluguer desta ferramenta.',
          );
      })
      .finally(() => {
        if (active) setIsLoadingSelectedToolRentals(false);
      });
    return () => {
      active = false;
    };
  }, [selectedTool, selectedToolRentalRevision]);

  const loadSuppliers = useCallback(async () => {
    if (suppliers !== null) return;
    setSupplierError(null);
    setIsLoadingSuppliers(true);
    const request = pendingSuppliersRef.current ?? getAllSuppliers();
    pendingSuppliersRef.current = request;
    try {
      setSuppliers(await request);
    } catch (cause: unknown) {
      setSupplierError(
        cause instanceof Error ? cause.message : 'Não foi possível carregar os fornecedores.',
      );
    } finally {
      if (pendingSuppliersRef.current === request) pendingSuppliersRef.current = null;
      setIsLoadingSuppliers(false);
    }
  }, [suppliers]);

  const toggleRentalData = (enabled: boolean) => {
    setShowRentalData(enabled);
    if (enabled && rentalData === null && visibleToolCount > 0) {
      setIsLoadingRentals(true);
      setRentalError(null);
    }
  };

  const refreshRentalData = () => {
    setRentalData(null);
    setRentalError(null);
    if (showRentalData) setIsLoadingRentals(true);
  };

  const retryRentalData = () => {
    setRentalData(null);
    setRentalError(null);
    setIsLoadingRentals(true);
  };

  const openTool = (tool: ToolResponse) => {
    setSelectedTool(tool);
    setSelectedToolRentals(null);
    setSelectedToolRentalError(null);
    setIsLoadingSelectedToolRentals(true);
    void loadSuppliers();
  };

  const refreshSelectedToolRentals = () => {
    setSelectedToolRentalError(null);
    setIsLoadingSelectedToolRentals(true);
    setSelectedToolRentalRevision((current) => current + 1);
    refreshRentalData();
  };

  return {
    showRentalData,
    rentalData,
    isLoadingRentals,
    rentalError,
    toggleRentalData,
    refreshRentalData,
    retryRentalData,
    selectedTool,
    selectedToolRentals,
    selectedToolRentalError,
    isLoadingSelectedToolRentals,
    openTool,
    closeTool: () => setSelectedTool(null),
    refreshSelectedToolRentals,
    suppliers,
    isLoadingSuppliers,
    supplierError,
    loadSuppliers,
  };
}
