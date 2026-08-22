import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, DEFAULT_BASE_URL } from '../api/client';
import { Order, Product, Customer, DashboardStats, Category, OrderStatus } from '../types';

interface AppContextType {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  categories: Category[];
  stats: DashboardStats | null;
  isLoading: boolean;
  isOnline: boolean;
  baseURL: string;
  setBaseURL: (url: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshOrders: (params?: { status?: string; q?: string }) => Promise<void>;
  refreshProducts: (params?: { q?: string; category?: string }) => Promise<void>;
  refreshCustomers: (q?: string) => Promise<void>;
  createOrder: (payload: any) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus, trackingCode?: string, note?: string) => Promise<boolean>;
  createProduct: (payload: any) => Promise<Product>;
  updateProductInventory: (productId: string, newStock: number) => Promise<boolean>;
  updateProductStatus: (productId: string, status: 'published' | 'unpublished' | 'archived') => Promise<boolean>;
  checkServerConnection: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [baseURL, setBaseURLState] = useState<string>(DEFAULT_BASE_URL);

  const checkServerConnection = useCallback(async (): Promise<boolean> => {
    const online = await api.checkHealth();
    setIsOnline(online);
    return online;
  }, []);

  const refreshOrders = useCallback(async (params?: { status?: string; q?: string }) => {
    const list = await api.getOrders(params);
    setOrders(list);
  }, []);

  const refreshProducts = useCallback(async (params?: { q?: string; category?: string }) => {
    const list = await api.getProducts(params);
    setProducts(list);
  }, []);

  const refreshCustomers = useCallback(async (q?: string) => {
    const list = await api.getCustomers(q);
    setCustomers(list);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await checkServerConnection();
      const [oList, pList, cList, catList, dStats] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers(),
        api.getCategories(),
        api.getDashboardStats(),
      ]);
      setOrders(oList);
      setProducts(pList);
      setCustomers(cList);
      setCategories(catList);
      setStats(dStats);
    } finally {
      setIsLoading(false);
    }
  }, [checkServerConnection]);

  useEffect(() => {
    (async () => {
      await api.init();
      setBaseURLState(api.getBaseURL());
      await refreshAll();
    })();
  }, [refreshAll]);

  const setBaseURL = async (url: string) => {
    await api.setBaseURL(url);
    setBaseURLState(url);
    await refreshAll();
  };

  const createOrder = async (payload: any): Promise<Order> => {
    const newOrd = await api.createOrder(payload);
    await refreshAll();
    return newOrd;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, trackingCode?: string, note?: string): Promise<boolean> => {
    const ok = await api.updateOrderStatus(id, status, trackingCode, note);
    if (ok) {
      await refreshAll();
    }
    return ok;
  };

  const createProduct = async (payload: any): Promise<Product> => {
    const newProd = await api.createProduct(payload);
    await refreshAll();
    return newProd;
  };

  const updateProductInventory = async (productId: string, newStock: number): Promise<boolean> => {
    const ok = await api.updateProductInventory(productId, newStock);
    if (ok) {
      await refreshProducts();
      await refreshAll();
    }
    return ok;
  };

  const updateProductStatus = async (productId: string, status: 'published' | 'unpublished' | 'archived'): Promise<boolean> => {
    const ok = await api.updateProductStatus(productId, status);
    if (ok) {
      await refreshProducts();
    }
    return ok;
  };

  return (
    <AppContext.Provider
      value={{
        orders,
        products,
        customers,
        categories,
        stats,
        isLoading,
        isOnline,
        baseURL,
        setBaseURL,
        refreshAll,
        refreshOrders,
        refreshProducts,
        refreshCustomers,
        createOrder,
        updateOrderStatus,
        createProduct,
        updateProductInventory,
        updateProductStatus,
        checkServerConnection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
